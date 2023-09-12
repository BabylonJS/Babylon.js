import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export const RegisterDebugSupport = (stateManager: StateManager) => {
    stateManager.isDebugConnectionAllowed = (a, b) => {
        return false; // No debug node in NME
    };
};
