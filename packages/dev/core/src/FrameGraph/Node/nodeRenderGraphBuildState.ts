import type { FrameGraph } from "../frameGraph";
import type { NodeRenderGraphConnectionPoint } from "./nodeRenderGraphBlockConnectionPoint";

/**
 * Class used to store node based render graph build state
 */
export class NodeRenderGraphBuildState {
    /** Gets or sets the build identifier */
    public buildId: number;

    /** Gets or sets the frame graph */
    public frameGraph: FrameGraph;

    /** Gets or sets a boolean indicating that verbose mode is on */
    public verbose = false;

    /**
     * Gets or sets the list of non connected mandatory inputs
     * @internal
     */
    public _notConnectedNonOptionalInputs: NodeRenderGraphConnectionPoint[] = [];

    /**
     * Emits console errors and exceptions if there is a failing check
     */
    public emitErrors() {
        let errorMessage = "";
        for (const notConnectedInput of this._notConnectedNonOptionalInputs) {
            errorMessage += `input "${notConnectedInput.name}" from block "${
                notConnectedInput.ownerBlock.name
            }"[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }
        if (errorMessage) {
            throw new Error("Build of node render graph failed:\n" + errorMessage);
        }
    }
}
