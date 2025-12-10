import { useState, useRef, DragEvent } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadAreaProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  value: File | File[] | null;
  onChange: (files: File | File[] | null) => void;
  error?: string;
}

export function FileUploadArea({
  label,
  accept = 'image/*,.pdf',
  multiple = false,
  maxFiles = 5,
  value,
  onChange,
  error,
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const files = Array.isArray(value) ? value : value ? [value] : [];

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = (newFiles: File[]) => {
    if (multiple) {
      const combined = [...files, ...newFiles].slice(0, maxFiles);
      onChange(combined);
    } else {
      onChange(newFiles[0] || null);
    }
  };

  const removeFile = (index: number) => {
    if (multiple) {
      const updated = files.filter((_, i) => i !== index);
      onChange(updated.length > 0 ? updated : null);
    } else {
      onChange(null);
    }
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-border hover:border-primary/50 hover:bg-muted/50',
          error && 'border-destructive'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          className="hidden"
        />
        
        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-foreground font-medium">
          Arraste e solte ou clique para enviar
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {accept.includes('pdf') ? 'PDF, JPG, PNG' : 'JPG, PNG'} • Máx. 10MB
          {multiple && ` • Até ${maxFiles} arquivos`}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {files.map((file, index) => {
            const preview = getFilePreview(file);
            return (
              <div
                key={index}
                className="relative group bg-muted rounded-lg overflow-hidden"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt={file.name}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground truncate px-2 py-1">
                  {file.name}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
