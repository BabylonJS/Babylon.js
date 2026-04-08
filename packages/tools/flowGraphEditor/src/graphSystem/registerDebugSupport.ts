import { type StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { type ConnectionPointPortData } from "./connectionPointPortData";

export const RegisterDebugSupport = (stateManager: StateManager) => {
    stateManager.isDebugConnectionAllowed = (a, b) => {
        const portA = a.portData as ConnectionPointPortData;
        const portB = b.portData as ConnectionPointPortData;
        // Only allow debug blocks on data connections, not signal connections
        if (portA.connectionKind === "signal" || portB.connectionKind === "signal") {
            return false;
        }
        return true;
    };
};
