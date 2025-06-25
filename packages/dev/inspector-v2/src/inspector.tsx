// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, IInspectorOptions, Nullable, Scene } from "core/index";
import type { ServiceDefinition } from "./modularity/serviceDefinition";
import type { ModularToolOptions } from "./modularTool";
import type { ISceneContext } from "./services/sceneContext";
import type { IShellService } from "./services/shellService";

import { makeStyles } from "@fluentui/react-components";
import { EngineStore } from "core/Engines/engineStore";
import { Observable } from "core/Misc/observable";
import { useEffect, useRef } from "react";
import { BuiltInsExtensionFeed } from "./extensibility/builtInsExtensionFeed";
import { MakeModularTool } from "./modularTool";
import { DebugServiceDefinition } from "./services/panes/debugService";
import { CommonPropertiesServiceDefinition } from "./services/panes/properties/commonPropertiesService";
import { MeshPropertiesServiceDefinition } from "./services/panes/properties/meshPropertiesService";
import { NodePropertiesServiceDefinition } from "./services/panes/properties/nodePropertiesService";
import { PropertiesServiceDefinition } from "./services/panes/properties/propertiesService";
import { TransformNodePropertiesServiceDefinition } from "./services/panes/properties/transformNodePropertiesService";
import { MaterialExplorerServiceDefinition } from "./services/panes/scene/materialExplorerService";
import { NodeHierarchyServiceDefinition } from "./services/panes/scene/nodeExplorerService";
import { SceneExplorerServiceDefinition } from "./services/panes/scene/sceneExplorerService";
import { TextureHierarchyServiceDefinition } from "./services/panes/scene/texturesExplorerService";
import { SettingsServiceDefinition } from "./services/panes/settingsService";
import { StatsServiceDefinition } from "./services/panes/statsService";
import { ToolsServiceDefinition } from "./services/panes/toolsService";
import { SceneContextIdentity } from "./services/sceneContext";
import { SelectionServiceDefinition } from "./services/selectionService";
import { ShellServiceIdentity } from "./services/shellService";
import { MaterialPropertiesServiceDefinition } from "./services/panes/properties/materialPropertiesService";

let CurrentInspectorToken: Nullable<IDisposable> = null;

type InspectorV2Options = Pick<ModularToolOptions, "serviceDefinitions" | "isThemeable"> & {
    isExtensible?: boolean;
};

export function IsInspectorVisible(): boolean {
    return CurrentInspectorToken != null;
}

export function ShowInspector(scene: Scene, options?: Partial<IInspectorOptions & InspectorV2Options>) {
    _ShowInspector(scene, options ?? {});
}

function _ShowInspector(scene: Nullable<Scene>, options: Partial<IInspectorOptions & InspectorV2Options>) {
    // TODO: Lots more work to do to respect all the Inspector v1 options.
    options = {
        overlay: false,
        showExplorer: true,
        showInspector: true,
        embedMode: false,
        enableClose: true,
        handleResize: true,
        enablePopup: true,
        isExtensible: true,
        isThemeable: false,
        ...options,
    };

    if (!scene) {
        scene = EngineStore.LastCreatedScene;
    }

    if (!scene || scene.isDisposed) {
        return;
    }

    let parentElement = options.globalRoot ?? null;
    if (!parentElement) {
        parentElement = scene.getEngine().getRenderingCanvas()?.parentElement ?? null;
        while (parentElement) {
            const rootNode = parentElement.getRootNode();
            // TODO: Right now we never parent the inspector within a ShadowRoot because we need to do more work to get FluentProvider to work correctly in this context.
            if (!(rootNode instanceof ShadowRoot)) {
                break;
            }
            parentElement = rootNode.host.parentElement;
        }
    }

    if (!parentElement) {
        return;
    }

    if (IsInspectorVisible()) {
        HideInspector();
    }

    const disposeActions: (() => void)[] = [];

    const canvasContainerDisplay = parentElement.style.display;
    const canvasContainerChildren: ChildNode[] = [];

    canvasContainerChildren.push(...parentElement.childNodes);

    disposeActions.push(() => {
        canvasContainerChildren.forEach((child) => parentElement.appendChild(child));
    });

    // This service is responsible for injecting the passed in canvas as the "central content" of the shell UI (the main area between the side panes and toolbars).
    const canvasInjectorServiceDefinition: ServiceDefinition<[], [IShellService]> = {
        friendlyName: "Canvas Injector",
        consumes: [ShellServiceIdentity],
        factory: (shellService) => {
            const useStyles = makeStyles({
                canvasContainer: {
                    display: canvasContainerDisplay,
                    width: "100%",
                    height: "100%",
                },
            });

            const registration = shellService.addCentralContent({
                key: "Canvas Injector",
                component: () => {
                    const classes = useStyles();
                    const canvasContainerRef = useRef<HTMLDivElement>(null);
                    useEffect(() => {
                        if (canvasContainerRef.current) {
                            for (const child of canvasContainerChildren) {
                                canvasContainerRef.current.appendChild(child);
                            }
                        }
                    }, []);

                    return <div ref={canvasContainerRef} className={classes.canvasContainer} />;
                },
            });

            return {
                dispose: () => {
                    registration.dispose();
                },
            };
        },
    };

    // This service exposes the scene that was passed into Inspector through ISceneContext, which is used by other services that may be used in other contexts outside of Inspector.
    const sceneContextServiceDefinition: ServiceDefinition<[ISceneContext], []> = {
        friendlyName: "Inspector Scene Context",
        produces: [SceneContextIdentity],
        factory: () => {
            return {
                currentScene: scene,
                currentSceneObservable: new Observable<Nullable<Scene>>(),
            };
        },
    };

    if (options.handleResize) {
        const observer = scene.onBeforeRenderObservable.add(() => scene.getEngine().resize());
        disposeActions.push(() => observer.remove());
    }

    if (options.showExplorer) {
        // TODO
    }

    const modularTool = MakeModularTool({
        containerElement: parentElement,
        serviceDefinitions: [
            // Injects the canvas the scene is rendering to into the central "content" area of the shell UI.
            canvasInjectorServiceDefinition,

            // Provides access to the scene in a generic way (other tools might provide a scene in a different way).
            sceneContextServiceDefinition,

            // Scene explorer tab and related services.
            SceneExplorerServiceDefinition,
            NodeHierarchyServiceDefinition,
            MaterialExplorerServiceDefinition,
            TextureHierarchyServiceDefinition,

            // Properties pane tab and related services.
            PropertiesServiceDefinition,
            CommonPropertiesServiceDefinition,
            NodePropertiesServiceDefinition,
            MeshPropertiesServiceDefinition,
            TransformNodePropertiesServiceDefinition,
            MaterialPropertiesServiceDefinition,

            // Debug pane tab and related services.
            DebugServiceDefinition,

            // Stats pane tab and related services.
            StatsServiceDefinition,

            // Tools pane tab and related services.
            ToolsServiceDefinition,

            // Settings pane tab and related services.
            SettingsServiceDefinition,

            // Tracks entity selection state (e.g. which Mesh or Material or other entity is currently selected in scene explorer and bound to the properties pane, etc.).
            SelectionServiceDefinition,

            // Additional services passed in to the Inspector.
            ...(options.serviceDefinitions ?? []),
        ],
        isThemeable: options.isThemeable ?? true,
        extensionFeeds: options.isExtensible ? [new BuiltInsExtensionFeed()] : [],
        toolbarMode: "compact",
    });
    disposeActions.push(() => modularTool.dispose());

    let disposed = false;
    CurrentInspectorToken = {
        dispose: () => {
            if (disposed) {
                return;
            }

            disposeActions.reverse().forEach((dispose) => dispose());
            if (options.handleResize) {
                scene.getEngine().resize();
            }

            disposed = true;
        },
    };

    const sceneDisposedObserver = scene.onDisposeObservable.addOnce(() => {
        HideInspector();
    });

    disposeActions.push(() => sceneDisposedObserver.remove());
}

export function HideInspector() {
    CurrentInspectorToken?.dispose();
    CurrentInspectorToken = null;
}

export class Inspector {
    public static get IsVisible(): boolean {
        return IsInspectorVisible();
    }

    public static Show(scene: Scene, userOptions: Partial<IInspectorOptions>) {
        _ShowInspector(scene, userOptions);
    }

    public static Hide() {
        HideInspector();
    }
}
