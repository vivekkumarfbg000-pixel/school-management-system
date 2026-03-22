/**
 * Excel Generator Utility
 * Generates Excel exports for students, attendance, and fee reports using ExcelJS
 */

import ExcelJS from 'exceljs';

const BRAND_COLOR = '6366F1'; // Indigo
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLOR } };
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };

function styleHeaderRow(worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'E5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
    };
  });
  headerRow.height = 28;
}

/**
 * Student List Excel
 */
export async function generateStudentListExcel(stream, students) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduStream SaaS';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Students');

  ws.columns = [
    { header: 'Admission No', key: 'admission_no', width: 16 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Father Name', key: 'father_name', width: 22 },
    { header: 'Class', key: 'class_name', width: 10 },
    { header: 'Section', key: 'section', width: 10 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'DOB', key: 'dob', width: 14 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Category', key: 'category', width: 12 },
    { header: 'RTE', key: 'is_rte', width: 8 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  students.forEach(s => {
    ws.addRow({
      ...s,
      dob: s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : '',
      is_rte: s.is_rte ? 'Yes' : 'No',
    });
  });

  styleHeaderRow(ws);
  await workbook.xlsx.write(stream);
}

/**
 * Attendance Summary Excel
 */
export async function generateAttendanceExcel(stream, { month, className, section, students, records }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduStream SaaS';

  const ws = workbook.addWorksheet(`Attendance ${className}-${section}`);

  // Build date columns for the month
  const year = parseInt(month.split('-')[0]);
  const mon = parseInt(month.split('-')[1]);
  const daysInMonth = new Date(year, mon, 0).getDate();

  const columns = [
    { header: 'Admission No', key: 'admission_no', width: 16 },
    { header: 'Name', key: 'name', width: 22 },
  ];

  for (let d = 1; d <= daysInMonth; d++) {
    columns.push({ header: `${d}`, key: `d${d}`, width: 5 });
  }
  columns.push({ header: 'Present', key: 'present', width: 9 });
  columns.push({ header: 'Absent', key: 'absent', width: 9 });
  columns.push({ header: '%', key: 'pct', width: 8 });

  ws.columns = columns;

  // Map records by student_id and date
  const recordMap = {};
  (records || []).forEach(r => {
    const dateStr = new Date(r.date).getDate();
    if (!recordMap[r.student_id]) recordMap[r.student_id] = {};
    recordMap[r.student_id][dateStr] = r.status;
  });

  students.forEach(s => {
    const row = { admission_no: s.admission_no, name: s.name };
    let present = 0, absent = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const status = recordMap[s.id]?.[d];
      row[`d${d}`] = status === 'Present' ? 'P' : status === 'Absent' ? 'A' : status === 'Late' ? 'L' : '-';
      if (status === 'Present' || status === 'Late') present++;
      else if (status === 'Absent') absent++;
    }

    row.present = present;
    row.absent = absent;
    row.pct = present + absent > 0 ? Math.round((present / (present + absent)) * 100) + '%' : '-';
    ws.addRow(row);
  });

  styleHeaderRow(ws);
  await workbook.xlsx.write(stream);
}

/**
 * Fee Collection Report Excel
 */
export async function generateFeeReportExcel(stream, { fees, reportType, date }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduStream SaaS';

  const ws = workbook.addWorksheet(`Fee ${reportType} Report`);

  ws.columns = [
    { header: 'Receipt No', key: 'receipt_no', width: 16 },
    { header: 'Student', key: 'student_name', width: 22 },
    { header: 'Class', key: 'class_name', width: 10 },
    { header: 'Fee Type', key: 'fee_type', width: 14 },
    { header: 'Amount Due', key: 'amount', width: 14 },
    { header: 'Amount Paid', key: 'paid_amount', width: 14 },
    { header: 'Late Fee', key: 'late_fee', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Due Date', key: 'due_date', width: 14 },
    { header: 'Paid Date', key: 'paid_date', width: 14 },
  ];

  fees.forEach(f => {
    ws.addRow({
      receipt_no: f.receipt_no || '-',
      student_name: f.students?.name || f.student_name || '-',
      class_name: f.students?.class_name || f.class_name || '-',
      fee_type: f.fee_type,
      amount: f.amount,
      paid_amount: f.paid_amount,
      late_fee: f.late_fee,
      status: f.status,
      due_date: f.due_date ? new Date(f.due_date).toLocaleDateString('en-IN') : '',
      paid_date: f.paid_date ? new Date(f.paid_date).toLocaleDateString('en-IN') : '',
    });
  });

  // Totals row
  const totalRow = ws.addRow({
    receipt_no: '',
    student_name: 'TOTAL',
    class_name: '',
    fee_type: '',
    amount: fees.reduce((a, f) => a + (f.amount || 0), 0),
    paid_amount: fees.reduce((a, f) => a + (f.paid_amount || 0), 0),
    late_fee: fees.reduce((a, f) => a + (f.late_fee || 0), 0),
    status: '',
    due_date: '',
    paid_date: '',
  });
  totalRow.font = { bold: true };

  styleHeaderRow(ws);
  await workbook.xlsx.write(stream);
}
