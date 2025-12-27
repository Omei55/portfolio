import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import commentsService from "../services/commentsService";
import "./TaskComments.css";

const TaskComments = ({ storyId, taskId, taskTitle }) => {
  const { user, getCurrentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef(null);
  const commentEndRef = useRef(null);

  useEffect(() => {
    if (taskId || storyId) {
      loadComments();
    }
  }, [taskId, storyId]);

  useEffect(() => {
    // Auto-scroll to bottom when new comments are added
    if (commentEndRef.current) {
      commentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  const loadComments = async () => {
    if (!taskId && !storyId) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Load task-specific comments if taskId is provided, otherwise load story comments
      let fetchedComments = [];
      if (taskId) {
        fetchedComments = await commentsService.getCommentsByTaskId(taskId);
      } else if (storyId) {
        fetchedComments = await commentsService.getCommentsByStoryId(storyId);
      }
      
      // Map API response to component format
      const mappedComments = Array.isArray(fetchedComments) ? fetchedComments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        authorId: comment.userId,
        authorName: comment.authorName || 'Unknown',
        authorEmail: comment.authorEmail || '',
        author: {
          id: comment.userId,
          name: comment.authorName,
          email: comment.authorEmail,
        },
        createdAt: comment.createdAt,
        created_at: comment.createdAt,
        updatedAt: comment.updatedAt,
        updated_at: comment.updatedAt,
      })) : [];
      setComments(mappedComments);
    } catch (err) {
      console.error("Failed to load comments:", err);
      setError(err.message || "Failed to load comments");
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserInfo = () => {
    const currentUser = getCurrentUser() || user;
    return {
      id: currentUser?.id || currentUser?.email || "unknown",
      name: currentUser?.full_name || currentUser?.fullName || "Anonymous User",
      email: currentUser?.email || "",
    };
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting || (!taskId && !storyId)) {
      return;
    }

    try {
      setIsSubmitting(true);
      const commentData = {
        content: newComment.trim(),
        taskId: taskId || undefined,
      };

      // Pass storyId if no taskId, otherwise pass undefined and let taskId be used
      await commentsService.createComment(taskId ? undefined : storyId, commentData);
      setNewComment("");
      await loadComments();
    } catch (err) {
      console.error("Failed to create comment:", err);
      alert(err.message || "Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) {
      return;
    }

    try {
      await commentsService.updateComment(commentId, {
        content: editContent.trim(),
      });
      setEditingId(null);
      setEditContent("");
      await loadComments();
    } catch (err) {
      console.error("Failed to update comment:", err);
      alert(err.message || "Failed to update comment. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await commentsService.deleteComment(commentId);
      await loadComments();
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert(err.message || "Failed to delete comment. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const currentUser = getCurrentUserInfo();
  const canEditOrDelete = (comment) => {
    // Check if current user is the comment author
    const userEmail = currentUser.email || user?.email;
    const userId = currentUser.id || user?.id;
    return comment.authorId === userId || 
           comment.authorEmail === userEmail ||
           comment.userId === userId;
  };

  if (loading) {
    return (
      <div className="task-comments-container">
        <div className="comments-loading">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="task-comments-container">
      <div className="comments-header">
        <h3 className="comments-title">
          Comments
          {comments.length > 0 && (
            <span className="comments-count">({comments.length})</span>
          )}
        </h3>
      </div>

      {error && <div className="comments-error">{error}</div>}

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="comments-empty">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                {getInitials(comment.authorName || comment.author?.name)}
              </div>
              <div className="comment-content-wrapper">
                <div className="comment-header">
                  <span className="comment-author">
                    {comment.authorName || comment.author?.name || "Anonymous"}
                  </span>
                  <span className="comment-date">
                    {formatDate(comment.createdAt || comment.created_at)}
                  </span>
                </div>
                {editingId === comment.id ? (
                  <div className="comment-edit-form">
                    <textarea
                      className="comment-edit-textarea"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows="3"
                      autoFocus
                    />
                    <div className="comment-edit-actions">
                      <button
                        className="comment-save-btn"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        Save
                      </button>
                      <button
                        className="comment-cancel-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="comment-text">
                      {comment.content || comment.text}
                    </div>
                    {canEditOrDelete(comment) && (
                      <div className="comment-actions">
                        <button
                          className="comment-action-btn"
                          onClick={() => handleEditComment(comment)}
                          title="Edit comment"
                        >
                          Edit
                        </button>
                        <button
                          className="comment-action-btn comment-delete-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                          title="Delete comment"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={commentEndRef} />
      </div>

      <form className="comment-form" onSubmit={handleSubmitComment}>
        <div className="comment-form-avatar">
          {getInitials(currentUser.name)}
        </div>
        <div className="comment-form-content">
          <textarea
            ref={textareaRef}
            className="comment-input"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows="3"
            disabled={isSubmitting}
          />
          <div className="comment-form-actions">
            <button
              type="submit"
              className="comment-submit-btn"
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TaskComments;

