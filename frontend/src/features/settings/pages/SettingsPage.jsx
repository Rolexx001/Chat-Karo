import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Laptop,
  Ban,
  Camera,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore.js';
import { settingsService } from '../services/settingsService.js';
import { mediaService } from '../../media/services/mediaService.js';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile'); // profile, devices, blocked

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Devices state
  const [sessions, setSessions] = useState([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);

  useEffect(() => {
    if (activeTab === 'devices') {
      fetchSessions();
    } else if (activeTab === 'blocked') {
      fetchBlockedUsers();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    setIsLoadingDevices(true);
    try {
      const data = await settingsService.getDevices();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const fetchBlockedUsers = async () => {
    setIsLoadingBlocked(true);
    try {
      const data = await settingsService.getBlockedUsers();
      setBlockedUsers(data.blockedUsers || []);
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const data = await mediaService.uploadAvatar(file);
      if (data.avatarUrl) {
        setAvatar(data.avatarUrl);
        if (data.user) setUser(data.user);
        toast.success('Avatar updated successfully!');
      }
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const data = await settingsService.updateProfile({ name, bio, avatar });
      if (data.user) {
        setUser(data.user);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!sessionId || sessionId === 'undefined') {
      toast.error('Invalid session identifier');
      return;
    }
    try {
      await settingsService.revokeDevice(sessionId);
      toast.success('Session revoked');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to revoke session');
    }
  };

  const handleRevokeAllOther = async () => {
    try {
      await settingsService.revokeOtherDevices();
      toast.success('All other sessions revoked');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to revoke sessions');
    }
  };

  const handleUnblock = async (targetUserId) => {
    try {
      await settingsService.unblockUser(targetUserId);
      toast.success('User unblocked');
      fetchBlockedUsers();
    } catch (err) {
      toast.error('Failed to unblock user');
    }
  };

  return (
    <div className="flex-1 h-full bg-[#0B0E14] flex flex-col overflow-y-auto select-none">
      {/* Top Header */}
      <div className="p-6 md:p-8 border-b border-white/5 bg-[#0F131C] shrink-0">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Account & Preferences</h2>
          <p className="text-xs text-[#94A3B8]">Manage your profile, active devices, and security controls</p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'devices', label: 'Active Devices', icon: Laptop },
              { id: 'blocked', label: 'Blocked Users', icon: Ban },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === id
                    ? 'bg-[#7C3AED] text-white shadow-glow-primary'
                    : 'text-[#64748B] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full p-6 md:p-8">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-6">
            {/* Avatar Uploader */}
            <div className="flex items-center gap-5 p-5 rounded-2xl bg-[#131720] border border-white/5">
              <div className="relative group">
                <Avatar src={avatar} name={name} size="xl" />
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">Profile Photo</h4>
                <p className="text-xs text-[#94A3B8] mt-0.5">Click photo to upload a new avatar (max 50MB)</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={user?.email || ''}
                disabled
                className="opacity-60 cursor-not-allowed"
              />

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1.5">
                  About / Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell contacts a little about yourself..."
                  className="w-full bg-[#131720] border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="font-semibold shadow-glow-primary"
              isLoading={isUpdatingProfile}
            >
              Save Profile Changes
            </Button>
          </form>
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Device Sessions</h3>
                <p className="text-xs text-[#94A3B8]">Logged in browsers and devices with active sessions</p>
              </div>

              {sessions.length > 1 && (
                <Button
                  onClick={handleRevokeAllOther}
                  variant="danger"
                  size="sm"
                >
                  Log out all other devices
                </Button>
              )}
            </div>

            {isLoadingDevices ? (
              <div className="flex items-center justify-center py-16 text-[#7C3AED]">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const sessionId = session._id || session.id;
                  return (
                    <div
                      key={sessionId}
                      className="p-4 rounded-2xl bg-[#131720] border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#7C3AED]">
                          <Laptop className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate max-w-xs">
                              {session.deviceInfo || 'Web Client'}
                            </h4>
                            {session.isCurrent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                                This Device
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            IP: {session.ipAddress || '127.0.0.1'} • Last active:{' '}
                            {new Date(session.lastActive).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {!session.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(sessionId)}
                          className="text-xs text-[#F43F5E] hover:text-[#E11D48] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#F43F5E]/10 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Blocked Users Tab */}
        {activeTab === 'blocked' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Blocked Contacts</h3>
              <p className="text-xs text-[#94A3B8]">Blocked users cannot message or call you on Chat Karo</p>
            </div>

            {isLoadingBlocked ? (
              <div className="flex items-center justify-center py-16 text-[#7C3AED]">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
            ) : blockedUsers.length === 0 ? (
              <div className="text-center py-16 text-xs text-[#64748B]">
                No blocked users.
              </div>
            ) : (
              <div className="space-y-2.5">
                {blockedUsers.map((bUser) => (
                  <div
                    key={bUser._id}
                    className="p-3.5 rounded-2xl bg-[#131720] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={bUser.avatar} name={bUser.name} size="sm" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{bUser.name}</h4>
                        <p className="text-[11px] text-[#94A3B8]">{bUser.email}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleUnblock(bUser._id)}
                      variant="secondary"
                      size="sm"
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
