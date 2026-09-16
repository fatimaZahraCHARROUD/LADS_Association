import React from 'react';

function StatCard({ title, count }) {
  return (
    <div style={cardStyle}>
      <h4>{title}</h4>
      <h2>{count}</h2>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  minWidth: '180px',
  textAlign: 'center'
};

export default StatCard;
