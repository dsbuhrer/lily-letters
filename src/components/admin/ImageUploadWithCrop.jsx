import { useCallback, useRef, useState } from 'react';
import { Upload, X, Loader2, Crop } from 'lucide-react';
import api from '../../lib/api';
import ImageCropModal from './ImageCropModal';

/**
 * @param {'single' | 'multiple'} mode
 * @param {string | string[]} value - URL or URL list
 * @param {(url: string | string[]) => void} onChange
 * @param {'blog-images' | 'product-images'} bucket
 * @param {number} aspect - crop aspect ratio
 * @param {string} label
 * @param {number} maxImages - multiple mode only
 * @param {(message: string) => void} [onError]
 * @param {string} [recommendedSize] - e.g. "1200 × 675 px · 16:9"
 * @param {string} [recommendedSizeNote] - context shown after the size (e.g. where it appears on the site)
 */
export default function ImageUploadWithCrop({
  mode = 'single',
  value,
  onChange,
  bucket = 'blog-images',
  aspect = 16 / 9,
  label = 'Image',
  maxImages = 12,
  onError,
  recommendedSize,
  recommendedSizeNote,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isMultiple = mode === 'multiple';
  const images = isMultiple ? (Array.isArray(value) ? value : []) : [];
  const singleUrl = isMultiple ? '' : value || '';

  const reportError = (message) => {
    if (onError) onError(message);
    else alert(message);
  };

  const openCropFromFile = (file) => {
    if (!file?.type?.startsWith('image/')) {
      reportError('Escolha um arquivo de imagem (JPEG, PNG ou WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReplaceIndex(null);
      setCropSrc(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const openCropFromUrl = async (url, index = null) => {
    setReplaceIndex(index);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Não foi possível carregar a imagem');
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => setCropSrc(reader.result);
      reader.onerror = () => reportError('Não foi possível abrir a imagem para recorte');
      reader.readAsDataURL(blob);
    } catch (e) {
      reportError(e.message || 'Não foi possível recortar esta imagem');
    }
  };

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    if (isMultiple && images.length >= maxImages) {
      reportError(`Máximo de ${maxImages} imagens.`);
      return;
    }
    openCropFromFile(file);
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [isMultiple, images.length, maxImages],
  );

  const uploadCropped = async (blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const file = new File([blob], `image-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      const { url } = await api.admin.upload(file, bucket);
      if (isMultiple) {
        if (replaceIndex !== null) {
          const next = [...images];
          next[replaceIndex] = url;
          onChange(next);
        } else {
          onChange([...images, url]);
        }
      } else {
        onChange(url);
      }
    } catch (e) {
      reportError(e.message || 'Falha no upload');
    } finally {
      setUploading(false);
      setReplaceIndex(null);
    }
  };

  const removeAt = (index) => {
    if (isMultiple) {
      onChange(images.filter((_, i) => i !== index));
    } else {
      onChange('');
    }
  };

  const canAddMore = isMultiple ? images.length < maxImages : !singleUrl;

  return (
    <div className="space-y-3">
      <div>
        <span className="text-xs uppercase tracking-widest text-[#2d2020]/50">{label}</span>
        {recommendedSize && (
          <p className="text-xs text-[#2d2020]/50 mt-1">
            Resolução recomendada: {recommendedSize}
            {recommendedSizeNote ? ` (${recommendedSizeNote})` : ''}
          </p>
        )}
      </div>

      {isMultiple && images.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <li key={`${url}-${i}`} className="relative group aspect-square border border-taupe bg-white">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-1 right-1 flex gap-1">
                <button
                  type="button"
                  className="p-1 bg-cream text-wine border border-taupe"
                  onClick={() => openCropFromUrl(url, i)}
                  aria-label="Recortar imagem"
                  title="Recortar"
                >
                  <Crop size={14} />
                </button>
                <button
                  type="button"
                  className="p-1 bg-wine text-cream"
                  onClick={() => removeAt(i)}
                  aria-label="Remover imagem"
                >
                  <X size={14} />
                </button>
              </div>
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-wine/80 text-cream text-[10px] text-center py-0.5 uppercase tracking-wider">
                  Capa
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isMultiple && singleUrl && (
        <div className="relative group border border-taupe bg-white">
          <img src={singleUrl} alt="" className="w-full max-h-56 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              className="px-2 py-1 text-xs bg-cream text-wine border border-taupe inline-flex items-center gap-1"
              onClick={() => openCropFromUrl(singleUrl, 0)}
            >
              <Crop size={14} />
              Recortar
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs bg-wine text-cream inline-flex items-center gap-1"
              onClick={() => removeAt(0)}
            >
              <X size={14} />
              Remover
            </button>
          </div>
        </div>
      )}

      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-wine bg-wine/5' : 'border-taupe hover:border-wine/50 hover:bg-white/50'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {uploading ? (
            <p className="flex items-center justify-center gap-2 text-sm text-[#2d2020]/60">
              <Loader2 size={18} className="animate-spin" />
              Enviando…
            </p>
          ) : (
            <>
              <Upload className="mx-auto text-gold mb-3" size={28} strokeWidth={1.25} />
              <p className="text-sm text-wine font-medium">
                {isMultiple ? 'Arraste ou clique para adicionar' : 'Arraste ou clique para escolher a imagem'}
              </p>
              <p className="text-xs text-[#2d2020]/45 mt-2">Recorte antes do envio · convertido para WebP no servidor</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onClose={() => {
            setCropSrc(null);
            setReplaceIndex(null);
          }}
          onComplete={uploadCropped}
          aspect={aspect}
        />
      )}
    </div>
  );
}
