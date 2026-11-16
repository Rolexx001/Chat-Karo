import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAiStore } from '../store/aiStore.js';
import Modal from '../../../components/ui/Modal.jsx';
import Button from '../../../components/ui/Button.jsx';
import { formatFileSize } from '../../../utils/formatFileSize.js';

export const PdfUploadModal = ({ isOpen, onClose, chatId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { indexPdf, isIndexingPdf } = useAiStore();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setIsSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !chatId) return;
    try {
      await indexPdf(chatId, selectedFile);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
        setIsSuccess(false);
      }, 1500);
    } catch (e) {
      // Error handled in store
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload PDF for Knowledge RAG"
      subtitle="Gemini AI will index this PDF to answer questions accurately inside this chat"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <label
          htmlFor="pdf-upload"
          className="border-2 border-dashed border-white/10 hover:border-[#7C3AED]/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#0B0E14]/50 group"
        >
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 text-[#A78BFA] group-hover:scale-105 transition-transform flex items-center justify-center mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>
          <span className="text-sm font-semibold text-white">Click or drag PDF document here</span>
          <span className="text-xs text-[#64748B] mt-1">Maximum file size: 50MB</span>
        </label>

        {selectedFile && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-6 h-6 text-[#A78BFA] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-[#94A3B8]">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>

            {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          </div>
        )}

        <Button
          onClick={handleUpload}
          variant="primary"
          className="w-full font-semibold"
          disabled={!selectedFile || isIndexingPdf || isSuccess}
          isLoading={isIndexingPdf}
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          {isIndexingPdf ? 'Indexing for RAG...' : isSuccess ? 'Document Indexed!' : 'Index Document'}
        </Button>
      </div>
    </Modal>
  );
};

export default PdfUploadModal;
