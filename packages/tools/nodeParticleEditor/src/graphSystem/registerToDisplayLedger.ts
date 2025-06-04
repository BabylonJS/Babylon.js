import { InputDisplayManager } from "./display/inputDisplayManager";
import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { TextureDisplayManager } from "./display/textureDisplayManager";
import { EmitterDisplayManager } from "./display/emitterDisplayManager";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["ParticleInputBlock"] = InputDisplayManager;
    DisplayLedger.RegisteredControls["ParticleTextureSourceBlock"] = TextureDisplayManager;
    DisplayLedger.RegisteredControls["BoxEmitterBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["PointEmitterBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["SphereEmitterBlock"] = EmitterDisplayManager;
};
