import { create } from "zustand";

type SettingsStore = {
  keepScreenAwake: boolean;
  hideCompleted: boolean;
  isDarkMode: boolean;
  setKeepScreenAwake: (val: boolean) => void;
  setHideCompleted: (val: boolean) => void;
  setIsDarkMode: (val: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  keepScreenAwake: true,
  hideCompleted: false,
  isDarkMode: false,
  setKeepScreenAwake: (val) => set({ keepScreenAwake: val }),
  setHideCompleted: (val) => set({ hideCompleted: val }),
  setIsDarkMode: (val) => set({ isDarkMode: val }),
}));
