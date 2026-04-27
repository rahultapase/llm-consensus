import { create } from "zustand";

interface UserState {
  username: string | null;
  avatarUrl: string | null;
  email: string | null;
  isProfileLoaded: boolean;
  setUser: (user: { username: string | null; avatarUrl: string | null; email: string | null }) => void;
  setProfileLoaded: () => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()((set) => ({
  username: null,
  avatarUrl: null,
  email: null,
  isProfileLoaded: false,
  setUser: (user) => set({ ...user, isProfileLoaded: true }),
  setProfileLoaded: () => set({ isProfileLoaded: true }),
  clearUser: () => set({ username: null, avatarUrl: null, email: null, isProfileLoaded: false }),
}));

export const useUsername = () => useUserStore((s) => s.username);
export const useAvatarUrl = () => useUserStore((s) => s.avatarUrl);
