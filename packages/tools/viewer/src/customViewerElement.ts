import type { CanvasViewerOptions } from "./viewerFactory";
import type { TransformNode } from "core/Meshes";
import { customElement } from "lit/decorators.js";
import { Viewer } from "./viewer";
import { ViewerElement } from "./viewerElement";

// TODO: DELETE THIS FILE

export class Viewer2 extends Viewer {
    public async loadAnotherModel() {
        const model = await this._loadModel("https://raw.githubusercontent.com/BabylonJS/Assets/master/meshes/flightHelmet.glb");
        (model.assetContainer.rootNodes[0] as TransformNode).scaling.setAll(0.03);
        this._model = model;
        return model;
    }
}

@customElement("babylon-viewer-2")
export class ViewerElement2 extends ViewerElement<Viewer2> {
    override async _createViewer(canvas: HTMLCanvasElement, options: CanvasViewerOptions) {
        const viewer2 = await super._createViewer(canvas, options);
        viewer2.loadAnotherModel();
        return viewer2;
    }

    public constructor() {
        super(Viewer2);
    }
}
