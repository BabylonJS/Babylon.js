import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { NodeMaterialDefines, NodeMaterial } from "../../nodeMaterial";
import { InputBlock } from "../Input/inputBlock";
import type { BaseTexture } from "../../../Textures/baseTexture";
import type { Nullable } from "../../../../types";
import { RegisterClass } from "../../../../Misc/typeStore";
import { Texture } from "../../../Textures/texture";
import type { Scene } from "../../../../scene";

/**
 * Base block used for the particle texture
 */
export class ParticleTextureBlock extends NodeMaterialBlock {
    private _samplerName = "diffuseSampler";
    private _linearDefineName: string;
    private _gammaDefineName: string;
    private _tempTextureRead: string;

    /**
     * Gets or sets the texture associated with the node
     */
    public texture: Nullable<BaseTexture>;

    /**
     * Gets or sets a boolean indicating if content needs to be converted to gamma space
     */
    public convertToGammaSpace = false;

    /**
     * Gets or sets a boolean indicating if content needs to be converted to linear space
     */
    public convertToLinearSpace = false;

    /**
     * Create a new ParticleTextureBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = false;

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.AutoDetect, false, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Vector2 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleTextureBlock";
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the rgba output component
     */
    public get rgba(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the rgb output component
     */
    public get rgb(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the r output component
     */
    public get r(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the g output component
     */
    public get g(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the b output component
     */
    public get b(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the a output component
     */
    public get a(): NodeMaterialConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("diffuseSampler");
    }

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.uv.isConnected) {
            let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "particle_uv" && additionalFilteringInfo(b));

            if (!uvInput) {
                uvInput = new InputBlock("uv");
                uvInput.setAsAttribute("particle_uv");
            }
            uvInput.output.connectTo(this.uv);
        }
    }

    public override prepareDefines(defines: NodeMaterialDefines) {
        defines.setValue(this._linearDefineName, this.convertToGammaSpace, true);
        defines.setValue(this._gammaDefineName, this.convertToLinearSpace, true);
    }

    public override isReady() {
        if (this.texture && !this.texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    private _writeOutput(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string) {
        state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle};\n`;

        state.compilationString += `#ifdef ${this._linearDefineName}\n`;
        state.compilationString += `${output.associatedVariableName} = toGammaSpace(${output.associatedVariableName});\n`;
        state.compilationString += `#endif\n`;

        state.compilationString += `#ifdef ${this._gammaDefineName}\n`;
        state.compilationString += `${output.associatedVariableName} = toLinearSpace(${output.associatedVariableName});\n`;
        state.compilationString += `#endif\n`;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            return;
        }

        this._tempTextureRead = state._getFreeVariableName("tempTextureRead");

        state._emit2DSampler(this._samplerName);

        state.sharedData.blockingBlocks.push(this);
        state.sharedData.textureBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);

        this._linearDefineName = state._getFreeDefineName("ISLINEAR");
        this._gammaDefineName = state._getFreeDefineName("ISGAMMA");

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${state._generateTextureSample(this.uv.associatedVariableName, this._samplerName)};\n`;

        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                this._writeOutput(state, output, output.name);
            }
        }

        return this;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;
        if (this.texture && !this.texture.isRenderTarget) {
            serializationObject.texture = this.texture.serialize();
        }

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.convertToGammaSpace = serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = !!serializationObject.convertToLinearSpace;

        if (serializationObject.texture) {
            rootUrl = serializationObject.texture.url.indexOf("data:") === 0 ? "" : rootUrl;
            this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl) as Texture;
        }
    }
}

RegisterClass("BABYLON.ParticleTextureBlock", ParticleTextureBlock);
