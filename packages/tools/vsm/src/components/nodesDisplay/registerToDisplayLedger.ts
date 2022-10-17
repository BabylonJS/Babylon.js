import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { NodeTypes } from "../types";
import { ReadyActionBlockDisplayManager } from "./ReadyActionDisplayManager";
import { StartActionBlockDisplayManager } from "./StartActionDisplayManager";
import { StateBlockDisplayManager } from "./StateBlockDisplayManager";
import { ValueBlockDisplayManager } from "./ValueBlockDisplayManager";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["ColorBlock"] = StateBlockDisplayManager;
    DisplayLedger.RegisteredControls[NodeTypes.StartActionNode] = StartActionBlockDisplayManager;
    DisplayLedger.RegisteredControls[NodeTypes.ReadyActionNode] = ReadyActionBlockDisplayManager;
    DisplayLedger.RegisteredControls[NodeTypes.ValueNode] = ValueBlockDisplayManager;
};
