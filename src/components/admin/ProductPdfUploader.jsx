import { useRef, useState, useEffect } from 'react';
import { FileText, Upload, X, Loader2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

const MAX_BYTES = 10 * 1024 * 1024;

export default function ProductPdfUploader({ pdfPath = '', fileName = '', onChange, onError }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState(fileName);

  useEffect(() => {
    setDisplayName(fileName);
  }, [fileName]);

  const reportError = (message) => {
    if (onError) onError(message);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      reportError('Choose a PDF file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      reportError('PDF too large (max 10 MB).');
      return;
    }

    setUploading(true);
    try {
      const { path } = await api.admin.uploadPdf(file);
      onChange(path, file.name);
      setDisplayName(file.name);
    } catch (e) {
      reportError(e.message || 'PDF upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('', '');
    setDisplayName('');
  };

  return (
    <div className="space-y-3 pt-4 border-t border-taupe/30">
      <div>
        <h3 className="font-display text-lg text-wine">Customer download (PDF)</h3>
        <p className="text-sm text-ink-subtle mt-1">
          PDF file customers receive after completing their purchase.
        </p>
        <p className="text-xs text-ink-subtle mt-1">
          We recommend a file smaller than 10 MB.
        </p>
      </div>

      {pdfPath ? (
        <div className="flex items-center gap-3 p-4 border border-taupe rounded-md bg-white">
          <FileText size={32} className="text-wine shrink-0" strokeWidth={1.25} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{displayName || 'product.pdf'}</p>
            <p className="text-xs text-ink-subtle truncate">{pdfPath}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              className="p-2 text-ink-subtle hover:text-wine transition-colors"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              aria-label="Replace PDF"
              title="Replace"
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              className="p-2 text-ink-subtle hover:text-wine transition-colors"
              onClick={handleRemove}
              disabled={uploading}
              aria-label="Remove PDF"
              title="Remove"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors border-taupe hover:border-wine/50 hover:bg-white/50 ${
            uploading ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          {uploading ? (
            <p className="flex items-center justify-center gap-2 text-sm text-ink-muted">
              <Loader2 size={18} className="animate-spin" />
              Uploading PDF…
            </p>
          ) : (
            <>
              <Upload className="mx-auto text-gold mb-3" size={28} strokeWidth={1.25} />
              <p className="text-sm text-wine font-medium">Click to upload PDF</p>
              <p className="text-xs text-ink-subtle mt-2">PDF only · max 10 MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
