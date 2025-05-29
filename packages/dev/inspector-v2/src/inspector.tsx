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
import { MaterialHierarchyServiceDefinition } from "./services/panes/hierarchy/materialHierarchyService";
import { NodeHierarchyServiceDefinition } from "./services/panes/hierarchy/nodeHierarchyService";
import { SceneExplorerServiceDefinition } from "./services/panes/hierarchy/sceneExplorerService";
import { TextureHierarchyServiceDefinition } from "./services/panes/hierarchy/texturesHierarchyService";
import { CommonPropertiesServiceDefinition } from "./services/panes/properties/common/commonPropertiesService";
import { MeshPropertiesServiceDefinition } from "./services/panes/properties/mesh/meshPropertiesService";
import { PropertiesServiceDefinition } from "./services/panes/properties/propertiesService";
import { SettingsServiceDefinition } from "./services/panes/settingsService";
import { StatsServiceDefinition } from "./services/panes/statsService";
import { ToolsServiceDefinition } from "./services/panes/toolsService";
import { SceneContextIdentity } from "./services/sceneContext";
import { SceneExplorerPropertyBindingServiceDefinition } from "./services/sceneExplorerPropertyBindingService";
import { ShellServiceIdentity } from "./services/shellService";

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

    if (!scene) {
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
    // while (parentElement.childElementCount > 0) {
    //     canvasContainerChildren.push(parentElement.removeChild(parentElement.childNodes[0]));
    // }

    disposeActions.push(() => {
        canvasContainerChildren.forEach((child) => parentElement.appendChild(child));
    });

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
            MaterialHierarchyServiceDefinition,
            TextureHierarchyServiceDefinition,

            // Properties pane tab and related services.
            PropertiesServiceDefinition,
            CommonPropertiesServiceDefinition,
            MeshPropertiesServiceDefinition,

            // Debug pane tab and related services.
            DebugServiceDefinition,

            // Stats pane tab and related services.
            StatsServiceDefinition,

            // Tools pane tab and related services.
            ToolsServiceDefinition,

            // Settings pane tab and related services.
            SettingsServiceDefinition,

            // Bind the scene explorer selected entity to the properties pane.
            SceneExplorerPropertyBindingServiceDefinition,

            // Additional services passed in to the Inspector.
            ...(options.serviceDefinitions ?? []),
        ],
        isThemeable: options.isThemeable ?? true,
        extensionFeeds: options.isExtensible ? [new BuiltInsExtensionFeed()] : [],
        toolBarMode: "compact",
    });
    disposeActions.push(() => modularTool.dispose());

    CurrentInspectorToken = {
        dispose: () => {
            disposeActions.reverse().forEach((dispose) => dispose());
            if (options.handleResize) {
                scene.getEngine().resize();
            }
        },
    };
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
