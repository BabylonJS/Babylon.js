import type { IDisposable, IReadonlyObservable, Nullable } from "core/index";
import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISceneContext } from "./sceneContext";
import type { ISelectionService } from "./selectionService";
import type { IShellService } from "./shellService";
import type { IGizmoService } from "./gizmoService";

import { Observable } from "core/Misc/observable";
import { SceneContextIdentity } from "./sceneContext";
import { SelectionServiceIdentity } from "./selectionService";
import { ShellServiceIdentity } from "./shellService";
import { GizmoToolbar } from "../components/gizmoToolbar";
import { useObservableState } from "../hooks/observableHooks";
import { GizmoServiceIdentity } from "./gizmoService";

/**
 * The available gizmo modes.
 */
export type GizmoMode = "translate" | "rotate" | "scale" | "boundingBox";

/**
 * The available coordinates modes for gizmos.
 */
export type CoordinatesMode = "local" | "world";

export const GizmoToolbarServiceIdentity = Symbol("GizmoToolbarService");

/**
 * Internal service that manages gizmo toolbar state.
 * External control is exposed via IInspectorHandle from ShowInspector().
 */
export interface IGizmoToolbarService extends IService<typeof GizmoToolbarServiceIdentity> {
    gizmoMode: Nullable<GizmoMode>;
    coordinatesMode: CoordinatesMode;
    readonly onGizmoModeChanged: IReadonlyObservable<Nullable<GizmoMode>>;
    readonly onCoordinatesModeChanged: IReadonlyObservable<CoordinatesMode>;
}

export const GizmoToolbarServiceDefinition: ServiceDefinition<[IGizmoToolbarService], [ISceneContext, IShellService, ISelectionService, IGizmoService]> = {
    friendlyName: "Gizmo Toolbar",
    produces: [GizmoToolbarServiceIdentity],
    consumes: [SceneContextIdentity, ShellServiceIdentity, SelectionServiceIdentity, GizmoServiceIdentity],
    factory: (sceneContext, shellService, selectionService, gizmoService) => {
        let gizmoModeState: Nullable<GizmoMode> = null;
        let coordinatesModeState: CoordinatesMode = "world";

        const gizmoModeObservable = new Observable<Nullable<GizmoMode>>();
        const coordinatesModeObservable = new Observable<CoordinatesMode>();

        const gizmoToolbarService: IGizmoToolbarService & IDisposable = {
            get gizmoMode() {
                return gizmoModeState;
            },
            set gizmoMode(mode: Nullable<GizmoMode>) {
                if (mode !== gizmoModeState) {
                    gizmoModeState = mode;
                    gizmoModeObservable.notifyObservers(mode);
                }
            },
            get coordinatesMode() {
                return coordinatesModeState;
            },
            set coordinatesMode(mode: CoordinatesMode) {
                if (mode !== coordinatesModeState) {
                    coordinatesModeState = mode;
                    coordinatesModeObservable.notifyObservers(mode);
                }
            },
            onGizmoModeChanged: gizmoModeObservable,
            onCoordinatesModeChanged: coordinatesModeObservable,
            dispose: () => {
                gizmoModeObservable.clear();
                coordinatesModeObservable.clear();
            },
        };

        shellService.addToolbarItem({
            key: "Gizmo Toolbar",
            verticalLocation: "top",
            horizontalLocation: "left",
            suppressTeachingMoment: true,
            component: () => {
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                const selectedEntity = useObservableState(() => selectionService.selectedEntity, selectionService.onSelectedEntityChanged);
                return scene ? <GizmoToolbar scene={scene} entity={selectedEntity} gizmoService={gizmoService} gizmoToolbarService={gizmoToolbarService} /> : null;
            },
        });

        return gizmoToolbarService;
    },
};
