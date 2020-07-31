import { InputDisplayManager } from './display/inputDisplayManager';
import { OutputDisplayManager } from './display/outputDisplayManager';
import { ClampDisplayManager } from './display/clampDisplayManager';
import { GradientDisplayManager } from './display/gradientDisplayManager';
import { RemapDisplayManager } from './display/remapDisplayManager';
import { TrigonometryDisplayManager } from './display/trigonometryDisplayManager';
import { TextureDisplayManager } from './display/textureDisplayManager';
import { DiscardDisplayManager } from './display/discardDisplayManager';

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
DisplayLedger.RegisteredControls["TextureBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["ReflectionTextureBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["ReflectionBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["RefractionBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["CurrentScreenBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["ParticleTextureBlock"] = TextureDisplayManager;
DisplayLedger.RegisteredControls["DiscardBlock"] = DiscardDisplayManager;
