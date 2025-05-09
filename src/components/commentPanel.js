import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { faMessage } from '@fortawesome/free-regular-svg-icons';
import '../i18n';
import { useTranslation } from 'react-i18next';

const CommentPopup = ({ isOpen, setIsOpen, id, type }) => {
  const count = 5;
  const { t } = useTranslation();

  const comments = [
    {
      status: 'Rejected',
      date: '10 Apr 2025',
      time: '12:30am',
      message: 'Comments on reject goes here',
    },
    {
      status: 'Approved',
      date: '10 Apr 2025',
      time: '12:30am',
      message: 'Comments on approval goes here',
    },
    {
      status: 'Rejected',
      date: '10 Apr 2025',
      time: '12:30am',
      message: 'Comments on reject goes here',
    },
    {
      status: 'Approved',
      date: '10 Apr 2025',
      time: '12:30am',
      message: 'Comments on approval goes here',
    },
    {
      status: 'Rejected',
      date: '10 Apr 2025',
      time: '12:30am',
      message: 'Comments on reject goes here',
    },
    {
      status: 'Approved',
      date: '10 Apr 2025',
      time: '12:30am',
      message: 'Comments on approval goes here',
    },
  ];

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="comment-button">
        <div className="icon-wrapper">
          <FontAwesomeIcon icon={faMessage} className="message-icon" />
          {count > 0 && <span className="badge">{count}</span>}
        </div>
      </button>

      <div className={`comment-panel ${isOpen ? 'open' : ''}`}>
        <div className="comment-panel-header">
          <h2>{t('Comments')}</h2>
          <button onClick={() => setIsOpen(false)} className="close-btn">✕</button>
        </div>
        <div className="comment-panel-body">
          {comments.map((comment, index) => (
            <div className="comment-entry" key={index}>
              <FontAwesomeIcon icon={faUserCircle} className="user-icon" />
              <div className="comment-content">
                <div className="comment-meta">
                  <strong>{t(comment.status)}</strong>
                  <span>{`${comment.date} ${comment.time}`}</span>
                </div>
                <div className="comment-text">{comment.message}</div>
              </div>
            </div>
          ))}
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
          gap: 1rem;
          position: relative;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .comment-entry::before {
          content: '';
          position: absolute;
          left: 2.3rem;
          top: 2.5rem;
          bottom: -1rem;
          width: 2px;
          background: #ccc;
        }
        [dir="rtl"] .comment-entry::before {
          left: auto;
          right: 1rem;
        }
        .user-icon {
          font-size: 30px;
          color: #888;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .comment-content {
          background-color: #f9f9f9;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
          flex: 1;
          width: 50px;
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