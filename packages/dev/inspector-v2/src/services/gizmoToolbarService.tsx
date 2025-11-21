import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISceneContext } from "./sceneContext";
import type { ISelectionService } from "./selectionService";
import type { IShellService } from "./shellService";
import type { IGizmoService } from "./gizmoService";

import { SceneContextIdentity } from "./sceneContext";
import { SelectionServiceIdentity } from "./selectionService";
import { ShellServiceIdentity } from "./shellService";
import { GizmoToolbar } from "../components/gizmoToolbar";
import { useObservableState } from "../hooks/observableHooks";
import { GizmoServiceIdentity } from "./gizmoService";

export const GizmoToolbarServiceDefinition: ServiceDefinition<[], [ISceneContext, IShellService, ISelectionService, IGizmoService]> = {
    friendlyName: "Gizmo Toolbar",
    consumes: [SceneContextIdentity, ShellServiceIdentity, SelectionServiceIdentity, GizmoServiceIdentity],
    factory: (sceneContext, shellService, selectionService, gizmoService) => {
        shellService.addToolbarItem({
            key: "Gizmo Toolbar",
            verticalLocation: "top",
            horizontalLocation: "left",
            suppressTeachingMoment: true,
            component: () => {
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                const selectedEntity = useObservableState(() => selectionService.selectedEntity, selectionService.onSelectedEntityChanged);
                return scene ? <GizmoToolbar scene={scene} entity={selectedEntity} gizmoService={gizmoService} /> : null;
            },
        });
    },
};
