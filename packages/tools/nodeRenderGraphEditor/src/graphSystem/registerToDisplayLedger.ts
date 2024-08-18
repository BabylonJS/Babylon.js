import { InputDisplayManager } from "./display/inputDisplayManager";
import { OutputDisplayManager } from "./display/outputDisplayManager";
import { ElbowDisplayManager } from "./display/elbowDisplayManager";
import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { PostProcessDisplayManager } from "./display/postProcessDisplayManager";
import { TeleportInDisplayManager } from "./display/teleportInDisplayManager";
import { TeleportOutDisplayManager } from "./display/teleportOutDisplayManager";
import { TextureDisplayManager } from "./display/textureDisplayManager";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["RenderGraphInputBlock"] = InputDisplayManager;
    DisplayLedger.RegisteredControls["RenderGraphOutputBlock"] = OutputDisplayManager;
    DisplayLedger.RegisteredControls["RenderGraphElbowBlock"] = ElbowDisplayManager;
    DisplayLedger.RegisteredControls["TeleportInBlock"] = TeleportInDisplayManager;
    DisplayLedger.RegisteredControls["TeleportOutBlock"] = TeleportOutDisplayManager;
    DisplayLedger.RegisteredControls["BlackAndWhitePostProcessBlock"] = PostProcessDisplayManager;
    DisplayLedger.RegisteredControls["BloomPostProcessBlock"] = PostProcessDisplayManager;
    DisplayLedger.RegisteredControls["ClearBlock"] = TextureDisplayManager;
};
