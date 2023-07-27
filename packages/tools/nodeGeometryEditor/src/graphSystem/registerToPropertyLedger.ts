import { PropertyLedger } from "shared-ui-components/nodeGraphSystem/propertyLedger";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { InputPropertyTabComponent } from "./properties/inputNodePropertyComponent";
import { MeshPropertyTabComponent } from "./properties/meshNodePropertyComponent";

export const RegisterToPropertyTabManagers = () => {
    PropertyLedger.DefaultControl = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["GeometryInputBlock"] = InputPropertyTabComponent;
    PropertyLedger.RegisteredControls["MeshBlock"] = MeshPropertyTabComponent;
};
