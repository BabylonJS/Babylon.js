import { PropertyLedger } from "shared-ui-components/nodeGraphSystem/propertyLedger";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { InputPropertyTabComponent } from "./properties/inputNodePropertyComponent";
import { SystemPropertyTabComponent } from "./properties/systemNodePropertyComponent";
import { TextureSourcePropertyTabComponent } from "./properties/textureSourceNodePropertyComponent";

export const RegisterToPropertyTabManagers = () => {
    PropertyLedger.DefaultControl = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["ParticleInputBlock"] = InputPropertyTabComponent;
    PropertyLedger.RegisteredControls["SystemBlock"] = SystemPropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleTextureSourceBlock"] = TextureSourcePropertyTabComponent;
};
