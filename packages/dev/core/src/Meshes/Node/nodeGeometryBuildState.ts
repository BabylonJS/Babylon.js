import type{ NodeGeometryConnectionPoint } from "./nodeGeometryBlockConnectionPoint";

/**
 * Class used to store node based geometry build state
 */
export class NodeGeometryBuildState {
    public notConnectedNonOptionalInputs: NodeGeometryConnectionPoint[] = [];
    public buildId: number;
    public verbose: boolean;

    /**
     * Emits console errors and exceptions if there is a failing check
     */
    public emitErrors() {
        let errorMessage = "";

        for (const notConnectedInput of this.notConnectedNonOptionalInputs) {
            errorMessage += `input ${notConnectedInput.name} from block ${
                notConnectedInput.ownerBlock.name
            }[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\r\n`;
        }

        if (errorMessage) {
            throw "Build of NodeGeometry failed:\r\n" + errorMessage;
        }
    }
}
