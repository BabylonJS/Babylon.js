import { createContext, useContext } from "react";

type TeachingMomentsContext = {
    /**
     * When true, all teaching moments are suppressed regardless of their individual state.
     */
    disabled: boolean;
};

export const TeachingMomentsContext = createContext<TeachingMomentsContext>({ disabled: false });

/**
 * Returns the teaching moments context provided by the surrounding modular tool framework.
 * @returns The current teaching moments context.
 */
export function useTeachingMomentsContext(): TeachingMomentsContext {
    return useContext(TeachingMomentsContext);
}
