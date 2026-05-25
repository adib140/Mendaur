import { X, AlertTriangle, Loader } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import '../styles/ConfirmDialog.css'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, isDeleting = false }) {
  const { hasPermission } = useAuth()
  
  // ✅ If user doesn't have permission, show restricted message
  const canProceed = hasPermission('delete_user') || hasPermission('approve_deposit') || hasPermission('approve_withdrawal') || hasPermission('approve_redemption')
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <div className="confirm-icon-wrapper">
            <AlertTriangle size={24} className="alert-icon" />
          </div>
          <h3>{title}</h3>
          <button className="confirm-close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="confirm-body">
          <p>{message}</p>
        </div>

        <div className="confirm-footer">
          <button
            className="btn-cancel"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={isDeleting || !canProceed}
            title={!canProceed ? '❌ You do not have permission' : 'Confirm'}
          >
            {isDeleting ? (
              <>
                <Loader size={16} className="spinner" />
                Deleting...
              </>
            ) : (
              'Confirm Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
