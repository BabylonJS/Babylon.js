import type { Camera } from "../../Cameras/camera";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Observable } from "../../Misc/observable";
import { AbstractEngine } from "../abstractEngine";

/**
 * Class used to define an additional view for the engine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/multiCanvas
 */
export class EngineView {
    /**
     * A randomly generated unique id
     */
    readonly id: string;
    /** Defines the canvas where to render the view */
    target: HTMLCanvasElement;
    /**
     * Defines an optional camera or array of cameras used to render the view (will use active camera / cameras else)
     * Support for array of cameras @since
     */
    camera?: Camera | Camera[];
    /** Indicates if the destination view canvas should be cleared before copying the parent canvas. Can help if the scene clear color has alpha < 1 */
    clearBeforeCopy?: boolean;
    /** Indicates if the view is enabled (true by default) */
    enabled: boolean;
    /** Defines a custom function to handle canvas size changes. (the canvas to render into is provided to the callback) */
    customResize?: (canvas: HTMLCanvasElement) => void;
}

declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _inputElement: Nullable<HTMLElement>;

        /**
         * Gets or sets the  HTML element to use for attaching events
         */
        inputElement: Nullable<HTMLElement>;

        /**
         * Observable to handle when a change to inputElement occurs
         * @internal
         */
        _onEngineViewChanged?: () => void;

        /**
         * Will be triggered before the view renders
         */
        readonly onBeforeViewRenderObservable: Observable<EngineView>;
        /**
         * Will be triggered after the view rendered
         */
        readonly onAfterViewRenderObservable: Observable<EngineView>;

        /**
         * Gets the current engine view
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/multiCanvas
         */
        activeView: Nullable<EngineView>;

        /** Gets or sets the list of views */
        views: EngineView[];

        /**
         * Register a new child canvas
         * @param canvas defines the canvas to register
         * @param camera defines an optional camera or array of cameras to use with this canvas (it will overwrite the scene.activeCamera / scene.activeCameras for this view). Support for array of cameras @since
         * @param clearBeforeCopy Indicates if the destination view canvas should be cleared before copying the parent canvas. Can help if the scene clear color has alpha \< 1
         * @returns the associated view
         */
        registerView(canvas: HTMLCanvasElement, camera?: Camera | Camera[], clearBeforeCopy?: boolean): EngineView;

        /**
         * Remove a registered child canvas
         * @param canvas defines the canvas to remove
         * @returns the current engine
         */
        unRegisterView(canvas: HTMLCanvasElement): AbstractEngine;

        /**
         * @internal
         */
        _renderViewStep(view: EngineView): boolean;
    }
}

const OnBeforeViewRenderObservable = new Observable<EngineView>();
const OnAfterViewRenderObservable = new Observable<EngineView>();

Object.defineProperty(AbstractEngine.prototype, "onBeforeViewRenderObservable", {
    get: function (this: AbstractEngine) {
        return OnBeforeViewRenderObservable;
    },
});

Object.defineProperty(AbstractEngine.prototype, "onAfterViewRenderObservable", {
    get: function (this: AbstractEngine) {
        return OnAfterViewRenderObservable;
    },
});

Object.defineProperty(AbstractEngine.prototype, "inputElement", {
    get: function (this: AbstractEngine) {
        return this._inputElement;
    },
    set: function (this: AbstractEngine, value: HTMLElement) {
        if (this._inputElement !== value) {
            this._inputElement = value;
            this._onEngineViewChanged?.();
        }
    },
});

AbstractEngine.prototype.getInputElement = function (): Nullable<HTMLElement> {
    return this.inputElement || this.getRenderingCanvas();
};

AbstractEngine.prototype.registerView = function (canvas: HTMLCanvasElement, camera?: Camera | Camera[], clearBeforeCopy?: boolean): EngineView {
    if (!this.views) {
        this.views = [];
    }

    for (const view of this.views) {
        if (view.target === canvas) {
            return view;
        }
    }

    const masterCanvas = this.getRenderingCanvas();
    if (masterCanvas) {
        canvas.width = masterCanvas.width;
        canvas.height = masterCanvas.height;
    }

    const newView = { target: canvas, camera, clearBeforeCopy, enabled: true, id: (Math.random() * 100000).toFixed() };
    this.views.push(newView);

    if (camera && !Array.isArray(camera)) {
        camera.onDisposeObservable.add(() => {
            this.unRegisterView(canvas);
        });
    }

    return newView;
};

AbstractEngine.prototype.unRegisterView = function (canvas: HTMLCanvasElement): AbstractEngine {
    if (!this.views || this.views.length === 0) {
        return this;
    }

    for (const view of this.views) {
        if (view.target === canvas) {
            const index = this.views.indexOf(view);

            if (index !== -1) {
                this.views.splice(index, 1);
            }
            break;
        }
    }

    return this;
};

AbstractEngine.prototype._renderViewStep = function (view: EngineView): boolean {
    const canvas = view.target;
    const context = canvas.getContext("2d");
    if (!context) {
        return true;
    }
    const parent = this.getRenderingCanvas()!;

    OnBeforeViewRenderObservable.notifyObservers(view);
    const camera = view.camera;
    let previewCamera: Nullable<Camera> = null;
    let previewCameras: Nullable<Camera[]> = null;
    let scene: Nullable<Scene> = null;
    if (camera) {
        scene = Array.isArray(camera) ? camera[0].getScene() : camera.getScene();

        previewCamera = scene.activeCamera;
        previewCameras = scene.activeCameras;

        if (Array.isArray(camera)) {
            scene.activeCameras = camera;
        } else {
            scene.activeCamera = camera;
            scene.activeCameras = null;
        }
    }
    this.activeView = view;

    if (view.customResize) {
        view.customResize(canvas);
    } else {
        // Set sizes
        const width = Math.floor(canvas.clientWidth / this._hardwareScalingLevel);
        const height = Math.floor(canvas.clientHeight / this._hardwareScalingLevel);

        const dimsChanged = width !== canvas.width || parent.width !== canvas.width || height !== canvas.height || parent.height !== canvas.height;
        if (canvas.clientWidth && canvas.clientHeight && dimsChanged) {
            canvas.width = width;
            canvas.height = height;
            this.setSize(width, height);
        }
    }

    if (!parent.width || !parent.height) {
        return false;
    }

    // Render the frame
    this._renderFrame();

    this.flushFramebuffer();

    // Copy to target
    if (view.clearBeforeCopy) {
        context.clearRect(0, 0, parent.width, parent.height);
    }
    context.drawImage(parent, 0, 0);

    // Restore
    if (scene) {
        scene.activeCameras = previewCameras;
        scene.activeCamera = previewCamera;
    }
    OnAfterViewRenderObservable.notifyObservers(view);
    return true;
};

AbstractEngine.prototype._renderViews = function () {
    if (!this.views || this.views.length === 0) {
        return false;
    }

    const parent = this.getRenderingCanvas();

    if (!parent) {
        return false;
    }

    let inputElementView;
    for (const view of this.views) {
        if (!view.enabled) {
            continue;
        }
        const canvas = view.target;
        // Always render the view correspondent to the inputElement for last
        if (canvas === this.inputElement) {
            inputElementView = view;
            continue;
        }

        if (!this._renderViewStep(view)) {
            return false;
        }
    }

    if (inputElementView) {
        if (!this._renderViewStep(inputElementView)) {
            return false;
        }
    }

    this.activeView = null;

    return true;
};
