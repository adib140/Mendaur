import { useState } from 'react'
import { X, AlertTriangle, Loader, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import '../styles/DangerConfirmDialog.css'

// Modal konfirmasi untuk operasi berbahaya
export default function DangerConfirmDialog({ 
  title = 'Confirm Action',
  message,
  confirmText,
  actionType = 'critical',
  onConfirm, 
  onCancel, 
  isProcessing = false,
  buttonText = 'Confirm'
}) {
  const { hasPermission } = useAuth()
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  // Determine required permission based on action type
  const getRequiredPermission = () => {
    switch (actionType) {
      case 'delete_account':
        return 'delete_user'
      case 'change_role':
        return 'edit_user'
      case 'edit_deposit':
        return 'approve_deposit'
      case 'delete_deposit':
        return 'approve_deposit'
      case 'edit_withdrawal':
        return 'approve_withdrawal'
      case 'delete_content':
        return 'manage_content'
      default:
        return 'superadmin_only'
    }
  }

  const requiredPermission = getRequiredPermission()
  const canProceed = hasPermission(requiredPermission)

  // Get action-specific styling
  const getActionStyle = () => {
    switch (actionType) {
      case 'delete_account':
        return { color: '#dc2626', icon: '🗑️', label: 'DELETE ACCOUNT' }
      case 'change_role':
        return { color: '#f59e0b', icon: '⚠️', label: 'ROLE CHANGE' }
      case 'edit_deposit':
        return { color: '#3b82f6', icon: '✏️', label: 'EDIT DEPOSIT' }
      case 'delete_deposit':
        return { color: '#dc2626', icon: '🗑️', label: 'DELETE DEPOSIT' }
      default:
        return { color: '#dc2626', icon: '⚠️', label: 'CRITICAL ACTION' }
    }
  }

  const actionStyle = getActionStyle()

  // Validate confirmation
  const isConfirmValid = confirmText 
    ? inputValue === confirmText 
    : true

  const handleConfirm = () => {
    if (!canProceed) {
      setError('You do not have permission to perform this action')
      return
    }

    if (confirmText && inputValue !== confirmText) {
      setError(`Please type "${confirmText}" exactly to confirm`)
      return
    }

    setError('')
    onConfirm({ confirmed: true })
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    setError('')
  }

  return (
    <div className="danger-confirm-overlay" onClick={onCancel}>
      <div className="danger-confirm-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="danger-confirm-header" style={{ borderLeftColor: actionStyle.color }}>
          <div className="danger-header-left">
            <div className="danger-icon-wrapper" style={{ backgroundColor: `${actionStyle.color}15` }}>
              <ShieldAlert size={24} style={{ color: actionStyle.color }} />
            </div>
            <div className="danger-title-section">
              <span className="danger-action-label" style={{ color: actionStyle.color }}>
                {actionStyle.icon} {actionStyle.label}
              </span>
              <h3 className="danger-title">{title}</h3>
            </div>
          </div>
          <button className="danger-close-btn" onClick={onCancel} disabled={isProcessing}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="danger-confirm-body">
          {/* Warning Message */}
          <div className="danger-warning-box">
            <AlertTriangle size={20} className="warning-icon" />
            <div className="warning-text">
              <p className="warning-title">This action is irreversible!</p>
              <p className="warning-desc">{message}</p>
            </div>
          </div>

          {/* Grace Period Info for Delete */}
          {actionType === 'delete_account' && (
            <div className="danger-info-box">
              <p>The account will be <strong style={{ color: '#dc2626' }}>permanently deleted</strong> in 48 hours.</p>
              <p className="info-subtext">You can cancel or force delete during the 48 hour grace period. Active sessions will be terminated immediately.</p>
            </div>
          )}

          {/* Confirmation Input */}
          {confirmText && (
            <div className="danger-input-section">
              <label className="danger-input-label">
                Type <strong>"{confirmText}"</strong> to confirm:
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={confirmText}
                className={`danger-input ${inputValue === confirmText ? 'valid' : ''} ${error ? 'error' : ''}`}
                disabled={isProcessing}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="danger-error-message">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Permission Warning */}
          {!canProceed && (
            <div className="danger-permission-warning">
              <ShieldAlert size={16} />
              <span>You do not have permission to perform this action. Required: <strong>{requiredPermission}</strong></span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="danger-confirm-footer">
          <button
            className="danger-btn-cancel"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className="danger-btn-confirm"
            onClick={handleConfirm}
            disabled={isProcessing || !canProceed || !isConfirmValid}
            style={{ 
              backgroundColor: isConfirmValid && canProceed ? actionStyle.color : '#6b7280',
              cursor: isConfirmValid && canProceed ? 'pointer' : 'not-allowed'
            }}
          >
            {isProcessing ? (
              <>
                <Loader size={16} className="spinner" />
                Processing...
              </>
            ) : (
              buttonText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
