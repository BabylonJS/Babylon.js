import { Engine } from "../engine";
import { Camera } from '../../Cameras/camera';

/**
 * Class used to define an additional view for the engine
 * @see https://doc.babylonjs.com/how_to/multi_canvases
 */
export class EngineView {
    /** Defines the canvas where to render the view */
    target: HTMLCanvasElement;
    /** Defines the camera used to render the view */
    camera: Camera;
}

declare module "../../Engines/engine" {
    export interface Engine {

        /** Gets or sets the list of views */
        views: EngineView[];

        /**
         * Register a new child canvas
         * @param canvas defines the canvas to register
         * @param camera defines the camera to use with this canvas (it will overwrite the scene.camera for this view)
         * @returns the current engine
         */
        registerView(canvas: HTMLCanvasElement, camera: Camera): Engine;

        /**
         * Remove a registered child canvas
         * @param canvas defines the canvas to remove
         * @returns the current engine
         */
        unRegisterView(canvas: HTMLCanvasElement): Engine;
    }
}

Engine.prototype.registerView = function(canvas: HTMLCanvasElement, camera: Camera): Engine {
    if (!this.views) {
        this.views = [];
    }

    for (var view of this.views) {
        if (view.target === canvas) {
            return this;
        }
    }

    this.views.push({target: canvas, camera: camera});

    camera.onDisposeObservable.add(() => {
        this.unRegisterView(canvas);
    });

    return this;
};

Engine.prototype.unRegisterView = function(canvas: HTMLCanvasElement): Engine {
    if (!this.views) {
        return this;
    }

    for (var view of this.views) {
        if (view.target = canvas) {
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
        return;
    }

    let parent = this.getRenderingCanvas();

    if (!parent) {
        return;
    }

    for (var view of this.views) {
        let canvas = view.target;
        let context = canvas.getContext("2d");
        if (!context) {
            continue;
        }
        let camera = view.camera;
        let scene = camera.getScene();

        if (scene.activeCameras.length) {
            continue;
        }

        let previewCamera = scene.activeCamera;
        scene.activeCamera = camera;

        // Render the frame
        this._renderFrame();

        // Copy to target
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        context.drawImage(parent, 0, 0, parent.clientWidth, parent.clientHeight, 0, 0, canvas.clientWidth, canvas.clientHeight);

        // Restore
        scene.activeCamera = previewCamera;
    }
};
