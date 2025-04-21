// eslint-disable-next-line import/no-internal-modules
import type { IInspectorOptions, Nullable, Observer, Scene } from "core/index";
import type { ServiceDefinition } from "./modularity/serviceDefinition";

import { EngineStore } from "core/Engines/engineStore";
import { MakeModularTool } from "./modularTool";
import { InspectorAspect } from "./aspects/inspector";
import { ShellService } from "./services/shellService";

const isVisible = false;
let _newCanvasContainer: Nullable<HTMLElement> = null;
let _onBeforeRenderObserver: Nullable<Observer<Scene>>;

export const canvasInjectorServiceDefinition: ServiceDefinition<[], [ShellService]> = {
    friendlyName: "Canvas Injector",
    consumes: [ShellService],
    factory: (shellService: ShellService) => {
        const registration = shellService.addToContent({
            key: "Canvas Injector",
            component: () => {
                return <></>;
            },
        });

        return {
            dispose: () => {
                registration.dispose();
            },
        };
    },
};

function _createCanvasContainer(parentElement: HTMLElement) {
    // Create a container for previous elements
    const newCanvasContainer = parentElement.ownerDocument.createElement("div");
    newCanvasContainer.style.display = parentElement.style.display;
    parentElement.style.display = "flex";

    while (parentElement.childElementCount > 0) {
        const child = parentElement.childNodes[0];
        parentElement.removeChild(child);
        newCanvasContainer.appendChild(child);
    }

    parentElement.appendChild(newCanvasContainer);

    newCanvasContainer.style.width = "100%";
    newCanvasContainer.style.height = "100%";

    return newCanvasContainer;
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

    if (isVisible) {
        HideInspector();
    }

    if (!scene) {
        scene = EngineStore.LastCreatedScene;
    }

    const rootElement = scene ? scene.getEngine().getInputElement() : (EngineStore.LastCreatedEngine?.getInputElement() ?? null);
    const parentElement: Nullable<HTMLElement> = options.globalRoot ? options.globalRoot : (rootElement?.parentElement ?? null);

    if (parentElement) {
        if (!_newCanvasContainer) {
            _newCanvasContainer = _createCanvasContainer(parentElement);
        }

        if (options.handleResize && scene) {
            _onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => scene.getEngine().resize());
        }

        if (options.showExplorer) {
            // TODO
        }

        const modularTool = MakeModularTool({
            defaultAspect: InspectorAspect,
            serviceDefinitions: [canvasInjectorServiceDefinition],
        });

        // TODO: createElement and render
    }
}

export function HideInspector() {
    // TODO
}

export class Inspector {
    public static get IsVisible(): boolean {
        return isVisible;
    }

    public static Show(scene: Scene, userOptions: Partial<IInspectorOptions>) {
        _ShowInspector(scene, userOptions);
    }

    public static Hide() {
        HideInspector();
    }
}
