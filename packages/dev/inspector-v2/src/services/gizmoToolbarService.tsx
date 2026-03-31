import { type ServiceDefinition } from "../modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "./shellService";
import { type IGizmoService, GizmoServiceIdentity } from "./gizmoService";
import { type ISceneContext, SceneContextIdentity } from "./sceneContext";

import { GizmoToolbar } from "../components/gizmoToolbar";

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
