import { createContext } from "react";

export interface AppContext {}

export const AppContext = createContext<AppContext | undefined>(undefined);
