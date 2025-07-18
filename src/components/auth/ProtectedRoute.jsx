// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext.jsx';
import TutorLogin from './TutorLogin';

const ProtectedRoute = ({ children, showLogin = true }) => {
  const { isAuthenticated, isLoading, error } = useAuthContext();

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '20px',
      textAlign: 'center'
    },
    loading: {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '32px',
      color: 'white'
    },
    error: {
      background: 'rgba(239, 68, 68, 0.2)',
      borderRadius: '16px',
      padding: '32px',
      color: '#FEF2F2'
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div>🔄 Verificando acceso...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <div>⚠️ Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <div style={styles.container}>
          <TutorLogin />
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div>🔐 Acceso requerido</div>
        </div>
      </div>
    );
  }

  return children;
};

export const TutorRoute = ({ children }) => {
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default ProtectedRoute;