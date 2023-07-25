import { InputDisplayManager } from "./display/inputDisplayManager";
import { OutputDisplayManager } from "./display/outputDisplayManager";
import { ElbowDisplayManager } from "./display/elbowDisplayManager";
import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["GeometryInputBlock"] = InputDisplayManager;
    DisplayLedger.RegisteredControls["GeometryOutputBlock"] = OutputDisplayManager;
    DisplayLedger.RegisteredControls["ElbowBlock"] = ElbowDisplayManager;
};
