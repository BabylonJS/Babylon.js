import { Engine } from "../engine";
import type { Camera } from "../../Cameras/camera";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Observable } from "../../Misc/observable";

/**
 * Class used to define an additional view for the engine
 * @see https://doc.babylonjs.com/divingDeeper/scene/multiCanvas
 */
export class EngineView {
    /**
     * A randomly generated unique id
     */
    readonly id: string;
    /** Defines the canvas where to render the view */
    target: HTMLCanvasElement;
    /** Defines an optional camera used to render the view (will use active camera else) */
    camera?: Camera;
    /** Indicates if the destination view canvas should be cleared before copying the parent canvas. Can help if the scene clear color has alpha < 1 */
    clearBeforeCopy?: boolean;
    /** Indicates if the view is enabled (true by default) */
    enabled: boolean;
    /** Defines a custom function to handle canvas size changes. (the canvas to render into is provided to the callback) */
    customResize?: (canvas: HTMLCanvasElement) => void;
}

declare module "../../Engines/engine" {
    export interface Engine {
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
         * @see https://doc.babylonjs.com/how_to/multi_canvases
         */
        activeView: Nullable<EngineView>;

        /** Gets or sets the list of views */
        views: EngineView[];

        /**
         * Register a new child canvas
         * @param canvas defines the canvas to register
         * @param camera defines an optional camera to use with this canvas (it will overwrite the scene.camera for this view)
         * @param clearBeforeCopy Indicates if the destination view canvas should be cleared before copying the parent canvas. Can help if the scene clear color has alpha < 1
         * @returns the associated view
         */
        registerView(canvas: HTMLCanvasElement, camera?: Camera, clearBeforeCopy?: boolean): EngineView;

        /**
         * Remove a registered child canvas
         * @param canvas defines the canvas to remove
         * @returns the current engine
         */
        unRegisterView(canvas: HTMLCanvasElement): Engine;
    }
}

const _onBeforeViewRenderObservable = new Observable<EngineView>();
const _onAfterViewRenderObservable = new Observable<EngineView>();

Object.defineProperty(Engine.prototype, "onBeforeViewRenderObservable", {
    get: function (this: Engine) {
        return _onBeforeViewRenderObservable;
    },
});

Object.defineProperty(Engine.prototype, "onAfterViewRenderObservable", {
    get: function (this: Engine) {
        return _onAfterViewRenderObservable;
    },
});

Object.defineProperty(Engine.prototype, "inputElement", {
    get: function (this: Engine) {
        return this._inputElement;
    },
    set: function (this: Engine, value: HTMLElement) {
        if (this._inputElement !== value) {
            this._inputElement = value;
            this._onEngineViewChanged?.();
        }
    },
});

Engine.prototype.getInputElement = function (): Nullable<HTMLElement> {
    return this.inputElement || this.getRenderingCanvas();
};

Engine.prototype.registerView = function (canvas: HTMLCanvasElement, camera?: Camera, clearBeforeCopy?: boolean): EngineView {
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

    if (camera) {
        camera.onDisposeObservable.add(() => {
            this.unRegisterView(canvas);
        });
    }

    return newView;
};

Engine.prototype.unRegisterView = function (canvas: HTMLCanvasElement): Engine {
    if (!this.views) {
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

Engine.prototype._renderViews = function () {
    if (!this.views) {
        return false;
    }

    const parent = this.getRenderingCanvas();

    if (!parent) {
        return false;
    }

    for (const view of this.views) {
        if (!view.enabled) {
            continue;
        }
        const canvas = view.target;
        const context = canvas.getContext("2d");
        if (!context) {
            continue;
        }
        _onBeforeViewRenderObservable.notifyObservers(view);
        const camera = view.camera;
        let previewCamera: Nullable<Camera> = null;
        let scene: Nullable<Scene> = null;
        if (camera) {
            scene = camera.getScene();

            if (scene.activeCameras && scene.activeCameras.length) {
                continue;
            }

            this.activeView = view;

            previewCamera = scene.activeCamera;
            scene.activeCamera = camera;
        }

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
        if (previewCamera && scene) {
            scene.activeCamera = previewCamera;
        }
        _onAfterViewRenderObservable.notifyObservers(view);
    }

    this.activeView = null;

    return true;
};
