import PDFDocument from 'pdfkit';

export const generateOfferLetterPDF = (offerData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Custom Palette Hex Values: #3D8C82, #6FAF9E, #FAFBF8, #24302E, #71807B, #E3E9E5
      const primaryColor = '#3D8C82'; // Deep Teal
      const textColor = '#24302E';    // Charcoal Pine
      const mutedColor = '#71807B';   // Muted Slate

      // Header Banner
      doc.rect(0, 0, 612, 100).fill('#E6F3F1'); // Soft Mint Highlight
      
      doc.fillColor(primaryColor)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('NEUZEN AI', 50, 30);

      doc.fillColor(mutedColor)
         .fontSize(11)
         .font('Helvetica')
         .text('Human Resource Management System', 50, 56);

      doc.fillColor(textColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('OFFER OF EMPLOYMENT', 350, 40, { align: 'right' });

      // Divider
      doc.moveTo(50, 115).lineTo(562, 115).strokeColor('#E3E9E5').lineWidth(1).stroke();

      // Date & Ref
      doc.fontSize(10).fillColor(mutedColor).font('Helvetica')
         .text(`Date: ${new Date(offerData.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 50, 130)
         .text(`Offer Ref: NEU-OFFER-${String(offerData._id).substring(0, 8).toUpperCase()}`, 350, 130, { align: 'right' });

      // Candidate Info Box
      doc.rect(50, 155, 512, 70).fillAndStroke('#FAFBF8', '#E3E9E5');
      
      doc.fillColor(textColor).fontSize(12).font('Helvetica-Bold')
         .text(`Dear ${offerData.candidateName},`, 65, 170);

      doc.fillColor(mutedColor).fontSize(10).font('Helvetica')
         .text(`We are pleased to offer you the position of ${offerData.position} at NEUZEN AI.`, 65, 195);

      // Offer Details Table
      doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold')
         .text('EMPLOYMENT TERMS & COMPENSATION (INR)', 50, 245);

      let y = 270;
      const details = [
        ['Position:', offerData.position],
        ['Department:', offerData.department],
        ['Employment Type:', offerData.employmentType || 'Full-time'],
        ['Work Location:', offerData.workLocation || 'Headquarters'],
        ['Proposed Joining Date:', new Date(offerData.joiningDate).toLocaleDateString('en-IN')],
        ['Base Salary (Per Annum):', `Rs. ${Number(offerData.baseSalary).toLocaleString('en-IN')} / year`],
        ['Allowances & Benefits:', `Rs. ${Number(offerData.allowances || 0).toLocaleString('en-IN')} / year`],
        ['Probation Period:', offerData.probationPeriod || '90 Days'],
        ['Offer Validity Until:', new Date(offerData.offerExpiryDate).toLocaleDateString('en-IN')],
      ];

      details.forEach(([label, value], idx) => {
        const bg = idx % 2 === 0 ? '#FFFFFF' : '#FAFBF8';
        doc.rect(50, y, 512, 22).fillAndStroke(bg, '#E3E9E5');
        doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text(label, 60, y + 6);
        doc.fillColor(textColor).fontSize(10).font('Helvetica').text(value, 260, y + 6);
        y += 22;
      });

      // Terms Paragraph
      y += 20;
      doc.fillColor(textColor).fontSize(11).font('Helvetica-Bold').text('Terms and Conditions', 50, y);
      y += 18;
      doc.fillColor(mutedColor).fontSize(9.5).font('Helvetica')
         .text(
           'This offer is contingent upon successful verification of your credentials, references, and required documentation. Please sign and return a copy of this letter prior to the offer expiry date to signify your formal acceptance.',
           50, y, { width: 512, align: 'justify' }
         );

      // Signatures
      y += 60;
      doc.moveTo(50, y).lineTo(220, y).strokeColor('#E3E9E5').stroke();
      doc.moveTo(340, y).lineTo(512, y).strokeColor('#E3E9E5').stroke();

      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold')
         .text('Authorized HR Manager', 50, y + 8)
         .text('Candidate Signature & Date', 340, y + 8);

      doc.fillColor(mutedColor).fontSize(9).font('Helvetica')
         .text('NEUZEN AI Human Resources', 50, y + 22)
         .text(`${offerData.candidateName}`, 340, y + 22);

      // Footer
      doc.fontSize(8).fillColor('#71807B')
         .text('NEUZEN AI HRMS • Confidential Employment Document • Page 1 of 1', 50, 740, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export const generatePayslipPDF = (payrollData, employeeData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primaryColor = '#3D8C82';
      const textColor = '#24302E';
      const mutedColor = '#71807B';

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthLabel = monthNames[payrollData.month - 1] || payrollData.month;

      // Header Banner
      doc.rect(0, 0, 612, 90).fill('#FAFBF8');

      doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text('NEUZEN AI', 50, 25);
      doc.fillColor(mutedColor).fontSize(10).font('Helvetica').text('Human Resource Management System', 50, 52);

      doc.fillColor(textColor).fontSize(16).font('Helvetica-Bold')
         .text('SALARY PAYSLIP (INR)', 350, 30, { align: 'right' });
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
         .text(`${monthLabel} ${payrollData.year}`, 350, 52, { align: 'right' });

      doc.moveTo(50, 100).lineTo(562, 100).strokeColor('#E3E9E5').lineWidth(1).stroke();

      // Employee Info Grid
      doc.rect(50, 115, 512, 75).fillAndStroke('#FFFFFF', '#E3E9E5');

      doc.fillColor(mutedColor).fontSize(9).font('Helvetica');
      doc.text('EMPLOYEE NAME:', 65, 128);
      doc.text('EMPLOYEE ID:', 65, 146);
      doc.text('DESIGNATION:', 65, 164);

      doc.text('DEPARTMENT:', 320, 128);
      doc.text('PAYMENT DATE:', 320, 146);
      doc.text('PAYROLL STATUS:', 320, 164);

      doc.fillColor(textColor).fontSize(9.5).font('Helvetica-Bold');
      doc.text(`${employeeData.firstName} ${employeeData.lastName}`, 160, 128);
      doc.text(employeeData.employeeCode || 'NEU-EMP', 160, 146);
      doc.text(employeeData.designation || 'N/A', 160, 164);

      doc.text(employeeData.department || 'N/A', 430, 128);
      doc.text(payrollData.paymentDate ? new Date(payrollData.paymentDate).toLocaleDateString('en-IN') : 'N/A', 430, 146);
      doc.text(payrollData.status || 'PAID', 430, 164);

      // Breakdown Header
      let y = 210;

      doc.rect(50, y, 250, 24).fill('#E6F3F1');
      doc.fillColor('#3D8C82').fontSize(11).font('Helvetica-Bold').text('EARNINGS (INR)', 65, y + 6);

      doc.rect(312, y, 250, 24).fill('#FBEBEB');
      doc.fillColor('#D87575').fontSize(11).font('Helvetica-Bold').text('DEDUCTIONS (INR)', 327, y + 6);

      y += 24;

      const earnings = [
        ['Basic Salary', `Rs. ${Number(payrollData.baseSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Allowances (HRA/Medical)', `Rs. ${Number(payrollData.allowances || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Bonus & Performance', `Rs. ${Number(payrollData.bonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ];

      const deductions = [
        ['Statutory Deductions (PF/Tax)', `Rs. ${Number(payrollData.deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
      ];

      const maxRows = Math.max(earnings.length, deductions.length);
      for (let i = 0; i < maxRows; i++) {
        const earn = earnings[i] || ['', ''];
        const ded = deductions[i] || ['', ''];

        const rowBg = i % 2 === 0 ? '#FFFFFF' : '#FAFBF8';

        // Earnings Col
        doc.rect(50, y, 250, 22).fillAndStroke(rowBg, '#E3E9E5');
        doc.fillColor(textColor).fontSize(9.5).font('Helvetica').text(earn[0], 60, y + 5);
        doc.fillColor(textColor).fontSize(9.5).font('Helvetica-Bold').text(earn[1], 180, y + 5, { width: 110, align: 'right' });

        // Deductions Col
        doc.rect(312, y, 250, 22).fillAndStroke(rowBg, '#E3E9E5');
        doc.fillColor(textColor).fontSize(9.5).font('Helvetica').text(ded[0], 322, y + 5);
        doc.fillColor(textColor).fontSize(9.5).font('Helvetica-Bold').text(ded[1], 442, y + 5, { width: 110, align: 'right' });

        y += 22;
      }

      // Totals Box
      y += 10;
      doc.rect(50, y, 512, 45).fillAndStroke('#3D8C82', '#3D8C82');

      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica')
         .text('GROSS EARNINGS:', 65, y + 10)
         .text(`Rs. ${Number(payrollData.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, y + 10);

      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica')
         .text('TOTAL DEDUCTIONS:', 320, y + 10)
         .text(`Rs. ${Number(payrollData.deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, y + 10);

      doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica-Bold')
         .text('NET SALARY PAID:', 65, y + 26)
         .text(`Rs. ${Number(payrollData.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, y + 26);

      // Note
      y += 70;
      doc.fillColor(mutedColor).fontSize(9).font('Helvetica')
         .text('This is a computer-generated document. No signature is required.', 50, y, { align: 'center' });

      // Footer
      doc.fontSize(8).fillColor('#71807B')
         .text('NEUZEN AI HRMS • Confidential Payslip Document', 50, 740, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
