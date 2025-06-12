import type { StateManager } from "@babylonjs/shared-ui-components/nodeGraphSystem/stateManager";

export const RegisterElbowSupport = (stateManager: StateManager) => {
    stateManager.isElbowConnectionAllowed = () => {
        return false;
    };
};
