import supabase from './supabaseClient.js';
import { sendWhatsAppMessage, generatePortalLink } from './whatsappProvider.js';

/**
 * Monthly Student Report Cron
 * Runs on the 1st of every month to send Attendance and Performance reports to parents.
 */
export async function runMonthlyReportCron() {
  console.log(`\n📈 [Monthly Report Cron] Starting at ${new Date().toISOString()}`);

  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthName = lastMonth.toLocaleString('default', { month: 'long' });
  
  const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]; // last day of prev month

  // Fetch all schools with WhatsApp enabled
  const { data: schools } = await supabase.from('schools').select('id, name, whatsapp_enabled').eq('whatsapp_enabled', true);
  if (!schools || schools.length === 0) return;

  for (const school of schools) {
    // Fetch active students with phone numbers
    const { data: students } = await supabase
      .from('students')
      .select('id, name, class_name, phone')
      .eq('school_id', school.id)
      .eq('status', 'Active')
      .not('phone', 'is', null);

    if (!students) continue;

    for (const student of students) {
      // 1. Calculate Attendance
      const { data: attendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', student.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const totalDays = attendance?.length || 0;
      let presentDays = 0;
      attendance?.forEach(a => {
         if (a.status === 'Present' || a.status === 'Late') presentDays++;
      });
      const attPercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      // 2. Fetch Exams (Mock logic for now, assumes 'exams' and 'exam_marks' tables)
      // We will just provide a static string if no table exists, or query it if it does.
      let examText = "";
      try {
          const { data: marks } = await supabase
            .from('exam_marks')
            .select('marks_obtained, total_marks, exams(subject)')
            .eq('student_id', student.id)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .limit(3);
            
          if (marks && marks.length > 0) {
              examText = `\n*Recent Test Scores:*\n` + marks.map(m => `- ${m.exams?.subject || 'Test'}: ${m.marks_obtained}/${m.total_marks}`).join('\n');
          }
      } catch (err) {
          // Table might not exist yet, skip exam data gracefully
      }

      // Build Message
      const portalLink = generatePortalLink(student.id, school.id);
      const msg = `📊 *${lastMonthName} Report Card for ${student.name}*
🏫 ${school.name}

*Attendance:* ${attPercent}% (${presentDays}/${totalDays} days)
${attPercent < 75 ? '⚠️ _Attendance is below 75%._' : '✅ _Great attendance!_'}${examText}

📄 *Full Report & Performance:* ${portalLink}

_This is an automated monthly report. If you have questions, please contact the class teacher._`;

      await sendWhatsAppMessage(student.phone, msg);
    }
  }
  
  console.log(`[Monthly Report Cron] Completed.`);
}
