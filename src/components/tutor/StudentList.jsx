// src/components/tutor/StudentList.jsx
import React from 'react';
import { useStudents } from '../../contexts/StudentsContext';
import StudentCard from './StudentCard';
import './StudentList.css';

const StudentList = ({ students, status, title, emptyMessage, onStartVoting }) => {
  const { searchTerm } = useStudents();

  // Filtrar estudiantes por término de búsqueda
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    const fullName = `${student.nombres} ${student.apellidos}`.toLowerCase();
    const reverseName = `${student.apellidos} ${student.nombres}`.toLowerCase();
    
    return fullName.includes(term) || 
           reverseName.includes(term) ||
           student.nombres.toLowerCase().includes(term) ||
           student.apellidos.toLowerCase().includes(term);
  });

  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return '🟢';
      case 'voted': return '✅';
      case 'absent': return '❌';
      default: return '📋';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending': return '#22c55e';
      case 'voted': return '#3b82f6';
      case 'absent': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (filteredStudents.length === 0) {
    return (
      <div className="student-list empty">
        <div className="empty-state">
          <div className="empty-icon">{getStatusIcon()}</div>
          <h3>{emptyMessage}</h3>
          {searchTerm && (
            <p>No se encontraron estudiantes que coincidan con "{searchTerm}"</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="student-list">
      <div className="list-header">
        <h2 style={{ color: getStatusColor() }}>
          {getStatusIcon()} {title} ({filteredStudents.length})
        </h2>
        {searchTerm && (
          <p className="search-info">
            📌 Mostrando {filteredStudents.length} de {students.length} estudiantes
          </p>
        )}
      </div>

      <div className="students-grid">
        {filteredStudents.map((student, index) => (
          <StudentCard
            key={student.id}
            student={student}
            status={status}
            index={index + 1}
            onStartVoting={onStartVoting}
          />
        ))}
      </div>
    </div>
  );
};

export default StudentList;