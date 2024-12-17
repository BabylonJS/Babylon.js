import { InputDisplayManager } from "./display/inputDisplayManager";
import { OutputDisplayManager } from "./display/outputDisplayManager";
import { ElbowDisplayManager } from "./display/elbowDisplayManager";
import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { PostProcessDisplayManager } from "./display/postProcessDisplayManager";
import { TeleportInDisplayManager } from "./display/teleportInDisplayManager";
import { TeleportOutDisplayManager } from "./display/teleportOutDisplayManager";
import { TextureDisplayManager } from "./display/textureDisplayManager";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["NodeRenderGraphInputBlock"] = InputDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphOutputBlock"] = OutputDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphElbowBlock"] = ElbowDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphTeleportInBlock"] = TeleportInDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphTeleportOutBlock"] = TeleportOutDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphBlackAndWhitePostProcessBlock"] = PostProcessDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphBloomPostProcessBlock"] = PostProcessDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphBlurPostProcessBlock"] = PostProcessDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphCircleOfConfusionPostProcessBlock"] = PostProcessDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphDepthOfFieldPostProcessBlock"] = PostProcessDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphExtractHighlightsPostProcessBlock"] = PostProcessDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphClearBlock"] = TextureDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphCopyTextureBlock"] = TextureDisplayManager;
    DisplayLedger.RegisteredControls["NodeRenderGraphGenerateMipmapsBlock"] = TextureDisplayManager;
};
