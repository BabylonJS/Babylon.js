import { InputDisplayManager } from "./display/inputDisplayManager";
import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { TextureDisplayManager } from "./display/textureDisplayManager";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["ParticleInputBlock"] = InputDisplayManager;
    DisplayLedger.RegisteredControls["ParticleTextureSourceBlock"] = TextureDisplayManager;
};
