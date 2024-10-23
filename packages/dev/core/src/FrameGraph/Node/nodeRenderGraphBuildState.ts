// eslint-disable-next-line import/no-internal-modules
import type { Nullable, NodeRenderGraphConnectionPoint, Observable } from "core/index";
import { Logger } from "../../Misc/logger";

/**
 * Class used to store node based render graph build state
 */
export class NodeRenderGraphBuildState {
    /** Gets or sets the build identifier */
    public buildId: number;

    /** Gets or sets a boolean indicating that verbose mode is on */
    public verbose = false;

    /**
     * Gets or sets the list of non connected mandatory inputs
     * @internal
     */
    public _notConnectedNonOptionalInputs: NodeRenderGraphConnectionPoint[] = [];

    /**
     * Emits console errors and exceptions if there is a failing check
     * @param errorObservable defines an Observable to send the error message
     * @returns true if all checks pass
     */
    public emitErrors(errorObservable: Nullable<Observable<string>> = null): boolean {
        let errorMessage = "";
        for (const notConnectedInput of this._notConnectedNonOptionalInputs) {
            errorMessage += `input "${notConnectedInput.name}" from block "${
                notConnectedInput.ownerBlock.name
            }"[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }
        if (errorMessage) {
            if (errorObservable) {
                errorObservable.notifyObservers(errorMessage);
            }
            Logger.Error("Build of node render graph failed:\n" + errorMessage);

            return false;
        }
        return true;
    }
}
