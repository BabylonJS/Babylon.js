// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, IInspectorOptions, Nullable, Observer, Scene } from "core/index";
import type { ServiceDefinition } from "./modularity/serviceDefinition";

import { EngineStore } from "core/Engines/engineStore";
import { MakeModularTool } from "./modularTool";
import { InspectorAspect } from "./aspects/inspectorAspect";
import { ShellService } from "./services/shellService";
import { makeStyles } from "@fluentui/react-components";
import { useEffect, useRef } from "react";

let currentInspectorToken: Nullable<IDisposable> = null;

export function IsInspectorVisible(): boolean {
    return currentInspectorToken != null;
}

export function ShowInspector(scene: Scene, userOptions: Partial<IInspectorOptions>) {
    _ShowInspector(scene, userOptions);
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

    while (parentElement.childElementCount > 0) {
        canvasContainerChildren.push(parentElement.removeChild(parentElement.childNodes[0]));
    }

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
        serviceDefinitions: [canvasInjectorServiceDefinition],
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
