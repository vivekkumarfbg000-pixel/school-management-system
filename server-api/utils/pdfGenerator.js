/**
 * PDF Generator Utility
 * Generates fee receipts and salary slips using PDFKit
 */

import PDFDocument from 'pdfkit';

/**
 * Generate a fee receipt PDF and pipe it to a writable stream (res)
 */
export function generateFeeReceiptPDF(stream, data) {
  const doc = new PDFDocument({ size: 'A5', margin: 40 });
  doc.pipe(stream);

  const { schoolName, studentName, admissionNo, className, section, feeType, amount, paidAmount, receiptNo, paidDate } = data;

  // Header - School Name
  doc.fontSize(18).font('Helvetica-Bold').text(schoolName || 'EduStream Academy', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text('Fee Receipt', { align: 'center' });
  doc.moveDown(0.5);

  // Divider
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#6366f1');
  doc.moveDown(0.5);

  // Receipt Info
  doc.fontSize(10).font('Helvetica-Bold').text(`Receipt No: ${receiptNo || 'N/A'}`, { continued: true });
  doc.font('Helvetica').text(`      Date: ${paidDate ? new Date(paidDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(0.8);

  // Student Details
  const detailY = doc.y;
  doc.font('Helvetica-Bold').text('Student Details', { underline: true });
  doc.moveDown(0.3);

  const details = [
    ['Name', studentName],
    ['Admission No', admissionNo],
    ['Class - Section', `${className} - ${section}`],
  ];

  details.forEach(([label, value]) => {
    doc.font('Helvetica').fontSize(9).text(`${label}:`, { continued: true, width: 120 });
    doc.font('Helvetica-Bold').text(`  ${value || 'N/A'}`);
  });

  doc.moveDown(0.8);

  // Payment Details
  doc.font('Helvetica-Bold').fontSize(10).text('Payment Details', { underline: true });
  doc.moveDown(0.3);

  const payments = [
    ['Fee Type', feeType],
    ['Amount Due', `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`],
    ['Amount Paid', `₹${parseFloat(paidAmount || 0).toLocaleString('en-IN')}`],
    ['Balance', `₹${(parseFloat(amount || 0) - parseFloat(paidAmount || 0)).toLocaleString('en-IN')}`],
  ];

  payments.forEach(([label, value]) => {
    doc.font('Helvetica').fontSize(9).text(`${label}:`, { continued: true, width: 120 });
    doc.font('Helvetica-Bold').text(`  ${value}`);
  });

  doc.moveDown(1.5);

  // Footer
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#e5e7eb');
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(7).fillColor('#9ca3af').text('This is a computer-generated receipt. No signature required.', { align: 'center' });
  doc.text('Powered by EduStream SaaS', { align: 'center' });

  doc.end();
  return doc;
}

/**
 * Generate a salary slip PDF and pipe it to a writable stream
 */
export function generateSalarySlipPDF(stream, data) {
  const doc = new PDFDocument({ size: 'A5', margin: 40 });
  doc.pipe(stream);

  const { schoolName, staffName, staffId, designation, month, basicSalary, da, hra, allowances, pfDeduction, tdsDeduction, absentDays, absentDeduction, grossSalary, totalDeductions, netSalary, status } = data;

  // Header
  doc.fontSize(18).font('Helvetica-Bold').text(schoolName || 'EduStream Academy', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text(`Salary Slip — ${month}`, { align: 'center' });
  doc.moveDown(0.5);

  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#6366f1');
  doc.moveDown(0.5);

  // Employee Info
  doc.font('Helvetica-Bold').fontSize(10).text('Employee Details', { underline: true });
  doc.moveDown(0.3);

  [['Name', staffName], ['Staff ID', staffId], ['Designation', designation]].forEach(([l, v]) => {
    doc.font('Helvetica').fontSize(9).text(`${l}:`, { continued: true, width: 120 });
    doc.font('Helvetica-Bold').text(`  ${v || 'N/A'}`);
  });

  doc.moveDown(0.8);

  // Earnings
  doc.font('Helvetica-Bold').fontSize(10).text('Earnings', { underline: true });
  doc.moveDown(0.3);

  const earnings = [
    ['Basic Salary', basicSalary],
    ['Dearness Allowance', da],
    ['House Rent Allowance', hra],
    ['Other Allowances', allowances],
  ];

  earnings.forEach(([l, v]) => {
    doc.font('Helvetica').fontSize(9).text(`${l}:`, { continued: true, width: 160 });
    doc.font('Helvetica-Bold').text(`  ₹${parseFloat(v || 0).toLocaleString('en-IN')}`);
  });

  doc.moveDown(0.5);

  // Deductions
  doc.font('Helvetica-Bold').fontSize(10).text('Deductions', { underline: true });
  doc.moveDown(0.3);

  const deductions = [
    ['PF Deduction', pfDeduction],
    ['TDS Deduction', tdsDeduction],
    ['Absent Days', `${absentDays || 0} days`],
    ['Absent Deduction', absentDeduction],
  ];

  deductions.forEach(([l, v]) => {
    doc.font('Helvetica').fontSize(9).text(`${l}:`, { continued: true, width: 160 });
    const displayVal = typeof v === 'string' ? v : `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;
    doc.font('Helvetica-Bold').text(`  ${displayVal}`);
  });

  doc.moveDown(0.8);

  // Summary
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#e5e7eb');
  doc.moveDown(0.3);

  [['Gross Salary', grossSalary], ['Total Deductions', totalDeductions], ['Net Salary', netSalary]].forEach(([l, v]) => {
    doc.font('Helvetica-Bold').fontSize(10).text(`${l}:`, { continued: true, width: 160 });
    doc.text(`  ₹${parseFloat(v || 0).toLocaleString('en-IN')}`);
  });

  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(9).text(`Status: ${status || 'Generated'}`);

  doc.moveDown(1);
  doc.font('Helvetica').fontSize(7).fillColor('#9ca3af').text('This is a computer-generated salary slip.', { align: 'center' });
  doc.text('Powered by EduStream SaaS', { align: 'center' });

  doc.end();
  return doc;
}
