import React from 'react';

const ICONS = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

export default function Alert({ type = 'info', children, onClose }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-icon">{ICONS[type] || ICONS.info}</div>
      <div>{children}</div>
      {onClose && <button className="alert-close" onClick={onClose}>×</button>}
    </div>
  );
}
