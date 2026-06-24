import { useEffect, useRef, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Link2,
  ImagePlus,
  Undo2,
  Redo2,
  Loader2,
  Minus,
} from 'lucide-react';
import api from '../../lib/api';

/** Stable reference — do not call inline in useEditor or it re-inits every render. */
export const blogEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
  }),
  Image.configure({
    inline: false,
    allowBase64: false,
    HTMLAttributes: { loading: 'lazy' },
  }),
];

export function getBlogEditorExtensions() {
  return blogEditorExtensions;
}

function ToolbarButton({ onClick, active, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`p-2 border border-transparent transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none ${
        active
          ? 'bg-wine/10 text-wine border-wine/20'
          : 'text-ink-muted hover:text-wine hover:bg-cream/80 hover:border-taupe/60'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="w-px h-6 bg-taupe/60 mx-0.5 self-center" aria-hidden />;
}

export default function BlogRichTextEditor({ editor, onError }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return undefined;
    const refresh = () => setTick((n) => n + 1);
    editor.on('selectionUpdate', refresh);
    editor.on('transaction', refresh);
    return () => {
      editor.off('selectionUpdate', refresh);
      editor.off('transaction', refresh);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="rich-text-editor border border-taupe bg-white min-h-[220px] flex items-center justify-center text-sm text-ink-subtle">
        Loading editor…
      </div>
    );
  }

  const reportError = (message) => {
    if (onError) onError(message);
  };

  const setLink = () => {
    const previous = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const handleImageFile = async (file) => {
    if (!file?.type?.startsWith('image/')) {
      reportError('Choose an image file (JPEG, PNG, WebP, or GIF).');
      return;
    }
    setUploading(true);
    try {
      const { url } = await api.admin.upload(file, 'blog-images', 'content');
      const alt = window.prompt('Alt text for accessibility (optional)', '') ?? '';
      editor.chain().focus().setImage({ src: url, alt: alt.trim() }).run();
    } catch (e) {
      reportError(e.message || 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const disabled = uploading;

  return (
    <div className="rich-text-editor border border-taupe bg-white shadow-soft">
      <div
        className="rich-text-toolbar sticky top-0 z-20 flex flex-wrap items-center gap-0.5 p-2 border-b border-taupe/60 bg-cream shadow-[0_1px_0_rgba(76,34,51,0.06)]"
        role="toolbar"
        aria-label="Article formatting"
      >
        <ToolbarButton
          label="Bold"
          active={editor.isActive('bold')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive('italic')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label="Bullet list"
          active={editor.isActive('bulletList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive('blockquote')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          label="Horizontal rule"
          disabled={disabled}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={16} strokeWidth={1.75} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton label="Insert link" active={editor.isActive('link')} disabled={disabled} onClick={setLink}>
          <Link2 size={16} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          label="Insert image"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ImagePlus size={16} strokeWidth={1.75} />
          )}
        </ToolbarButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
          }}
        />

        <ToolbarDivider />

        <ToolbarButton
          label="Undo"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={16} strokeWidth={1.75} />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={16} strokeWidth={1.75} />
        </ToolbarButton>
      </div>

      <div className="rich-text-body blog-article-body">
        <EditorContent editor={editor} />
      </div>

      <p className="px-4 py-2 text-xs text-ink-faint border-t border-taupe/40 bg-cream/30">
        Use the image button to upload photos into the article. Images are stored in your blog library (max 5MB).
      </p>
    </div>
  );
}
