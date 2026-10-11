import { create } from 'zustand';
import type { ApiResponse } from '@/types';

interface ExecutionState {
  responseEndpointId: string | null;
  response: ApiResponse | null;
  previousResponse: ApiResponse | null;
  error: string | null;
  warning: string | null;
  isExecuting: boolean;
  setResponse: (r: ApiResponse | null, endpointId?: string) => void;
  setError: (e: string | null) => void;
  setWarning: (warning: string | null) => void;
  setIsExecuting: (v: boolean) => void;
  clearResponse: () => void;
}

export const useExecutionStore = create<ExecutionState>()((set) => ({
  responseEndpointId: null,
  response: null,
  previousResponse: null,
  error: null,
  warning: null,
  isExecuting: false,
  setResponse: (r, endpointId) =>
    set((state) => ({
      previousResponse: state.responseEndpointId === endpointId ? state.response : null,
      responseEndpointId: endpointId || null,
      response: r,
      error: null,
      warning: null,
      isExecuting: false,
    })),
  setError: (e) => set({ error: e, response: null, isExecuting: false }),
  setWarning: (warning) => set({ warning }),
  setIsExecuting: (v) => set({ isExecuting: v }),
  clearResponse: () => set({ response: null, responseEndpointId: null, previousResponse: null, error: null, warning: null, isExecuting: false }),
}));
