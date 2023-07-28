import { InputDisplayManager } from "./display/inputDisplayManager";
import { OutputDisplayManager } from "./display/outputDisplayManager";
import { ElbowDisplayManager } from "./display/elbowDisplayManager";
import { DisplayLedger } from "shared-ui-components/nodeGraphSystem/displayLedger";
import { SourceDisplayManager } from "./display/sourceDisplayManager";

export const RegisterToDisplayManagers = () => {
    DisplayLedger.RegisteredControls["GeometryInputBlock"] = InputDisplayManager;
    DisplayLedger.RegisteredControls["GeometryOutputBlock"] = OutputDisplayManager;
    DisplayLedger.RegisteredControls["GeometryElbowBlock"] = ElbowDisplayManager;
    DisplayLedger.RegisteredControls["BoxBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["PlaneBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["SphereBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["CapsuleBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["TorusBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["MeshBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["CylinderBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["DiscBlock"] = SourceDisplayManager;
    DisplayLedger.RegisteredControls["IcoSphereBlock"] = SourceDisplayManager;
};
