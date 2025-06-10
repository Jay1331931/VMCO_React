import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { faMessage } from '@fortawesome/free-regular-svg-icons';
import '../i18n';
import { useTranslation } from 'react-i18next';
import formatDate from '../utilities/dateFormatter';
import RbacManager from '../utilities/rbac';

/**
 * comment object structure
 {"action": "New", "date": "2025-05-21 00:00", "message": "Technician assigned", "userName": "currentUser.userName", "userId": "currentUser.userId"} 
 {"status": "New", "actionTimestamp": "2025-05-21 00:00", "comment": "Technician assigned", "userName": "currentUser.userName", "userId": "currentUser.userId"} 
 */

const CommentPopup = ({ 
  isOpen, 
  setIsOpen, 
  onAddComment, 
  showCommentForm = true,
  externalComments = [],
  currentUser  
}) => {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(externalComments);
  const [count, setCount] = useState(externalComments?.length);

    //RBAC
    //use formMode to decide if it is editform or add form
    const rbacMgr = new RbacManager(currentUser.userType === 'employee' && currentUser.roles[0] !== 'admin' ? currentUser.designation : currentUser.roles,'commentPanel');
    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);

  

  const handleAddComment = () => {
    if (commentText.trim()) {
      // Create a new comment object
      const newComment = {
        action: 'New',
        date: formatDate(new Date(),'YYYY-MM-DD HH:MM'),
        message: commentText.trim(),
        userName: currentUser.userName,
        userId: currentUser.userId
      };
      
      // Add the new comment to the comments array
      const updatedComments = [newComment, ...comments];
      externalComments.push(newComment);
      setComments(updatedComments);
      setCount(updatedComments.length);

      // Call the provided onAddComment function if it exists
      if (onAddComment) {
        onAddComment(commentText, newComment);
      }
      
      // Clear the comment input
      setCommentText('');
    }
  };

  // Helper function to format date as DD MMM YYYY

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="comment-button">
        <div className="icon-wrapper">
          {isV('commentIcon') && isE('commentIcon')&&(<FontAwesomeIcon icon={faMessage} className="message-icon" />)}
          {count > 0 && <span className="badge">{count}</span>}
        </div>
      </button>

      <div className={`comment-panel ${isOpen ? 'open' : ''}`}>
        <div className="comment-panel-header">
          <h2>{t('Comments')}</h2>
          <button onClick={() => setIsOpen(false)} className="close-btn">✕</button>
        </div>
        <div className="comment-panel-body">
          {/* {showCommentForm && (
            <div className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('Add your comment here...')}
                className="comment-textarea"
                rows="3"
              />
              <button 
                onClick={handleAddComment} 
                className="add-comment-btn"
                disabled={!commentText.trim()}
              >
                {t('Add Comment')}
              </button>
            </div>
          )} */}
          
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <div className="comment-entry" key={index}>
                <div className="user-info">
                  <FontAwesomeIcon icon={faUserCircle} className="user-icon" />
                  <div className="user-name">{comment.userName || 'User'}</div>
                </div>
                <div className="comment-content">
                  <div className="comment-meta">
                    <p>{`${comment.date}`}</p>
                    <p>{t(comment.action || 'Comment')}</p>
                  </div>
                  <div className="comment-text">{comment.message}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-comments">{t('No comments yet')}</div>
          )}
        </div>
      </div>
      <style>{`
        .comment-button {
          position: fixed;
          top: 120px;
          right: 10px;
          z-index: 1000;
          background-color: transparent;
          cursor: pointer;
          outline: none;
          border: none;
        }

        [dir="rtl"] .comment-button {
          right: auto;
          left: 0px;
        }
          
        .comment-panel {
          position: fixed;
          top: 70px;
          right: 0;
          width: 340px;
          height: 90%;
          background-color: white;
          z-index: 999;
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          border-radius: 5px;
          border: lightgrey solid 1px;
        }
        .comment-panel.open {
          transform: translateX(-40px);
        }
        [dir="rtl"] .comment-panel {
          position: fixed;
          top: 70px;
          left: 0;
          right: auto;
          width: 340px;
          height: 90%;
          background-color: white;
          z-index: 999;
          transform: translateX(-100%);
          transition: transform 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
        }
        [dir="rtl"] .comment-panel.open {
          transform: translateX(40px);
        }
        .comment-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .comment-panel-body {
          padding: 16px;
          overflow-y: auto;
          flex-grow: 1;
        }
        .icon-wrapper {
          position: relative;
        }
        .message-icon {
          width: 35px;
          height: 24px;
        }
        .badge {
          position: absolute;
          top: -6px;
          right: -4px;
          background-color: #002b5c;
          color: white;
          font-size: 12px;
          font-weight: bold;
          border-radius: 50%;
          height: 20px;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
        }
        .comment-entry {
          display: flex;
          align-items: flex-start;
          position: relative;
          margin-bottom: 1.5rem;
        }
        .comment-entry::before {
          content: '';
          position: absolute;
          left: 2rem;
          top: 3rem;
          bottom: -1rem;
          width: 2px;
          background: #ccc;
        }
        [dir="rtl"] .comment-entry::before {
          left: auto;
          right: 1rem;
        }
        .user-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 60px;
        }
        .user-icon {
          font-size: 30px;
          color: #888;
          margin-bottom: 4px;
        }
        .user-name {
          font-size: 11px;
          color: #555;
          text-align: center;
          max-width: 60px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .comment-content {
          background-color: #f9f9f9;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
          flex: 1;
        }
        .comment-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          font-weight: 500;
          color: #333;
          margin-bottom: 0.3rem;
        }
        .comment-text {
          color: #444;
          font-size: 12px;
          line-height: 1.4;
        }
        .comment-form {
          margin-bottom: 1.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
        }
        .comment-textarea {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 8px;
        }
        .add-comment-btn {
          background-color: #002b5c;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          float: right;
        }
        .add-comment-btn:hover {
          background-color: #00224a;
        }
        .add-comment-btn:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        .no-comments {
          color: #666;
          text-align: center;
          font-style: italic;
          padding: 20px 0;
        }
        @media (max-width: 768px) {
          .comment-panel {
            width: 75%;
            height: 75%;
            top: 20;
            right: 0;
            transform: translateX(100%);
          }
          .comment-panel.open {
            transform: translateX(20);
          }
          .comment-button {
            top: 70px;
            right: 10px;
          }
          [dir = "rtl"] .comment-panel {
            width: 75%;
            height: 75%;
            top: 20;
            left: 0;
            transform: translateX(-100%);
          }
        }
      `}</style>
    </>
  );
};

export default CommentPopup;