import { PropertyLedger } from "shared-ui-components/nodeGraphSystem/propertyLedger";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { InputPropertyTabComponent } from "./properties/inputNodePropertyComponent";
import { TextureSourcePropertyTabComponent } from "./properties/textureSourceNodePropertyComponent";
import { DebugPropertyTabComponent } from "./properties/debugNodePropertyComponent";
import { TeleportOutPropertyTabComponent } from "./properties/teleportOutNodePropertyComponent";
import { MeshShapePropertyTabComponent } from "./properties/meshShapeNodePropertyComponent";

export const RegisterToPropertyTabManagers = () => {
    PropertyLedger.DefaultControl = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["ParticleInputBlock"] = InputPropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleTextureSourceBlock"] = TextureSourcePropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleDebugBlock"] = DebugPropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleTeleportOutBlock"] = TeleportOutPropertyTabComponent;
    PropertyLedger.RegisteredControls["MeshShapeBlock"] = MeshShapePropertyTabComponent;

    // SPS Blocks - use default GenericPropertyComponent
    PropertyLedger.RegisteredControls["SPSMeshSourceBlock"] = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["SPSCreateBlock"] = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["SPSSystemBlock"] = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["SPSInitBlock"] = GenericPropertyComponent;
};
