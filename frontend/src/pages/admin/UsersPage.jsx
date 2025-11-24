import { useState, useEffect } from "react";
import api from "../../utils/api";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "client",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/dashboard/superadmin");
      setUsers(data.data?.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/auth/users/${userId}`);
      alert("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await api.put(`/auth/users/${editingUser._id}`, updateData);
        alert("User updated successfully!");
      } else {
        await api.post("/auth/register", formData);
        alert("User created successfully!");
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ username: "", email: "", password: "", role: "client" });
      fetchUsers();
    } catch (error) {
      console.error("Failed to save user:", error);
      alert(error.response?.data?.message || "Failed to save user");
    }
  };

  const openModal = () => {
    setEditingUser(null);
    setFormData({ username: "", email: "", password: "", role: "client" });
    setShowModal(true);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>👥 User Management</h1>
        <p>Manage all users and their permissions</p>
      </div>

      <div className="users-controls">
        <div className="search-filter-group">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="client">Client</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
        <button className="add-user-btn" onClick={openModal}>➕ Add New User</button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Problems</th>
              <th>Accuracy</th>
              <th>Level</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge ${u.role}`}>{u.role}</span>
                </td>
                <td>{u.problemsSolved}</td>
                <td>{u.accuracy}%</td>
                <td>{u.currentLevel}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" title="Edit" onClick={() => handleEdit(u)}>✏️</button>
                    <button className="btn-delete" title="Delete" onClick={() => handleDelete(u._id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-results">
          <p>No users found matching your criteria.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password {editingUser ? "(Leave blank to keep current)" : "*"}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="client">Client</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

