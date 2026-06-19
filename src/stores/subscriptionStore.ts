import { create } from 'zustand';

interface SubscriptionState {
  isPremium: boolean;
  setPremium: (status: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  setPremium: (status) => set({ isPremium: status }),
}));
