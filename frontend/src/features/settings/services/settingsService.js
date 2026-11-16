import { authService } from '../../auth/services/authService.js';

export const settingsService = {
  getProfile: authService.getProfile,
  updateProfile: authService.updateProfile,
  getDevices: authService.getSessions,
  revokeDevice: authService.revokeSession,
  revokeOtherDevices: authService.revokeAllOtherSessions,
  getBlockedUsers: authService.getBlockedUsers,
  unblockUser: authService.unblockUser,
};
