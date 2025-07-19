// src/components/auth/AdminLogin.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { loginAsAdmin, isOnline } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Ingrese la contraseña');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await loginAsAdmin(password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setIsSubmitting(false);
  };

  const getConnectionStatus = () => {
    return isOnline ? '🟢 Conectado' : '🔴 Sin conexión';
  };

  return (
    <div className="admin-login">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <h1>🏛️ PANEL DE ADMINISTRACIÓN</h1>
          <h2>🔐 ACCESO RESTRINGIDO</h2>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="password">
              🔑 Contraseña de Administrador:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese la contraseña"
              className={`form-input ${error ? 'error' : ''}`}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={!password || isSubmitting}
          >
            {isSubmitting ? (
              <>🔄 Verificando...</>
            ) : (
              <>🔓 ACCEDER AL PANEL</>
            )}
          </button>
        </form>

        <div className="status-bar">
          <span className="status-item">
            💡 Estado: {getConnectionStatus()}
          </span>
        </div>

        <div className="admin-help-section">
          <h3>ℹ️ Información:</h3>
          <p>Para acceso de desarrollo, utilice: <strong>admin2024</strong></p>
          <p>En producción, cambie la contraseña en AuthContext.jsx</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;