import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IGizmoService } from "./gizmoService";
import type { ISceneContext } from "./sceneContext";
import type { ISelectionService } from "./selectionService";
import type { IShellService } from "./shellService";

import { useCallback } from "react";
import { PickingToolbar } from "../components/pickingToolbar";
import { useObservableState } from "../hooks/observableHooks";
import { GizmoServiceIdentity } from "./gizmoService";
import { SceneContextIdentity } from "./sceneContext";
import { SelectionServiceIdentity } from "./selectionService";
import { ShellServiceIdentity } from "./shellService";

export const PickingServiceDefinition: ServiceDefinition<[], [ISceneContext, IShellService, ISelectionService, IGizmoService]> = {
    friendlyName: "Picking Service",
    consumes: [SceneContextIdentity, ShellServiceIdentity, SelectionServiceIdentity, GizmoServiceIdentity],
    factory: (sceneContext, shellService, selectionService, gizmoService) => {
        shellService.addToolbarItem({
            key: "Picking Service",
            verticalLocation: "top",
            horizontalLocation: "left",
            suppressTeachingMoment: true,
            component: () => {
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                const selectEntity = useCallback((entity: unknown) => (selectionService.selectedEntity = entity), []);
                return scene ? <PickingToolbar scene={scene} selectEntity={selectEntity} gizmoService={gizmoService} /> : null;
            },
        });
    },
};
