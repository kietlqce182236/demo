import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: { url: string; caption: string } | null;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  photo,
}) => {
  if (!isOpen || !photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between p-3.5 border-b border-slate-100">
          <span className="font-bold text-sm text-slate-800">{photo.caption}</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 bg-slate-900 flex items-center justify-center">
          <img
            src={photo.url}
            alt={photo.caption}
            className="max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
