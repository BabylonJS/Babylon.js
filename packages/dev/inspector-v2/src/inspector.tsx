// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, IInspectorOptions, Nullable, Scene } from "core/index";
import type { ServiceDefinition } from "./modularity/serviceDefinition";
import type { ModularToolOptions } from "./modularTool";

import { makeStyles } from "@fluentui/react-components";
import { EngineStore } from "core/Engines/engineStore";
import { Observable } from "core/Misc/observable";
import { useEffect, useRef } from "react";
import { InspectorAspect } from "./aspects/inspectorAspect";
import { MakeModularTool } from "./modularTool";
import { SceneContext } from "./services/sceneContext";
import { SceneExplorerServiceDefinition } from "./services/sceneExplorerService";
import { ShellService } from "./services/shellService";

let currentInspectorToken: Nullable<IDisposable> = null;

type InspectorV2Options = Pick<ModularToolOptions, "defaultAspect" | "additionalAspects" | "serviceDefinitions" | "isExtensible" | "isThemeable">;

export function IsInspectorVisible(): boolean {
    return currentInspectorToken != null;
}

export function ShowInspector(scene: Scene, options: Partial<IInspectorOptions> & InspectorV2Options) {
    _ShowInspector(scene, options);
}

function _ShowInspector(scene: Nullable<Scene>, options: Partial<IInspectorOptions>) {
    options = {
        overlay: false,
        showExplorer: true,
        showInspector: true,
        embedMode: false,
        enableClose: true,
        handleResize: true,
        enablePopup: true,
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

    const canvasInjectorServiceDefinition: ServiceDefinition<[], [ShellService]> = {
        friendlyName: "Canvas Injector",
        consumes: [ShellService],
        factory: (shellService: ShellService) => {
            const useStyles = makeStyles({
                canvasContainer: {
                    display: canvasContainerDisplay,
                    width: "100%",
                    height: "100%",
                },
            });

            const registration = shellService.addToContent({
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

    const sceneContextServiceDefinition: ServiceDefinition<[SceneContext], []> = {
        friendlyName: "Inspector Scene Context",
        produces: [SceneContext],
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
        defaultAspect: InspectorAspect,
        serviceDefinitions: [canvasInjectorServiceDefinition, sceneContextServiceDefinition, SceneExplorerServiceDefinition],
    });
    disposeActions.push(() => modularTool.dispose());

    currentInspectorToken = {
        dispose: () => disposeActions.reverse().forEach((dispose) => dispose()),
    };
}

export function HideInspector() {
    currentInspectorToken?.dispose();
    currentInspectorToken = null;
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
