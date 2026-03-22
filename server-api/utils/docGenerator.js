import PDFDocument from 'pdfkit';

export const generateStudentIdCard = (student, res) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: [240, 380] }); // Roughly 3.3 x 5.2 inches

        doc.on('error', reject);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ID_${student.admission_no}.pdf`);
        doc.pipe(res);

        // Background
        doc.rect(0, 0, 240, 380).fill('#1E293B');
        
        // Header
        doc.rect(0, 0, 240, 80).fill('#4F46E5');
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#FFFFFF').text('EDUSTREAM SAAS', 0, 25, { align: 'center' });
        doc.font('Helvetica').fontSize(9).text('2026-2027 Academic Year', 0, 45, { align: 'center' });

        // Photo Placeholder (White Box)
        doc.rect(70, 100, 100, 100).fill('#FFFFFF');
        doc.rect(70, 100, 100, 100).lineWidth(2).stroke('#4F46E5');
        doc.font('Helvetica').fontSize(10).fillColor('#94A3B8').text('PHOTO', 70, 145, { width: 100, align: 'center' });

        // Student Info
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#F8FAFC').text(student.name.toUpperCase(), 0, 220, { align: 'center' });
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#94A3B8').text('Class:', 20, 250);
        doc.font('Helvetica').fillColor('#F8FAFC').text(`${student.class_name} - ${student.section}`, 60, 250);

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#94A3B8').text('Admn:', 20, 270);
        doc.font('Helvetica').fillColor('#F8FAFC').text(student.admission_no, 60, 270);

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#94A3B8').text('DOB:', 20, 290);
        doc.font('Helvetica').fillColor('#F8FAFC').text(new Date(student.dob).toLocaleDateString(), 60, 290);

        // Footer Barcode Mock
        doc.rect(40, 330, 160, 30).fill('#FFFFFF');
        doc.font('Courier').fontSize(8).fillColor('#000000').text(`||||||| | ||| ${student.admission_no} ||||| ||`, 40, 340, { width: 160, align: 'center' });

        doc.end();
        resolve();
    });
};

export const generateTransferCertificate = (student, res) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        doc.on('error', reject);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=TC_${student.admission_no}.pdf`);
        doc.pipe(res);

        // Border
        doc.rect(20, 20, 555, 800).lineWidth(3).stroke('#4F46E5');
        doc.rect(25, 25, 545, 790).lineWidth(1).stroke('#1E293B');

        // Header
        doc.font('Helvetica-Bold').fontSize(24).fillColor('#4F46E5').text('EDUSTREAM ACADEMY', { align: 'center' });
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10).fillColor('#1E293B').text('123 Innovation Drive, Tech City, 10001', { align: 'center' });
        doc.text('Affiliation No: 1234567 | School Code: 89012', { align: 'center' });
        
        doc.moveDown(2);
        doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000').text('TRANSFER CERTIFICATE', { align: 'center', underline: true });
        
        doc.moveDown(2);
        
        // Lines of info
        const drawLine = (label, value) => {
            doc.font('Helvetica-Bold').fontSize(12).text(label, { continued: true }).font('Helvetica').text(`  ${value}`);
            doc.moveDown(0.8);
        };

        drawLine('1. Name of Pupil:', student.name.toUpperCase());
        drawLine('2. Admission Number:', student.admission_no);
        drawLine('3. Date of Birth:', new Date(student.dob).toLocaleDateString());
        drawLine('4. Class in which pupil last studied:', `${student.class_name} - ${student.section}`);
        drawLine('5. Date of leaving the school:', new Date().toLocaleDateString());
        drawLine('6. Reason for leaving:', 'Higher Studies');
        drawLine('7. Conduct / Character:', 'GOOD');
        drawLine('8. Any fee concession availed:', student.is_rte ? 'Yes (RTE Quota)' : 'No');

        doc.moveDown(5);

        // Signatures
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('______________________', 50, doc.y);
        doc.text('Class Teacher', 50, doc.y + 5);

        doc.text('______________________', 380, doc.y - 17);
        doc.text('Principal (Seal)', 380, doc.y + 5);

        doc.end();
        resolve();
    });
};
