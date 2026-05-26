import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImageBlob } from '../../utils/cropImage';
import { useUiFeedback } from '../../context/UiFeedbackContext';

export default function ImageCropModal({ imageSrc, onClose, onComplete, aspect = 4 / 3 }) {
  const { toast } = useUiFeedback();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const apply = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      onComplete(blob);
    } catch (e) {
      toast.error(e.message || 'Could not crop image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-cream w-full max-w-lg border border-taupe shadow-xl">
        <div className="p-4 border-b border-taupe">
          <h2 className="font-display text-xl text-wine">Recortar imagem</h2>
          <p className="text-xs text-[#2d2020]/50 mt-1">Arraste para reposicionar · use o controle de zoom</p>
        </div>
        <div className="relative w-full h-72 bg-[#2d2020]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="px-4 py-3">
          <label className="text-xs uppercase tracking-widest text-[#2d2020]/50">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div className="flex gap-3 p-4 border-t border-taupe">
          <button type="button" className="btn-primary flex-1" disabled={busy} onClick={apply}>
            {busy ? 'Processando…' : 'Usar imagem'}
          </button>
          <button type="button" className="btn-ghost" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
