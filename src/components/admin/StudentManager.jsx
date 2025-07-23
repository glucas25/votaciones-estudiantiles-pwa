// src/components/admin/StudentManager.jsx
// Performance optimized student management component with virtualization for 1000+ students

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import StudentImport from './StudentImport';
import { generateCSVContent } from '../../utils/csvTemplate';
import { validateStudent } from '../../utils/studentValidation';
import performanceMonitor from '../../utils/performanceMonitor';
import smartCache from '../../utils/smartCache';
import './StudentManager.css';

const ITEMS_PER_PAGE = 50;
const ROW_HEIGHT = 80;
const LIST_HEIGHT = 600;
const SEARCH_DEBOUNCE_DELAY = 200; // 200ms optimized debounce

// Custom hook for optimized debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
};

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
  
  // Performance optimization refs
  const searchTimerRef = useRef();
  const lastSearchResults = useRef(new Map());
  
  // Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_DELAY);

  // Optimized filter and sort students with performance monitoring
  const filteredAndSortedStudents = useMemo(() => {
    const timer = performanceMonitor?.measureStudentSearch();
    
    console.log('🔍 StudentManager - Processing students:', students.length, 'students');
    console.log('🔍 StudentManager - Filters:', { levelFilter, statusFilter, searchTerm: debouncedSearchTerm });
    
    // Generate cache key for this filter combination
    const cacheKey = `${debouncedSearchTerm}-${levelFilter}-${statusFilter}-${sortBy}-${sortOrder}`;
    
    // Try to get from cache first
    const cached = smartCache.getSearchResults(cacheKey, 'students');
    if (cached && cached.length > 0) {
      console.log('🎯 Using cached search results:', cached.length, 'students');
      timer?.end({ cached: true, resultCount: cached.length });
      return cached;
    }
    
    let filtered = [...students];

    // Optimized search filter with early termination
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      const searchWords = term.split(' ').filter(w => w.length > 0);
      
      filtered = filtered.filter(student => {
        // Create searchable text once per student
        const searchableText = `${student.nombres || ''} ${student.apellidos || ''} ${student.cedula || ''} ${student.curso || ''}`.toLowerCase();
        
        // All search words must be found (AND logic)
        return searchWords.every(word => searchableText.includes(word));
      });
      
      console.log('🔍 After optimized search filter:', filtered.length, 'students');
    }

    // Optimized level filter
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(student => 
        student.nivel === levelFilter || student.level === levelFilter
      );
      console.log('🔍 After level filter:', filtered.length, 'students');
    }

    // Optimized status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(student => {
        const studentStatus = student.status || 'pending';
        return studentStatus === statusFilter;
      });
      console.log('🔍 After status filter:', filtered.length, 'students');
    }

    // Optimized sort with memoized comparison function
    const sortComparator = useCallback((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    }, [sortBy, sortOrder]);

    filtered.sort(sortComparator);

    // Cache the result for future use
    smartCache.cacheSearchResults(cacheKey, filtered, 'students');
    
    timer?.end({ cached: false, resultCount: filtered.length });
    return filtered;
  }, [students, debouncedSearchTerm, levelFilter, statusFilter, sortBy, sortOrder]);

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
      // Count both 'nivel' and 'level' fields for compatibility
      const level = student.nivel || student.level || 'Sin nivel';
      levelCounts[level] = (levelCounts[level] || 0) + 1;
      
      const status = student.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return {
      total: students.length,
      filtered: filteredAndSortedStudents.length,
      levelCounts,
      statusCounts
    };
  }, [students, filteredAndSortedStudents]);

  // Debug function for analyzing filter issues
  const debugFilters = () => {
    console.log('🔍 STUDENT MANAGER DEBUG:');
    console.log('Total students:', students.length);
    console.log('Current filters:', { levelFilter, statusFilter, searchTerm });
    
    if (students.length > 0) {
      console.log('Sample students (first 3):');
      students.slice(0, 3).forEach((student, index) => {
        console.log(`Student ${index + 1}:`, {
          id: student._id || student.id,
          nombre: student.nombres,
          apellidos: student.apellidos,
          nivel: student.nivel,
          status: student.status,
          curso: student.curso
        });
      });
      
      console.log('Unique levels (nivel field):', [...new Set(students.map(s => s.nivel))]);
      console.log('Unique levels (level field):', [...new Set(students.map(s => s.level))]);
      console.log('Unique statuses:', [...new Set(students.map(s => s.status || 'pending'))]);
      console.log('Students without nivel:', students.filter(s => !s.nivel).length);
      console.log('Students without level:', students.filter(s => !s.level).length);
      console.log('Students without status:', students.filter(s => !s.status).length);
    }
    
    console.log('Filtered results:', filteredAndSortedStudents.length);
  };

  // Add debug function to window for manual testing
  useEffect(() => {
    window.debugStudentFilters = debugFilters;
  }, [students, filteredAndSortedStudents, levelFilter, statusFilter, searchTerm]);

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

  // Optimized student row component for virtualized list
  const StudentRow = React.memo(({ index, style }) => {
    const student = paginatedStudents[index];
    if (!student) return null;

    // Pre-compute values for better performance
    const studentId = student.id || student._id || student.cedula;
    const isSelected = selectedStudents.has(studentId);
    const status = student.status || 'pending';
    const nivel = student.nivel || student.level || '';
    const levelClass = `student-level level-${nivel.toLowerCase()}`;
    const statusClass = `student-status status-${status}`;

    // Memoized event handlers to prevent unnecessary re-renders
    const handleSelectChange = useCallback(() => {
      handleSelectStudent(studentId);
    }, [studentId]);

    const handleEditClick = useCallback(() => {
      setEditingStudent(student);
    }, [student]);

    const handleDeleteClick = useCallback(() => {
      setShowDeleteConfirm(student);
    }, [student]);

    return (
      <div style={style} className="student-row">
        <div className="student-row-content">
          <div className="student-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectChange}
              aria-label={`Seleccionar ${student.nombres} ${student.apellidos}`}
            />
          </div>
          
          <div className="student-name">
            <strong>{student.apellidos}, {student.nombres}</strong>
          </div>
          
          <div className="student-id" title={`Cédula: ${student.cedula}`}>
            {student.cedula}
          </div>
          
          <div className="student-course" title={`Curso: ${student.curso}`}>
            {student.curso}
          </div>
          
          <div className={levelClass} title={`Nivel: ${nivel}`}>
            {nivel}
          </div>
          
          <div className={statusClass} title={`Estado: ${status}`}>
            {status === 'pending' && '⏳'}
            {status === 'voted' && '✅'}
            {status === 'absent' && '❌'}
            <span className="status-text">{status}</span>
          </div>

          <div className="student-actions">
            <button 
              onClick={handleEditClick}
              className="btn-edit"
              title={`Editar ${student.nombres} ${student.apellidos}`}
              aria-label={`Editar estudiante ${student.nombres} ${student.apellidos}`}
            >
              ✏️
            </button>
            <button 
              onClick={handleDeleteClick}
              className="btn-delete"
              title={`Eliminar ${student.nombres} ${student.apellidos}`}
              aria-label={`Eliminar estudiante ${student.nombres} ${student.apellidos}`}
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison for React.memo to prevent unnecessary re-renders
    const prevStudent = prevProps.paginatedStudents?.[prevProps.index];
    const nextStudent = nextProps.paginatedStudents?.[nextProps.index];
    
    if (!prevStudent && !nextStudent) return true;
    if (!prevStudent || !nextStudent) return false;
    
    // Compare key fields that affect rendering
    return (
      prevStudent._id === nextStudent._id &&
      prevStudent.nombres === nextStudent.nombres &&
      prevStudent.apellidos === nextStudent.apellidos &&
      prevStudent.cedula === nextStudent.cedula &&
      prevStudent.curso === nextStudent.curso &&
      prevStudent.nivel === nextStudent.nivel &&
      prevStudent.status === nextStudent.status &&
      prevProps.style?.height === nextProps.style?.height &&
      prevProps.style?.top === nextProps.style?.top
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

          <button
            onClick={() => {
              setSearchTerm('');
              setLevelFilter('ALL');
              setStatusFilter('ALL');
              setSortBy('apellidos');
              setSortOrder('asc');
              setCurrentPage(1);
            }}
            className="btn-reset-filters"
            title="Restablecer todos los filtros"
          >
            🔄 Reset
          </button>
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
                  const studentId = showDeleteConfirm._id || showDeleteConfirm.id;
                  console.log('🗑️ StudentManager deleting:', studentId, showDeleteConfirm);
                  onStudentDelete?.(studentId);
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