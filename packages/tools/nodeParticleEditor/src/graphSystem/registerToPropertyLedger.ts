import { PropertyLedger } from "shared-ui-components/nodeGraphSystem/propertyLedger";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { InputPropertyTabComponent } from "./properties/inputNodePropertyComponent";
import { TextureSourcePropertyTabComponent } from "./properties/textureSourceNodePropertyComponent";
import { DebugPropertyTabComponent } from "./properties/debugNodePropertyComponent";
import { TeleportOutPropertyTabComponent } from "./properties/teleportOutNodePropertyComponent";
import { MeshShapePropertyTabComponent } from "./properties/meshShapeNodePropertyComponent";
import { SPSMeshSourcePropertyTabComponent } from "./properties/spsMeshSourceNodePropertyComponent";
import { SPSNodeMaterialPropertyTabComponent } from "./properties/spsNodeMaterialPropertyComponent";

export const RegisterToPropertyTabManagers = () => {
    PropertyLedger.DefaultControl = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["ParticleInputBlock"] = InputPropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleTextureSourceBlock"] = TextureSourcePropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleDebugBlock"] = DebugPropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleTeleportOutBlock"] = TeleportOutPropertyTabComponent;
    PropertyLedger.RegisteredControls["MeshShapeBlock"] = MeshShapePropertyTabComponent;

    PropertyLedger.RegisteredControls["SPSMeshSourceBlock"] = SPSMeshSourcePropertyTabComponent;
    PropertyLedger.RegisteredControls["SPSParticleConfigBlock"] = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["SPSCreateBlock"] = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["SPSSystemBlock"] = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["SPSUpdateBlock"] = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["SpsParticlePropsSetBlock"] = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["SpsParticlePropsGetBlock"] = GenericPropertyComponent;
    PropertyLedger.RegisteredControls["SPSNodeMaterialBlock"] = SPSNodeMaterialPropertyTabComponent;
};
