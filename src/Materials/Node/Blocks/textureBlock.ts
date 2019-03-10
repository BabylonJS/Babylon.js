import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { BaseTexture } from '../../Textures/baseTexture';

/**
 * Block used to read a texture from a sampler
 */
export class TextureBlock extends NodeMaterialBlock {

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
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("textureInfo", NodeMaterialBlockConnectionPointTypes.Vector2, true);

        this.registerInput("transformedUV", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Texture);
        this.registerInput("textureTransform", NodeMaterialBlockConnectionPointTypes.Matrix, true);

        this.registerOutput("color", NodeMaterialBlockConnectionPointTypes.Color4);

        // Auto configuration
        this._inputs[0].setAsAttribute();
        this._inputs[0].connectTo(this._inputs[2]);
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

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let uvInput = this.uv;
        let transformedUV = this.transformedUV;
        let textureInfo = this.textureInfo;
        let textureTransform = this.textureTransform;
        let isTextureInfoConnected = textureInfo.connectedPoint != null || textureInfo.isUniform;
        let isTextureTransformConnected = textureTransform.connectedPoint != null || textureTransform.isUniform;

        if (state.target === NodeMaterialBlockTargets.Fragment) { // Fragment
            let samplerInput = this.texture;

            let output = this._outputs[0];

            const complement = isTextureInfoConnected ? ` * ${textureInfo.associatedVariableName}.y` : "";

            state.compilationString += `vec4 ${output.associatedVariableName} = texture2D(${samplerInput.associatedVariableName}, ${transformedUV.associatedVariableName})${complement};\r\n`;
        } else { // Vertex
            transformedUV.associatedVariableName = state._getFreeVariableName(transformedUV.name);
            state._emitVaryings(transformedUV, true);

            if (isTextureTransformConnected) {
                state.compilationString += `${transformedUV.associatedVariableName} =  vec2(${textureTransform.associatedVariableName} * vec4(${uvInput.associatedVariableName}, 1.0, 0.0));`;
            } else {
                state.compilationString += `${transformedUV.associatedVariableName} =  ${uvInput.associatedVariableName};`;
            }
        }
        return this;
    }
}