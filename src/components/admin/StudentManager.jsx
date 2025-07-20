// src/components/admin/StudentManager.jsx
// Complete student management component with pagination, search, and virtualization

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import StudentImport from './StudentImport';
import { generateCSVContent } from '../../utils/csvTemplate';
import { validateStudent } from '../../utils/studentValidation';
import './StudentManager.css';

const ITEMS_PER_PAGE = 50;
const ROW_HEIGHT = 80;
const LIST_HEIGHT = 600;

const StudentManager = ({ 
  students = [], 
  onStudentsUpdate, 
  onStudentAdd, 
  onStudentUpdate, 
  onStudentDelete,
  onBulkImport 
}) => {
  const [view, setView] = useState('list'); // list, import, edit
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('apellidos');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [editingStudent, setEditingStudent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    console.log('🔍 StudentManager - Processing students:', students);
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.nombres?.toLowerCase().includes(term) ||
        student.apellidos?.toLowerCase().includes(term) ||
        student.cedula?.includes(term) ||
        student.curso?.toLowerCase().includes(term) ||
        `${student.nombres} ${student.apellidos}`.toLowerCase().includes(term)
      );
    }

    // Level filter
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(student => student.nivel === levelFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [students, searchTerm, levelFilter, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedStudents, currentPage]);

  // Statistics
  const stats = useMemo(() => {
    const levelCounts = {};
    const statusCounts = {};
    
    students.forEach(student => {
      levelCounts[student.nivel] = (levelCounts[student.nivel] || 0) + 1;
      statusCounts[student.status || 'pending'] = (statusCounts[student.status || 'pending'] || 0) + 1;
    });

    return {
      total: students.length,
      filtered: filteredAndSortedStudents.length,
      levelCounts,
      statusCounts
    };
  }, [students, filteredAndSortedStudents]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, levelFilter, statusFilter]);

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle selection
  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === paginatedStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(paginatedStudents.map(s => s.id)));
    }
  };

  // Export functions
  const exportToCSV = (studentsToExport = filteredAndSortedStudents) => {
    const csvContent = generateCSVContent(studentsToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estudiantes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedStudents.size === 0) return;
    
    if (window.confirm(`¿Está seguro de eliminar ${selectedStudents.size} estudiantes seleccionados?`)) {
      const idsToDelete = Array.from(selectedStudents);
      idsToDelete.forEach(id => onStudentDelete?.(id));
      setSelectedStudents(new Set());
    }
  };

  const handleBulkExport = () => {
    if (selectedStudents.size === 0) return;
    
    const selectedStudentData = students.filter(s => selectedStudents.has(s.id));
    exportToCSV(selectedStudentData);
  };

  // Import handling
  const handleImportComplete = (importedStudents, report) => {
    console.log('📤 StudentManager - handleImportComplete called with:', importedStudents);
    if (onBulkImport) {
      console.log('📤 Calling onBulkImport with students');
      onBulkImport(importedStudents);
    } else {
      console.error('❌ onBulkImport function not provided');
    }
    setView('list');
  };

  // Student row component for virtualized list
  const StudentRow = React.memo(({ index, style }) => {
    const student = paginatedStudents[index];
    if (!student) return null;

    return (
      <div style={style} className="student-row">
        <div className="student-row-content">
          <div className="student-checkbox">
            <input
              type="checkbox"
              checked={selectedStudents.has(student.id)}
              onChange={() => handleSelectStudent(student.id)}
            />
          </div>
          
          <div className="student-name">
            <strong>{student.apellidos}, {student.nombres}</strong>
          </div>
          
          <div className="student-id">
            {student.cedula}
          </div>
          
          <div className="student-course">
            {student.curso}
          </div>
          
          <div className={`student-level level-${student.nivel?.toLowerCase()}`}>
            {student.nivel}
          </div>
          
          <div className={`student-status status-${student.status || 'pending'}`}>
            {student.status || 'pending'}
          </div>

          <div className="student-actions">
            <button 
              onClick={() => setEditingStudent(student)}
              className="btn-edit"
              title="Editar estudiante"
            >
              ✏️
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(student)}
              className="btn-delete"
              title="Eliminar estudiante"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  });

  // Import view
  if (view === 'import') {
    return (
      <div className="student-manager">
        <div className="manager-header">
          <button 
            onClick={() => setView('list')}
            className="btn-back"
          >
            ⬅️ Volver a Lista
          </button>
        </div>
        <StudentImport
          onImportComplete={handleImportComplete}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  // Main list view
  return (
    <div className="student-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="header-title">
          <h2>👥 Gestión de Estudiantes</h2>
          <div className="stats-summary">
            <span className="stat-item">Total: {stats.total}</span>
            <span className="stat-item">Filtrados: {stats.filtered}</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => setView('import')}
            className="btn-primary"
          >
            📁 Importar Estudiantes
          </button>
          <button 
            onClick={() => exportToCSV()}
            className="btn-secondary"
          >
            📊 Exportar Todo
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-section">
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filter-section">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">📚 Todos los Niveles</option>
            <option value="BASICA_ELEMENTAL">📖 Básica Elemental</option>
            <option value="BASICA_MEDIA">📓 Básica Media</option>
            <option value="BASICA_SUPERIOR">📔 Básica Superior</option>
            <option value="BACHILLERATO">🎓 Bachillerato</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">🏷️ Todos los Estados</option>
            <option value="pending">⏳ Pendiente</option>
            <option value="voted">✅ Votó</option>
            <option value="absent">❌ Ausente</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="filter-select"
          >
            <option value="apellidos-asc">📝 Apellidos A-Z</option>
            <option value="apellidos-desc">📝 Apellidos Z-A</option>
            <option value="nombres-asc">👤 Nombres A-Z</option>
            <option value="nombres-desc">👤 Nombres Z-A</option>
            <option value="curso-asc">🎓 Curso A-Z</option>
            <option value="cedula-asc">🆔 Cédula</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedStudents.size > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span>{selectedStudents.size} estudiantes seleccionados</span>
          </div>
          <div className="bulk-buttons">
            <button onClick={handleBulkExport} className="btn-secondary">
              📊 Exportar Seleccionados
            </button>
            <button onClick={handleBulkDelete} className="btn-danger">
              🗑️ Eliminar Seleccionados
            </button>
            <button onClick={() => setSelectedStudents(new Set())} className="btn-secondary">
              ✕ Limpiar Selección
            </button>
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="students-section">
        {/* Table Header */}
        <div className="table-header">
          <div className="header-checkbox">
            <input
              type="checkbox"
              checked={paginatedStudents.length > 0 && selectedStudents.size === paginatedStudents.length}
              onChange={handleSelectAll}
            />
          </div>
          <div className="header-name">
            <button 
              onClick={() => handleSort('apellidos')}
              className={`sort-btn ${sortBy === 'apellidos' ? 'active' : ''}`}
            >
              Estudiante {sortBy === 'apellidos' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          <div className="header-id">
            <button 
              onClick={() => handleSort('cedula')}
              className={`sort-btn ${sortBy === 'cedula' ? 'active' : ''}`}
            >
              Cédula {sortBy === 'cedula' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          <div className="header-course">
            <button 
              onClick={() => handleSort('curso')}
              className={`sort-btn ${sortBy === 'curso' ? 'active' : ''}`}
            >
              Curso {sortBy === 'curso' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          <div className="header-level">
            <button 
              onClick={() => handleSort('nivel')}
              className={`sort-btn ${sortBy === 'nivel' ? 'active' : ''}`}
            >
              Nivel {sortBy === 'nivel' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          <div className="header-status">
            <button 
              onClick={() => handleSort('status')}
              className={`sort-btn ${sortBy === 'status' ? 'active' : ''}`}
            >
              Estado {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
          <div className="header-actions">Acciones</div>
        </div>

        {/* Virtualized List */}
        {filteredAndSortedStudents.length > 0 ? (
          <List
            height={LIST_HEIGHT}
            itemCount={paginatedStudents.length}
            itemSize={ROW_HEIGHT}
            className="students-list"
          >
            {StudentRow}
          </List>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No se encontraron estudiantes</h3>
            <p>
              {searchTerm || levelFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza importando un archivo de estudiantes'
              }
            </p>
            {!searchTerm && levelFilter === 'ALL' && statusFilter === 'ALL' && (
              <button 
                onClick={() => setView('import')}
                className="btn-primary"
              >
                📁 Importar Estudiantes
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="page-btn"
          >
            ⏮️
          </button>
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            ⬅️
          </button>
          
          <span className="page-info">
            Página {currentPage} de {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            ➡️
          </button>
          <button 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            ⏭️
          </button>
        </div>
      )}

      {/* Statistics Panel */}
      <div className="stats-panel">
        <div className="stats-section">
          <h4>📊 Estadísticas por Nivel</h4>
          <div className="stats-grid">
            {Object.entries(stats.levelCounts).map(([level, count]) => (
              <div key={level} className="stat-card">
                <div className="stat-number">{count}</div>
                <div className="stat-label">{level.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-section">
          <h4>🏷️ Estados de Votación</h4>
          <div className="stats-grid">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status} className={`stat-card status-${status}`}>
                <div className="stat-number">{count}</div>
                <div className="stat-label">{status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🗑️ Confirmar Eliminación</h3>
            <p>
              ¿Está seguro de eliminar al estudiante <strong>
                {showDeleteConfirm.nombres} {showDeleteConfirm.apellidos}
              </strong>?
            </p>
            <p className="warning-text">Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onStudentDelete?.(showDeleteConfirm.id);
                  setShowDeleteConfirm(null);
                }}
                className="btn-danger"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;