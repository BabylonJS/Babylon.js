import { PropertyLedger } from "shared-ui-components/nodeGraphSystem/propertyLedger";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { InputPropertyTabComponent } from "./properties/inputNodePropertyComponent";
import { MeshPropertyTabComponent } from "./properties/meshNodePropertyComponent";
import { OutputPropertyTabComponent } from "./properties/outputNodePropertyComponent";
import { DebugPropertyTabComponent } from "./properties/debugNodePropertyComponent";
import { TeleportOutPropertyTabComponent } from "./properties/TeleportOutNodePropertyComponent";

export const RegisterToPropertyTabManagers = () => {
    PropertyLedger.DefaultControl = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["GeometryInputBlock"] = InputPropertyTabComponent;
    PropertyLedger.RegisteredControls["MeshBlock"] = MeshPropertyTabComponent;
    PropertyLedger.RegisteredControls["GeometryOutputBlock"] = OutputPropertyTabComponent;
    PropertyLedger.RegisteredControls["DebugBlock"] = DebugPropertyTabComponent;
    PropertyLedger.RegisteredControls["TeleportOutBlock"] = TeleportOutPropertyTabComponent;
};
