import type { FrameGraphConnectionPoint } from "./frameGraphBlockConnectionPoint";

/**
 * Class used to store node based geometry build state
 */
export class FrameGraphBuildState {
    /** Gets or sets the list of non connected mandatory inputs */
    public notConnectedNonOptionalInputs: FrameGraphConnectionPoint[] = [];

    /** Gets or sets the build identifier */
    public buildId: number;

    /** Gets or sets a boolean indicating that verbose mode is on */
    public verbose: boolean;

    /**
     * Emits console errors and exceptions if there is a failing check
     */
    public emitErrors() {
        let errorMessage = "";
        for (const notConnectedInput of this.notConnectedNonOptionalInputs) {
            errorMessage += `input ${notConnectedInput.name} from block ${
                notConnectedInput.ownerBlock.name
            }[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }
        if (errorMessage) {
            // eslint-disable-next-line no-throw-literal
            throw "Build of NodeGeometry failed:\n" + errorMessage;
        }
    }
}
