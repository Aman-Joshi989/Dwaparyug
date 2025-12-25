import React from "react";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper function to create preview URL for local files
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

// Simple but effective rich text editor using a textarea with formatting helpers
export const RichTextEditor = ({ value, onChange, placeholder }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + text + value.substring(start);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertText('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertText('*', '*');
          break;
        case 'u':
          e.preventDefault();
          insertText('<u>', '</u>');
          break;
      }
    }
  };

  const addLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const linkText = prompt('Enter link text (optional):') || url;
      insertText(`[${linkText}](${url})`);
    }
  };

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap gap-1 p-1 border-b bg-gray-50">
        <button
          type="button"
          onClick={() => insertText('**', '**')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => insertText('*', '*')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => insertText('<u>', '</u>')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => insertText('~~', '~~')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => insertText('# ', '')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => insertText('## ', '')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => insertText('### ', '')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => insertText('- ', '')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => insertText('1. ', '')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Numbered List"
        >
          1. List
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={addLink}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Add Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => insertText('> ', '')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Quote"
        >
          " "
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('\n---\n')}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
          title="Horizontal Rule"
        >
          ―
        </button>
      </div>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full min-h-24 p-2 resize-none border-0 outline-none focus:ring-0"
          rows={6}
        />
        <div className="absolute bottom-1 right-1 text-xs text-gray-400">
          Markdown supported
        </div>
      </div>
    </div>
  );
};



export const uploadImages = async (images: (File | string)[]): Promise<string[]> => {
  try {
    // Separate files and base64 strings
    const files = images.filter(img => img instanceof File) as File[];
    const base64Images = images.filter(img => typeof img === 'string') as string[];

    const results: string[] = [];

    // Upload files via form data
    if (files.length > 0) {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file images');
      }

      const data = await response.json();
      const fileUrls = files.length === 1 ? [data.imageUrl] : data.imageUrls;
      results.push(...fileUrls);
    }

    // Upload base64 images via JSON
    if (base64Images.length > 0) {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: base64Images,
          type: base64Images.length === 1 ? 'single' : 'multiple'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload base64 images');
      }

      const data = await response.json();
      const base64Urls = base64Images.length === 1 ? [data.imageUrl] : data.imageUrls;
      results.push(...base64Urls);
    }

    return results;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

export interface LocalImage {
  file?: File;
  base64?: string;
  url: string;
  isExisting: boolean;
}

export const renderMarkdownContent = (content: string) => {
  return content.split('\n').map((line, index) => {
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">{line.slice(2)}</h1>
    }
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-xl font-bold text-gray-900 mb-3 mt-5">{line.slice(3)}</h2>
    }
    if (line.startsWith('### ')) {
      return <h3 key={index} className="text-lg font-bold text-gray-900 mb-2 mt-4">{line.slice(4)}</h3>
    }

    if (line.includes('**') && line.trim() !== '') {
      const parts = line.split('**')
      return (
        <p key={index} className="mb-2 text-gray-600">
          {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : part)}
        </p>
      )
    }

    if (line.startsWith('- ')) {
      return <li key={index} className="mb-1 text-gray-600 ml-4 list-disc">{line.slice(2)}</li>
    }

    if (line.trim() === '---') {
      return <hr key={index} className="my-6 border-gray-200" />
    }

    if (line.trim() === '') {
      return <div key={index} className="mb-2" />
    }

    if (line.startsWith('*') && line.endsWith('*') && line.length > 2) {
      return <p key={index} className="mb-2 text-gray-500 italic text-sm">{line.slice(1, -1)}</p>
    }

    return <p key={index} className="mb-3 text-gray-600 leading-relaxed">{line}</p>
  })
}