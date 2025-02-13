import { InputDisplayManager } from "./display/inputDisplayManager";
import { OutputDisplayManager } from "./display/outputDisplayManager";
import { ElbowDisplayManager } from "./display/elbowDisplayManager";
import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { SourceDisplayManager } from "./display/sourceDisplayManager";
import { DebugDisplayManager } from "./display/debugDisplayManager";
import { TeleportInDisplayManager } from "./display/teleportInDisplayManager";
import { TeleportOutDisplayManager } from "./display/teleportOutDisplayManager";
import { TextureDisplayManager } from "./display/textureDisplayManager";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["GeometryInputBlock"] = InputDisplayManager;
    DisplayLedger.RegisteredControls["GeometryOutputBlock"] = OutputDisplayManager;
    DisplayLedger.RegisteredControls["GeometryElbowBlock"] = ElbowDisplayManager;
    DisplayLedger.RegisteredControls["DebugBlock"] = DebugDisplayManager;
    DisplayLedger.RegisteredControls["PointListBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["BoxBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["PlaneBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["SphereBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["CapsuleBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["TorusBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["MeshBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["CylinderBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["DiscBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["IcoSphereBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["TeleportInBlock"] = TeleportInDisplayManager;
    DisplayLedger.RegisteredControls["TeleportOutBlock"] = TeleportOutDisplayManager;
    DisplayLedger.RegisteredControls["GeometryTextureBlock"] = TextureDisplayManager;
};
