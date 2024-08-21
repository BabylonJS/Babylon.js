import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export const RegisterDebugSupport = (stateManager: StateManager) => {
    stateManager.isDebugConnectionAllowed = (_a, _b) => {
        return false;
    };
};
