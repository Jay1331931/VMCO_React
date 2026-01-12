import React, { useState, useEffect } from 'react';
import CommentPopup from './commentPanel';
import formatDate from '../utilities/dateFormatter';
import { useTranslation } from 'react-i18next';

const OrderDetailsCommentPopup = ({ 
  isOpen, 
  setIsOpen, 
  onAddComment, 
  showCommentForm = true, 
  currentUser, 
  isVisible = false,
  formData = {},
  approvalHistory = []
}) => {
  const { t } = useTranslation();
  const [processedComments, setProcessedComments] = useState([]);

  // Helper function to parse comments from JSON string
  const parseComments = (commentsField) => {
    if (!commentsField) return [];
    try {
      const parsed = typeof commentsField === 'string' ? JSON.parse(commentsField) : commentsField;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  };

  // Helper function to parse feedback
  const parseFeedback = (feedbackField) => {
    if (!feedbackField) return [];
    try {
      const parsed = typeof feedbackField === 'string' ? JSON.parse(feedbackField) : feedbackField;
      if (Array.isArray(parsed)) return parsed;
      return [{
        message: parsed.comment || parsed.message || parsed.feedback,
        date: parsed.date || parsed.actionTimestamp || parsed.createdAt,
        userName: parsed.userName || parsed.createdBy || 'System',
        userId: parsed.userId || parsed.createdById || 'system',
        status: parsed.status || 'Feedback'
      }];
    } catch {
      return [];
    }
  };

  // Transform approval history into comment format (PRIORITY 1)
  const getApprovalComments = () => {
    return approvalHistory.map(item => ({
      action: item.action || item.status || 'Approved',
      date: formatDate(item.actionTimestamp || item.date || new Date(), "YYYY-MM-DD HH:MM"),
      message: item.comment || item.message || `${item.action} by ${item.userName}`,
      userName: item.userName || item.createdBy || 'System',
      userId: item.userId || item.createdById || 'system',
      status: item.status || item.action || 'Approval'
    })).filter(comment => comment.message);
  };

  // Get prioritized comments in correct order
  const getPrioritizedComments = () => {
    // 1. Approval history comments (highest priority)
    const approvalComments = getApprovalComments();
    
    // 2. Sales order comments field
    const salesOrderComments = parseComments(formData.comments);
    
    // 3. Sales order feedback field
    const feedbackComments = parseFeedback(formData.feedback);
    
    // Combine all sources
    const allComments = [...approvalComments, ...salesOrderComments, ...feedbackComments];
    
    // Remove duplicates and sort by date (newest first)
    const uniqueComments = allComments.filter((comment, index, self) => 
      index === self.findIndex(c => 
        c.message === comment.message && 
        c.date === comment.date
      )
    );
    
    return uniqueComments.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  useEffect(() => {
    const prioritizedComments = getPrioritizedComments();
    setProcessedComments(prioritizedComments);
  }, [formData.comments, formData.feedback, approvalHistory]);

  // Pass processed comments to original CommentPopup
  return (
    <CommentPopup
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onAddComment={onAddComment}
      showCommentForm={showCommentForm}
      externalComments={processedComments}  // Pass prioritized comments here
      currentUser={currentUser}
      isVisible={isVisible}
    />
  );
};

export default OrderDetailsCommentPopup;
