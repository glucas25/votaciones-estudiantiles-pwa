// src/components/tutor/TutorPanel.jsx
import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext.jsx';

const TutorPanel = () => {
  const { currentTutor, logout } = useAuthContext();

  const handleLogout = async () => {
    const confirmLogout = window.confirm('¿Está seguro que desea cerrar sesión?');
    if (confirmLogout) {
      await logout();
    }
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      width: '100%',
      padding: '20px'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '24px',
      color: 'white'
    },
    title: {
      fontSize: '2rem',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    info: {
      fontSize: '1.1rem',
      marginBottom: '20px'
    },
    button: {
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#1e40af',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 20px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginRight: '12px'
    },
    dangerButton: {
      background: 'rgba(239, 68, 68, 0.9)',
      color: 'white'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span>👨‍🏫</span>
          Panel de Votación
        </h1>
        <div style={styles.info}>
          Bienvenido, {currentTutor?.name} - Curso: {currentTutor?.course}
        </div>
        
        <button style={styles.button}>
          🗳️ Iniciar Votación (Próximamente)
        </button>
        
        <button 
          style={{...styles.button, ...styles.dangerButton}}
          onClick={handleLogout}
        >
          🚪 Cerrar Sesión
        </button>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2>🎉 ¡Autenticación Exitosa!</h2>
        <p>La Fase 2 está completa. El sistema de votación se implementará en las siguientes fases.</p>
      </div>
    </div>
  );
};

export default TutorPanel;