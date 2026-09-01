"use client";

import { create } from "zustand";

interface AuthState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

/** Client store for a loading flag used while signing in or out. */
export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  /** Sets whether an auth action is in progress. */
  setLoading: (loading) => set({ isLoading: loading }),
}));
