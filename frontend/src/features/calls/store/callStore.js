import { create } from 'zustand';
import { callService } from '../services/callService.js';
import {
  initPeerConnection,
  startLocalMedia,
  addTracksToPeer,
  createOfferSignal,
  createAnswerSignal,
  setRemoteAnswer,
  addRemoteCandidate,
  closeMediaAndPeer,
} from '../services/webrtcService.js';
import { getSocket } from '../../../services/socket/socketClient.js';
import { toast } from 'sonner';

export const useCallStore = create((set, get) => ({
  callState: 'idle', // 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'
  callType: 'voice', // 'voice' | 'video'
  callId: null,
  peerUserId: null,
  peerName: 'User',
  peerAvatar: '',
  incomingSignalData: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  callDuration: 0,
  history: [],
  isLoadingHistory: false,

  fetchHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const data = await callService.getHistory();
      set({ history: data.history || [], isLoadingHistory: false });
    } catch (err) {
      console.error('Failed to fetch call history:', err);
      set({ isLoadingHistory: false });
    }
  },

  startCall: async (targetUserId, targetName, targetAvatar, type = 'voice') => {
    const socket = getSocket();
    if (!socket.connected) {
      toast.error('Socket disconnected. Cannot place call.');
      return;
    }

    set({
      callState: 'calling',
      callType: type,
      peerUserId: targetUserId,
      peerName: targetName,
      peerAvatar: targetAvatar,
      isMuted: false,
      isVideoOff: false,
    });

    try {
      const stream = await startLocalMedia(type);
      set({ localStream: stream });

      await initPeerConnection(
        (remoteStream) => {
          set({ remoteStream, callState: 'connected' });
        },
        (candidate) => {
          socket.emit('iceCandidate', {
            targetUserId,
            candidate,
            callId: get().callId,
          });
        }
      );

      addTracksToPeer(stream);
      const offerSignal = await createOfferSignal();

      socket.emit('callUser', {
        targetUserId,
        signalData: offerSignal,
        type,
      });
    } catch (err) {
      console.error('Error starting call:', err);
      toast.error(err.message || 'Microphone/Camera permission denied');
      get().endCall();
    }
  },

  handleIncomingCall: ({ from, signalData, type, callId }) => {
    set({
      callState: 'incoming',
      callType: type || 'voice',
      peerUserId: from,
      callId,
      incomingSignalData: signalData,
    });
  },

  acceptIncomingCall: async () => {
    const { peerUserId, incomingSignalData, callId, callType } = get();
    const socket = getSocket();

    try {
      set({ callState: 'connected' });
      const stream = await startLocalMedia(callType);
      set({ localStream: stream });

      await initPeerConnection(
        (remoteStream) => {
          set({ remoteStream });
        },
        (candidate) => {
          socket.emit('iceCandidate', {
            targetUserId: peerUserId,
            candidate,
            callId,
          });
        }
      );

      addTracksToPeer(stream);
      const answerSignal = await createAnswerSignal(incomingSignalData);

      socket.emit('acceptCall', {
        callerId: peerUserId,
        signalData: answerSignal,
        callId,
      });
    } catch (err) {
      console.error('Error accepting call:', err);
      toast.error('Failed to access camera/microphone');
      get().rejectIncomingCall();
    }
  },

  handleCallAccepted: async ({ signalData, callId }) => {
    set({ callId, callState: 'connected' });
    try {
      await setRemoteAnswer(signalData);
    } catch (err) {
      console.error('Error setting remote answer:', err);
    }
  },

  rejectIncomingCall: () => {
    const { peerUserId, callId } = get();
    const socket = getSocket();
    if (socket.connected && peerUserId && callId) {
      socket.emit('rejectCall', { callerId: peerUserId, callId });
    }
    get().cleanup();
  },

  endCall: () => {
    const { peerUserId, callId, callDuration } = get();
    const socket = getSocket();
    if (socket.connected && peerUserId && callId) {
      socket.emit('endCall', {
        targetUserId: peerUserId,
        callId,
        duration: callDuration,
      });
    }
    get().cleanup();
  },

  handleRemoteEnded: () => {
    toast.info('Call ended');
    get().cleanup();
  },

  handleRemoteBusy: () => {
    toast.warning('User is currently on another call');
    get().cleanup();
  },

  handleRemoteOffline: () => {
    toast.info('User is currently offline. A missed call alert was sent.');
    get().cleanup();
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // Toggle
      });
      set({ isMuted: !isMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff; // Toggle
      });
      set({ isVideoOff: !isVideoOff });
    }
  },

  setDuration: (duration) => set({ callDuration: duration }),

  cleanup: () => {
    closeMediaAndPeer();
    set({
      callState: 'idle',
      callId: null,
      peerUserId: null,
      incomingSignalData: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
    });
  },
}));
