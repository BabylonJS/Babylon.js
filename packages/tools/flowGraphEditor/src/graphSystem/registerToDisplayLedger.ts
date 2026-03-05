import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";

export const RegisterToDisplayManagers = () => {
    // Flow graph blocks don't need custom display managers initially.
    // All blocks will use the default display.
    // Register custom display managers here as needed, e.g.:
    // DisplayLedger.RegisteredControls["FlowGraphSomeBlock"] = SomeDisplayManager;
    void DisplayLedger; // reference to avoid unused import warning
};
