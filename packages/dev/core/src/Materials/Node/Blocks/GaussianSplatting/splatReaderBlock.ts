import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * Block used for Reading components of the Gaussian Splatting
 */
export class SplatReaderBlock extends NodeMaterialBlock {
    /**
     * Create a new SplatReaderBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex);

        this._isUnique = true;

        this.registerInput("splatIndex", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Vertex);

        this.registerOutput("splatPosition", NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockTargets.Vertex);
        this.registerOutput("splatColor", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Vertex);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SplatReaderBlock";
    }

    /**
     * Gets the splat index input component
     */
    public get splatIndex(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the splatPosition output component
     */
    public get splatPosition(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the splatColor output component
     */
    public get splatColor(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        //state._excludeVariableName("splatColor");
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            return;
        }

        // Emit code
        const comments = `//${this.name}`;
        state._emit2DSampler("covariancesATexture");
        state._emit2DSampler("covariancesBTexture");
        state._emit2DSampler("centersTexture");
        state._emit2DSampler("colorsTexture");

        state._emitFunctionFromInclude("gaussianSplattingVertexDeclaration", comments);
        state._emitVaryingFromString("vPosition", NodeMaterialBlockConnectionPointTypes.Vector2);
        state._emitUniformFromString("dataTextureSize", NodeMaterialBlockConnectionPointTypes.Vector2);
        const splatIndex = this.splatIndex;
        const splatPosition = this.splatPosition;
        const splatColor = this.splatColor;

        const splatVariablename = state._getFreeVariableName("splat");
        state.compilationString += `Splat ${splatVariablename} = readSplat(${splatIndex.associatedVariableName});\n`;

        state.compilationString += "vec3 covA = splat.covA; vec3 covB = splat.covB;\n";
        state.compilationString += "vPosition = position;";
        state.compilationString += `${state._declareOutput(splatPosition)} = ${splatVariablename}.center;\n`;
        state.compilationString += `${state._declareOutput(splatColor)} = ${splatVariablename}.color;\n`;

        return this;
    }
}

RegisterClass("BABYLON.SplatReaderBlock", SplatReaderBlock);
