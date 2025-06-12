import { PropertyLedger } from "shared-ui-components/nodeGraphSystem/propertyLedger";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { InputPropertyTabComponent } from "./properties/inputNodePropertyComponent";
import { TextureSourcePropertyTabComponent } from "./properties/textureSourceNodePropertyComponent";
import { DebugPropertyTabComponent } from "./properties/debugNodePropertyComponent";
import { TeleportOutPropertyTabComponent } from "./properties/teleportOutNodePropertyComponent";

export const RegisterToPropertyTabManagers = () => {
    PropertyLedger.DefaultControl = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["ParticleInputBlock"] = InputPropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleTextureSourceBlock"] = TextureSourcePropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleDebugBlock"] = DebugPropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleTeleportOutBlock"] = TeleportOutPropertyTabComponent;
};
