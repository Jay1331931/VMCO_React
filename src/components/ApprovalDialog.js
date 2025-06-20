import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import '../styles/approvaldialog.css'; 
import Swal from 'sweetalert2';

const ApprovalDialog = ({ 
  isOpen, 
  onClose, 
  action, 
  onSubmit, 
  customerName,
  title,
  subtitle
}) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim() && action === 'reject') {
      Swal.fire({
        icon: 'warning',
        title: t('Warning'),
        text: t('Please provide a reason for rejection'),
        confirmButtonText: t('OK')
      });
      // alert(t('Please provide a reason for rejection'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(comment);
      onClose();
    } catch (error) {
      console.error('Error submitting approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="approval-dialog-overlay">
      <div className="approval-dialog">
        <div className="approval-dialog-header">
          <h3>
            {action === 'approve' 
              ? t(title) 
              : t(title)}
          </h3>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="approval-dialog-body">
          <p>
            {action === 'approve'
              ? t(subtitle)
              : t(subtitle)}
          </p>
          
          <textarea
            className="approval-comment-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              action === 'approve' 
                ? t('Comments...') 
                : t('Required reason for rejection...')
            }
            rows={5}
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
            disabled={isSubmitting || (action === 'reject' && !comment.trim())}
          >
            {isSubmitting 
              ? t('Processing...') 
              : action === 'approve' 
                ? t('Approve') 
                : t('Reject')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDialog;