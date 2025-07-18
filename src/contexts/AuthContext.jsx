import React, { createContext, useContext, useEffect } from 'react';
import useAuth from '../hooks/useAuth.jsx';

const AuthContext = createContext(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }
  
  return context;
};

export const AuthProvider = ({ children }) => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const renewInterval = setInterval(async () => {
      console.log('🔄 Auto-renovando sesión...');
      await auth.renewSession();
    }, 30 * 60 * 1000);

    return () => clearInterval(renewInterval);
  }, [auth.isAuthenticated, auth.renewSession]);

  const contextValue = {
    ...auth,
    
    isRole: (role) => {
      if (!auth.isAuthenticated || !auth.currentTutor) return false;
      
      switch (role) {
        case 'tutor':
          return true;
        case 'admin':
          return false;
        case 'student':
          return false;
        default:
          return false;
      }
    },
    
    hasPermission: (permission) => {
      if (!auth.isAuthenticated) return false;
      
      switch (permission) {
        case 'view_students':
          return true;
        case 'mark_absent':
          return true;
        case 'conduct_voting':
          return true;
        case 'export_data':
          return true;
        case 'manage_candidates':
          return false;
        case 'manage_codes':
          return false;
        default:
          return false;
      }
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;