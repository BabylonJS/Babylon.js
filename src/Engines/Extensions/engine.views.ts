import { Engine } from "../engine";
import { Camera } from '../../Cameras/camera';
import { Nullable } from '../../types';
import { Scene } from '../../scene';

/**
 * Class used to define an additional view for the engine
 * @see https://doc.babylonjs.com/how_to/multi_canvases
 */
export class EngineView {
    /** Defines the canvas where to render the view */
    target: HTMLCanvasElement;
    /** Defines an optional camera used to render the view (will use active camera else) */
    camera?: Camera;
    /** Indicates if the destination view canvas should be cleared before copying the parent canvas. Can help if the scene clear color has alpha < 1 */
    clearBeforeCopy?: boolean;
}

declare module "../../Engines/engine" {
    export interface Engine {

        /**
         * Gets or sets the  HTML element to use for attaching events
         */
        inputElement: Nullable<HTMLElement>;

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

Engine.prototype.getInputElement = function(): Nullable<HTMLElement> {
    return this.inputElement || this.getRenderingCanvas();
};

Engine.prototype.registerView = function(canvas: HTMLCanvasElement, camera?: Camera, clearBeforeCopy?: boolean): EngineView {
    if (!this.views) {
        this.views = [];
    }

    for (var view of this.views) {
        if (view.target === canvas) {
            return view;
        }
    }

    let masterCanvas = this.getRenderingCanvas();
    if (masterCanvas) {
        canvas.width = masterCanvas.width;
        canvas.height = masterCanvas.height;
    }

    let newView = {target: canvas, camera, clearBeforeCopy};
    this.views.push(newView);

    if (camera) {
        camera.onDisposeObservable.add(() => {
            this.unRegisterView(canvas);
        });
    }

    return newView;
};

Engine.prototype.unRegisterView = function(canvas: HTMLCanvasElement): Engine {
    if (!this.views) {
        return this;
    }

    for (var view of this.views) {
        if (view.target === canvas) {
            let index = this.views.indexOf(view);

            if (index !== -1) {
                this.views.splice(index, 1);
            }
            break;
        }
    }

    return this;
};

Engine.prototype._renderViews = function() {
    if (!this.views) {
        return false;
    }

    let parent = this.getRenderingCanvas();

    if (!parent) {
        return false;
    }

    for (var view of this.views) {
        let canvas = view.target;
        let context = canvas.getContext("2d");
        if (!context) {
            continue;
        }
        let camera = view.camera;
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

        // Set sizes
        const width = Math.floor(canvas.clientWidth / this._hardwareScalingLevel);
        const height = Math.floor(canvas.clientHeight / this._hardwareScalingLevel);

        const dimsChanged =
            width !== canvas.width || parent.width !== canvas.width ||
            height !== canvas.height || parent.height !== canvas.height;
        if (canvas.clientWidth && canvas.clientHeight && dimsChanged) {
            canvas.width = width;
            canvas.height = height;
            this.setSize(width, height);
        }

        if (!parent.width || !parent.height) {
            return false;
        }

        // Render the frame
        this._renderFrame();

        // Copy to target
        if (view.clearBeforeCopy) {
            context.clearRect(0, 0, parent.width, parent.height);
        }
        context.drawImage(parent, 0, 0);

        // Restore
        if (previewCamera && scene) {
            scene.activeCamera = previewCamera;
        }
    }

    this.activeView = null;

    return true;
};
