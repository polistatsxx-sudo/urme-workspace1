import React from 'react';

export default function RichTextDisplay({ content, className }) {
  if (!content) return null;
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  if (!isHtml) {
    return <p className={`text-sm text-muted-foreground ${className || ''}`}>{content}</p>;
  }
  return (
    <div
      className={`rich-text-display text-sm text-foreground/80 ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}