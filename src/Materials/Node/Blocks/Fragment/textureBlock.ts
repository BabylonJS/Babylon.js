import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { BaseTexture } from '../../../Textures/baseTexture';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';

/**
 * Block used to read a texture from a sampler
 */
export class TextureBlock extends NodeMaterialBlock {
    private _defineName: string;

    /**
     * Gets or sets a boolean indicating that the block can automatically fetch the texture matrix
     */
    public autoConnectTextureMatrix = true;

    /**
     * Gets or sets a boolean indicating that the block can automatically select the uv channel based on texture
     */
    public autoSelectUV = true;

    /**
     * Create a new TextureBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("textureInfo", NodeMaterialBlockConnectionPointTypes.Vector2, true);

        this.registerInput("transformedUV", NodeMaterialBlockConnectionPointTypes.Vector2, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Texture, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("textureTransform", NodeMaterialBlockConnectionPointTypes.Matrix, true, NodeMaterialBlockTargets.Vertex);

        this.registerOutput("color", NodeMaterialBlockConnectionPointTypes.Color4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "TextureBlock";
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the texture information input component
     */
    public get textureInfo(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the transformed uv input component
     */
    public get transformedUV(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the texture input component
     */
    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the texture transform input component
     */
    public get textureTransform(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    public autoConfigure() {
        if (!this.uv.connectedPoint) {
            this.uv.setAsAttribute();
            this.uv.connectTo(this.transformedUV);
        }
    }

    public initialize(state: NodeMaterialBuildState) {
        if (this.texture.value && this.texture.value.getTextureMatrix) {
            const texture = this.texture.value as BaseTexture;

            if (this.autoConnectTextureMatrix) {
                this.textureTransform.valueCallback = () => texture.getTextureMatrix();
            }
            if (this.autoSelectUV) {
                this.uv.setAsAttribute("uv" + (texture.coordinatesIndex ? (texture.coordinatesIndex + 1) : ""));
            }
        }
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (!this.texture.value || !this.texture.value.getTextureMatrix) {
            return;
        }

        let uvInput = this.uv;
        let textureTransform = this.textureTransform;
        let isTextureTransformConnected = textureTransform.connectedPoint != null || textureTransform.isUniform;

        const texture = this.texture.value as BaseTexture;
        let mainUVName = ("vMain" + uvInput.associatedVariableName).toUpperCase();

        if (isTextureTransformConnected && !texture.getTextureMatrix().isIdentityAs3x2()) {
            defines.setValue(this._defineName, true);
            defines.setValue(mainUVName, false);
        } else {
            defines.setValue(this._defineName, false);
            defines.setValue(mainUVName, true);
        }
    }

    public isReady() {
        let texture = this.texture.value as BaseTexture;
        if (texture && !texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    private _injectVertexCode(state: NodeMaterialBuildState) {
        let uvInput = this.uv;
        let transformedUV = this.transformedUV;
        let textureTransform = this.textureTransform;
        let isTextureTransformConnected = textureTransform.connectedPoint != null || textureTransform.isUniform;

        // Inject code in vertex
        this._defineName = state._getFreeDefineName("UVTRANSFORM");
        let mainUVName = "vMain" + uvInput.associatedVariableName;

        transformedUV.associatedVariableName = state._getFreeVariableName(transformedUV.name);
        state._emitVaryings(transformedUV, this._defineName, true);
        state._emitVaryings(transformedUV, mainUVName.toUpperCase(), true, false, mainUVName);

        textureTransform.associatedVariableName = state._getFreeVariableName(textureTransform.name);
        state._emitUniformOrAttributes(textureTransform, this._defineName);

        if (isTextureTransformConnected) {
            if (state.sharedData.emitComments) {
                state.compilationString += `\r\n//${this.name}\r\n`;
            }
            state.compilationString += `#ifdef ${this._defineName}\r\n`;
            state.compilationString += `${transformedUV.associatedVariableName} = vec2(${textureTransform.associatedVariableName} * vec4(${uvInput.associatedVariableName}, 1.0, 0.0));\r\n`;
            state.compilationString += `#else\r\n`;
            state.compilationString += `${mainUVName} = ${uvInput.associatedVariableName};\r\n`;
            state.compilationString += `#endif\r\n`;
        } else {
            state.compilationString += `${mainUVName} = ${uvInput.associatedVariableName};\r\n`;
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        state.sharedData.blockingBlocks.push(this);

        // Vertex
        this._injectVertexCode(state._vertexState);

        // Fragment
        state.sharedData.blocksWithDefines.push(this);

        let uvInput = this.uv;
        let transformedUV = this.transformedUV;
        let textureInfo = this.textureInfo;
        let samplerInput = this.texture;
        let output = this._outputs[0];
        let isTextureInfoConnected = textureInfo.connectedPoint != null || textureInfo.isUniform;
        const complement = isTextureInfoConnected ? ` * ${textureInfo.associatedVariableName}.y` : "";

        state.compilationString += `#ifdef ${this._defineName}\r\n`;
        state.compilationString += `vec4 ${output.associatedVariableName} = texture2D(${samplerInput.associatedVariableName}, ${transformedUV.associatedVariableName})${complement};\r\n`;
        state.compilationString += `#else\r\n`;
        state.compilationString += `vec4 ${output.associatedVariableName} = texture2D(${samplerInput.associatedVariableName}, ${"vMain" + uvInput.associatedVariableName})${complement};\r\n`;
        state.compilationString += `#endif\r\n`;

        return this;
    }
}