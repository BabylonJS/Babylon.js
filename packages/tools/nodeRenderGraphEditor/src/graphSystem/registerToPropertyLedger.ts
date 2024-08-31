import { PropertyLedger } from "shared-ui-components/nodeGraphSystem/propertyLedger";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { InputPropertyTabComponent } from "./properties/inputNodePropertyComponent";
import { TeleportOutPropertyTabComponent } from "./properties/teleportOutNodePropertyComponent";

export const RegisterToPropertyTabManagers = () => {
    PropertyLedger.DefaultControl = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["NodeRenderGraphInputBlock"] = InputPropertyTabComponent;
    PropertyLedger.RegisteredControls["NodeRenderGraphTeleportOutBlock"] = TeleportOutPropertyTabComponent;
};
