import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { DebugDisplayManager } from "./display/debugDisplayManager";
import { FlowGraphDefaultDisplayManager } from "./display/flowGraphDefaultDisplayManager";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { GetAllBlockNames } from "../allBlockNames";

export const RegisterToDisplayManagers = () => {
    // Block-specific overrides first
    DisplayLedger.RegisteredControls[FlowGraphBlockNames.DebugBlock] = DebugDisplayManager;

    // Register the default type-colored display manager for every known block
    // that doesn't already have a specific one.
    for (const name of GetAllBlockNames()) {
        if (!DisplayLedger.RegisteredControls[name]) {
            DisplayLedger.RegisteredControls[name] = FlowGraphDefaultDisplayManager;
        }
    }
};
