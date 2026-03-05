import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { DebugDisplayManager } from "./display/debugDisplayManager";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls[FlowGraphBlockNames.DebugBlock] = DebugDisplayManager;
};
