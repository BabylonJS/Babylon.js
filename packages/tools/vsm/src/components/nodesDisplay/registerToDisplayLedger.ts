import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { ColorBlockDisplayManager } from "./ColorBlockDisplayManager";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["ColorBlock"] = ColorBlockDisplayManager;
};
