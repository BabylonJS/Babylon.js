import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export const RegisterElbowSupport = (stateManager: StateManager) => {
    stateManager.isElbowConnectionAllowed = () => {
        return false;
    };
};
