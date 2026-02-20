
import { create } from 'zustand';

export interface LecturePage {
    filename: string;
    title: string;
    content: string;
    safeContent: string;
}

interface LectureStore {
    pages: LecturePage[];
    setPages: (pages: LecturePage[]) => void;
}

export const useLectureStore = create<LectureStore>((set) => ({
    pages: [],
    setPages: (pages) => set({ pages }),
}));
