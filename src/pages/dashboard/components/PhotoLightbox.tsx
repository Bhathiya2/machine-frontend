import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { RepairPhoto } from '../types'
import { Badge } from './DashboardUI'

export function PhotoLightbox({ photos, startIndex, onClose }: { photos: RepairPhoto[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const photo = photos[idx];
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"><X size={16} /></button>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <img src={photo.url} alt={photo.caption} className="w-full max-h-[70vh] object-cover bg-gray-800" />
          <div className="px-5 py-3 flex items-center gap-3">
            <Badge className={photo.type === "before" ? "bg-red-900/60 text-red-300" : "bg-green-900/60 text-green-300"}>
              {photo.type === "before" ? "Before" : "After"}
            </Badge>
            <p className="text-sm text-gray-300 flex-1">{photo.caption}</p>
            <span className="text-xs text-gray-500 font-mono shrink-0">{idx + 1} / {photos.length}</span>
          </div>
        </div>
        {photos.length > 1 && (
          <>
            <button onClick={() => setIdx((idx - 1 + photos.length) % photos.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => setIdx((idx + 1) % photos.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><ChevronRight size={20} /></button>
          </>
        )}
      </div>
    </div>
  );
}

