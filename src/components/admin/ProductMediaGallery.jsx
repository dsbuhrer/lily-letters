import { useCallback, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImagePlus, Pencil, Trash2, Loader2, GripVertical, Video, Play } from 'lucide-react';
import api from '../../lib/api';
import {
  PRODUCT_IMAGE_RECOMMENDED_LABEL,
  PRODUCT_IMAGE_RECOMMENDED_NOTE,
} from '../../constants/productImages';

function SortableImageTile({ url, index, onReplace, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: url,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const replaceRef = useRef(null);
  const stopDrag = (e) => e.stopPropagation();

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-md border border-taupe bg-white overflow-hidden group"
    >
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />
      </div>

      {index === 0 && (
        <span className="absolute top-2 left-2 z-10 bg-cream/90 text-ink text-[10px] font-medium px-2 py-0.5 rounded-full border border-taupe/50 pointer-events-none">
          Featured
        </span>
      )}

      <div
        className={`absolute inset-0 z-20 flex items-center justify-center gap-3 bg-ink/50 pointer-events-none transition-opacity ${
          isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <button
          type="button"
          className="pointer-events-auto p-2 bg-cream text-wine rounded-full hover:bg-white transition-colors"
          onPointerDown={stopDrag}
          onClick={() => replaceRef.current?.click()}
          aria-label="Replace image"
          title="Edit"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="pointer-events-auto p-2 bg-wine text-cream rounded-full hover:bg-wine/90 transition-colors"
          onPointerDown={stopDrag}
          onClick={() => onRemove(index)}
          aria-label="Delete image"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div
        className={`absolute top-2 right-2 z-30 p-1 text-cream pointer-events-none transition-opacity ${
          isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
        }`}
        aria-hidden
      >
        <GripVertical size={14} strokeWidth={2} />
      </div>

      <input
        ref={replaceRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onReplace(index, file);
          e.target.value = '';
        }}
      />
    </li>
  );
}

export default function ProductMediaGallery({
  images = [],
  onChange,
  videos = [],
  onVideosChange,
  maxImages = 12,
  maxVideos = 3,
  onError,
}) {
  const inputRef = useRef(null);
  const videoInputRef = useRef(null);
  const replaceVideoIndexRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reportError = (message) => {
    if (onError) onError(message);
  };

  const uploadFiles = async (fileList, replaceIndex = null) => {
    const files = Array.from(fileList || []).filter((f) => f.type?.startsWith('image/'));
    if (!files.length) {
      reportError('Choose image files (JPEG, PNG, or WebP).');
      return;
    }

    const slotsLeft =
      replaceIndex !== null ? 1 : maxImages - images.length;
    if (slotsLeft <= 0) {
      reportError(`Maximum of ${maxImages} images.`);
      return;
    }

    const toUpload = files.slice(0, slotsLeft);
    if (toUpload.length < files.length) {
      reportError(`Only ${slotsLeft} slot(s) remaining — extra files were skipped.`);
    }

    setUploading(true);
    setUploadCount(toUpload.length);

    try {
      const urls = await Promise.all(
        toUpload.map(async (file) => {
          const { url } = await api.admin.upload(file, 'product-images');
          return url;
        }),
      );

      if (replaceIndex !== null) {
        const next = [...images];
        next[replaceIndex] = urls[0];
        onChange(next);
      } else {
        onChange([...images, ...urls]);
      }
    } catch (e) {
      reportError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadCount(0);
    }
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      uploadFiles(e.dataTransfer.files);
    },
    [images, maxImages],
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.indexOf(active.id);
    const newIndex = images.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(images, oldIndex, newIndex));
  };

  const removeAt = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const uploadVideoFiles = async (fileList, replaceIndex = null) => {
    if (!onVideosChange) return;

    const files = Array.from(fileList || []).filter((f) => f.type?.startsWith('video/'));
    if (!files.length) {
      reportError('Choose video files (MP4, WebM, or MOV).');
      return;
    }

    const slotsLeft = replaceIndex !== null ? 1 : maxVideos - videos.length;
    if (slotsLeft <= 0) {
      reportError(`Maximum of ${maxVideos} videos.`);
      return;
    }

    const toUpload = files.slice(0, slotsLeft);
    if (toUpload.length < files.length) {
      reportError(`Only ${slotsLeft} slot(s) remaining — extra files were skipped.`);
    }

    setUploadingVideo(true);
    try {
      const urls = await Promise.all(
        toUpload.map(async (file) => {
          const { url } = await api.admin.uploadVideo(file);
          return url;
        }),
      );

      if (replaceIndex !== null) {
        const next = [...videos];
        next[replaceIndex] = urls[0];
        onVideosChange(next);
      } else {
        onVideosChange([...videos, ...urls]);
      }
    } catch (e) {
      reportError(e.message || 'Video upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeVideoAt = (index) => {
    if (onVideosChange) onVideosChange(videos.filter((_, i) => i !== index));
  };

  const videoFileName = (url) => {
    try {
      return decodeURIComponent(url.split('/').pop() || 'video');
    } catch {
      return 'video';
    }
  };

  const remaining = maxImages - images.length;
  const canAddMore = remaining > 0;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display text-lg text-wine">Photos</h3>
        <p className="text-sm text-ink-subtle mt-1">
          Show off different angles, available options, or even a peek behind the scenes at your
          process.
        </p>
        <p className="text-xs text-ink-subtle mt-2">
          Add up to {maxImages} photos and {maxVideos} videos. Recommended: {PRODUCT_IMAGE_RECOMMENDED_LABEL} (
          {PRODUCT_IMAGE_RECOMMENDED_NOTE}).
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <SortableImageTile
                key={url}
                url={url}
                index={i}
                onReplace={(idx, file) => uploadFiles([file], idx)}
                onRemove={removeAt}
              />
            ))}

            {canAddMore && (
              <li>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && inputRef.current?.click()}
                  className={`aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-wine bg-wine/5'
                      : 'border-taupe hover:border-wine/50 hover:bg-white/50'
                  } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={24} className="animate-spin text-wine mb-2" />
                      <p className="text-xs text-ink-subtle">Uploading {uploadCount}…</p>
                    </>
                  ) : (
                    <>
                      <ImagePlus size={28} className="text-gold mb-2" strokeWidth={1.25} />
                      <p className="text-sm text-wine font-medium">Add photos</p>
                      <p className="text-xs text-ink-subtle mt-1">{remaining} remaining</p>
                    </>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      uploadFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>

      {onVideosChange && (
        <div className="pt-4 border-t border-taupe/30 space-y-3">
          <p className="text-sm font-medium text-ink">Videos</p>
          <p className="text-xs text-ink-subtle">
            MP4, WebM, or MOV · max 50 MB each · up to {maxVideos} videos
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {videos.map((url, i) => (
              <li
                key={url}
                className="relative aspect-video rounded-md border border-taupe bg-ink/5 overflow-hidden group"
              >
                <video
                  src={url}
                  className="w-full h-full object-cover pointer-events-none"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-cream/90 flex items-center justify-center">
                    <Play size={18} className="text-wine ml-0.5" fill="currentColor" />
                  </div>
                </div>
                <p className="absolute bottom-0 left-0 right-0 bg-ink/60 text-cream text-[10px] px-2 py-1 truncate pointer-events-none">
                  {videoFileName(url)}
                </p>
                <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    className="p-2 bg-cream text-wine rounded-full hover:bg-white transition-colors"
                    onClick={() => {
                      replaceVideoIndexRef.current = i;
                      videoInputRef.current?.click();
                    }}
                    aria-label="Replace video"
                    title="Replace"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="p-2 bg-wine text-cream rounded-full hover:bg-wine/90 transition-colors"
                    onClick={() => removeVideoAt(i)}
                    aria-label="Delete video"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}

            {videos.length < maxVideos && (
              <li>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && videoInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setVideoDragOver(true);
                  }}
                  onDragLeave={() => setVideoDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setVideoDragOver(false);
                    uploadVideoFiles(e.dataTransfer.files);
                  }}
                  onClick={() => {
                    if (!uploadingVideo) {
                      replaceVideoIndexRef.current = null;
                      videoInputRef.current?.click();
                    }
                  }}
                  className={`aspect-video rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    videoDragOver
                      ? 'border-wine bg-wine/5'
                      : 'border-taupe hover:border-wine/50 hover:bg-white/50'
                  } ${uploadingVideo ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {uploadingVideo ? (
                    <>
                      <Loader2 size={24} className="animate-spin text-wine mb-2" />
                      <p className="text-xs text-ink-subtle">Uploading video…</p>
                    </>
                  ) : (
                    <>
                      <Video size={28} className="text-gold mb-2" strokeWidth={1.25} />
                      <p className="text-sm text-wine font-medium">Add video</p>
                      <p className="text-xs text-ink-subtle mt-1">
                        {maxVideos - videos.length} remaining
                      </p>
                    </>
                  )}
                </div>
              </li>
            )}
          </ul>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const replaceIndex = replaceVideoIndexRef.current;
              replaceVideoIndexRef.current = null;
              uploadVideoFiles(e.target.files, replaceIndex);
              e.target.value = '';
            }}
          />
        </div>
      )}
    </div>
  );
}
