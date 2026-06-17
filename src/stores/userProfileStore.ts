import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfileData {
  age: string;
  weight: string;
  height: string;
  bloodType: string;
  allergies: string;
  chronicConditions: string;
}

interface UserProfileState {
  data: UserProfileData;
  setPersonalData: (data: Partial<UserProfileData>) => void;
  clearPersonalData: () => void;
}

const defaultData: UserProfileData = {
  age: '',
  weight: '',
  height: '',
  bloodType: '',
  allergies: '',
  chronicConditions: '',
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
      data: defaultData,
      setPersonalData: (newData) =>
        set((state) => ({
          data: { ...state.data, ...newData },
        })),
      clearPersonalData: () => set({ data: defaultData }),
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
