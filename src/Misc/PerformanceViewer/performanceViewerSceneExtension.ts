import { Scene } from "../../scene";
import { PerformanceViewerCollector } from "./performanceViewerCollector";
import { CanvasGraphService } from "./canvasGraphService";
import { Tools } from "../tools";
import { Observer } from "..";
import { Nullable } from "../..";

// Should commit with false while the design is not finalized.
const isEnabled = false;
declare module "../../scene" {
    export interface Scene {
        /**
         * Standalone performance viewer element with a simplified view of perfomance independent of the inspector.
         */
        _standalonePerfViewerCanvas: HTMLCanvasElement;
        /**
         * Service that draws the performance graphs on the canvas
         */
        _standalonePerfViewerService: CanvasGraphService;
        /**
         * Asks the service to update after the scene is rendered
         */
        _standalonePerfViewerSceneObserver: Nullable<Observer<Scene>>;
    }
}

Scene.prototype.getPerfCollector = function (this: Scene): PerformanceViewerCollector {
    if (!this._perfCollector) {
        this._perfCollector = new PerformanceViewerCollector(this);
    }

    return this._perfCollector;
};

/**
 * Add the standalone performance viewer as a child to element parentElement
 * @param parentElement the HTML element to which the perf viewer will be appended.
 */
Scene.prototype.addPerfViewer = function (parentElement: HTMLElement) {
    if (!isEnabled) {
        Tools.Warn("This feature is not enabled yet.");
        return;
    }
    this.getPerfCollector().start();

    this._standalonePerfViewerCanvas = document.createElement("canvas");

    parentElement.appendChild(this._standalonePerfViewerCanvas);

    this._standalonePerfViewerService = new CanvasGraphService(this._standalonePerfViewerCanvas, { datasets: this.getPerfCollector().datasets });
    this._standalonePerfViewerSceneObserver = this.onAfterRenderObservable.add(() => {
        this._standalonePerfViewerService.update();
    });

    // Place the standalone perf viewer in the top left corner of the parent, but this should be
    // dependent on options
    this._standalonePerfViewerCanvas.style.position = "absolute";
    this._standalonePerfViewerCanvas.style.top = "0px";
    this._standalonePerfViewerCanvas.style.left = "0px";
    this._standalonePerfViewerCanvas.style.fontSize = "10px";
};

/**
 * Remove performance viewer from parent and dispose of any of its resources.
 */
Scene.prototype.removePerfViewer = function () {
    if (!isEnabled) {
        Tools.Warn("This feature is not enabled yet.");
        return;
    }
    this.getPerfCollector().stop();

    this.onAfterRenderObservable.remove(this._standalonePerfViewerSceneObserver);
    this._standalonePerfViewerSceneObserver = null;

    this._standalonePerfViewerCanvas.parentElement?.removeChild(this._standalonePerfViewerCanvas);
};
