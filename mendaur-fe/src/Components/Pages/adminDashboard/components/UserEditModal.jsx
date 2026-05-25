import { useState } from 'react'
import { X, Loader } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import adminApi from '../../../../services/adminApi'
import DangerConfirmDialog from './DangerConfirmDialog'
import '../styles/UserEditModal.css'

export default function UserEditModal({ user, onClose, onSave }) {
  const { hasPermission } = useAuth()
  
  // Map role_id to role name for display
  const getRoleName = (roleId) => {
    const roleMap = {
      1: 'nasabah',
      2: 'admin',
      3: 'superadmin'
    }
    return roleMap[roleId] || 'nasabah'
  }
  
  // Map role name to role_id
  const getRoleId = (roleName) => {
    const roleMap = {
      'nasabah': 1,
      'admin': 2,
      'superadmin': 3
    }
    return roleMap[roleName] || 1
  }
  
  const [formData, setFormData] = useState({
    nama: user?.nama || '',
    email: user?.email || '',
    no_hp: user?.no_hp || '',
    alamat: user?.alamat || '',
    role_id: user?.role_id || 1,
    tipe_nasabah: user?.tipe_nasabah || 'konvensional',
    status: user?.status || 'active'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showRoleConfirm, setShowRoleConfirm] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleRoleChange = (e) => {
    const roleName = e.target.value
    const roleId = getRoleId(roleName)
    
    setFormData(prev => ({
      ...prev,
      role_id: roleId
    }))
    setError(null)
  }

  const handleSave = async () => {
    try {
      // Permission check
      if (!hasPermission('edit_user')) {
        alert('Anda tidak memiliki izin untuk mengedit user')
        return
      }
      
      setSaving(true)
      setError(null)

      // Check what changed
      const roleChanged = parseInt(formData.role_id) !== parseInt(user.role_id)
      const statusChanged = formData.status !== user.status
      const tipeChanged = formData.tipe_nasabah !== user.tipe_nasabah

      // If role is being changed, show confirmation dialog
      if (roleChanged) {
        setShowRoleConfirm(true)
        return
      }

      // Otherwise proceed with update
      await executeUpdate(roleChanged, statusChanged, tipeChanged)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan')
      alert(`Error: ${err.message || 'Gagal menyimpan user'}`)
    } finally {
      setSaving(false)
    }
  }

  const executeUpdate = async (roleChanged, statusChanged, tipeChanged) => {
    try {
      setSaving(true)

      let updateSuccess = false

      // Update role if changed (using specific endpoint)
      if (roleChanged) {
        const roleResult = await adminApi.updateUserRole(user.user_id, parseInt(formData.role_id))
        if (roleResult.success) updateSuccess = true
      }

      // Update status if changed (using specific endpoint)
      if (statusChanged) {
        const statusResult = await adminApi.updateUserStatus(user.user_id, formData.status)
        if (statusResult.success) updateSuccess = true
      }

      // Update tipe_nasabah if changed (using general update)
      if (tipeChanged) {
        const tipeResult = await adminApi.updateAdminUser(user.user_id, {
          tipe_nasabah: formData.tipe_nasabah
        })
        if (tipeResult.success) updateSuccess = true
      }

      if (!roleChanged && !statusChanged && !tipeChanged) {
        alert('Tidak ada perubahan yang terdeteksi')
        onClose()
        return
      }

      if (updateSuccess) {
        alert(`User "${formData.nama}" berhasil diperbarui!`)
        setShowRoleConfirm(false)
        onSave()
        onClose()
      } else {
        throw new Error('Semua percobaan update gagal')
      }
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan')
      alert(`Error: ${err.message || 'Gagal menyimpan user'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <h3>Edit User: {user?.nama}</h3>
            <span className={`status-indicator status-${(user?.status || 'active').toLowerCase()}`}>
              {(user?.status || 'active').toUpperCase()}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form className="edit-form">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              disabled
              className="form-input disabled"
            />
            <small>Name cannot be changed</small>
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="form-input disabled"
            />
            <small>Email cannot be changed</small>
          </div>

          <div className="form-group">
            <label>Phone Number:</label>
            <input
              type="tel"
              name="no_hp"
              value={formData.no_hp}
              disabled
              className="form-input disabled"
            />
            <small>Phone cannot be changed</small>
          </div>

          <div className="form-group">
            <label>Address:</label>
            <textarea
              name="alamat"
              value={formData.alamat}
              disabled
              className="form-input disabled form-textarea"
              rows="3"
            />
            <small>Address cannot be changed</small>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role:</label>
            <select
              id="role"
              name="role_id"
              value={getRoleName(formData.role_id)}
              onChange={handleRoleChange}
              className="form-input"
            >
              <option value="nasabah">Nasabah</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tipe">Tipe Nasabah:</label>
            <select
              id="tipe"
              name="tipe_nasabah"
              value={formData.tipe_nasabah}
              onChange={handleChange}
              className="form-input"
            >
              <option value="konvensional">Konvensional</option>
              <option value="korporat">Korporat</option>
            </select>
          </div>
        </form>

        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader size={16} className="spinner" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Role Change Confirmation Dialog */}
      {showRoleConfirm && (
        <DangerConfirmDialog
          title="Konfirmasi Perubahan Role"
          message={`Anda akan mengubah role user "${user?.nama}" dari "${getRoleName(user?.role_id)}" menjadi "${getRoleName(formData.role_id)}". Perubahan role akan mempengaruhi akses dan permission user terhadap sistem.`}
          confirmText="UBAH"
          actionType="warning"
          onConfirm={() => {
            const roleChanged = parseInt(formData.role_id) !== parseInt(user.role_id)
            const statusChanged = formData.status !== user.status
            const tipeChanged = formData.tipe_nasabah !== user.tipe_nasabah
            executeUpdate(roleChanged, statusChanged, tipeChanged)
          }}
          onCancel={() => setShowRoleConfirm(false)}
          isProcessing={saving}
          buttonText="Ubah Role"
        />
      )}
    </div>
  )
}
