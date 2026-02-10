import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IGizmoService } from "./gizmoService";
import type { ISceneContext } from "./sceneContext";
import type { ISelectionService } from "./selectionService";
import type { ISettingsContext } from "./settingsContext";
import type { IShellService } from "./shellService";

import { useCallback } from "react";
import { PickingToolbar } from "../components/pickingToolbar";
import { useObservableState } from "../hooks/observableHooks";
import { GizmoServiceIdentity } from "./gizmoService";
import { SceneContextIdentity } from "./sceneContext";
import { SelectionServiceIdentity } from "./selectionService";
import { SettingsContextIdentity } from "./settingsContext";
import { ShellServiceIdentity } from "./shellService";

export const PickingServiceDefinition: ServiceDefinition<[], [ISceneContext, IShellService, ISelectionService, IGizmoService, ISettingsContext]> = {
    friendlyName: "Picking Service",
    consumes: [SceneContextIdentity, ShellServiceIdentity, SelectionServiceIdentity, GizmoServiceIdentity, SettingsContextIdentity],
    factory: (sceneContext, shellService, selectionService, gizmoService, settingsContext) => {
        shellService.addToolbarItem({
            key: "Picking Service",
            verticalLocation: "top",
            horizontalLocation: "left",
            suppressTeachingMoment: true,
            component: () => {
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                const selectEntity = useCallback((entity: unknown) => (selectionService.selectedEntity = entity), []);
                const ignoreBackfacesForPicking = useObservableState(() => settingsContext.ignoreBackfacesForPicking, settingsContext.settingsChangedObservable);
                const highlightSelectedEntity = useObservableState(() => settingsContext.highlightSelectedEntity, settingsContext.settingsChangedObservable);
                const onHighlightSelectedEntityChange = useCallback((value: boolean) => (settingsContext.highlightSelectedEntity = value), []);
                return scene ? (
                    <PickingToolbar
                        scene={scene}
                        selectEntity={selectEntity}
                        gizmoService={gizmoService}
                        ignoreBackfaces={ignoreBackfacesForPicking}
                        highlightSelectedEntity={highlightSelectedEntity}
                        onHighlightSelectedEntityChange={onHighlightSelectedEntityChange}
                    />
                ) : null;
            },
        });
    },
};
