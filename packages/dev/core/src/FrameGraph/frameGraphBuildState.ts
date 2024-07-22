import type { AbstractEngine } from "core/Engines";
import type { FrameGraphConnectionPoint } from "./frameGraphBlockConnectionPoint";
import type { Scene } from "core/scene";

/**
 * Class used to store node based geometry build state
 */
export class FrameGraphBuildState {
    /** Engine used by the frame graph */
    public engine: AbstractEngine;

    /** Gets or sets the list of non connected mandatory inputs */
    public notConnectedNonOptionalInputs: FrameGraphConnectionPoint[] = [];

    /** Gets or sets the build identifier */
    public buildId: number;

    /** Gets or sets a boolean indicating that verbose mode is on */
    public verbose: boolean;

    /** Gets or sets a boolean indicating that textures created by the frame graph should be visible in the inspector */
    public debugTextures: boolean;

    /** Scene in which debugging textures are to be created */
    public scene?: Scene;

    /**
     * Emits console errors and exceptions if there is a failing check
     */
    public emitErrors() {
        let errorMessage = "";
        for (const notConnectedInput of this.notConnectedNonOptionalInputs) {
            errorMessage += `input "${notConnectedInput.name}" from block "${
                notConnectedInput.ownerBlock.name
            }"[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }
        if (errorMessage) {
            // eslint-disable-next-line no-throw-literal
            throw "Build of frame graph failed:\n" + errorMessage;
        }
    }
}
