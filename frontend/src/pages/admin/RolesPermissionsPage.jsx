import { useState, useEffect } from 'react';
import api from '../../utils/api';
import PermissionGuard from '../../components/PermissionGuard';
import '../../styles/Dashboard.css';

const RolesPermissionsPage = () => {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
    color: '#4ade80'
  });
  const [errors, setErrors] = useState({});

  // Fetch roles and permissions from backend
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/roles');
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/roles/permissions');
      if (response.data.success) {
        setAllPermissions(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      // Use fallback permissions if API fails
      setAllPermissions([
        { id: 'all', label: 'All Permissions', category: 'System' },
        { id: 'read:problems', label: 'View Problems', category: 'Problems' },
        { id: 'submit:solutions', label: 'Submit Solutions', category: 'Solutions' },
        { id: 'view:analytics', label: 'View Analytics', category: 'Analytics' },
        { id: 'access:mentor', label: 'Access AI Mentor', category: 'Features' },
      ]);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      color: role.color
    });
    setShowModal(true);
  };

  const handleDeleteRole = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      alert('Cannot delete system roles');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteRole(roleId);
    }
  };

  const deleteRole = async (roleId) => {
    try {
      const response = await api.delete(`/roles/${roleId}`);
      if (response.data.success) {
        setRoles(roles.filter(r => r.id !== roleId));
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      alert(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleOpenModal = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
      color: '#4ade80'
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
      color: '#4ade80'
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => {
      const permissions = [...prev.permissions];
      
      // If toggling 'all', clear other permissions
      if (permissionId === 'all') {
        return {
          ...prev,
          permissions: permissions.includes('all') ? [] : ['all']
        };
      }
      
      // If 'all' is selected, clear it when selecting individual permissions
      const filteredPerms = permissions.filter(p => p !== 'all');
      
      if (filteredPerms.includes(permissionId)) {
        return {
          ...prev,
          permissions: filteredPerms.filter(p => p !== permissionId)
        };
      } else {
        return {
          ...prev,
          permissions: [...filteredPerms, permissionId]
        };
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Role name must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.permissions.length === 0) {
      newErrors.permissions = 'At least one permission must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (editingRole) {
      updateRole(editingRole.id);
    } else {
      createRole();
    }
  };

  const createRole = async () => {
    try {
      const response = await api.post('/roles', formData);
      if (response.data.success) {
        setRoles([...roles, response.data.data]);
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error creating role:', err);
      alert(err.response?.data?.message || 'Failed to create role');
    }
  };

  const updateRole = async (roleId) => {
    try {
      const response = await api.put(`/roles/${roleId}`, formData);
      if (response.data.success) {
        setRoles(roles.map(role => 
          role.id === roleId ? response.data.data : role
        ));
        handleCloseModal();
      }
    } catch (err) {
      console.error('Error updating role:', err);
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Roles & Permissions Management</h1>
          <p>Control access levels and permissions for all user roles</p>
        </div>
        <PermissionGuard permission="manage:roles">
          <button className="btn-primary" onClick={handleOpenModal}>
            + Create New Role
          </button>
        </PermissionGuard>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading roles...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button className="btn-secondary" onClick={fetchRoles}>Retry</button>
        </div>
      ) : (
        <div className="roles-grid">
        {roles.map(role => (
          <div key={role.id} className="role-card" style={{ borderLeftColor: role.color }}>
            <div className="role-header">
              <div>
                <h3>{role.name}</h3>
                <span className="user-count" style={{ backgroundColor: `${role.color}20`, color: role.color }}>
                  {role.userCount} users
                </span>
              </div>
              {role.name !== 'Super Admin' && (
                <PermissionGuard permission="manage:roles">
                  <div className="role-actions-inline">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleEditRole(role)}
                      title="Edit Role"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon btn-danger-icon" 
                      onClick={() => handleDeleteRole(role.id)}
                      title="Delete Role"
                    >
                      🗑️
                    </button>
                  </div>
                </PermissionGuard>
              )}
            </div>
            
            <p className="role-description">{role.description}</p>
            
            <div className="permissions-section">
              <h4>Permissions ({role.permissions.length})</h4>
              <div className="permissions-list">
                {role.permissions.includes('all') ? (
                  <span className="permission-badge all-permissions">
                    🔓 All System Permissions
                  </span>
                ) : (
                  role.permissions.map((perm, idx) => {
                    const permInfo = allPermissions.find(p => p.id === perm);
                    return (
                      <span key={idx} className="permission-badge">
                        {permInfo?.label || perm}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Role Creation/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="role-form">
              <div className="form-group">
                <label htmlFor="name">Role Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Moderator, Editor"
                  className={errors.name ? 'error' : ''}
                  disabled={editingRole?.name === 'Super Admin'}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the role and its responsibilities"
                  rows="3"
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="color">Role Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                  />
                  <span className="color-label">{formData.color}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Permissions * {formData.permissions.length > 0 && `(${formData.permissions.length} selected)`}</label>
                {errors.permissions && <span className="error-message">{errors.permissions}</span>}
                
                <div className="permissions-grid">
                  {/* Group permissions by category */}
                  {['System', 'Problems', 'Solutions', 'Analytics', 'Mentor', 'Users', 'Reports'].map(category => {
                    const categoryPerms = allPermissions.filter(p => p.category === category);
                    if (categoryPerms.length === 0) return null;
                    
                    return (
                      <div key={category} className="permission-category">
                        <h4 className="category-title">{category}</h4>
                        {categoryPerms.map(perm => (
                          <label key={perm.id} className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm.id)}
                              onChange={() => handlePermissionToggle(perm.id)}
                              disabled={editingRole?.name === 'Super Admin' && perm.id === 'all'}
                            />
                            <span>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .page-content {
          padding: 2rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .page-header p {
          color: var(--text-secondary);
          font-size: 1rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4ade80, #22d3ee);
          color: white;
          border: none;
          padding: 0.875rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(74, 222, 128, 0.3);
        }

        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .role-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-left: 4px solid;
          border-radius: 0.75rem;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .role-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .role-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .role-header h3 {
          font-size: 1.5rem;
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
        }

        .user-count {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .role-actions-inline {
          display: flex;
          gap: 0.5rem;
        }

        .btn-icon {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          padding: 0.5rem;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.3s;
        }

        .btn-icon:hover {
          background: rgba(74, 222, 128, 0.1);
          border-color: var(--primary-color);
          transform: scale(1.1);
        }

        .btn-danger-icon:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }

        .role-description {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .permissions-section h4 {
          font-size: 1rem;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .permissions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .permission-badge {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          padding: 0.4rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          border: 1px solid var(--border-color);
          transition: all 0.3s;
        }

        .permission-badge:hover {
          background: rgba(74, 222, 128, 0.1);
          border-color: var(--primary-color);
        }

        .all-permissions {
          background: linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(34, 211, 238, 0.1));
          border-color: var(--primary-color);
          font-weight: 600;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            transform: translateY(-20px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-content {
          background: var(--bg-secondary);
          border-radius: 1rem;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          background: var(--bg-secondary);
          z-index: 10;
        }

        .modal-header h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          transition: all 0.3s;
        }

        .close-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .role-form {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
          font-weight: 600;
          font-size: 0.95rem;
        }

        .form-group input[type="text"],
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: 1rem;
          transition: all 0.3s;
          font-family: inherit;
        }

        .form-group input[type="text"]:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
        }

        .form-group input.error,
        .form-group textarea.error {
          border-color: #ef4444;
        }

        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          display: block;
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .color-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .color-picker-wrapper input[type="color"] {
          width: 60px;
          height: 40px;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          cursor: pointer;
          background: var(--bg-tertiary);
        }

        .color-label {
          color: var(--text-secondary);
          font-family: monospace;
          font-size: 0.95rem;
        }

        .permissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          max-height: 400px;
          overflow-y: auto;
        }

        .permission-category {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .category-title {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 0 0 0.5rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .permission-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .permission-checkbox:hover {
          background: rgba(74, 222, 128, 0.05);
        }

        .permission-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--primary-color);
        }

        .permission-checkbox input[type="checkbox"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .permission-checkbox span {
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        /* Loading and Error States */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-state {
          text-align: center;
          padding: 4rem 2rem;
          background: var(--bg-secondary);
          border-radius: 0.75rem;
          border: 1px solid var(--border-color);
        }

        .error-state .error-message {
          color: #ef4444;
          font-size: 1rem;
          margin-bottom: 1rem;
          display: block;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
          margin-top: 1.5rem;
        }

        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-secondary:hover {
          background: var(--bg-primary);
          border-color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .roles-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
          }

          .btn-primary {
            width: 100%;
          }

          .modal-content {
            max-height: 95vh;
            margin: 1rem;
          }

          .permissions-grid {
            grid-template-columns: 1fr;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }

          .modal-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default RolesPermissionsPage;
