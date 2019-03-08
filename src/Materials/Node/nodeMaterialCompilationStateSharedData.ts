import { NodeMaterialConnectionPoint } from './nodeMaterialBlockConnectionPoint';

/**
 * Class used to store shared data between 2 NodeMaterialCompilationState
 */
export class NodeMaterialCompilationStateSharedData {
    /**
     * Gets the list of emitted varyings
     */
    public varyings = new Array<string>();

    /**
     * Gets the varying declaration string
     */
    public varyingDeclaration = "";

    /**
     * Build Id used to avoid multiple recompilations
     */
    public buildId: number;

    /** List of emitted variables */
    public variableNames: { [key: string]: number } = {};

    /** Should emit comments? */
    public emitComments: boolean;

    /** Emit build activity */
    public verbose: boolean;

    /**
     * Gets the compilation hints emitted at compilation time
     */
    public hints = {
        needWorldMatrix: false,
        needViewMatrix: false,
        needProjectionMatrix: false,
        needViewProjectionMatrix: false,
        needWorldViewMatrix: false,
        needWorldViewProjectionMatrix: false,
        needFogColor: false,
        needFogParameters: false
    };

    /**
     * List of compilation checks
     */
    public checks = {
        emitVertex: false,
        emitFragment: false,
        notConnectedNonOptionalInputs: new Array<NodeMaterialConnectionPoint>()
    };

    /**
     * Emits console errors and exceptions if there is a failing check
     */
    public emitErrors() {
        let shouldThrowError = false;

        if (!this.checks.emitVertex) {
            shouldThrowError = true;
            console.error("NodeMaterial does not have a vertex output. You need to at least add a block that generates a glPosition value.");
        }
        if (!this.checks.emitFragment) {
            shouldThrowError = true;
            console.error("NodeMaterial does not have a fragment output. You need to at least add a block that generates a glFragColor value.");
        }
        for (var notConnectedInput of this.checks.notConnectedNonOptionalInputs) {
            shouldThrowError = true;
            console.error(`input ${notConnectedInput.name} from block ${notConnectedInput.ownerBlock.name}[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.`);
        }

        if (shouldThrowError) {
            throw "Build of NodeMaterial failed.";
        }
    }
}