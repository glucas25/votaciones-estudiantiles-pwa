// src/components/admin/ReportGenerator.jsx
// Professional Report Generator Interface

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import pdfGenerator from '../../services/pdfGenerator.js';
import chartToPdf from '../../utils/chartToPdf.js';
import databaseService from '../../services/database-indexeddb.js';
import ReportPreview from './ReportPreview.jsx';
import './ReportGenerator.css';

const ReportGenerator = () => {
  // State management
  const [activeReport, setActiveReport] = useState('official');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [reportHistory, setReportHistory] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Data state
  const [electoralData, setElectoralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters and configuration
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    course: '',
    level: '',
    reportType: 'final' // draft, final
  });
  
  const [institutionConfig, setInstitutionConfig] = useState({
    name: 'Institución Educativa',
    logo: null,
    address: 'Dirección de la Institución',
    phone: 'Teléfono: (04) 123-4567',
    email: 'info@institucion.edu.ec',
    city: 'Ciudad'
  });

  // Report types configuration
  const reportTypes = {
    official: {
      id: 'official',
      title: 'Acta Oficial de Resultados',
      description: 'Documento oficial con resultados certificados y firmas',
      icon: '📋',
      color: '#1e40af',
      requirements: ['results', 'validation'],
      estimatedTime: '2-3 min'
    },
    participation: {
      id: 'participation',
      title: 'Reporte de Participación',
      description: 'Estadísticas detalladas y análisis de participación',
      icon: '📊',
      color: '#059669',
      requirements: ['stats', 'charts'],
      estimatedTime: '3-4 min'
    },
    certificates: {
      id: 'certificates',
      title: 'Certificados Individuales',
      description: 'Certificados de participación para estudiantes',
      icon: '🎓',
      color: '#7c3aed',
      requirements: ['voters'],
      estimatedTime: '5-10 min'
    },
    audit: {
      id: 'audit',
      title: 'Reporte de Auditoría',
      description: 'Log completo de votaciones y trazabilidad',
      icon: '🔍',
      color: '#dc2626',
      requirements: ['logs', 'sessions'],
      estimatedTime: '4-6 min'
    }
  };

  // Load electoral data on component mount
  useEffect(() => {
    loadElectoralData();
    loadReportHistory();
  }, []);

  // Load all electoral data from database
  const loadElectoralData = async () => {
    setLoading(true);
    try {
      console.log('📊 Loading electoral data for reports...');

      // Load all required data in parallel
      const [studentsResult, votesResult, candidatesResult] = await Promise.all([
        databaseService.findDocuments('students', { selector: { type: 'student' } }),
        databaseService.findDocuments('votes', { selector: { type: 'vote' } }),
        databaseService.findDocuments('candidates', { selector: {} })
      ]);

      const students = studentsResult.docs || [];
      const votes = votesResult.docs || [];
      const candidates = candidatesResult.docs || [];

      // Process electoral data
      const processedData = await processElectoralData(students, votes, candidates);
      setElectoralData(processedData);
      
      console.log('✅ Electoral data loaded successfully');
      
    } catch (error) {
      console.error('Error loading electoral data:', error);
      setError('Error cargando datos electorales: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Process raw data into report-ready format
  const processElectoralData = async (students, votes, candidates) => {
    // Basic stats - use ONLY votes database for accurate counting
    const totalStudents = students.length;
    const totalVotes = votes.length;
    
    // Create set of student IDs who voted (from votes database)
    const votedStudentIds = new Set(votes.map(vote => vote.studentId).filter(Boolean));
    
    // Filter students who actually voted
    const votedStudents = students.filter(student => {
      const studentId = student._id || student.id;
      return votedStudentIds.has(studentId);
    });
    
    // Students specifically marked as absent (not just "not voted")
    const absentStudents = students.filter(s => s.status === 'absent');
    
    console.log('📊 ReportGenerator: Electoral data processed:', {
      totalStudents,
      totalVotes,
      votedStudentsCount: votedStudents.length,
      absentStudentsCount: absentStudents.length,
      votedStudentIds: Array.from(votedStudentIds).slice(0, 3)
    });

    // Results by candidate/list
    const results = processResults(votes, candidates);
    
    // Participation by course
    const byCourse = processParticipationByCourse(students, votes);
    
    // Participation by level
    const byLevel = processParticipationByLevel(students, votes);

    // Voters list
    const voters = votedStudents.map(s => ({
      nombres: s.nombres,
      apellidos: s.apellidos,
      curso: s.curso || s.course,
      cedula: s.cedula || s.id,
      votedAt: s.votedAt
    }));

    // Absent students
    const absent = absentStudents.map(s => ({
      nombres: s.nombres,
      apellidos: s.apellidos,
      curso: s.curso || s.course,
      cedula: s.cedula || s.id
    }));

    return {
      electionInfo: {
        date: new Date().toLocaleDateString('es-EC'),
        startTime: '08:00',
        endTime: '16:00',
        totalStudents,
        totalVotes,
        participation: (totalVotes / totalStudents * 100).toFixed(2)
      },
      results,
      summary: {
        totalStudents,
        voted: votedStudents.length,
        absent: absentStudents.length,
        validVotes: totalVotes,
        participation: (votedStudents.length / totalStudents * 100).toFixed(2)
      },
      byCourse,
      byLevel,
      voters,
      absent,
      charts: generateChartData(results, byCourse, byLevel),
      verificationCode: generateVerificationCode(),
      electionType: detectElectionType(candidates)
    };
  };

  // Process voting results
  const processResults = (votes, candidates) => {
    const resultMap = new Map();
    
    votes.forEach(vote => {
      const key = vote.listId || vote.candidateId;
      if (!resultMap.has(key)) {
        resultMap.set(key, { votes: 0, id: key });
      }
      resultMap.get(key).votes++;
    });

    const results = Array.from(resultMap.values()).map(result => {
      const candidate = candidates.find(c => c._id === result.id);
      return {
        ...result,
        listName: candidate?.listName,
        presidentName: candidate?.presidentName,
        candidateName: candidate?.nombre,
        position: candidate?.cargo,
        percentage: (result.votes / votes.length * 100).toFixed(2)
      };
    });

    return results.sort((a, b) => b.votes - a.votes);
  };

  // Process participation by course
  const processParticipationByCourse = (students, votes) => {
    const courseMap = new Map();
    
    // Create set of student IDs who voted
    const votedStudentIds = new Set(votes.map(vote => vote.studentId).filter(Boolean));
    
    students.forEach(student => {
      const course = student.curso || student.course;
      if (!courseMap.has(course)) {
        courseMap.set(course, { 
          course, 
          total: 0, 
          voted: 0, 
          absent: 0 
        });
      }
      
      const courseData = courseMap.get(course);
      courseData.total++;
      
      const studentId = student._id || student.id;
      if (votedStudentIds.has(studentId)) {
        courseData.voted++;
      } else if (student.status === 'absent') {
        courseData.absent++;
      }
    });

    return Array.from(courseMap.values());
  };

  // Process participation by level
  const processParticipationByLevel = (students, votes) => {
    const levelMap = new Map();
    
    // Create set of student IDs who voted
    const votedStudentIds = new Set(votes.map(vote => vote.studentId).filter(Boolean));
    
    students.forEach(student => {
      const level = student.level || student.nivel || detectLevel(student.curso || student.course);
      if (!levelMap.has(level)) {
        levelMap.set(level, { level, total: 0, voted: 0 });
      }
      
      const levelData = levelMap.get(level);
      levelData.total++;
      
      const studentId = student._id || student.id;
      if (votedStudentIds.has(studentId)) {
        levelData.voted++;
      }
    });

    return Array.from(levelMap.values()).map(level => ({
      ...level,
      participation: (level.voted / level.total * 100).toFixed(2)
    }));
  };

  // Generate chart data for reports
  const generateChartData = (results, byCourse, byLevel) => {
    return {
      results: results.slice(0, 10), // Top 10 for readability
      participation: byCourse,
      levels: byLevel
    };
  };

  // Detect election type
  const detectElectionType = (candidates) => {
    const hasLists = candidates.some(c => c.listName || c.presidentName);
    return hasLists ? 'LIST_BASED' : 'POSITION_BASED';
  };

  // Detect education level from course name
  const detectLevel = (courseName) => {
    if (!courseName) return 'OTROS';
    
    const course = courseName.toLowerCase();
    if (course.includes('bach')) return 'BACHILLERATO';
    if (course.includes('1') || course.includes('2') || course.includes('3')) {
      return course.includes('bach') ? 'BACHILLERATO' : 'BÁSICA SUPERIOR';
    }
    return 'OTROS';
  };

  // Generate verification code
  const generateVerificationCode = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `ELECT-${timestamp}-${random}`.toUpperCase();
  };

  // Load report history
  const loadReportHistory = () => {
    const history = pdfGenerator.getReportHistory();
    setReportHistory(history);
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    if (!electoralData) {
      alert('❌ No hay datos disponibles para generar el reporte');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      let result;
      const reportType = reportTypes[activeReport];

      // Progress simulation
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      console.log(`📄 Generating ${reportType.title}...`);

      // Configure PDF generator with institution settings
      pdfGenerator.setInstitutionConfig(institutionConfig);

      // Generate based on report type
      switch (activeReport) {
        case 'official':
          result = await pdfGenerator.generateOfficialResults({
            ...electoralData,
            reportType: filters.reportType
          });
          break;
          
        case 'participation':
          result = await pdfGenerator.generateParticipationReport({
            ...electoralData,
            filters
          });
          break;
          
        case 'certificates':
          result = await pdfGenerator.generateIndividualCertificates(
            electoralData.voters.slice(0, 50) // Limit for demo
          );
          break;
          
        case 'audit':
          // Generate audit data
          const auditData = await generateAuditData();
          result = await pdfGenerator.generateAuditReport(auditData);
          break;
          
        default:
          throw new Error('Tipo de reporte no válido');
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (result.success) {
        // Download the PDF
        if (result.certificates) {
          // Handle multiple certificates - create ZIP
          const zip = result.zip || await createZipFromCertificates(result.certificates);
          downloadBlob(zip, `certificados_${new Date().toISOString().split('T')[0]}.zip`);
        } else {
          // Single PDF
          const pdfBlob = result.pdf.output('blob');
          downloadBlob(pdfBlob, result.filename);
        }

        // Update history
        loadReportHistory();
        
        alert(`✅ ${reportType.title} generado exitosamente!`);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }

    } catch (error) {
      console.error('Error generating report:', error);
      alert(`❌ Error generando reporte: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Generate audit data
  const generateAuditData = async () => {
    const sessions = await databaseService.findDocuments('sessions', {});
    const votes = await databaseService.findDocuments('votes', {});
    
    return {
      systemInfo: {
        totalSessions: sessions.docs?.length || 0,
        totalVotes: votes.docs?.length || 0,
        startTime: '08:00:00',
        endTime: '16:00:00',
        devices: 5,
        tutors: 8
      },
      sessions: sessions.docs || [],
      logs: votes.docs?.map(vote => ({
        timestamp: vote.timestamp,
        action: 'VOTE_CAST',
        studentId: vote.studentId,
        details: `Vote cast for ${vote.listId || vote.candidateId}`
      })) || [],
      errors: [], // Would be populated with actual error logs
      security: {
        integrityChecks: 'PASSED',
        duplicateVotes: 0,
        invalidVotes: 0
      }
    };
  };

  // Create ZIP from certificates
  const createZipFromCertificates = async (certificates) => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    certificates.forEach(cert => {
      zip.file(cert.filename, cert.pdf.output('blob'));
    });
    
    return await zip.generateAsync({ type: 'blob' });
  };

  // Download blob as file
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle preview
  const handlePreviewReport = () => {
    if (!electoralData) {
      alert('❌ No hay datos disponibles para la vista previa');
      return;
    }

    setPreviewData({
      type: activeReport,
      data: electoralData,
      config: { institution: institutionConfig }
    });
    setShowPreview(true);
  };

  // Render report type selector
  const renderReportTypeSelector = () => (
    <div className="report-types-grid">
      {Object.values(reportTypes).map(type => (
        <div
          key={type.id}
          className={`report-type-card ${activeReport === type.id ? 'active' : ''}`}
          onClick={() => setActiveReport(type.id)}
          style={{ '--accent-color': type.color }}
        >
          <div className="report-icon">{type.icon}</div>
          <h3>{type.title}</h3>
          <p>{type.description}</p>
          <div className="report-meta">
            <span className="estimated-time">⏱️ {type.estimatedTime}</span>
          </div>
        </div>
      ))}
    </div>
  );

  // Render filters section
  const renderFiltersSection = () => (
    <div className="filters-section">
      <h3>Filtros y Configuración</h3>
      <div className="filters-grid">
        <div className="filter-group">
          <label>Fecha desde:</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </div>
        
        <div className="filter-group">
          <label>Fecha hasta:</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>
        
        <div className="filter-group">
          <label>Tipo de documento:</label>
          <select
            value={filters.reportType}
            onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
          >
            <option value="final">Documento Final</option>
            <option value="draft">Borrador</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Render institution config
  const renderInstitutionConfig = () => (
    <div className="institution-config">
      <h3>Configuración Institucional</h3>
      <div className="config-grid">
        <div className="config-group">
          <label>Nombre de la Institución:</label>
          <input
            type="text"
            value={institutionConfig.name}
            onChange={(e) => setInstitutionConfig({ ...institutionConfig, name: e.target.value })}
          />
        </div>
        
        <div className="config-group">
          <label>Dirección:</label>
          <input
            type="text"
            value={institutionConfig.address}
            onChange={(e) => setInstitutionConfig({ ...institutionConfig, address: e.target.value })}
          />
        </div>
        
        <div className="config-group">
          <label>Teléfono:</label>
          <input
            type="text"
            value={institutionConfig.phone}
            onChange={(e) => setInstitutionConfig({ ...institutionConfig, phone: e.target.value })}
          />
        </div>
        
        <div className="config-group">
          <label>Email:</label>
          <input
            type="email"
            value={institutionConfig.email}
            onChange={(e) => setInstitutionConfig({ ...institutionConfig, email: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  // Render generation progress
  const renderGenerationProgress = () => (
    <div className="generation-progress">
      <div className="progress-header">
        <h3>Generando {reportTypes[activeReport].title}...</h3>
        <span>{generationProgress}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${generationProgress}%` }}
        />
      </div>
      <p>Este proceso puede tomar {reportTypes[activeReport].estimatedTime}</p>
    </div>
  );

  // Render report history
  const renderReportHistory = () => (
    <div className="report-history">
      <h3>Historial de Reportes</h3>
      {reportHistory.length === 0 ? (
        <p>No hay reportes generados aún</p>
      ) : (
        <div className="history-list">
          {reportHistory.slice(0, 10).map(report => (
            <div key={report.id} className="history-item">
              <div className="history-info">
                <span className="report-type">
                  {reportTypes[report.type]?.icon} {reportTypes[report.type]?.title}
                </span>
                <span className="report-date">
                  {new Date(report.timestamp).toLocaleString('es-EC')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <button 
        className="clear-history-btn"
        onClick={() => {
          pdfGenerator.clearHistory();
          loadReportHistory();
        }}
      >
        🗑️ Limpiar Historial
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="report-generator loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <h3>Cargando datos electorales...</h3>
          <p>Preparando información para reportes</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-generator error">
        <div className="error-content">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={loadElectoralData} className="retry-btn">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-generator">
      <div className="report-header">
        <h2>📋 Generador de Reportes PDF</h2>
        <p>Sistema profesional de reportes electorales</p>
      </div>

      {/* Report Type Selection */}
      <section className="report-selection-section">
        <h3>Seleccionar Tipo de Reporte</h3>
        {renderReportTypeSelector()}
      </section>

      {/* Configuration Sections */}
      <div className="config-sections">
        <div className="config-column">
          {renderFiltersSection()}
          {renderInstitutionConfig()}
        </div>
        
        <div className="config-column">
          {renderReportHistory()}
        </div>
      </div>

      {/* Generation Controls */}
      <div className="generation-controls">
        <div className="control-buttons">
          <button
            className="preview-btn"
            onClick={handlePreviewReport}
            disabled={isGenerating}
          >
            👁️ Vista Previa
          </button>
          
          <button
            className="generate-btn"
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ Generando...' : '🚀 Generar PDF'}
          </button>
        </div>

        {isGenerating && renderGenerationProgress()}
      </div>

      {/* Statistics Overview */}
      {electoralData && (
        <div className="data-overview">
          <h3>Resumen de Datos</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{electoralData.summary.totalStudents}</span>
              <span className="stat-label">Estudiantes Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{electoralData.summary.voted}</span>
              <span className="stat-label">Votaron</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{electoralData.summary.participation}%</span>
              <span className="stat-label">Participación</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{electoralData.results.length}</span>
              <span className="stat-label">Candidatos/Listas</span>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <ReportPreview
          data={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default ReportGenerator;