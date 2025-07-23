import React, { useState } from 'react';

const SubmissionBoard = () => {
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles([...files, ...selected]);
  };

  return (
    <div className="my-4">
      <h4>
        <i className="fa-solid fa-upload me-2 text-success"></i>Submit Proof (Image/Text)
      </h4>
      <input
        type="file"
        multiple
        accept="image/*,.txt,.pdf"
        className="form-control"
        onChange={handleFileChange}
      />
      <div className="mt-3">
        {files.length === 0 && <div className="text-muted">No files submitted yet.</div>}
        {files.map((file, idx) => (
          <div key={idx} className="small text-dark">
            <i className="fa-solid fa-file me-1 text-secondary"></i> {file.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubmissionBoard;
