import { callService } from './callService.js';
import { getSocket } from '../../../services/socket/socketClient.js';

let peerConnection = null;
let localStream = null;

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
];

export const getIceServersConfig = async () => {
  try {
    const data = await callService.getIceServers();
    return data.iceServers || DEFAULT_ICE_SERVERS;
  } catch (err) {
    console.warn('Using fallback STUN servers:', err);
    return DEFAULT_ICE_SERVERS;
  }
};

export const initPeerConnection = async (onRemoteStream, onIceCandidate) => {
  const iceServers = await getIceServersConfig();

  peerConnection = new RTCPeerConnection({ iceServers });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  };

  peerConnection.ontrack = (event) => {
    if (event.streams && event.streams[0] && onRemoteStream) {
      onRemoteStream(event.streams[0]);
    }
  };

  return peerConnection;
};

export const startLocalMedia = async (type = 'voice') => {
  const constraints = {
    audio: true,
    video: type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false,
  };

  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  return localStream;
};

export const addTracksToPeer = (stream) => {
  if (peerConnection && stream) {
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });
  }
};

export const createOfferSignal = async () => {
  if (!peerConnection) throw new Error('PeerConnection not initialized');
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

export const createAnswerSignal = async (remoteOffer) => {
  if (!peerConnection) throw new Error('PeerConnection not initialized');
  await peerConnection.setRemoteDescription(new RTCSessionDescription(remoteOffer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
};

export const setRemoteAnswer = async (remoteAnswer) => {
  if (peerConnection && peerConnection.signalingState !== 'stable') {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(remoteAnswer));
  }
};

export const addRemoteCandidate = async (candidate) => {
  if (peerConnection && candidate) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('Error adding ice candidate:', e);
    }
  }
};

export const closeMediaAndPeer = () => {
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
};
