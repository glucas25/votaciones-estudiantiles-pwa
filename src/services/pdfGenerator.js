// src/services/pdfGenerator.js
// Professional PDF Generation Service for Electoral Reports

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import JSZip from 'jszip';

/**
 * Professional PDF Generator for Electoral Reports
 * Supports multiple report types with institutional branding
 */
class PDFGenerator {
  constructor() {
    this.defaultConfig = {
      institution: {
        name: 'Institución Educativa',
        logo: null,
        colors: {
          primary: '#1e40af',
          secondary: '#64748b',
          accent: '#059669'
        },
        address: 'Dirección de la Institución',
        phone: 'Teléfono: (04) 123-4567',
        email: 'info@institucion.edu.ec'
      },
      fonts: {
        title: 16,
        subtitle: 14,
        body: 11,
        small: 9
      },
      margins: {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15
      }
    };
    
    this.reportHistory = [];
  }

  /**
   * Configure institutional settings
   */
  setInstitutionConfig(config) {
    this.defaultConfig.institution = {
      ...this.defaultConfig.institution,
      ...config
    };
  }

  /**
   * Generate Official Results Report (Acta Oficial)
   */
  async generateOfficialResults(data) {
    console.log('📋 Generating Official Results Report...');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = this.defaultConfig.margins.top;

    try {
      // Header with logo and institution info
      yPos = await this.addHeader(doc, yPos, 'ACTA OFICIAL DE RESULTADOS ELECTORALES');
      
      // Election details
      yPos = this.addElectionDetails(doc, yPos, data.electionInfo);
      
      // Results section
      yPos = this.addResultsSection(doc, yPos, data.results, data.electionType);
      
      // Signatures section
      yPos = this.addSignaturesSection(doc, yPos);
      
      // QR Code for verification
      await this.addQRCode(doc, data.verificationCode);
      
      // Footer
      this.addFooter(doc);
      
      // Save report to history
      this.saveToHistory('official_results', data);
      
      return {
        success: true,
        pdf: doc,
        filename: `acta_oficial_${new Date().toISOString().split('T')[0]}.pdf`
      };
      
    } catch (error) {
      console.error('Error generating official results report:', error);
      throw error;
    }
  }

  /**
   * Generate Participation Report
   */
  async generateParticipationReport(data) {
    console.log('📊 Generating Participation Report...');
    
    const doc = new jsPDF();
    let yPos = this.defaultConfig.margins.top;

    try {
      // Header
      yPos = await this.addHeader(doc, yPos, 'REPORTE DE PARTICIPACIÓN ELECTORAL');
      
      // General statistics
      yPos = this.addGeneralStats(doc, yPos, data.stats);
      
      // Participation by level
      yPos = this.addParticipationByLevel(doc, yPos, data.byLevel);
      
      // Course participation table
      yPos = this.addCourseParticipationTable(doc, yPos, data.byCourse);
      
      // Add new page if needed for student lists
      if (yPos > 200) {
        doc.addPage();
        yPos = this.defaultConfig.margins.top;
      }
      
      // Complete list of voters
      yPos = this.addVotersList(doc, yPos, data.voters);
      
      // Absent students
      yPos = this.addAbsentStudents(doc, yPos, data.absent);
      
      this.addFooter(doc);
      
      this.saveToHistory('participation', data);
      
      return {
        success: true,
        pdf: doc,
        filename: `reporte_participacion_${new Date().toISOString().split('T')[0]}.pdf`
      };
      
    } catch (error) {
      console.error('Error generating participation report:', error);
      throw error;
    }
  }

  /**
   * Generate Individual Certificates
   */
  async generateIndividualCertificates(students) {
    console.log('🎓 Generating Individual Certificates...');
    
    const certificates = [];
    
    for (const student of students) {
      try {
        const doc = new jsPDF();
        
        // Certificate design
        await this.addCertificateDesign(doc, student);
        
        certificates.push({
          student: student,
          pdf: doc,
          filename: `certificado_${student.cedula || student.id}.pdf`
        });
        
      } catch (error) {
        console.error(`Error generating certificate for ${student.nombres}:`, error);
      }
    }
    
    this.saveToHistory('certificates', { count: certificates.length });
    
    return {
      success: true,
      certificates: certificates,
      count: certificates.length
    };
  }

  /**
   * Generate Audit Report
   */
  async generateAuditReport(data) {
    console.log('🔍 Generating Audit Report...');
    
    const doc = new jsPDF();
    let yPos = this.defaultConfig.margins.top;

    try {
      // Header
      yPos = await this.addHeader(doc, yPos, 'REPORTE DE AUDITORÍA ELECTORAL');
      
      // System overview
      yPos = this.addSystemOverview(doc, yPos, data.systemInfo);
      
      // Voting sessions
      yPos = this.addVotingSessions(doc, yPos, data.sessions);
      
      // Detailed log
      yPos = this.addDetailedLog(doc, yPos, data.log);
      
      // Error analysis
      yPos = this.addErrorAnalysis(doc, yPos, data.errors);
      
      this.addFooter(doc);
      
      this.saveToHistory('audit', data);
      
      return {
        success: true,
        pdf: doc,
        filename: `auditoria_${new Date().toISOString().split('T')[0]}.pdf`
      };
      
    } catch (error) {
      console.error('Error generating audit report:', error);
      throw error;
    }
  }

  /**
   * Generate multiple PDFs and create ZIP
   */
  async generateBatch(reports) {
    console.log('📦 Generating batch reports...');
    
    const zip = new JSZip();
    const results = [];
    
    for (const report of reports) {
      try {
        let result;
        
        switch (report.type) {
          case 'official':
            result = await this.generateOfficialResults(report.data);
            break;
          case 'participation':
            result = await this.generateParticipationReport(report.data);
            break;
          case 'certificates':
            result = await this.generateIndividualCertificates(report.data);
            break;
          case 'audit':
            result = await this.generateAuditReport(report.data);
            break;
          default:
            throw new Error(`Unknown report type: ${report.type}`);
        }
        
        if (result.success) {
          if (result.certificates) {
            // Handle multiple certificates
            const certFolder = zip.folder('certificados');
            for (const cert of result.certificates) {
              certFolder.file(cert.filename, cert.pdf.output('blob'));
            }
          } else {
            // Single PDF
            zip.file(result.filename, result.pdf.output('blob'));
          }
          
          results.push(result);
        }
        
      } catch (error) {
        console.error(`Error generating report ${report.type}:`, error);
        results.push({ success: false, error: error.message, type: report.type });
      }
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    return {
      success: true,
      zip: zipBlob,
      results: results,
      filename: `reportes_electorales_${new Date().toISOString().split('T')[0]}.zip`
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Add professional header with logo and institution info
   */
  async addHeader(doc, yPos, title) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const config = this.defaultConfig;
    
    // Institution name
    doc.setFontSize(config.fonts.title);
    doc.setTextColor(config.institution.colors.primary);
    doc.text(config.institution.name.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Title
    doc.setFontSize(config.fonts.subtitle);
    doc.setTextColor('#000000');
    doc.text(title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Line separator
    doc.setDrawColor(config.institution.colors.primary);
    doc.setLineWidth(0.5);
    doc.line(config.margins.left, yPos, pageWidth - config.margins.right, yPos);
    yPos += 8;
    
    return yPos;
  }

  /**
   * Add election details section
   */
  addElectionDetails(doc, yPos, electionInfo) {
    const config = this.defaultConfig;
    
    doc.setFontSize(config.fonts.body);
    doc.setTextColor('#000000');
    
    const details = [
      `Fecha de Elección: ${electionInfo.date}`,
      `Hora de Inicio: ${electionInfo.startTime}`,
      `Hora de Cierre: ${electionInfo.endTime}`,
      `Lugar: ${electionInfo.location || config.institution.name}`,
      `Total de Estudiantes Habilitados: ${electionInfo.totalStudents}`,
      `Total de Votos Emitidos: ${electionInfo.totalVotes}`
    ];
    
    details.forEach(detail => {
      doc.text(detail, config.margins.left, yPos);
      yPos += 6;
    });
    
    yPos += 5;
    return yPos;
  }

  /**
   * Add results section based on election type
   */
  addResultsSection(doc, yPos, results, electionType) {
    const config = this.defaultConfig;
    
    doc.setFontSize(config.fonts.subtitle);
    doc.setTextColor(config.institution.colors.primary);
    doc.text('RESULTADOS OFICIALES', config.margins.left, yPos);
    yPos += 10;
    
    // Create results table
    const headers = electionType === 'LIST_BASED' 
      ? ['Lista Electoral', 'Votos', 'Porcentaje']
      : ['Candidato', 'Cargo', 'Votos', 'Porcentaje'];
    
    const data = results.map(result => 
      electionType === 'LIST_BASED'
        ? [result.listName, result.votes.toString(), `${result.percentage.toFixed(2)}%`]
        : [result.candidateName, result.position, result.votes.toString(), `${result.percentage.toFixed(2)}%`]
    );
    
    doc.autoTable({
      head: [headers],
      body: data,
      startY: yPos,
      styles: {
        fontSize: config.fonts.body,
        cellPadding: 3
      },
      headStyles: {
        fillColor: config.institution.colors.primary,
        textColor: '#FFFFFF'
      }
    });
    
    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Add signatures section
   */
  addSignaturesSection(doc, yPos) {
    const config = this.defaultConfig;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(config.fonts.subtitle);
    doc.setTextColor(config.institution.colors.primary);
    doc.text('FIRMAS Y VALIDACIÓN', config.margins.left, yPos);
    yPos += 15;
    
    // Signature lines
    const signatures = [
      { title: 'Presidente del Tribunal Electoral', name: '_'.repeat(30) },
      { title: 'Secretario/a', name: '_'.repeat(30) },
      { title: 'Vocal', name: '_'.repeat(30) }
    ];
    
    signatures.forEach((sig, index) => {
      const xPos = config.margins.left + (index * 60);
      
      doc.setFontSize(config.fonts.small);
      doc.text(sig.title, xPos, yPos);
      
      doc.setFontSize(config.fonts.body);
      doc.text(sig.name, xPos, yPos + 15);
      
      // Date line
      doc.text(`Fecha: ${'_'.repeat(15)}`, xPos, yPos + 25);
    });
    
    return yPos + 40;
  }

  /**
   * Add QR code for verification
   */
  async addQRCode(doc, verificationCode) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    try {
      const qrDataURL = await QRCode.toDataURL(verificationCode, {
        width: 80,
        height: 80
      });
      
      doc.addImage(qrDataURL, 'PNG', pageWidth - 30, pageHeight - 40, 20, 20);
      
      doc.setFontSize(this.defaultConfig.fonts.small);
      doc.text('Código de Verificación', pageWidth - 30, pageHeight - 15, { align: 'left' });
      
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  /**
   * Add professional footer
   */
  addFooter(doc) {
    const config = this.defaultConfig;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFontSize(config.fonts.small);
    doc.setTextColor(config.institution.colors.secondary);
    
    // Institution contact info
    const footerText = `${config.institution.address} | ${config.institution.phone} | ${config.institution.email}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Generation timestamp
    const timestamp = `Generado: ${new Date().toLocaleString('es-EC')}`;
    doc.text(timestamp, config.margins.left, pageHeight - 10);
    
    // Page number
    doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - config.margins.right, pageHeight - 10, { align: 'right' });
  }

  /**
   * Add general statistics
   */
  addGeneralStats(doc, yPos, stats) {
    const config = this.defaultConfig;
    
    doc.setFontSize(config.fonts.subtitle);
    doc.setTextColor(config.institution.colors.primary);
    doc.text('ESTADÍSTICAS GENERALES', config.margins.left, yPos);
    yPos += 10;
    
    // Stats table
    const data = [
      ['Total de Estudiantes Habilitados', stats.totalStudents.toString()],
      ['Estudiantes que Votaron', stats.voted.toString()],
      ['Estudiantes Ausentes', stats.absent.toString()],
      ['Porcentaje de Participación', `${((stats.voted / stats.totalStudents) * 100).toFixed(2)}%`],
      ['Votos Válidos', stats.validVotes.toString()],
      ['Votos en Blanco', stats.blankVotes?.toString() || '0'],
      ['Votos Nulos', stats.nullVotes?.toString() || '0']
    ];
    
    doc.autoTable({
      body: data,
      startY: yPos,
      styles: { fontSize: config.fonts.body },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { halign: 'right', cellWidth: 40 }
      }
    });
    
    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Save report to history
   */
  saveToHistory(type, data) {
    const reportEntry = {
      id: Date.now().toString(),
      type: type,
      timestamp: new Date().toISOString(),
      dataSize: JSON.stringify(data).length,
      generated: true
    };
    
    this.reportHistory.unshift(reportEntry);
    
    // Keep only last 50 reports in history
    if (this.reportHistory.length > 50) {
      this.reportHistory = this.reportHistory.slice(0, 50);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('pdf_report_history', JSON.stringify(this.reportHistory));
    } catch (error) {
      console.warn('Could not save report history to localStorage:', error);
    }
  }

  /**
   * Get report history
   */
  getReportHistory() {
    try {
      const saved = localStorage.getItem('pdf_report_history');
      if (saved) {
        this.reportHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Could not load report history:', error);
    }
    
    return this.reportHistory;
  }

  /**
   * Clear report history
   */
  clearHistory() {
    this.reportHistory = [];
    localStorage.removeItem('pdf_report_history');
  }
}

// Export singleton instance
export default new PDFGenerator();