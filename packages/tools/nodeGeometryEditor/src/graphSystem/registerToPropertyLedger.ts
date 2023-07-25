import { PropertyLedger } from "shared-ui-components/nodeGraphSystem/propertyLedger";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { InputPropertyTabComponent } from "./properties/inputNodePropertyComponent";

export const RegisterToPropertyTabManagers = () => {
    PropertyLedger.DefaultControl = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["GeometryInputBlock"] = InputPropertyTabComponent;
};
