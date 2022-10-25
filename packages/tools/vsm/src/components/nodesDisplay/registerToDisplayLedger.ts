import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { NodeTypes } from "../types";
import { ReadyActionBlockDisplayManager } from "./ReadyActionDisplayManager";
import { StartActionBlockDisplayManager } from "./StartActionDisplayManager";
import { StateBlockDisplayManager } from "./StateBlockDisplayManager";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls[NodeTypes.StateNode] = StateBlockDisplayManager;
    DisplayLedger.RegisteredControls[NodeTypes.StartActionNode] = StartActionBlockDisplayManager;
    DisplayLedger.RegisteredControls[NodeTypes.ReadyActionNode] = ReadyActionBlockDisplayManager;
};
