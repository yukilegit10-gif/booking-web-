'use client';

import { useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/image-compression';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function ImageUploader({ files, onChange, maxFiles = 4 }: Props) {
  const [compressing, setCompressing] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    setCompressing(true);
    try {
      const remainingSlots = maxFiles - files.length;
      const toProcess = selected.slice(0, remainingSlots);

      const compressedList: File[] = [];
      for (const f of toProcess) {
        const compressed = await compressImage(f);
        compressedList.push(compressed);
      }

      onChange([...files, ...compressedList]);
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {files.map((file, idx) => {
          const previewUrl = URL.createObjectURL(file);
          const sizeKb = Math.round(file.size / 1024);

          return (
            <div
              key={idx}
              className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 group shadow-xs"
            >
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-1 right-1 bg-slate-900/70 hover:bg-red-600 text-white rounded-full p-1 transition cursor-pointer"
                title="Xóa ảnh"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded font-mono">
                {sizeKb}KB
              </span>
            </div>
          );
        })}

        {files.length < maxFiles && (
          <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0F3D6E] bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition text-slate-500 hover:text-[#0F3D6E]">
            {compressing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                <span className="text-[10px] font-medium">Đang nén...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span className="text-[11px] font-medium">Thêm ảnh</span>
                <span className="text-[9px] text-slate-400">Tối đa {maxFiles}</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={compressing}
              onChange={handleFiles}
              className="hidden"
            />
          </label>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-1.5">
        Ảnh được tự động nén WebP dưới 150KB trên trình duyệt giúp tải nhanh và tiết kiệm dung lượng.
      </p>
    </div>
  );
}
