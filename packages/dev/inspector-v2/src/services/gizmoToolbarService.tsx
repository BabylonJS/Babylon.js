import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "./shellService";
import type { IGizmoService } from "./gizmoService";
import type { ISceneContext } from "./sceneContext";

import { ShellServiceIdentity } from "./shellService";
import { GizmoToolbar } from "../components/gizmoToolbar";
import { GizmoServiceIdentity } from "./gizmoService";
import { SceneContextIdentity } from "./sceneContext";

export const GizmoToolbarServiceDefinition: ServiceDefinition<[], [IShellService, IGizmoService, ISceneContext]> = {
    friendlyName: "Gizmo Toolbar",
    consumes: [ShellServiceIdentity, GizmoServiceIdentity, SceneContextIdentity],
    factory: (shellService, gizmoService, sceneContext) => {
        shellService.addToolbarItem({
            key: "Gizmo Toolbar",
            verticalLocation: "top",
            horizontalLocation: "left",
            teachingMoment: false,
            component: () => <GizmoToolbar gizmoService={gizmoService} sceneContext={sceneContext} />,
        });
    },
};
