import { InputDisplayManager } from "./display/inputDisplayManager";
import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { TextureDisplayManager } from "./display/textureDisplayManager";
import { EmitterDisplayManager } from "./display/emitterDisplayManager";
import { UpdateDisplayManager } from "./display/updateDisplayManager";
import { SystemDisplayManager } from "./display/systemDisplayManager";
import { DebugDisplayManager } from "./display/debugDisplayManager";
import { ElbowDisplayManager } from "./display/elbowDisplayManager";
import { TeleportOutDisplayManager } from "./display/teleportOutDisplayManager";
import { TeleportInDisplayManager } from "./display/teleportInDisplayManager";
import { ConditionDisplayManager } from "./display/conditionDisplayManager";
import { TriggerDisplayManager } from "./display/triggerDisplayManager";

/**
 * Registers all display managers to the display ledger
 */
export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["ParticleInputBlock"] = InputDisplayManager;
    DisplayLedger.RegisteredControls["ParticleTextureSourceBlock"] = TextureDisplayManager;
    DisplayLedger.RegisteredControls["BoxShapeBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["ConeShapeBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["PointShapeBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["CustomShapeBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["SphereShapeBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["MeshShapeBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["CylinderShapeBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["CreateParticleBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["SetupSpriteSheetBlock"] = EmitterDisplayManager;
    DisplayLedger.RegisteredControls["UpdatePositionBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateDirectionBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateColorBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateScaleBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateSizeBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateAgeBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["AlignAngleBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["BasicUpdateSpriteBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateSpriteCellIndexBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateAngleBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["BasicPositionUpdateBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["BasicSpriteUpdateBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["BasicColorUpdateBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateAttractorBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateFlowMapBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["UpdateNoiseBlock"] = UpdateDisplayManager;
    DisplayLedger.RegisteredControls["SystemBlock"] = SystemDisplayManager;
    DisplayLedger.RegisteredControls["ParticleDebugBlock"] = DebugDisplayManager;
    DisplayLedger.RegisteredControls["ParticleElbowBlock"] = ElbowDisplayManager;
    DisplayLedger.RegisteredControls["ParticleTeleportInBlock"] = TeleportInDisplayManager;
    DisplayLedger.RegisteredControls["ParticleTeleportOutBlock"] = TeleportOutDisplayManager;
    DisplayLedger.RegisteredControls["BasicConditionBlock"] = ConditionDisplayManager;
    DisplayLedger.RegisteredControls["ParticleTriggerBlock"] = TriggerDisplayManager;
};
