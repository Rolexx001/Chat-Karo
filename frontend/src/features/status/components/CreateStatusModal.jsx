import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, Video, X, Loader2 } from 'lucide-react';
import { useStatusStore } from '../store/statusStore.js';
import Modal from '../../../components/ui/Modal.jsx';
import Button from '../../../components/ui/Button.jsx';
import { toast } from 'sonner';

export const CreateStatusModal = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createStatus = useStatusStore((s) => s.createStatus);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleClose = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setCaption('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select an image or video');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }
      await createStatus(formData);
      handleClose();
    } catch (e) {
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create 24-Hour Story"
      subtitle="Share an update with your contacts that disappears in 24 hours"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!previewUrl ? (
          <label
            htmlFor="status-media"
            className="border-2 border-dashed border-white/10 hover:border-[#7C3AED]/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#0B0E14]/50 group"
          >
            <input
              id="status-media"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 text-[#A78BFA] group-hover:scale-105 transition-transform flex items-center justify-center mb-2">
              <UploadCloud className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-white">Choose photo or video</span>
            <span className="text-[10px] text-[#64748B] mt-1">JPEG, PNG, MP4, MOV (max 50MB)</span>
          </label>
        ) : (
          <div className="relative rounded-2xl overflow-hidden max-h-72 bg-black flex items-center justify-center">
            {file?.type?.startsWith('video/') ? (
              <video src={previewUrl} controls className="max-h-72 w-full object-contain" />
            ) : (
              <img src={previewUrl} alt="Preview" className="max-h-72 w-full object-contain" />
            )}
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreviewUrl('');
              }}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
            Caption (Optional)
          </label>
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full font-semibold"
          disabled={!file || isSubmitting}
          isLoading={isSubmitting}
        >
          Post Story Update
        </Button>
      </form>
    </Modal>
  );
};

export default CreateStatusModal;
