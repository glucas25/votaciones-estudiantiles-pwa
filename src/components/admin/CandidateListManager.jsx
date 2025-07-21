// src/components/admin/CandidateListManager.jsx
// Component for managing candidate lists for list-based voting
import React, { useState, useContext, useRef } from 'react';
import AdminContext from '../../contexts/AdminContext';
import databaseService, { DOC_TYPES } from '../../services/database-indexeddb.js';
import './CandidateListManager.css';

const CandidateListManager = () => {
  const { candidates, setCandidates, students } = useContext(AdminContext);
  const [showForm, setShowForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleEditList = (list) => {
    setEditingList(list);
    setShowForm(true);
  };

  const handleDeleteList = async (listId) => {
    if (window.confirm('¿Está seguro de eliminar esta lista completa?')) {
      setLoading(true);
      setError(null);
      
      try {
        const list = candidates.find(c => c.id === listId || c._id === listId);
        if (!list) {
          throw new Error('Lista no encontrada');
        }
        
        const dbId = list._id || listId;
        const rev = list._rev;
        
        if (rev) {
          const result = await databaseService.deleteDocument('candidates', dbId, rev);
          
          if (result.success) {
            setCandidates(candidates.filter(c => (c.id || c._id) !== listId));
            setSuccess('✅ Lista eliminada exitosamente');
            setTimeout(() => setSuccess(null), 3000);
          } else {
            throw new Error(result.error || 'Error al eliminar lista');
          }
        } else {
          setCandidates(candidates.filter(c => (c.id || c._id) !== listId));
          setSuccess('✅ Lista eliminada exitosamente');
          setTimeout(() => setSuccess(null), 3000);
        }
      } catch (err) {
        console.error('❌ Error al eliminar lista:', err);
        setError('Error al eliminar lista: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const candidateLists = candidates.filter(c => 
    c.type === 'list' || 
    (c.type === 'candidate' && c.listName) ||
    c.listName ||
    c.presidentName ||
    c.vicePresidentName
  ) || [];

  return (
    <div className="candidate-list-manager">
      <div className="list-header">
        <h2>📋 GESTIÓN DE LISTAS ELECTORALES</h2>
        <div className="list-controls">
          <button 
            className="btn-primary"
            onClick={() => {
              setEditingList(null);
              setShowForm(true);
            }}
            disabled={loading}
          >
            ➕ Nueva Lista
          </button>
          {loading && <span className="loading-indicator">⏳ Guardando...</span>}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {showForm && (
        <CandidateListForm 
          list={editingList}
          onSave={async (listData) => {
            setLoading(true);
            setError(null);
            setSuccess(null);
            
            try {
              if (editingList) {
                // Update existing list
                const dbId = editingList._id;
                const rev = editingList._rev;
                
                if (dbId && rev) {
                  const result = await databaseService.updateDocument(
                    'candidates', 
                    dbId, 
                    rev, 
                    listData, 
                    DOC_TYPES.LIST
                  );
                  
                  if (result.success) {
                    const updatedLists = candidates.map(c => 
                      (c.id || c._id) === (editingList.id || editingList._id) 
                        ? { ...listData, _id: result.id, _rev: result.rev }
                        : c
                    );
                    setCandidates(updatedLists);
                    setSuccess('✅ Lista actualizada exitosamente');
                  } else {
                    throw new Error(result.error || 'Error al actualizar lista');
                  }
                } else {
                  // Update local state only
                  const updatedLists = candidates.map(c => 
                    (c.id || c._id) === (editingList.id || editingList._id) 
                      ? { ...listData, id: editingList.id || editingList._id }
                      : c
                  );
                  setCandidates(updatedLists);
                  setSuccess('✅ Lista actualizada exitosamente');
                }
              } else {
                // Create new list
                const newListData = {
                  ...listData,
                  type: 'list',
                  createdAt: new Date().toISOString()
                };

                const result = await databaseService.createDocument(
                  'candidates', 
                  newListData, 
                  DOC_TYPES.LIST
                );
                
                if (result.success) {
                  const newList = {
                    ...newListData,
                    _id: result.id,
                    _rev: result.rev
                  };
                  setCandidates([...candidates, newList]);
                  setSuccess('✅ Lista creada exitosamente');
                } else {
                  // Fallback to local storage
                  const newList = {
                    ...newListData,
                    id: Date.now().toString()
                  };
                  setCandidates([...candidates, newList]);
                  setSuccess('✅ Lista creada exitosamente (local)');
                }
              }
              
              setTimeout(() => setSuccess(null), 3000);
              setShowForm(false);
              setEditingList(null);
              
            } catch (err) {
              console.error('❌ Error al guardar lista:', err);
              setError('Error al guardar lista: ' + err.message);
            } finally {
              setLoading(false);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingList(null);
          }}
        />
      )}

      <div className="lists-container">
        {candidateLists.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No hay listas creadas</h3>
            <p>Cree su primera lista electoral para comenzar</p>
            <button 
              className="btn-primary"
              onClick={() => {
                setEditingList(null);
                setShowForm(true);
              }}
            >
              ➕ Crear Primera Lista
            </button>
          </div>
        ) : (
          <div className="lists-grid">
            {candidateLists.map(list => (
              <CandidateListCard 
                key={list._id || list.id}
                list={list}
                onEdit={() => handleEditList(list)}
                onDelete={() => handleDeleteList(list._id || list.id)}
                loading={loading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Component for individual list card display
const CandidateListCard = ({ list, onEdit, onDelete, loading }) => {
  return (
    <div className="list-card" style={{ borderLeft: `4px solid ${list.color || '#007bff'}` }}>
      <div className="list-header-card">
        <div className="list-info">
          <h3 className="list-name">{list.listName}</h3>
          <span className="list-general-info">Lista Electoral</span>
        </div>
        <div className="list-color" style={{ backgroundColor: list.color || '#007bff' }}></div>
      </div>
      
      <div className="candidates-info">
        <div className="candidate-item president">
          <div className="candidate-avatar">
            {list.presidentPhoto ? (
              <img src={list.presidentPhoto} alt={list.presidentName} />
            ) : (
              <span className="avatar-placeholder">👑</span>
            )}
          </div>
          <div className="candidate-details">
            <span className="candidate-role">Presidente</span>
            <span className="candidate-name">{list.presidentName}</span>
            <span className="candidate-course">{list.presidentCourse}</span>
          </div>
        </div>
        
        <div className="candidate-item vice-president">
          <div className="candidate-avatar">
            <span className="avatar-placeholder">🤝</span>
          </div>
          <div className="candidate-details">
            <span className="candidate-role">Vicepresidente</span>
            <span className="candidate-name">{list.vicePresidentName}</span>
            <span className="candidate-course">{list.vicePresidentCourse}</span>
          </div>
        </div>
      </div>
      
      <div className="list-actions">
        <button 
          className="btn-edit"
          onClick={onEdit}
          disabled={loading}
        >
          ✏️ Editar
        </button>
        <button 
          className="btn-delete"
          onClick={onDelete}
          disabled={loading}
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
};

// Form component for creating/editing candidate lists
const CandidateListForm = ({ list, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    listName: list?.listName || '',
    color: list?.color || '#007bff',
    presidentName: list?.presidentName || '',
    vicePresidentName: list?.vicePresidentName || '',
    presidentCourse: list?.presidentCourse || '',
    vicePresidentCourse: list?.vicePresidentCourse || '',
    presidentPhoto: list?.presidentPhoto || null
  });
  const [photoPreview, setPhotoPreview] = useState(list?.presidentPhoto || null);
  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoDataUrl = e.target.result;
        setPhotoPreview(photoDataUrl);
        setFormData(prev => ({ ...prev, presidentPhoto: photoDataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, presidentPhoto: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.listName.trim()) {
      alert('El nombre de la lista es requerido');
      return;
    }
    if (!formData.presidentName.trim()) {
      alert('El nombre del presidente es requerido');
      return;
    }
    if (!formData.vicePresidentName.trim()) {
      alert('El nombre del vicepresidente es requerido');
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="list-form-overlay">
      <div className="list-form-container">
        <div className="form-header">
          <h3>{list ? 'Editar Lista' : 'Nueva Lista Electoral'}</h3>
          <button className="btn-close" onClick={onCancel}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="list-form">
          <div className="form-grid">
            {/* List Information */}
            <div className="form-section">
              <h4>📋 Información de la Lista</h4>
              
              <div className="form-group">
                <label htmlFor="listName">Nombre de la Lista:</label>
                <input
                  id="listName"
                  type="text"
                  value={formData.listName}
                  onChange={(e) => handleInputChange('listName', e.target.value)}
                  placeholder="Ej: Lista Progreso"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="listColor">Color de la Lista:</label>
                <div className="color-picker-container">
                  <input
                    id="listColor"
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                  />
                  <span className="color-preview" style={{ backgroundColor: formData.color }}></span>
                  <span className="color-value">{formData.color}</span>
                </div>
              </div>
              
            </div>
            
            {/* President Information */}
            <div className="form-section">
              <h4>👑 Candidato a Presidente</h4>
              
              <div className="form-group">
                <label htmlFor="presidentName">Nombre del Presidente:</label>
                <input
                  id="presidentName"
                  type="text"
                  value={formData.presidentName}
                  onChange={(e) => handleInputChange('presidentName', e.target.value)}
                  placeholder="Nombre completo del presidente"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="presidentCourse">Curso del Presidente:</label>
                <input
                  id="presidentCourse"
                  type="text"
                  value={formData.presidentCourse}
                  onChange={(e) => handleInputChange('presidentCourse', e.target.value)}
                  placeholder="Ej: 1ro Bach A, 2do EGB, etc."
                />
                <small className="form-help">Campo referencial para mostrar en la votación</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="presidentPhoto">Fotografía del Presidente:</label>
                <div className="photo-upload-container">
                  <input
                    id="presidentPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  
                  {photoPreview ? (
                    <div className="photo-preview">
                      <img src={photoPreview} alt="Preview" />
                      <div className="photo-actions">
                        <button 
                          type="button"
                          className="btn-change"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📷 Cambiar
                        </button>
                        <button 
                          type="button"
                          className="btn-remove"
                          onClick={removePhoto}
                        >
                          🗑️ Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="photo-placeholder" onClick={() => fileInputRef.current?.click()}>
                      <div className="placeholder-icon">📷</div>
                      <p>Haga clic para subir fotografía</p>
                      <small>Formatos: JPG, PNG (recomendado: 300x300px)</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Vice President Information */}
            <div className="form-section">
              <h4>🤝 Candidato a Vicepresidente</h4>
              
              <div className="form-group">
                <label htmlFor="vicePresidentName">Nombre del Vicepresidente:</label>
                <input
                  id="vicePresidentName"
                  type="text"
                  value={formData.vicePresidentName}
                  onChange={(e) => handleInputChange('vicePresidentName', e.target.value)}
                  placeholder="Nombre completo del vicepresidente"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="vicePresidentCourse">Curso del Vicepresidente:</label>
                <input
                  id="vicePresidentCourse"
                  type="text"
                  value={formData.vicePresidentCourse}
                  onChange={(e) => handleInputChange('vicePresidentCourse', e.target.value)}
                  placeholder="Ej: 1ro Bach B, 3ro EGB, etc."
                />
                <small className="form-help">Campo referencial para mostrar en la votación</small>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {list ? 'Actualizar Lista' : 'Crear Lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateListManager;