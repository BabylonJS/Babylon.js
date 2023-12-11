import type { Camera } from "core/Cameras/camera";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { flushFramebuffer, setSize, type IWebGLEnginePublic, type WebGLEngineState } from "../../engine.webgl";
import type { EngineView } from "../../../Extensions/views/views.base";
import { _getExtensionState } from "../../../Extensions/views/views.base";
import { _renderFrame, getRenderingCanvas } from "../../../engine.base";

export const getInputElement = function (engineState: IWebGLEnginePublic): Nullable<HTMLElement> {
    const extensionState = _getExtensionState(engineState);
    return extensionState.inputElement || getRenderingCanvas(engineState);
};

export const registerView = function (engineState: IWebGLEnginePublic, canvas: HTMLCanvasElement, camera?: Camera, clearBeforeCopy?: boolean): EngineView {
    const extensionState = _getExtensionState(engineState);
    if (!extensionState.views) {
        extensionState.views = [];
    }

    for (const view of extensionState.views) {
        if (view.target === canvas) {
            return view;
        }
    }

    const masterCanvas = getRenderingCanvas(engineState);
    if (masterCanvas) {
        canvas.width = masterCanvas.width;
        canvas.height = masterCanvas.height;
    }

    const newView = { target: canvas, camera, clearBeforeCopy, enabled: true, id: (Math.random() * 100000).toFixed() };
    extensionState.views.push(newView);

    if (camera) {
        camera.onDisposeObservable.add(() => {
            unRegisterView(engineState, canvas);
        });
    }

    return newView;
};

export const unRegisterView = function (engineState: IWebGLEnginePublic, canvas: HTMLCanvasElement): IWebGLEnginePublic {
    const extensionState = _getExtensionState(engineState);
    if (!extensionState.views || extensionState.views.length === 0) {
        return engineState;
    }

    for (const view of extensionState.views) {
        if (view.target === canvas) {
            const index = extensionState.views.indexOf(view);

            if (index !== -1) {
                extensionState.views.splice(index, 1);
            }
            break;
        }
    }

    return engineState;
};

export const _renderViewStep = function (engineState: IWebGLEnginePublic, view: EngineView): boolean {
    const extensionState = _getExtensionState(engineState);
    const fes = engineState as WebGLEngineState;
    const canvas = view.target;
    const context = canvas.getContext("2d");
    if (!context) {
        return true;
    }
    const parent = getRenderingCanvas(engineState)!;

    extensionState.onBeforeViewRenderObservable.notifyObservers(view);
    const camera = view.camera;
    let previewCamera: Nullable<Camera> = null;
    let scene: Nullable<Scene> = null;
    if (camera) {
        scene = camera.getScene();

        if (!scene || (scene.activeCameras && scene.activeCameras.length)) {
            return true;
        }

        extensionState.activeView = view;

        previewCamera = scene.activeCamera;
        scene.activeCamera = camera;
    }

    if (view.customResize) {
        view.customResize(canvas);
    } else {
        // Set sizes
        const width = Math.floor(canvas.clientWidth / fes._hardwareScalingLevel);
        const height = Math.floor(canvas.clientHeight / fes._hardwareScalingLevel);

        const dimsChanged = width !== canvas.width || parent.width !== canvas.width || height !== canvas.height || parent.height !== canvas.height;
        if (canvas.clientWidth && canvas.clientHeight && dimsChanged) {
            canvas.width = width;
            canvas.height = height;
            setSize(fes, width, height);
        }
    }

    if (!parent.width || !parent.height) {
        return false;
    }

    // Render the frame
    _renderFrame(fes);

    flushFramebuffer(fes);

    // Copy to target
    if (view.clearBeforeCopy) {
        context.clearRect(0, 0, parent.width, parent.height);
    }
    context.drawImage(parent, 0, 0);

    // Restore
    if (previewCamera && scene) {
        scene.activeCamera = previewCamera;
    }
    extensionState.onAfterViewRenderObservable.notifyObservers(view);
    return true;
};

export const _renderViews = function (engineState: IWebGLEnginePublic) {
    const extensionState = _getExtensionState(engineState);
    if (!extensionState.views || extensionState.views.length === 0) {
        return false;
    }

    const parent = getRenderingCanvas(engineState);

    if (!parent) {
        return false;
    }

    let inputElementView;
    for (const view of extensionState.views) {
        if (!view.enabled) {
            continue;
        }
        const canvas = view.target;
        // Always render the view correspondent to the inputElement for last
        if (canvas === extensionState.inputElement) {
            inputElementView = view;
            continue;
        }

        if (!_renderViewStep(engineState, view)) {
            return false;
        }
    }

    if (inputElementView) {
        if (!_renderViewStep(engineState, inputElementView)) {
            return false;
        }
    }

    extensionState.activeView = null;

    return true;
};

export const _setOnEngineViewChanged = function (engineState: IWebGLEnginePublic, callback: (engineState: IWebGLEnginePublic) => void) {
    const extensionState = _getExtensionState(engineState);
    extensionState._onEngineViewChanged = callback;
};

export const viewsEngineExtension = {
    registerView,
    unRegisterView,
    _renderViewStep,
    _renderViews,
    _setOnEngineViewChanged,
};

export default viewsEngineExtension;
