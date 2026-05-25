import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { backupService } from '../../services/backupService'
import './BackupManager.css'

const BackupManager = () => {
  const { isSuperAdmin } = useAuth()
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [restoreConfirm, setRestoreConfirm] = useState(null)

  // Check permission - Superadmin only
  const canManageBackups = isSuperAdmin

  // Load backups
  const loadBackups = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await backupService.getAll()
      if (response.success) {
        setBackups(response.data || [])
      } else {
        setError(response.message || 'Failed to load backups')
      }
    } catch (err) {
      setError('Error loading backups: ' + err.message)
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (canManageBackups) {
      loadBackups()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!canManageBackups) {
    return (
      <div className="permission-denied">
        <p>⛔ Only superadmins can access backup management</p>
      </div>
    )
  }

  // Create backup
  const handleCreateBackup = async () => {
    if (!window.confirm('Create a new database backup? This will take some time.')) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await backupService.create()
      if (response.success) {
        setSuccess('✅ Backup created successfully!')
        loadBackups()
      } else {
        setError(response.message || 'Failed to create backup')
      }
    } catch (err) {
      setError('Error creating backup: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Download backup
  const handleDownload = async (backupId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await backupService.download(backupId)
      if (response.success) {
        setSuccess('✅ ' + response.message)
      } else {
        setError(response.message || 'Failed to download backup')
      }
    } catch (err) {
      setError('Error downloading backup: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Restore backup
  const handleRestore = async (backupId) => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will restore the entire database to this backup point.\n\nThis action CANNOT be undone! All data changes since this backup will be lost.\n\nDo you want to proceed?'
    )

    if (!confirmed) {
      return
    }

    // Double confirmation
    const doubleConfirm = window.prompt(
      'Type "YES, RESTORE" to confirm this dangerous operation:'
    )

    if (doubleConfirm !== 'YES, RESTORE') {
      setError('Restore cancelled.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setRestoreConfirm(null)

    try {
      const response = await backupService.restore(backupId, true)
      if (response.success) {
        setSuccess('♻️ ' + response.message)
        loadBackups()
      } else {
        setError(response.message || 'Failed to restore backup')
      }
    } catch (err) {
      setError('Error restoring backup: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Delete backup
  const handleDelete = async (backupId) => {
    if (!window.confirm('Delete this backup permanently?')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await backupService.delete(backupId)
      if (response.success) {
        setSuccess('✅ Backup deleted successfully!')
        loadBackups()
      } else {
        setError(response.message || 'Failed to delete backup')
      }
    } catch (err) {
      setError('Error deleting backup: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="backup-manager-container">
      <div className="manager-header">
        <div>
          <h2>🗄️ Database Backup Management</h2>
          <p className="subtitle">Superadmin only - Handle with care</p>
        </div>
        <button
          className="btn-create-backup"
          onClick={handleCreateBackup}
          disabled={loading}
        >
          💾 Create New Backup
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="close-alert">
            ✕
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <p>{success}</p>
          <button onClick={() => setSuccess(null)} className="close-alert">
            ✕
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="info-box">
        <h3>📋 Backup Information</h3>
        <ul>
          <li>Regular backups help protect your data against loss or corruption</li>
          <li>Download backups to store them in a safe location</li>
          <li>Restoring a backup will overwrite ALL current data</li>
          <li>Only superadmins can manage backups</li>
        </ul>
      </div>

      {/* Backups List */}
      {loading && backups.length === 0 ? (
        <div className="loading-state">
          <p>📦 Loading backups...</p>
        </div>
      ) : backups.length > 0 ? (
        <div className="backups-table-wrapper">
          <table className="backups-table">
            <thead>
              <tr>
                <th>Backup ID</th>
                <th>Created Date</th>
                <th>File Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id} className={backup.completed ? '' : 'incomplete'}>
                  <td className="backup-id">
                    <code>{backup.id || 'N/A'}</code>
                  </td>
                  <td className="created-date">
                    {backup.created_at
                      ? new Date(backup.created_at).toLocaleString('id-ID')
                      : 'N/A'}
                  </td>
                  <td className="file-size">
                    {backup.file_size ? formatBytes(backup.file_size) : 'N/A'}
                  </td>
                  <td className="status">
                    <span className={`status-badge ${backup.completed ? 'completed' : 'pending'}`}>
                      {backup.completed ? '✓ Complete' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-action btn-download"
                      onClick={() => handleDownload(backup.id)}
                      disabled={!backup.completed || loading}
                      title="Download backup file"
                    >
                      ⬇️
                    </button>
                    <button
                      className="btn-action btn-restore"
                      onClick={() => handleRestore(backup.id)}
                      disabled={!backup.completed || loading}
                      title="Restore from this backup"
                    >
                      ♻️
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(backup.id)}
                      disabled={loading}
                      title="Delete this backup"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-backups">
          <p>📦 No backups found. Create your first backup!</p>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ Confirm Database Restore</h3>
            <p>
              This will restore the entire database to backup ID: <code>{restoreConfirm}</code>
            </p>
            <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
              All data changes since this backup will be permanently lost!
            </p>
            <div className="modal-buttons">
              <button
                className="btn-confirm-restore"
                onClick={() => handleRestore(restoreConfirm)}
              >
                Yes, Restore
              </button>
              <button className="btn-cancel-restore" onClick={() => setRestoreConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export default BackupManager
