import { InputDisplayManager } from "./display/inputDisplayManager";
import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { TextureDisplayManager } from "./display/textureDisplayManager";
import { EmitterDisplayManager } from "./display/emitterDisplayManager";
import { UpdateDisplayManager } from "./display/updateDisplayManager";
import { SystemDisplayManager } from "./display/systemDisplayManager";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["ParticleInputBlock"] = InputDisplayManager;
    DisplayLedger.RegisteredControls["ParticleTextureSourceBlock"] = TextureDisplayManager;
    DisplayLedger.RegisteredControls["BoxEmitterBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["PointEmitterBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["SphereEmitterBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["UpdatePositionBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateDirectionBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateColorBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateScaleBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["SystemBlock"] = SystemDisplayManager;
};
