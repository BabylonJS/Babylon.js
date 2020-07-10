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
         * @returns the associated view
         */
        registerView(canvas: HTMLCanvasElement, camera?: Camera): EngineView;

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

Engine.prototype.registerView = function(canvas: HTMLCanvasElement, camera?: Camera): EngineView {
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

    let newView = {target: canvas, camera: camera};
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

            if (scene.activeCameras.length) {
                continue;
            }

            this.activeView = view;

            previewCamera = scene.activeCamera;
            scene.activeCamera = camera;
        }

        // Set sizes
        if (canvas.clientWidth && canvas.clientHeight) {
            const dimensionsMismatch = canvas.clientWidth !== parent.width || canvas.clientHeight !== parent.height;
            if(dimensionsMismatch) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                parent.width = canvas.clientWidth;
                parent.height = canvas.clientHeight;
                this.resize();
            }
            
        }

        if (!parent.width || !parent.height) {
            return false;
        }
        
        // Render the frame
        this._renderFrame();

        // Copy to target
        context.drawImage(parent, 0, 0);

        // Restore
        if (previewCamera && scene) {
            scene.activeCamera = previewCamera;
        }
    }

    this.activeView = null;

    return true;
};
