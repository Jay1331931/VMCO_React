import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import '../styles/approvaldialog.css';
import Swal from 'sweetalert2';
import { isMobile } from "../utilities/isMobile";
const ApprovalDialog = ({
  isOpen,
  onClose,
  action,
  onSubmit,
  customerName,
  title,
  subtitle,
  placeholder,
  pageType // Add this prop to differentiate between 'order' and 'support'
}) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Go' || e.key === 'Search' || e.key === 'Done'  ) {
      if (isMobile) {
        // Close keyboard
        e.target.blur();
        document.body.classList.remove('keyboard-open');
      }
    }
  };
  const handleSubmit = async () => {
    // Require comment for reject, cancel, close, and reassign actions
    if (!comment.trim() && ['reject', 'cancel', 'close', 'reassign'].includes(action)) {
      Swal.fire({
        icon: 'warning',
        title: t('Warning'),
        text: t('Please provide a reason'),
        confirmButtonText: t('OK')
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(comment);
      setComment(''); // Reset comment after submission
      onClose();
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Determine button text based on action and pageType
  const getActionButtonText = () => {
    if (isSubmitting) return t('Processing...');

    switch (action) {
      case 'approve':
        return t('Approve');
      case 'reject':
        return t('Reject');
      case 'cancel':
        return pageType === 'order' ? t('Cancel Order') : t('Cancel Ticket');
      case 'close':
        return t('Close Ticket');
      case 'reassign':
        return t('Request to Reassign');
      default:
        return t('Submit');
    }
  };

  return (
    <div className="approval-dialog-overlay">
      <div className="approval-dialog">
        <div className="approval-dialog-header">
          <h3>{t(title)}</h3>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="approval-dialog-body">
          <p>{t(subtitle)}</p>

          <textarea
            className="approval-comment-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t(placeholder)}
            rows={5}
            onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
          />
        </div>

        <div className="approval-dialog-footer">
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('Cancel')}
          </button>
          <button
            className={`action-button ${action}`}
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (['reject', 'cancel', 'close', 'reassign'].includes(action) && !comment.trim())
            }
          >
            {getActionButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDialog;
