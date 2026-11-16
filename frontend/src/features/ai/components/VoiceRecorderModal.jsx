import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { aiService } from '../services/aiService.js';
import { getFullMediaUrl } from '../../../utils/constants.js';
import Modal from '../../../components/ui/Modal.jsx';
import Button from '../../../components/ui/Button.jsx';
import { toast } from 'sonner';

export const VoiceRecorderModal = ({ isOpen, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null); // { prompt, replyText, audioUrl }
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach((t) => t.stop());
        await processVoice(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setResult(null);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      toast.error('Microphone permission required for voice notes');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processVoice = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const data = await aiService.voiceAssistant(audioBlob);
      setResult(data);
    } catch (err) {
      console.error('Voice processing failed:', err);
      toast.error(err.response?.data?.message || 'Voice assistant failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    stopRecording();
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    setIsPlaying(false);
    setResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Gemini Voice Assistant"
      subtitle="Speak naturally — Gemini transcribes audio and answers with intelligence"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center space-y-6 py-2">
        {/* Record Animation / Waveform Indicator */}
        <div className="relative">
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-[#F43F5E]/30 animate-ping" />
          )}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-[#F43F5E] text-white shadow-glow-rose hover:scale-105'
                : 'bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] text-white shadow-glow-primary hover:scale-105'
            }`}
          >
            {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        <div>
          {isRecording ? (
            <p className="text-sm font-semibold text-[#F43F5E] animate-pulse">
              Recording... {recordingSeconds}s (Click to send)
            </p>
          ) : isProcessing ? (
            <div className="flex items-center gap-2 text-sm text-[#06B6D4] font-medium">
              <Loader2 className="w-4 h-4 animate-spin" /> Transcribing with Gemini & reasoning...
            </div>
          ) : result ? (
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              Response generated
            </p>
          ) : (
            <p className="text-xs text-[#94A3B8]">Click the microphone to start speaking</p>
          )}
        </div>

        {/* Results Area */}
        {result && (
          <div className="w-full text-left space-y-3.5 bg-[#0B0E14] border border-white/10 rounded-2xl p-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1">
                You Said
              </span>
              <p className="text-xs text-[#F8FAFC] italic">"{result.prompt}"</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#A78BFA] tracking-wider block mb-1">
                Gemini Assistant Answer
              </span>
              <p className="text-xs text-[#E2E8F0] leading-relaxed">{result.replyText}</p>
            </div>

            {/* Audio Response Player */}
            {result.audioUrl && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <audio
                  ref={audioPlayerRef}
                  src={getFullMediaUrl(result.audioUrl)}
                  onEnded={() => setIsPlaying(false)}
                />
                <Button
                  onClick={togglePlayback}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  {isPlaying ? <Pause className="w-4 h-4 mr-1 text-[#F43F5E]" /> : <Volume2 className="w-4 h-4 mr-1 text-[#06B6D4]" />}
                  {isPlaying ? 'Pause Audio Note' : 'Listen to Voice Response'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VoiceRecorderModal;
