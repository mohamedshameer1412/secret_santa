// src/Components/GlassCard.jsx
import React from 'react'
import './GlassCard.css' // create below

const GlassCard = ({ title, text }) => {
  return (
    <div className="col-md-4">
      <div className="glass-card p-4 shadow-sm rounded text-center">
        <h5 className="fw-bold text-success">{title}</h5>
        <p className="text-muted">{text}</p>
      </div>
    </div>
  )
}

export default GlassCard
