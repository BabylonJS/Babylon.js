import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "./shellService";
import type { IGizmoService } from "./gizmoService";

import { ShellServiceIdentity } from "./shellService";
import { GizmoToolbar } from "../components/gizmoToolbar";
import { GizmoServiceIdentity } from "./gizmoService";

export const GizmoToolbarServiceDefinition: ServiceDefinition<[], [IShellService, IGizmoService]> = {
    friendlyName: "Gizmo Toolbar",
    consumes: [ShellServiceIdentity, GizmoServiceIdentity],
    factory: (shellService, gizmoService) => {
        shellService.addToolbarItem({
            key: "Gizmo Toolbar",
            verticalLocation: "top",
            horizontalLocation: "left",
            suppressTeachingMoment: true,
            component: () => <GizmoToolbar gizmoService={gizmoService} />,
        });
    },
};
