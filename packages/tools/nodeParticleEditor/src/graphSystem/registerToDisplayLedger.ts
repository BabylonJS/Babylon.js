import { InputDisplayManager } from "./display/inputDisplayManager";
import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["ParticleInputBlock"] = InputDisplayManager;
};
