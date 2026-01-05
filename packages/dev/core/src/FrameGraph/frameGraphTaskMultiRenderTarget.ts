import type { FrameGraphRenderPass, LayerAndFaceIndex } from "core/index";
import { FrameGraphTask } from "./frameGraphTask";

/**
 * Base class for frame graph tasks that involve multi-target rendering.
 */
export abstract class FrameGraphTaskMultiRenderTarget extends FrameGraphTask {
    private _outputLayerAndFaceIndices: LayerAndFaceIndex[];
    private _layerAndFaceIndicesUpdated = false;

    /**
     * Sets the output layer and face indices for multi-target rendering.
     * @param indices The array of layer and face indices.
     */
    public setOutputLayerAndFaceIndices(indices: LayerAndFaceIndex[]) {
        this._outputLayerAndFaceIndices = indices;
        this._layerAndFaceIndicesUpdated = indices.length > 0;
    }

    protected _updateLayerAndFaceIndices(pass: FrameGraphRenderPass) {
        if (this._layerAndFaceIndicesUpdated) {
            pass.setOutputLayerAndFaceIndices(this._outputLayerAndFaceIndices);
            this._layerAndFaceIndicesUpdated = false;
        }
    }
}
