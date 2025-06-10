import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { NodeMaterialDefines } from "../../nodeMaterial";
import type { BaseTexture } from "../../../Textures/baseTexture";
import type { Nullable } from "../../../../types";
import { RegisterClass } from "../../../../Misc/typeStore";
import { Texture } from "../../../Textures/texture";
import type { Scene } from "../../../../scene";
import type { InputBlock } from "../Input/inputBlock";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "core/Engines/constants";

/**
 * Base block used as input for post process
 */
export class CurrentScreenBlock extends NodeMaterialBlock {
    protected _samplerName = "textureSampler";
    protected _linearDefineName: string;
    protected _gammaDefineName: string;
    protected _mainUVName: string;
    protected _tempTextureRead: string;

    /**
     * The name of the sampler to read the screen texture from.
     */
    public get samplerName(): string {
        return this._samplerName;
    }

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
     * Create a new CurrentScreenBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

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

        this._inputs[0]._prioritizeVertex = false;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "CurrentScreenBlock";
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
        state._excludeVariableName(this._samplerName);
    }

    public override get target() {
        if (!this.uv.isConnected) {
            return NodeMaterialBlockTargets.VertexAndFragment;
        }

        if (this.uv.sourceBlock!.isInput) {
            return NodeMaterialBlockTargets.VertexAndFragment;
        }

        return NodeMaterialBlockTargets.Fragment;
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

    protected _getMainUvName(state: NodeMaterialBuildState): string {
        return "vMain" + this.uv.associatedVariableName;
    }

    protected _injectVertexCode(state: NodeMaterialBuildState) {
        const uvInput = this.uv;

        if (uvInput.connectedPoint!.ownerBlock.isInput) {
            const uvInputOwnerBlock = uvInput.connectedPoint!.ownerBlock as InputBlock;

            if (!uvInputOwnerBlock.isAttribute) {
                state._emitUniformFromString(uvInput.associatedVariableName, NodeMaterialBlockConnectionPointTypes.Vector2);
            }
        }

        state.compilationString += `${this._mainUVName} = ${uvInput.associatedVariableName}.xy;\n`;

        if (!this._outputs.some((o) => o.isConnectedInVertexShader)) {
            return;
        }

        this._writeTextureRead(state, true);

        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                this._writeOutput(state, output, output.name, true);
            }
        }
    }

    protected _writeTextureRead(state: NodeMaterialBuildState, vertexMode = false) {
        const uvInput = this.uv;

        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }
            const textureReadFunc =
                state.shaderLanguage === ShaderLanguage.GLSL
                    ? `texture2D(${this._samplerName},`
                    : `textureSampleLevel(${this._samplerName}, ${this._samplerName + Constants.AUTOSAMPLERSUFFIX},`;

            const complement = state.shaderLanguage === ShaderLanguage.GLSL ? "" : ", 0";

            state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${textureReadFunc} ${uvInput.associatedVariableName}${complement});\n`;
            return;
        }

        const textureReadFunc =
            state.shaderLanguage === ShaderLanguage.GLSL
                ? `texture2D(${this._samplerName},`
                : `textureSample(${this._samplerName}, ${this._samplerName + Constants.AUTOSAMPLERSUFFIX},`;

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${textureReadFunc} ${uvInput.associatedVariableName});\n`;
            return;
        }

        state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${textureReadFunc} ${this._mainUVName});\n`;
    }

    protected _writeOutput(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string, vertexMode = false) {
        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }

            state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle};\n`;

            return;
        }

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle};\n`;
            return;
        }

        state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle};\n`;

        state.compilationString += `#ifdef ${this._linearDefineName}\n`;
        state.compilationString += `${output.associatedVariableName} = toGammaSpace(${output.associatedVariableName});\n`;
        state.compilationString += `#endif\n`;

        state.compilationString += `#ifdef ${this._gammaDefineName}\n`;
        state.compilationString += `${output.associatedVariableName} = toLinearSpace(${output.associatedVariableName});\n`;
        state.compilationString += `#endif\n`;
    }

    protected _emitUvAndSampler(state: NodeMaterialBuildState) {
        state._emitVaryingFromString(this._mainUVName, NodeMaterialBlockConnectionPointTypes.Vector2);
        state._emit2DSampler(this._samplerName);
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        this._tempTextureRead = state._getFreeVariableName("tempTextureRead");

        if (state.sharedData.blockingBlocks.indexOf(this) < 0) {
            state.sharedData.blockingBlocks.push(this);
        }
        if (state.sharedData.textureBlocks.indexOf(this) < 0) {
            state.sharedData.textureBlocks.push(this);
        }
        if (state.sharedData.blocksWithDefines.indexOf(this) < 0) {
            state.sharedData.blocksWithDefines.push(this);
        }
        this._mainUVName = this._getMainUvName(state);

        this._emitUvAndSampler(state);

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            this._injectVertexCode(state);
            return;
        }

        // Fragment
        if (!this._outputs.some((o) => o.isConnectedInFragmentShader)) {
            return;
        }

        this._linearDefineName = state._getFreeDefineName("ISLINEAR");
        this._gammaDefineName = state._getFreeDefineName("ISGAMMA");

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        this._writeTextureRead(state);

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

RegisterClass("BABYLON.CurrentScreenBlock", CurrentScreenBlock);
