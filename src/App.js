import AdminDashboard from './components/admin/AdminDashboard';
function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial',
      textAlign: 'center'
    }}>
      <div>
        <h1>🏛️ Sistema de Votación Estudiantil</h1>
        <p>✅ Aplicación funcionando correctamente!</p>
        <div style={{marginTop: '20px'}}>
          <button style={{margin: '10px', padding: '15px 25px', fontSize: '16px', borderRadius: '8px', border: 'none', background: 'white', color: '#1e40af', cursor: 'pointer'}}>
            👨‍💼 Administrador
          </button>
          <button style={{margin: '10px', padding: '15px 25px', fontSize: '16px', borderRadius: '8px', border: 'none', background: 'white', color: '#1e40af', cursor: 'pointer'}}>
            👨‍🏫 Tutor
          </button>
          <button style={{margin: '10px', padding: '15px 25px', fontSize: '16px', borderRadius: '8px', border: 'none', background: 'white', color: '#1e40af', cursor: 'pointer'}}>
            🎓 Estudiante
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
