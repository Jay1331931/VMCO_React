// import React, { useState } from 'react';
// import '../styles/commentPanel.css'; // Import your CSS file for styles
// import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
// import { faComment, faPaperPlane, faEnvelope } from '@fortawesome/free-solid-svg-icons';
// const CommentPopup = ({ isOpen, setIsOpen }) => {
//     let count = 2;
//     return (
//         <>
//       <>
        
//       <>
//       <button onClick={() => setIsOpen(!isOpen)} className="comment-button">
      
//       <div className="icon-wrapper">
//         <FontAwesomeIcon icon={faEnvelope} className="message-icon" />
//         {count > 0 && <span className="badge">{count}</span>}
//       </div>
//     </button>
//         <div className={`comment-panel ${isOpen ? 'open' : ''}`}>
//           <div className="comment-panel-header">
//             <h2>Comments</h2>
//             <button onClick={() => setIsOpen(false)}>✕</button>
//           </div>
//           <div className="comment-panel-body">
//             {/* Add your comment content here */}
//             <p>This is your sliding comment panel.</p>
//           </div>
//         </div>
        
//       </>
      
//     </>
//     </>
//     );
//   };
  
//   export default CommentPopup;

import React from 'react';
import '../styles/commentPanel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faMessage } from '@fortawesome/free-solid-svg-icons';

const CommentPopup = ({ isOpen, setIsOpen }) => {
  const count = 2;

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
          <h2>Comments</h2>
          <button onClick={() => setIsOpen(false)} className="close-btn">✕</button>
        </div>
        <div className="comment-panel-body">
          {comments.map((comment, index) => (
            <div className="comment-entry" key={index}>
              <FontAwesomeIcon icon={faUserCircle} className="user-icon" />
              <div className="comment-content">
                <div className="comment-meta">
                  <strong>{comment.status}</strong>
                  <span>{`${comment.date} ${comment.time}`}</span>
                </div>
                <div className="comment-text">{comment.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CommentPopup;
