import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 120 }) {
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'bullet' }, { list: 'ordered' }],
      ['link'],
      ['clean'],
    ],
  }), []);

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || ''}
        style={{ minHeight }}
      />
    </div>
  );
}