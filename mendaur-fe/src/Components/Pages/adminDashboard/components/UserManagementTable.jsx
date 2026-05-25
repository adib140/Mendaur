import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Loader, AlertCircle, Edit2, Trash2, RefreshCw } from 'lucide-react'
import adminApi from '../../../../services/adminApi'
import { useAuth } from '../../context/AuthContext'
import { PermissionGuard } from '../../../PermissionGuard'
import UserEditModal from './UserEditModal'
import ConfirmDialog from './ConfirmDialog'
import DangerConfirmDialog from './DangerConfirmDialog'

const ITEMS_PER_PAGE = 10

// Mock data for testing
const MOCK_USERS = [
  {
    user_id: 1,
    nama: 'John Doe',
    email: 'john@example.com',
    no_hp: '081234567890',
    role: 'user',
    status: 'active',
    actual_poin: 1500,
    display_poin: 1500,
  },
  {
    user_id: 2,
    nama: 'Jane Smith',
    email: 'jane@example.com',
    no_hp: '081234567891',
    role: 'user',
    status: 'active',
    actual_poin: 2000,
    display_poin: 2000,
  },
]

// Mock roles data
const MOCK_ROLES = [
  { role_id: 1, nama_role: 'nasabah' },
  { role_id: 2, nama_role: 'admin' },
  { role_id: 3, nama_role: 'superadmin' }
]

function UserManagementTable() {
  // ✅ Get permission checker
  const { hasPermission } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
    password: '',
    confirmPassword: '',
    role_id: 1, // Default to nasabah (role_id: 1)
    tipe_nasabah: 'konvensional', // Default type
    status: 'active' // Default status
  })
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [roles, setRoles] = useState([])
  
  // Helper function to get role name by ID
  const getRoleNameById = useCallback((roleId) => {
    // If roleId is not a number (e.g., it's a string like 'user', 'admin'), return it directly
    if (!roleId) return 'N/A'
    if (typeof roleId === 'string') return roleId
    
    // If it's a number, search in roles array
    const role = roles.find(r => r.role_id === roleId)
    return role ? role.nama_role : 'N/A'
  }, [roles])
  
  // Fetch roles on component mount
  const loadRoles = useCallback(async () => {
    // For now, use mock roles until backend implements /api/admin/roles endpoint
    // When backend is ready, uncomment the API call below
    
    /* API version (when backend is ready):
    try {
      const result = await adminApi.getAllRoles()
      
      if (Array.isArray(result.data)) {
        setRoles(result.data)
      } else if (result.data?.data && Array.isArray(result.data.data)) {
        setRoles(result.data.data)
      } else {
        setRoles(MOCK_ROLES)
      }
    } catch (error) {
      console.error('Failed to load roles, using mock data:', error.message)
      setRoles(MOCK_ROLES)
    }
    */
    
    // Using mock roles for now
    setRoles(MOCK_ROLES)
  }, [])
  
  // Filter users berdasarkan search term
  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      (u.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  // Separated fetch function (Session 2 pattern)
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Call adminApi endpoint
      const response = await adminApi.getAllUsers(1, 100, searchTerm || null)
      
      // Multi-format response handler (supports 3+ formats)
      let usersData = MOCK_USERS
      if (Array.isArray(response.data)) {
        // Direct array format
        usersData = response.data
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Wrapped in data key
        usersData = response.data.data
      } else if (response.data?.users && Array.isArray(response.data.users)) {
        // Wrapped in users key
        usersData = response.data.users
      }
      
      setUsers(usersData)
      setError(null)
    } catch (err) {
      console.warn('Error fetching users, using mock data:', err.message)
      // Fallback to mock data on error
      setUsers(MOCK_USERS)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Only close if clicked element is not part of status dropdown
      if (!e.target.closest('.status-dropdown-wrapper')) {
        setOpenStatusDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Load roles on component mount
  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleRetry = () => {
    setSearchTerm('')
    setError(null)
  }

  const handleEdit = (user) => {
    // Permission check
    if (!hasPermission('edit_user')) {
      alert('Anda tidak memiliki izin untuk mengedit user')
      return
    }
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDelete = (user) => {
    // Permission check
    if (!hasPermission('delete_user')) {
      alert('Anda tidak memiliki izin untuk menghapus user')
      return
    }
    setSelectedUser(user)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    // Re-check permission (defense in depth)
    if (!hasPermission('delete_user')) {
      alert('Anda tidak memiliki izin untuk menghapus user')
      return
    }

    try {
      setIsDeleting(true)

      // Call adminApi endpoint
      const result = await adminApi.deleteAdminUser(selectedUser.user_id)

      if (result.success) {
        // Success - remove from list and refresh
        setUsers(users.filter(u => u.user_id !== selectedUser.user_id))
        setShowDeleteConfirm(false)
        setSelectedUser(null)
        alert(`User "${selectedUser.nama}" berhasil dihapus`)
      } else {
        alert(`Gagal menghapus user: ${result.message || 'Terjadi kesalahan'}`)
      }
    } catch (err) {
      alert(`Gagal menghapus user: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveEdit = () => {
    loadUsers()
    setShowEditModal(false)
  }

  const handleCreateUserClick = () => {
    // Permission check
    if (!hasPermission('create_user')) {
      alert('Anda tidak memiliki izin untuk membuat user')
      return
    }
    setNewUserForm({
      nama: '',
      email: '',
      no_hp: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    })
    setShowCreateUserModal(true)
  }

  const handleCreateUserFormChange = (e) => {
    const { name, value } = e.target
    setNewUserForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateUserSubmit = async () => {
    // Validation
    if (!newUserForm.nama || !newUserForm.email || !newUserForm.password) {
      alert('Nama, Email, dan Password wajib diisi!')
      return
    }

    if (newUserForm.password !== newUserForm.confirmPassword) {
      alert('Password dan Confirm Password tidak cocok!')
      return
    }

    if (newUserForm.password.length < 6) {
      alert('Password minimal 6 karakter!')
      return
    }

    // Permission check
    if (!hasPermission('create_user')) {
      alert('Anda tidak memiliki izin untuk membuat user')
      return
    }

    try {
      setIsCreatingUser(true)

      // Call API to create user
      const result = await adminApi.createUser({
        nama: newUserForm.nama,
        email: newUserForm.email,
        password: newUserForm.password,
        no_hp: newUserForm.no_hp || '',
        alamat: newUserForm.alamat || '',
        role_id: newUserForm.role_id ? parseInt(newUserForm.role_id) : null,
        tipe_nasabah: newUserForm.tipe_nasabah || 'konvensional',
        status: newUserForm.status || 'active'
      })

      if (result.success) {
        alert('User berhasil dibuat!')
        setShowCreateUserModal(false)
        // Refresh users list
        await loadUsers()
      } else {
        alert(`Gagal membuat user: ${result.message || 'Terjadi kesalahan'}`)
      }
    } catch (err) {
      alert(`Gagal membuat user: ${err.message}`)
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleStatusChange = async (user, newStatus) => {
    // Permission check
    if (!hasPermission('edit_user')) {
      alert('Anda tidak memiliki izin untuk mengubah status user')
      return
    }

    try {
      setLoading(true)
      const result = await adminApi.updateUserStatus(user.user_id, newStatus)

      if (result.success) {
        // Update local state
        setUsers(users.map(u => 
          u.user_id === user.user_id ? { ...u, status: newStatus } : u
        ))
        alert(`Status user berhasil diubah ke ${newStatus}`)
      } else {
        alert(`Gagal mengubah status: ${result.message || 'Terjadi kesalahan'}`)
      }
    } catch (err) {
      alert(`Gagal mengubah status: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status, user) => {
    const statusValue = (status || '').toLowerCase()
    let statusClass = 'badge-unknown'
    
    if (statusValue === 'active') {
      statusClass = 'badge-active'
    } else if (statusValue === 'inactive') {
      statusClass = 'badge-inactive'
    } else if (statusValue === 'suspended') {
      statusClass = 'badge-suspended'
    }
    
    const statuses = ['active', 'inactive', 'suspended']
    const isOpen = openStatusDropdown === user.user_id
    
    return (
      <div className="status-dropdown-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
        <button 
          className={`status-badge ${statusClass}`}
          title="Click to change status"
          onClick={(e) => {
            e.stopPropagation()
            setOpenStatusDropdown(isOpen ? null : user.user_id)
          }}
          style={{ cursor: 'pointer', minWidth: '100px', padding: '6px 12px', border: 'none', borderRadius: '4px' }}
        >
          {statusValue.toUpperCase()} ▼
        </button>
        {isOpen && (
          <div className="status-menu" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minWidth: '120px',
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginTop: '4px'
          }}>
            {statuses.map(s => (
              <button
                key={s}
                className={`status-option ${s === statusValue ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange(user, s)
                  setOpenStatusDropdown(null)
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  backgroundColor: s === statusValue ? '#e8f5e9' : 'white',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: '13px',
                  fontWeight: s === statusValue ? '600' : 'normal',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = s === statusValue ? '#c8e6c9' : '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = s === statusValue ? '#e8f5e9' : 'white'
                }}
              >
                ● {s.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const getRoleBadge = (user) => {
    // Support both role_id (from database) and role (for backward compatibility)
    const roleId = user.role_id || user.role
    const roleName = getRoleNameById(roleId)
    const roleClass = `badge-role-${roleName.toLowerCase()}`
    return <span className={`role-badge ${roleClass}`}>{roleName.toUpperCase()}</span>
  }

  if (error) {
    return (
      <div className="users-table-error">
        <AlertCircle className="error-icon" />
        <p>Error: {error}</p>
        <button onClick={handleRetry} className="btn-retry">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="users-management">
      <div className="users-header">
        <h2>User Management</h2>
        <div className="header-actions">
          <button 
            className="btn-refresh"
            onClick={loadUsers}
            disabled={loading}
            title="Refresh data"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          </button>
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          <button 
            className="btn-create-user"
            onClick={handleCreateUserClick}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            + Tambah User Baru
          </button>
        </div>
      </div>

      {loading ? (
        <div className="users-loading">
          <Loader className="spinner" />
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <tr key={user.user_id}>
                      <td>{index + 1}</td>
                      <td className="user-name">{user.nama || user.nama || 'N/A'}</td>
                      <td>{user.email}</td>
                      <td>{user.no_hp || user.no_hp || 'N/A'}</td>
                      <td>{getRoleBadge(user)}</td>
                      <td>{getStatusBadge(user.status, user)}</td>
                      <td className="points">{user.actual_poin ?? 0}</td>
                      <td className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(user)}
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                        <PermissionGuard
                          permission="delete_user"
                          fallback={
                            <button
                              className="btn-delete"
                              disabled
                              title="You do not have permission to delete users"
                              style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          }
                        >
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(user)}
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </PermissionGuard>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-message">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="users-mobile-cards">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user.user_id} className="user-card">
                  <div className="user-card-row">
                    <span className="label">Name:</span>
                    <span className="value">{user.nama || user.nama || 'N/A'}</span>
                  </div>
                  <div className="user-card-row">
                    <span className="label">Email:</span>
                    <span className="value">{user.email}</span>
                  </div>
                  <div className="user-card-row">
                    <span className="label">Phone:</span>
                    <span className="value">{user.no_hp || user.no_hp || 'N/A'}</span>
                  </div>
                  <div className="user-card-row">
                    <span className="label">Points:</span>
                    <span className="value">{user.actual_poin ?? 0}</span>
                  </div>
                  <div className="user-card-row">
                    <span className="label">Role:</span>
                    {getRoleBadge(user)}
                  </div>
                  <div className="user-card-row">
                    <span className="label">Status:</span>
                    {getStatusBadge(user.status, user)}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-message">No users found</p>
            )}
          </div>

          {/* Info - Show total users */}
          <div className="table-info">
            <p>Total: <strong>{filteredUsers.length}</strong> users found (scroll to view more)</p>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Dialog - Using DangerConfirmDialog for critical action */}
      {showDeleteConfirm && selectedUser && (
        <DangerConfirmDialog
          title={`Hapus Akun "${selectedUser.nama}"`}
          message={`Anda akan menghapus akun user "${selectedUser.nama}" (${selectedUser.email}). Semua data terkait user ini akan dihapus permanen termasuk riwayat setoran, poin, dan badge.`}
          confirmText="HAPUS"
          actionType="delete"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isProcessing={isDeleting}
          buttonText="Hapus Akun"
        />
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            minWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              Tambah User Baru
            </h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Nama Lengkap *
              </label>
              <input
                type="text"
                name="nama"
                value={newUserForm.nama}
                onChange={handleCreateUserFormChange}
                placeholder="Masukkan nama lengkap"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={newUserForm.email}
                onChange={handleCreateUserFormChange}
                placeholder="Masukkan email"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Nomor Telepon
              </label>
              <input
                type="text"
                name="no_hp"
                value={newUserForm.no_hp}
                onChange={handleCreateUserFormChange}
                placeholder="Masukkan nomor telepon (opsional)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Alamat
              </label>
              <textarea
                name="alamat"
                value={newUserForm.alamat}
                onChange={handleCreateUserFormChange}
                placeholder="Masukkan alamat (opsional)"
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Role *
              </label>
              <select
                name="role_id"
                value={newUserForm.role_id}
                onChange={handleCreateUserFormChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {roles.map(role => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.nama_role}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Tipe Nasabah *
              </label>
              <select
                name="tipe_nasabah"
                value={newUserForm.tipe_nasabah}
                onChange={handleCreateUserFormChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="konvensional">Konvensional</option>
                <option value="modern">Modern</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={newUserForm.password}
                onChange={handleCreateUserFormChange}
                placeholder="Masukkan password (min 6 karakter)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Konfirmasi Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={newUserForm.confirmPassword}
                onChange={handleCreateUserFormChange}
                placeholder="Konfirmasi password"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateUserModal(false)}
                disabled={isCreatingUser}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleCreateUserSubmit}
                disabled={isCreatingUser}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  cursor: isCreatingUser ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: isCreatingUser ? 0.7 : 1
                }}
              >
                {isCreatingUser ? 'Membuat...' : 'Buat User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementTable;
