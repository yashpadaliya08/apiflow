import { create } from 'zustand';
import type { ApiResponse } from '@/types';

interface ExecutionState {
  response: ApiResponse | null;
  previousResponse: ApiResponse | null;
  error: string | null;
  isExecuting: boolean;
  setResponse: (r: ApiResponse | null) => void;
  setError: (e: string | null) => void;
  setIsExecuting: (v: boolean) => void;
  clearResponse: () => void;
}

export const useExecutionStore = create<ExecutionState>()((set) => ({
  response: null,
  previousResponse: null,
  error: null,
  isExecuting: false,
  setResponse: (r) =>
    set((state) => ({
      previousResponse: state.response,
      response: r,
      error: null,
      isExecuting: false,
    })),
  setError: (e) => set({ error: e, response: null, isExecuting: false }),
  setIsExecuting: (v) => set({ isExecuting: v }),
  clearResponse: () => set({ response: null, previousResponse: null, error: null, isExecuting: false }),
}));
