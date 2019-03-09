import { NodeMaterialConnectionPoint } from './nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlock } from './nodeMaterialBlock';

/**
 * Class used to store shared data between 2 NodeMaterialBuildState
 */
export class NodeMaterialBuildStateSharedData {
    /**
     * Gets the list of emitted varyings
     */
    public varyings = new Array<string>();

    /**
     * Gets the varying declaration string
     */
    public varyingDeclaration = "";

    /**
     * Uniform connection points
     */
    public uniformConnectionPoints = new Array<NodeMaterialConnectionPoint>();

    /**
     * Active blocks (Blocks that need to set data to the effect)
     */
    public activeBlocks = new Array<NodeMaterialBlock>();

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
        needFogParameters: false,
        needAlphaBlending: false,
        needAlphaTesting: false
    };

    /**
     * List of compilation checks
     */
    public checks = {
        emitVertex: false,
        emitFragment: false,
        notConnectedNonOptionalInputs: new Array<NodeMaterialConnectionPoint>()
    };

    /** Creates a new shared data */
    public constructor() {
        // Exclude usual attributes from free variable names
        this.variableNames["position"] = 0;
        this.variableNames["normal"] = 0;
        this.variableNames["tangent"] = 0;
        this.variableNames["uv"] = 0;
        this.variableNames["uv2"] = 0;
        this.variableNames["uv3"] = 0;
        this.variableNames["uv4"] = 0;
        this.variableNames["uv4"] = 0;
        this.variableNames["uv5"] = 0;
        this.variableNames["uv6"] = 0;
        this.variableNames["color"] = 0;
        this.variableNames["matricesIndices"] = 0;
        this.variableNames["matricesWeights"] = 0;
        this.variableNames["matricesIndicesExtra"] = 0;
        this.variableNames["matricesWeightsExtra"] = 0;
    }

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