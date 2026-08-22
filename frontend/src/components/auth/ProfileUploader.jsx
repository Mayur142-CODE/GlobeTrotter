import React, { useRef, useState } from 'react';
import { Camera, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ProfileUploader({ value, onChange, error }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    onChange(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="profile-upload-wrap">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload profile photo"
        className="profile-avatar"
        style={dragging ? { borderColor: 'rgba(34,211,238,0.7)' } : undefined}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {/* Placeholder icon when no photo */}
        {!preview && (
          <div className="profile-placeholder">
            <User size={32} strokeWidth={1.25} color="rgba(148,163,184,0.4)" aria-hidden="true" />
          </div>
        )}

        {/* Preview image */}
        {preview && (
          <motion.img
            src={preview}
            alt="Profile preview"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          />
        )}

        {/* Hover overlay */}
        <AnimatePresence>
          {(hovering || dragging) && (
            <motion.div
              className="profile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Camera size={20} color="#22d3ee" strokeWidth={1.75} aria-hidden="true" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: '#22d3ee', fontWeight: 600 }}>
                {dragging ? 'Drop here' : 'Upload'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge when photo set */}
        {preview && !hovering && (
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 22, height: 22, borderRadius: '50%',
            background: '#22d3ee',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #06101c',
          }}>
            <Camera size={10} color="#fff" strokeWidth={2} aria-hidden="true" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
        tabIndex={-1}
        aria-hidden="true"
      />

      <p className="profile-caption">
        {preview ? 'Click to change' : 'Add profile photo'}
      </p>

      {error && (
        <p role="alert" className="auth-field-error">{error}</p>
      )}
    </div>
  );
}
