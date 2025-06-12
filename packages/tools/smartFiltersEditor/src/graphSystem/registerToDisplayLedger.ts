import { OutputBlockName } from "../configuration/constants.js";
import type { GlobalState } from "../globalState.js";
import { InputDisplayManager } from "./display/inputDisplayManager.js";
import { OutputDisplayManager } from "./display/outputDisplayManager.js";
import { DisplayLedger } from "@babylonjs/shared-ui-components/nodeGraphSystem/displayLedger.js";

export const RegisterToDisplayManagers = (globalState: GlobalState) => {
    DisplayLedger.RegisteredControls["InputBlock"] =
        globalState.blockEditorRegistration?.inputDisplayManager || InputDisplayManager;
    DisplayLedger.RegisteredControls[OutputBlockName] = OutputDisplayManager;
};
