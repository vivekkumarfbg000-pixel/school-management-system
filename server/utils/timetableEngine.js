import supabase from './supabaseClient.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIOD_TIMES = {
    1: { start: '08:00', end: '08:45' },
    2: { start: '08:45', end: '09:30' },
    3: { start: '09:30', end: '10:15' },
    4: { start: '10:30', end: '11:15' },
    5: { start: '11:15', end: '12:00' },
    6: { start: '12:00', end: '12:45' },
    7: { start: '01:30', end: '02:15' },
    8: { start: '02:15', end: '03:00' },
};

/**
 * Constraint-Satisfaction Engine to generate a clash-free timetable
 * @param {string} schoolId 
 * @param {string} className 
 * @param {string} section 
 * @param {object} subjectConfig e.g. { 'Maths': 6, 'Science': 5 }
 */
export const generateTimetable = async (schoolId, className, section, subjectConfig) => {
    // 1. Fetch available staff pools for the current school
    const { data: staffList, error: staffErr } = await supabase.from('staff').select('id, name, subjects').eq('school_id', schoolId);
    if (staffErr) throw staffErr;
    if (!staffList || staffList.length === 0) throw new Error("No staff available in database");

    // 2. Fetch all current global slots to detect clashes
    // Note: timetable_slots lacks a direct school_id, so we filter out staffs belonging to other schools internally if needed.
    const { data: existingSlots } = await supabase.from('timetable_slots').select('day, period, staff_id');
    
    // Clash map structures: { staff_uuid: Set('Monday-1', 'Tuesday-2') }
    const clashMap = {};
    (existingSlots || []).forEach(slot => {
        if (!clashMap[slot.staff_id]) clashMap[slot.staff_id] = new Set();
        clashMap[slot.staff_id].add(`${slot.day}-${slot.period}`);
    });

    const newSlots = [];
    let pool = [];

    // Create a pool of subject slots to distribute
    for (const [subject, count] of Object.entries(subjectConfig)) {
        const c = parseInt(count, 10) || 0;
        for (let i = 0; i < c; i++) {
            pool.push(subject);
        }
    }

    // Shuffle pool to distribute subjects randomly
    pool = pool.sort(() => Math.random() - 0.5);

    // Heuristic Staff assignment function
    const getAvailableStaff = (subject, day, period) => {
        let eligibleStaff = staffList.filter(s => (s.subjects || '').toLowerCase().includes(subject.toLowerCase()));
        if (eligibleStaff.length === 0) eligibleStaff = staffList; // Fallback to any teacher explicitly to prevent breaking output
        
        // Remove busy staff handling clashes
        const availableStaff = eligibleStaff.filter(s => {
            if (!clashMap[s.id]) return true;
            return !clashMap[s.id].has(`${day}-${period}`);
        });

        if (availableStaff.length === 0) return null;
        return availableStaff[Math.floor(Math.random() * availableStaff.length)]; // Pick random clash-free teacher
    };

    let poolIndex = 0;

    // Distribute subjects sequentially, while skipping slots where no teacher is available
    for (const day of DAYS) {
        for (let p = 1; p <= 8; p++) {
            if (poolIndex >= pool.length) break; 
            
            const subject = pool[poolIndex];
            const teacher = getAvailableStaff(subject, day, p);

            if (teacher) {
                newSlots.push({
                    day,
                    period: p,
                    subject,
                    class_name: className,
                    section,
                    room: `R-${className}${section}`,
                    staff_id: teacher.id,
                    start_time: PERIOD_TIMES[p].start,
                    end_time: PERIOD_TIMES[p].end
                });
                
                // Track internal updates dynamically to prevent intra-generation clashes
                if (!clashMap[teacher.id]) clashMap[teacher.id] = new Set();
                clashMap[teacher.id].add(`${day}-${p}`);
                
                poolIndex++;
            }
        }
    }

    // Overwrite the existing timetable for this specific class scope
    await supabase.from('timetable_slots')
        .delete()
        .eq('class_name', className)
        .eq('section', section);
    
    if (newSlots.length > 0) {
        const { error: insertErr } = await supabase.from('timetable_slots').insert(newSlots);
        if (insertErr) throw insertErr;
    }

    return newSlots;
};
