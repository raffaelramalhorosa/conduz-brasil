import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Image, Check, X, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProofUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepTitle: string;
  stepDescription: string;
  onConfirm: () => void;
}

export function ProofUploadModal({
  open,
  onOpenChange,
  stepTitle,
  stepDescription,
  onConfirm,
}: ProofUploadModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato não suportado', {
        description: 'Use imagens JPG, PNG, WebP ou PDF',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'O arquivo deve ter no máximo 10MB',
      });
      return;
    }

    setFileName(file.name);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleConfirm = async () => {
    if (!fileName) {
      toast.error('Selecione um arquivo');
      return;
    }

    setIsUploading(true);
    
    // Simulate upload delay for UX
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsUploading(false);
    onConfirm();
    handleClose();
    
    toast.success('Comprovante registrado!', {
      description: 'Sua etapa foi marcada como concluída',
    });
  };

  const handleClose = () => {
    setPreview(null);
    setFileName(null);
    onOpenChange(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: { files: dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {stepTitle}
          </DialogTitle>
          <DialogDescription>{stepDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center
              transition-all duration-200 cursor-pointer
              ${preview || fileName 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-3"
                >
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded-lg object-contain"
                  />
                  <p className="text-sm text-muted-foreground truncate max-w-full">
                    {fileName}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview(null);
                      setFileName(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </motion.div>
              ) : fileName ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-3"
                >
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground truncate max-w-full">
                    {fileName}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview(null);
                      setFileName(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Arraste ou clique para enviar
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG, WebP ou PDF (máx. 10MB)
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info Alert */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 dark:text-amber-200">
              O comprovante é apenas para seu acompanhamento pessoal. 
              Não armazenamos seus documentos em nossos servidores.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!fileName || isUploading}
            className="bg-gradient-to-r from-primary to-orange-500"
          >
            {isUploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <Upload className="h-4 w-4" />
                </motion.div>
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar Conclusão
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
