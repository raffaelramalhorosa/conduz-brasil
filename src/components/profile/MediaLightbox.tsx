import { useEffect, useCallback } from "react";
import { X, Play, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  video_type: string;
  media_type: string;
}

interface MediaLightboxProps {
  media: MediaItem | null;
  onClose: () => void;
}

const MediaLightbox = ({ media, onClose }: MediaLightboxProps) => {
  // Handle ESC key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (media) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [media, handleKeyDown]);

  if (!media) return null;

  const isImage = media.media_type === "image";
  const isUpload = media.video_type === "upload";
  const youtubeMatch = media.video_url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  const vimeoMatch = media.video_url.match(/vimeo\.com\/(\d+)/);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {media && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleBackdropClick}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Content container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-5xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media display */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              {isImage ? (
                // High-res image with object-contain
                <div className="flex items-center justify-center max-h-[80vh]">
                  <img
                    src={media.video_url}
                    alt={media.title}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                </div>
              ) : isUpload ? (
                // Native video player for uploaded files
                <div className="aspect-video">
                  <video
                    src={media.video_url}
                    controls
                    autoPlay
                    className="w-full h-full"
                    poster={media.thumbnail_url || undefined}
                  >
                    Seu navegador não suporta vídeos HTML5.
                  </video>
                </div>
              ) : youtubeMatch ? (
                // YouTube embed
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`}
                    title={media.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : vimeoMatch ? (
                // Vimeo embed
                <div className="aspect-video">
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`}
                    title={media.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                // Fallback: link to external media
                <div className="aspect-video flex items-center justify-center bg-muted">
                  <a
                    href={media.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-12 h-12" />
                    <span className="text-lg">Abrir mídia em nova aba</span>
                  </a>
                </div>
              )}
            </div>

            {/* Title and description caption */}
            <div className="mt-4 text-center">
              <h3 className="text-white text-xl font-semibold">{media.title}</h3>
              {media.description && (
                <p className="text-white/70 text-sm mt-1">{media.description}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MediaLightbox;
