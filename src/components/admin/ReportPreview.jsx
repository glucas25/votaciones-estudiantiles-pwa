// src/components/admin/ReportPreview.jsx
// Report Preview Modal Component

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './ReportPreview.css';

const ReportPreview = ({ data, onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!data) return null;

  const { type, data: reportData, config } = data;

  // Chart colors
  const colors = ['#1e40af', '#059669', '#dc2626', '#7c3aed', '#0891b2', '#65a30d'];

  // Render different preview sections based on report type
  const renderOverview = () => (
    <div className="preview-section">
      <h3>Información General</h3>
      
      <div className="overview-grid">
        <div className="overview-card">
          <h4>📅 Fecha de Elección</h4>
          <p>{reportData.electionInfo?.date}</p>
        </div>
        
        <div className="overview-card">
          <h4>👥 Total Estudiantes</h4>
          <p>{reportData.summary?.totalStudents}</p>
        </div>
        
        <div className="overview-card">
          <h4>🗳️ Total Votos</h4>
          <p>{reportData.summary?.validVotes}</p>
        </div>
        
        <div className="overview-card">
          <h4>📊 Participación</h4>
          <p>{reportData.summary?.participation}%</p>
        </div>
      </div>

      {config?.institution && (
        <div className="institution-preview">
          <h4>Información Institucional</h4>
          <div className="institution-details">
            <p><strong>Nombre:</strong> {config.institution.name}</p>
            <p><strong>Dirección:</strong> {config.institution.address}</p>
            <p><strong>Teléfono:</strong> {config.institution.phone}</p>
            <p><strong>Email:</strong> {config.institution.email}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderResults = () => (
    <div className="preview-section">
      <h3>Resultados Electorales</h3>
      
      {reportData.results && reportData.results.length > 0 ? (
        <div className="results-preview">
          {/* Results Table */}
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Posición</th>
                  <th>{reportData.electionType === 'LIST_BASED' ? 'Lista Electoral' : 'Candidato'}</th>
                  <th>Votos</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {reportData.results.slice(0, 10).map((result, index) => (
                  <tr key={index} className={index === 0 ? 'winner-row' : ''}>
                    <td>{index + 1}</td>
                    <td>
                      {reportData.electionType === 'LIST_BASED' 
                        ? result.listName || result.name 
                        : result.candidateName || result.name
                      }
                      {result.presidentName && (
                        <div className="candidate-details">
                          Presidente: {result.presidentName}
                        </div>
                      )}
                    </td>
                    <td>{result.votes}</td>
                    <td>{result.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results Chart */}
          <div className="results-chart">
            <h4>Distribución de Votos</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.results.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={reportData.electionType === 'LIST_BASED' ? 'listName' : 'candidateName'}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="votes" 
                  fill="#1e40af"
                  name="Votos"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p>No hay resultados disponibles para mostrar.</p>
      )}
    </div>
  );

  const renderParticipation = () => (
    <div className="preview-section">
      <h3>Análisis de Participación</h3>
      
      <div className="participation-charts">
        {/* General Participation Pie Chart */}
        <div className="chart-container">
          <h4>Participación General</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Votaron', value: reportData.summary?.voted || 0, fill: '#059669' },
                  { name: 'Ausentes', value: reportData.summary?.absent || 0, fill: '#dc2626' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {[{ fill: '#059669' }, { fill: '#dc2626' }].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Participation by Course */}
        {reportData.byCourse && (
          <div className="chart-container">
            <h4>Participación por Curso</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.byCourse.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="course"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="voted" fill="#059669" name="Votaron" />
                <Bar dataKey="absent" fill="#dc2626" name="Ausentes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Participation Statistics */}
      <div className="participation-stats">
        <h4>Estadísticas Detalladas</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{reportData.summary?.voted || 0}</div>
            <div className="stat-label">Estudiantes que Votaron</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{reportData.summary?.absent || 0}</div>
            <div className="stat-label">Estudiantes Ausentes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{reportData.summary?.participation || 0}%</div>
            <div className="stat-label">Tasa de Participación</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{reportData.byCourse?.length || 0}</div>
            <div className="stat-label">Cursos Participantes</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVotersList = () => (
    <div className="preview-section">
      <h3>Lista de Sufragantes</h3>
      
      {reportData.voters && reportData.voters.length > 0 ? (
        <div className="voters-list">
          <div className="list-summary">
            <p>Total de estudiantes que ejercieron su voto: <strong>{reportData.voters.length}</strong></p>
          </div>
          
          <div className="voters-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>Curso</th>
                  <th>Cédula/ID</th>
                </tr>
              </thead>
              <tbody>
                {reportData.voters.slice(0, 20).map((voter, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{voter.nombres}</td>
                    <td>{voter.apellidos}</td>
                    <td>{voter.curso}</td>
                    <td>{voter.cedula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reportData.voters.length > 20 && (
            <p className="truncation-notice">
              Mostrando primeros 20 de {reportData.voters.length} sufragantes.
              El reporte completo incluirá todos los registros.
            </p>
          )}
        </div>
      ) : (
        <p>No hay datos de sufragantes disponibles.</p>
      )}
    </div>
  );

  const renderAbsentStudents = () => (
    <div className="preview-section">
      <h3>Estudiantes Ausentes</h3>
      
      {reportData.absent && reportData.absent.length > 0 ? (
        <div className="absent-list">
          <div className="list-summary">
            <p>Total de estudiantes ausentes: <strong>{reportData.absent.length}</strong></p>
          </div>
          
          <div className="absent-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>Curso</th>
                  <th>Cédula/ID</th>
                </tr>
              </thead>
              <tbody>
                {reportData.absent.slice(0, 20).map((student, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{student.nombres}</td>
                    <td>{student.apellidos}</td>
                    <td>{student.curso}</td>
                    <td>{student.cedula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reportData.absent.length > 20 && (
            <p className="truncation-notice">
              Mostrando primeros 20 de {reportData.absent.length} estudiantes ausentes.
            </p>
          )}
        </div>
      ) : (
        <p>No hay estudiantes registrados como ausentes.</p>
      )}
    </div>
  );

  const renderCertificatePreview = () => (
    <div className="preview-section">
      <h3>Vista Previa de Certificados</h3>
      
      <div className="certificate-preview">
        <div className="certificate-sample">
          <div className="certificate-header">
            <h4>{config?.institution?.name || 'INSTITUCIÓN EDUCATIVA'}</h4>
            <h3>CERTIFICADO DE PARTICIPACIÓN</h3>
            <p>PROCESO ELECTORAL ESTUDIANTIL</p>
          </div>
          
          <div className="certificate-body">
            <p><strong>SE CERTIFICA QUE:</strong></p>
            <p className="student-name">[NOMBRE DEL ESTUDIANTE]</p>
            <p>Estudiante del curso [CURSO]</p>
            <p>Ha participado activamente en el proceso electoral estudiantil</p>
            <p>realizado el día {reportData.electionInfo?.date}</p>
          </div>
          
          <div className="certificate-footer">
            <div className="signature-area">
              <div className="signature">
                ____________________
                <br />RECTOR/A
              </div>
              <div className="signature">
                ____________________
                <br />PRESIDENTE CONSEJO ESTUDIANTIL
              </div>
            </div>
          </div>
        </div>
        
        <div className="certificate-info">
          <h4>Información de Generación</h4>
          <p><strong>Número de certificados:</strong> {reportData.voters?.length || 0}</p>
          <p><strong>Formato:</strong> PDF individual por estudiante</p>
          <p><strong>Entrega:</strong> Archivo ZIP con todos los certificados</p>
          <p><strong>Personalización:</strong> Datos automáticos por estudiante</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'results':
        return renderResults();
      case 'participation':
        return renderParticipation();
      case 'voters':
        return renderVotersList();
      case 'absent':
        return renderAbsentStudents();
      case 'certificates':
        return renderCertificatePreview();
      default:
        return renderOverview();
    }
  };

  const getSectionName = (section) => {
    const sections = {
      overview: 'Resumen General',
      results: 'Resultados',
      participation: 'Participación',
      voters: 'Sufragantes',
      absent: 'Ausentes',
      certificates: 'Certificados'
    };
    return sections[section] || section;
  };

  const getAvailableSections = () => {
    const baseSections = ['overview'];
    
    switch (type) {
      case 'official':
        return [...baseSections, 'results'];
      case 'participation':
        return [...baseSections, 'participation', 'voters', 'absent'];
      case 'certificates':
        return [...baseSections, 'certificates'];
      case 'audit':
        return [...baseSections, 'participation'];
      default:
        return baseSections;
    }
  };

  return (
    <div className="report-preview-modal" onClick={onClose}>
      <div className="report-preview-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="preview-header">
          <div className="preview-title">
            <h2>👁️ Vista Previa del Reporte</h2>
            <span className="report-type-badge">{type}</span>
          </div>
          
          <div className="preview-controls">
            <div className="zoom-controls">
              <button 
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                disabled={zoomLevel <= 0.5}
              >
                🔍-
              </button>
              <span>{Math.round(zoomLevel * 100)}%</span>
              <button 
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                disabled={zoomLevel >= 2}
              >
                🔍+
              </button>
            </div>
            
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="preview-navigation">
          {getAvailableSections().map(section => (
            <button
              key={section}
              className={`nav-btn ${activeSection === section ? 'active' : ''}`}
              onClick={() => setActiveSection(section)}
            >
              {getSectionName(section)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div 
          className="preview-content" 
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="preview-footer">
          <div className="preview-info">
            <p>Esta es una vista previa aproximada. El documento PDF final puede tener diferencias menores en el formato.</p>
          </div>
          
          <div className="preview-actions">
            <button className="secondary-btn" onClick={onClose}>
              📋 Cerrar Vista Previa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;