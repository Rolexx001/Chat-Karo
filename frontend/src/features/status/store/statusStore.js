import { create } from 'zustand';
import { statusService } from '../services/statusService.js';
import { toast } from 'sonner';

export const useStatusStore = create((set, get) => ({
  feed: [],
  myStatuses: [],
  activeStoryIndex: 0,
  activeUserStories: null,
  isViewerOpen: false,
  isLoading: false,

  fetchFeed: async () => {
    set({ isLoading: true });
    try {
      const feedData = await statusService.getFeed();
      const myData = await statusService.getMyStatuses();
      set({
        feed: feedData.feed || [],
        myStatuses: myData.statuses || [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch status feed:', err);
      set({ isLoading: false });
    }
  },

  openViewer: (userStories, startIndex = 0) => {
    set({
      activeUserStories: userStories,
      activeStoryIndex: startIndex,
      isViewerOpen: true,
    });
    // Mark status as viewed
    const currentStory = userStories[startIndex];
    if (currentStory?._id) {
      statusService.view(currentStory._id).catch(() => {});
    }
  },

  closeViewer: () => {
    set({ isViewerOpen: false, activeUserStories: null, activeStoryIndex: 0 });
  },

  createStatus: async (formData) => {
    try {
      const res = await statusService.create(formData);
      toast.success('Story posted successfully!');
      get().fetchFeed();
      return res;
    } catch (err) {
      console.error('Failed to create status:', err);
      toast.error(err.response?.data?.message || 'Failed to post story');
      throw err;
    }
  },

  deleteStatus: async (statusId) => {
    try {
      await statusService.delete(statusId);
      toast.success('Story deleted');
      set((state) => ({
        myStatuses: state.myStatuses.filter((s) => s._id !== statusId),
      }));
    } catch (err) {
      console.error('Failed to delete status:', err);
      toast.error('Failed to delete story');
    }
  },
}));
