import React, { useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './NotificationToast.css';

function NotificationToast({ open, title, message, type = 'success', onClose }) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      if (onClose) onClose();
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-icon">
        {type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
      </div>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close notification">
        ×
      </button>
    </div>
  );
}

export default NotificationToast;
