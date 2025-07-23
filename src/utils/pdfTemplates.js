// src/utils/pdfTemplates.js
// Professional PDF Templates for Electoral Reports

import chartToPdf from './chartToPdf.js';

/**
 * Professional PDF Templates
 * Provides standardized layouts and styling for electoral reports
 */
class PDFTemplates {
  constructor() {
    this.themes = {
      official: {
        primary: '#1e40af',
        secondary: '#64748b',
        accent: '#059669',
        danger: '#dc2626',
        warning: '#d97706',
        background: '#ffffff',
        text: '#1f2937'
      },
      modern: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        background: '#ffffff',
        text: '#111827'
      },
      conservative: {
        primary: '#374151',
        secondary: '#6b7280',
        accent: '#059669',
        danger: '#b91c1c',
        warning: '#92400e',
        background: '#ffffff',
        text: '#1f2937'
      }
    };
    
    this.currentTheme = this.themes.official;
  }

  /**
   * Set active theme
   */
  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = this.themes[themeName];
    }
  }

  /**
   * Official Results Template
   */
  async renderOfficialResults(doc, data, config = {}) {
    const theme = this.currentTheme;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header Section
    yPos = await this.renderHeader(doc, {
      title: 'ACTA OFICIAL DE RESULTADOS ELECTORALES',
      subtitle: data.electionInfo?.title || 'Elección Estudiantil',
      yPos,
      theme
    });

    // Institution Section
    if (config.institution) {
      yPos = this.renderInstitutionInfo(doc, config.institution, yPos, theme);
    }

    // Election Information
    yPos = this.renderElectionInfo(doc, data.electionInfo, yPos, theme);

    // Official Results Section
    yPos = await this.renderResultsTable(doc, data.results, yPos, theme, data.electionType);

    // Statistical Summary
    yPos = this.renderStatisticalSummary(doc, data.summary, yPos, theme);

    // Validation Section
    yPos = this.renderValidationSection(doc, yPos, theme);

    // Footer
    this.renderFooter(doc, config.institution, theme);

    // Add verification elements
    if (data.verificationCode) {
      await this.addVerificationElements(doc, data.verificationCode, theme);
    }

    return doc;
  }

  /**
   * Participation Report Template
   */
  async renderParticipationReport(doc, data, config = {}) {
    const theme = this.currentTheme;
    let yPos = 20;

    // Header
    yPos = await this.renderHeader(doc, {
      title: 'REPORTE DE PARTICIPACIÓN ELECTORAL',
      subtitle: `Análisis Detallado - ${data.date}`,
      yPos,
      theme
    });

    // Executive Summary
    yPos = this.renderExecutiveSummary(doc, data.summary, yPos, theme);

    // Participation Charts
    if (data.charts) {
      yPos = await this.renderChartSection(doc, data.charts, yPos, theme);
    }

    // Detailed Statistics by Level
    yPos = this.renderLevelStatistics(doc, data.byLevel, yPos, theme);

    // Course Participation Table
    yPos = this.renderCourseParticipationTable(doc, data.byCourse, yPos, theme);

    // Add new page for detailed lists if needed
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // Voter Lists
    yPos = this.renderVoterLists(doc, data.voters, yPos, theme);

    // Absent Students
    yPos = this.renderAbsentStudents(doc, data.absent, yPos, theme);

    this.renderFooter(doc, config.institution, theme);

    return doc;
  }

  /**
   * Individual Certificate Template
   */
  async renderCertificate(doc, student, config = {}) {
    const theme = this.currentTheme;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Decorative border
    this.renderCertificateBorder(doc, theme);

    // Institution logo and name (centered)
    let yPos = 40;
    if (config.institution?.logo) {
      doc.addImage(config.institution.logo, 'PNG', pageWidth/2 - 15, yPos, 30, 30);
      yPos += 35;
    }

    doc.setFontSize(18);
    doc.setTextColor(theme.primary);
    doc.text(config.institution?.name || 'INSTITUCIÓN EDUCATIVA', pageWidth/2, yPos, { align: 'center' });
    yPos += 20;

    // Certificate title
    doc.setFontSize(24);
    doc.setTextColor(theme.primary);
    doc.text('CERTIFICADO DE PARTICIPACIÓN', pageWidth/2, yPos, { align: 'center' });
    yPos += 20;

    // Subtitle
    doc.setFontSize(16);
    doc.setTextColor(theme.text);
    doc.text('PROCESO ELECTORAL ESTUDIANTIL', pageWidth/2, yPos, { align: 'center' });
    yPos += 30;

    // Main text
    doc.setFontSize(14);
    const studentName = `${student.nombres} ${student.apellidos}`.toUpperCase();
    const certificateText = [
      'SE CERTIFICA QUE:',
      '',
      studentName,
      '',
      `Estudiante del curso ${student.curso || student.course}`,
      'Ha participado activamente en el proceso electoral estudiantil',
      `realizado el día ${config.electionDate}`,
      '',
      'Ejerciendo su derecho al voto de manera responsable',
      'y contribuyendo al fortalecimiento de la democracia estudiantil.'
    ];

    certificateText.forEach((line, index) => {
      const fontSize = line === studentName ? 16 : 14;
      const fontStyle = (line === studentName || line === 'SE CERTIFICA QUE:') ? 'bold' : 'normal';
      
      doc.setFontSize(fontSize);
      doc.setFont(undefined, fontStyle);
      
      if (line === studentName) {
        doc.setTextColor(theme.primary);
      } else {
        doc.setTextColor(theme.text);
      }
      
      doc.text(line, pageWidth/2, yPos, { align: 'center' });
      yPos += fontSize === 16 ? 8 : 6;
    });

    // Date and signatures
    yPos += 20;
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(theme.text);
    
    const issueDate = new Date().toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    doc.text(`Emitido en: ${config.institution?.city || 'Ciudad'}, ${issueDate}`, pageWidth/2, yPos, { align: 'center' });
    yPos += 30;

    // Signature lines
    const signatures = [
      { title: 'RECTOR/A', x: 60 },
      { title: 'PRESIDENTE CONSEJO ESTUDIANTIL', x: pageWidth - 60 }
    ];

    signatures.forEach(sig => {
      doc.line(sig.x - 30, yPos, sig.x + 30, yPos);
      doc.text(sig.title, sig.x, yPos + 8, { align: 'center' });
    });

    // Add seal placeholder
    doc.setDrawColor(theme.secondary);
    doc.circle(pageWidth/2, yPos - 15, 20, 'S');
    doc.setFontSize(10);
    doc.text('SELLO', pageWidth/2, yPos - 15, { align: 'center' });

    return doc;
  }

  /**
   * Audit Report Template
   */
  async renderAuditReport(doc, data, config = {}) {
    const theme = this.currentTheme;
    let yPos = 20;

    // Header
    yPos = await this.renderHeader(doc, {
      title: 'REPORTE DE AUDITORÍA ELECTORAL',
      subtitle: 'Trazabilidad y Control del Proceso',
      yPos,
      theme
    });

    // System Overview
    yPos = this.renderSystemOverview(doc, data.systemInfo, yPos, theme);

    // Voting Sessions Summary
    yPos = this.renderVotingSessionsSummary(doc, data.sessions, yPos, theme);

    // Timeline Analysis
    if (data.timeline) {
      yPos = await this.renderTimelineChart(doc, data.timeline, yPos, theme);
    }

    // New page for detailed logs
    doc.addPage();
    yPos = 20;

    // Detailed Activity Log
    yPos = this.renderDetailedLog(doc, data.logs, yPos, theme);

    // Error Analysis
    if (data.errors && data.errors.length > 0) {
      yPos = this.renderErrorAnalysis(doc, data.errors, yPos, theme);
    }

    // Security Validation
    yPos = this.renderSecurityValidation(doc, data.security, yPos, theme);

    this.renderFooter(doc, config.institution, theme);

    return doc;
  }

  // ==================== HELPER METHODS ====================

  /**
   * Render professional header
   */
  async renderHeader(doc, { title, subtitle, yPos, theme }) {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Main title
    doc.setFontSize(18);
    doc.setTextColor(theme.primary);
    doc.setFont(undefined, 'bold');
    doc.text(title, pageWidth/2, yPos, { align: 'center' });
    yPos += 12;

    // Subtitle if provided
    if (subtitle) {
      doc.setFontSize(14);
      doc.setTextColor(theme.secondary);
      doc.setFont(undefined, 'normal');
      doc.text(subtitle, pageWidth/2, yPos, { align: 'center' });
      yPos += 10;
    }

    // Decorative line
    doc.setDrawColor(theme.primary);
    doc.setLineWidth(1);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 15;

    return yPos;
  }

  /**
   * Render institution information
   */
  renderInstitutionInfo(doc, institution, yPos, theme) {
    doc.setFontSize(12);
    doc.setTextColor(theme.text);
    doc.setFont(undefined, 'bold');
    
    doc.text(institution.name.toUpperCase(), 20, yPos);
    yPos += 6;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    const info = [
      institution.address,
      institution.phone,
      institution.email
    ].filter(Boolean);
    
    info.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });
    
    yPos += 5;
    return yPos;
  }

  /**
   * Render election information
   */
  renderElectionInfo(doc, electionInfo, yPos, theme) {
    if (!electionInfo) return yPos;
    
    doc.setFontSize(14);
    doc.setTextColor(theme.primary);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DE LA ELECCIÓN', 20, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setTextColor(theme.text);
    doc.setFont(undefined, 'normal');

    const details = [
      ['Fecha:', electionInfo.date],
      ['Hora de Inicio:', electionInfo.startTime],
      ['Hora de Cierre:', electionInfo.endTime],
      ['Total Estudiantes Habilitados:', electionInfo.totalStudents?.toString()],
      ['Votos Emitidos:', electionInfo.totalVotes?.toString()],
      ['Participación:', `${electionInfo.participation?.toFixed(1)}%`]
    ].filter(([, value]) => value);

    details.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(value, 80, yPos);
      yPos += 5;
    });

    yPos += 8;
    return yPos;
  }

  /**
   * Render results table with professional styling
   */
  async renderResultsTable(doc, results, yPos, theme, electionType) {
    if (!results || results.length === 0) return yPos;

    doc.setFontSize(14);
    doc.setTextColor(theme.primary);
    doc.setFont(undefined, 'bold');
    doc.text('RESULTADOS OFICIALES', 20, yPos);
    yPos += 10;

    // Configure table based on election type
    const isListBased = electionType === 'LIST_BASED';
    
    const headers = isListBased 
      ? ['Lista Electoral', 'Presidente', 'Votos', 'Porcentaje']
      : ['Candidato', 'Cargo', 'Votos', 'Porcentaje'];

    const tableData = results.map(result => {
      if (isListBased) {
        return [
          result.listName || result.name,
          result.presidentName || 'N/A',
          result.votes?.toString() || '0',
          `${result.percentage?.toFixed(2) || 0}%`
        ];
      } else {
        return [
          result.candidateName || result.name,
          result.position || result.cargo,
          result.votes?.toString() || '0',
          `${result.percentage?.toFixed(2) || 0}%`
        ];
      }
    });

    // Calculate winner
    const winner = results.reduce((max, current) => 
      (current.votes || 0) > (max.votes || 0) ? current : max
    );

    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: theme.secondary,
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: theme.primary,
        textColor: '#FFFFFF',
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: {
        textColor: theme.text
      },
      alternateRowStyles: {
        fillColor: '#f8fafc'
      },
      didParseCell: (data) => {
        // Highlight winner row
        if (data.section === 'body' && tableData[data.row.index]) {
          const rowData = results[data.row.index];
          if (rowData === winner) {
            data.cell.styles.fillColor = theme.accent;
            data.cell.styles.textColor = '#FFFFFF';
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Winner announcement
    if (winner) {
      doc.setFontSize(12);
      doc.setTextColor(theme.primary);
      doc.setFont(undefined, 'bold');
      
      const winnerText = isListBased 
        ? `🏆 LISTA GANADORA: ${winner.listName || winner.name}`
        : `🏆 GANADOR: ${winner.candidateName || winner.name}`;
      
      doc.text(winnerText, 20, yPos);
      yPos += 10;
    }

    return yPos;
  }

  /**
   * Render statistical summary
   */
  renderStatisticalSummary(doc, summary, yPos, theme) {
    if (!summary) return yPos;

    doc.setFontSize(14);
    doc.setTextColor(theme.primary);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN ESTADÍSTICO', 20, yPos);
    yPos += 10;

    const stats = [
      ['Total de Votos Válidos:', summary.validVotes?.toString()],
      ['Votos en Blanco:', summary.blankVotes?.toString() || '0'],
      ['Votos Nulos:', summary.nullVotes?.toString() || '0'],
      ['Participación General:', `${summary.participation?.toFixed(2)}%`],
      ['Abstención:', `${(100 - (summary.participation || 0)).toFixed(2)}%`]
    ].filter(([, value]) => value);

    doc.autoTable({
      body: stats,
      startY: yPos,
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, fillColor: '#f1f5f9' },
        1: { halign: 'right', cellWidth: 30 }
      }
    });

    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Render validation section with signature areas
   */
  renderValidationSection(doc, yPos, theme) {
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Move to bottom of page if not enough space
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(theme.primary);
    doc.setFont(undefined, 'bold');
    doc.text('VALIDACIÓN Y FIRMAS', 20, yPos);
    yPos += 15;

    const officials = [
      { title: 'PRESIDENTE DEL TRIBUNAL ELECTORAL', name: '', cedula: '' },
      { title: 'SECRETARIO/A', name: '', cedula: '' },
      { title: 'VOCAL PRINCIPAL', name: '', cedula: '' }
    ];

    officials.forEach((official, index) => {
      const xPos = 20 + (index * 60);
      
      // Title
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(official.title, xPos, yPos);
      
      // Signature line
      doc.setDrawColor(theme.secondary);
      doc.line(xPos, yPos + 20, xPos + 50, yPos + 20);
      
      // Labels
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text('Nombre:', xPos, yPos + 28);
      doc.text('Cédula:', xPos, yPos + 35);
      doc.text('Fecha:', xPos, yPos + 42);
      
      // Lines for filling
      doc.line(xPos + 15, yPos + 28, xPos + 50, yPos + 28);
      doc.line(xPos + 15, yPos + 35, xPos + 50, yPos + 35);
      doc.line(xPos + 15, yPos + 42, xPos + 50, yPos + 42);
    });

    return yPos + 50;
  }

  /**
   * Add verification elements (QR code, watermarks)
   */
  async addVerificationElements(doc, verificationCode, theme) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // QR Code
    try {
      const QRCode = await import('qrcode');
      const qrDataURL = await QRCode.toDataURL(verificationCode, {
        width: 100,
        height: 100,
        color: {
          dark: theme.primary,
          light: '#FFFFFF'
        }
      });
      
      doc.addImage(qrDataURL, 'PNG', pageWidth - 35, pageHeight - 45, 25, 25);
      
      doc.setFontSize(8);
      doc.setTextColor(theme.secondary);
      doc.text('Código de Verificación', pageWidth - 35, pageHeight - 15);
      doc.text(verificationCode.slice(0, 12) + '...', pageWidth - 35, pageHeight - 10);
      
    } catch (error) {
      console.error('Error adding QR code:', error);
    }

    // Watermark
    doc.setGState(doc.GState({ opacity: 0.1 }));
    doc.setFontSize(60);
    doc.setTextColor(theme.primary);
    doc.text('OFICIAL', pageWidth/2, pageHeight/2, { 
      align: 'center', 
      angle: 45 
    });
    doc.setGState(doc.GState({ opacity: 1.0 }));
  }

  /**
   * Render professional footer
   */
  renderFooter(doc, institution, theme) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Footer line
    doc.setDrawColor(theme.primary);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
    
    // Institution info
    doc.setFontSize(8);
    doc.setTextColor(theme.secondary);
    
    if (institution) {
      const footerText = [institution.name, institution.address, institution.phone]
        .filter(Boolean).join(' | ');
      doc.text(footerText, pageWidth/2, pageHeight - 18, { align: 'center' });
    }
    
    // Generation info
    const timestamp = new Date().toLocaleString('es-EC');
    doc.text(`Generado: ${timestamp}`, 20, pageHeight - 10);
    
    // Page number
    const pageNum = doc.getCurrentPageInfo().pageNumber;
    doc.text(`Página ${pageNum}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
  }

  /**
   * Render decorative certificate border
   */
  renderCertificateBorder(doc, theme) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    
    // Outer border
    doc.setDrawColor(theme.primary);
    doc.setLineWidth(2);
    doc.rect(margin, margin, pageWidth - 2*margin, pageHeight - 2*margin);
    
    // Inner decorative border
    doc.setDrawColor(theme.accent);
    doc.setLineWidth(0.5);
    doc.rect(margin + 5, margin + 5, pageWidth - 2*(margin + 5), pageHeight - 2*(margin + 5));
    
    // Corner decorations
    const cornerSize = 10;
    const corners = [
      [margin + 15, margin + 15],
      [pageWidth - margin - 15, margin + 15],
      [margin + 15, pageHeight - margin - 15],
      [pageWidth - margin - 15, pageHeight - margin - 15]
    ];
    
    corners.forEach(([x, y]) => {
      doc.setFillColor(theme.accent);
      doc.circle(x, y, 3, 'F');
    });
  }
}

export default new PDFTemplates();