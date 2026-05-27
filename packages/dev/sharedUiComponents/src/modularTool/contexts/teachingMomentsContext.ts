import { createContext, useContext } from "react";

type TeachingMomentsContext = {
    /**
     * When true, all teaching moments are suppressed regardless of any caller-supplied
     * `suppress` argument and regardless of whether the user has previously dismissed
     * the teaching moment.
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
