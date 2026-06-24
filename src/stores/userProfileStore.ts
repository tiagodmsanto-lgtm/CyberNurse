import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfileData {
  // 1. Identificação
  name: string;
  email: string;
  age: string; // ou Data de Nascimento
  biologicalGender: string;

  // 2. Antropometria
  weight: string;
  height: string;
  activityLevel: string;
  healthGoals: string;

  // 3. Clínico
  bloodType: string;
  chronicConditions: string;
  medicationAllergies: string;
  foodIntolerances: string;
  allergies: string; // Legacy / Other allergies
}

interface UserProfileState {
  data: UserProfileData;
  setPersonalData: (data: Partial<UserProfileData>) => void;
  clearPersonalData: () => void;
}

const defaultData: UserProfileData = {
  name: '',
  email: '',
  age: '',
  biologicalGender: '',
  weight: '',
  height: '',
  activityLevel: '',
  healthGoals: '',
  bloodType: '',
  chronicConditions: '',
  medicationAllergies: '',
  foodIntolerances: '',
  allergies: '',
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
