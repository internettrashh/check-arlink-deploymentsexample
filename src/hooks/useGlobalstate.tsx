// src/hooks/useGlobalState.ts
import { TDeployment } from '@/types/types';
import { create } from 'zustand';

export type Store = {
    managerProcess: string;
    deployments: TDeployment[];
    setManagerProcess: (managerProcess: string) => void;
    setDeployments: (deployments: TDeployment[]) => void;
}

export const useGlobalState = create<Store>()((set) => ({
    managerProcess: "",
    deployments: [],
    setManagerProcess: (managerProcess: string) => set({ managerProcess }),
    setDeployments: (deployments: TDeployment[]) => set({ deployments })
}));