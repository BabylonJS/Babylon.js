import { InputDisplayManager } from './display/inputDisplayManager';
import { OutputDisplayManager } from './display/outputDisplayManager';
import { ClampDisplayManager } from './display/clampDisplayManager';
import { GradientDisplayManager } from './display/gradientDisplayManager';
import { RemapDisplayManager } from './display/remapDisplayManager';
import { TrigonometryDisplayManager } from './display/trigonometryDisplayManager';
import { TextureDisplayManager } from './display/textureDisplayManager';
import { DiscardDisplayManager } from './display/discardDisplayManager';
import { PBRDisplayManager } from './display/pbrDisplayManager';
import { ConditionalDisplayManager } from './display/conditionalDisplayManager';

export class DisplayLedger {
    public static RegisteredControls: {[key: string] : any} = {};
}

DisplayLedger.RegisteredControls["InputBlock"] = InputDisplayManager;
DisplayLedger.RegisteredControls["VertexOutputBlock"] = OutputDisplayManager;
DisplayLedger.RegisteredControls["FragmentOutputBlock"] = OutputDisplayManager;
DisplayLedger.RegisteredControls["ClampBlock"] = ClampDisplayManager;
DisplayLedger.RegisteredControls["GradientBlock"] = GradientDisplayManager;
DisplayLedger.RegisteredControls["RemapBlock"] = RemapDisplayManager;
DisplayLedger.RegisteredControls["TrigonometryBlock"] = TrigonometryDisplayManager;
DisplayLedger.RegisteredControls["ConditionalBlock"] = ConditionalDisplayManager;
DisplayLedger.RegisteredControls["TextureBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["ReflectionTextureBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["ReflectionBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["RefractionBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["CurrentScreenBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["ParticleTextureBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["DiscardBlock"] = DiscardDisplayManager;
DisplayLedger.RegisteredControls["PBRMetallicRoughnessBlock"] = PBRDisplayManager;
DisplayLedger.RegisteredControls["AnisotropyBlock"] = PBRDisplayManager;
DisplayLedger.RegisteredControls["ClearCoatBlock"] = PBRDisplayManager;
DisplayLedger.RegisteredControls["SheenBlock"] = PBRDisplayManager;
DisplayLedger.RegisteredControls["SubSurfaceBlock"] = PBRDisplayManager;
