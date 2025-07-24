import React from 'react';
import './AccessDenied.css';

const AccessDenied = () => {
  return (
    <div className="access-denied-container">
      <h1>Access Denied</h1>
      <p>You are not authorized to participate in this survey.</p>
      <p>If you believe this is a mistake, please contact the study administrator.</p>
    </div>
  );
};

export default AccessDenied;