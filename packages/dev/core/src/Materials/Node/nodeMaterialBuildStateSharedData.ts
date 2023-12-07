import type { NodeMaterialConnectionPoint } from "./nodeMaterialBlockConnectionPoint";
import type { NodeMaterialBlock } from "./nodeMaterialBlock";
import type { InputBlock } from "./Blocks/Input/inputBlock";
import type { Scene } from "../../scene";
import type { Immutable } from "../../types";
import type { NodeMaterial, NodeMaterialTextureBlocks } from "./nodeMaterial";

/**
 * Class used to store shared data between 2 NodeMaterialBuildState
 */
export class NodeMaterialBuildStateSharedData {
    /**
     * The node material we are currently building
     */
    public nodeMaterial: NodeMaterial;

    /**
     * Gets the list of emitted varyings
     */
    public temps: string[] = [];

    /**
     * Gets the list of emitted varyings
     */
    public varyings: string[] = [];

    /**
     * Gets the varying declaration string
     */
    public varyingDeclaration = "";

    /**
     * List of the fragment output nodes
     */
    public fragmentOutputNodes: Immutable<Array<NodeMaterialBlock>>;

    /**
     * Input blocks
     */
    public inputBlocks: InputBlock[] = [];

    /**
     * Input blocks
     */
    public textureBlocks: NodeMaterialTextureBlocks[] = [];

    /**
     * Bindable blocks (Blocks that need to set data to the effect)
     */
    public bindableBlocks: NodeMaterialBlock[] = [];

    /**
     * Bindable blocks (Blocks that need to set data to the effect) that will always be called (by bindForSubMesh), contrary to bindableBlocks that won't be called if _mustRebind() returns false
     */
    public forcedBindableBlocks: NodeMaterialBlock[] = [];

    /**
     * List of blocks that can provide a compilation fallback
     */
    public blocksWithFallbacks: NodeMaterialBlock[] = [];

    /**
     * List of blocks that can provide a define update
     */
    public blocksWithDefines: NodeMaterialBlock[] = [];

    /**
     * List of blocks that can provide a repeatable content
     */
    public repeatableContentBlocks: NodeMaterialBlock[] = [];

    /**
     * List of blocks that can provide a dynamic list of uniforms
     */
    public dynamicUniformBlocks: NodeMaterialBlock[] = [];

    /**
     * List of blocks that can block the isReady function for the material
     */
    public blockingBlocks: NodeMaterialBlock[] = [];

    /**
     * Gets the list of animated inputs
     */
    public animatedInputs: InputBlock[] = [];

    /**
     * Build Id used to avoid multiple recompilations
     */
    public buildId: number;

    /** List of emitted variables */
    public variableNames: { [key: string]: number } = {};

    /** List of emitted defines */
    public defineNames: { [key: string]: number } = {};

    /** Should emit comments? */
    public emitComments: boolean;

    /** Emit build activity */
    public verbose: boolean;

    /** Gets or sets the hosting scene */
    public scene: Scene;

    /**
     * Gets the compilation hints emitted at compilation time
     */
    public hints = {
        needWorldViewMatrix: false,
        needWorldViewProjectionMatrix: false,
        needAlphaBlending: false,
        needAlphaTesting: false,
    };

    /**
     * List of compilation checks
     */
    public checks = {
        emitVertex: false,
        emitFragment: false,
        notConnectedNonOptionalInputs: new Array<NodeMaterialConnectionPoint>(),
    };

    /**
     * Is vertex program allowed to be empty?
     */
    public allowEmptyVertexProgram: boolean = false;

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
        this.variableNames["uv5"] = 0;
        this.variableNames["uv6"] = 0;
        this.variableNames["color"] = 0;
        this.variableNames["matricesIndices"] = 0;
        this.variableNames["matricesWeights"] = 0;
        this.variableNames["matricesIndicesExtra"] = 0;
        this.variableNames["matricesWeightsExtra"] = 0;
        this.variableNames["diffuseBase"] = 0;
        this.variableNames["specularBase"] = 0;
        this.variableNames["worldPos"] = 0;
        this.variableNames["shadow"] = 0;
        this.variableNames["view"] = 0;

        // Exclude known varyings
        this.variableNames["vTBN"] = 0;

        // Exclude defines
        this.defineNames["MAINUV0"] = 0;
        this.defineNames["MAINUV1"] = 0;
        this.defineNames["MAINUV2"] = 0;
        this.defineNames["MAINUV3"] = 0;
        this.defineNames["MAINUV4"] = 0;
        this.defineNames["MAINUV5"] = 0;
        this.defineNames["MAINUV6"] = 0;
        this.defineNames["MAINUV7"] = 0;
    }

    /**
     * Emits console errors and exceptions if there is a failing check
     */
    public emitErrors() {
        let errorMessage = "";

        if (!this.checks.emitVertex && !this.allowEmptyVertexProgram) {
            errorMessage += "NodeMaterial does not have a vertex output. You need to at least add a block that generates a glPosition value.\n";
        }
        if (!this.checks.emitFragment) {
            errorMessage += "NodeMaterial does not have a fragment output. You need to at least add a block that generates a glFragColor value.\n";
        }
        for (const notConnectedInput of this.checks.notConnectedNonOptionalInputs) {
            errorMessage += `input ${notConnectedInput.name} from block ${
                notConnectedInput.ownerBlock.name
            }[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }

        if (errorMessage) {
            throw "Build of NodeMaterial failed:\n" + errorMessage;
        }
    }
}
