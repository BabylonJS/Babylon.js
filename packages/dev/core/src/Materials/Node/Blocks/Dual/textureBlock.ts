import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import type { NodeMaterialDefines } from "../../nodeMaterial";
import { NodeMaterial } from "../../nodeMaterial";
import { InputBlock } from "../Input/inputBlock";
import type { Effect } from "../../../effect";
import type { Nullable } from "../../../../types";
import { RegisterClass } from "../../../../Misc/typeStore";
import { Texture } from "../../../Textures/texture";
import type { Scene } from "../../../../scene";
import { NodeMaterialModes } from "../../Enums/nodeMaterialModes";
import { Constants } from "../../../../Engines/constants";
import "../../../../Shaders/ShadersInclude/helperFunctions";
import { ImageSourceBlock } from "./imageSourceBlock";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { EngineStore } from "../../../../Engines/engineStore";
import type { PrePassTextureBlock } from "../Input/prePassTextureBlock";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to read a texture from a sampler
 */
export class TextureBlock extends NodeMaterialBlock {
    private _defineName: string;
    private _linearDefineName: string;
    private _gammaDefineName: string;
    private _tempTextureRead: string;
    private _samplerName: string;
    private _transformedUVName: string;
    private _textureTransformName: string;
    private _textureInfoName: string;
    private _mainUVName: string;
    private _mainUVDefineName: string;
    private _fragmentOnly: boolean;
    private _imageSource: Nullable<ImageSourceBlock | PrePassTextureBlock>;

    protected _texture: Nullable<Texture>;

    /**
     * Gets or sets a boolean indicating if the block is used in fragment shader only
     * If false the system will allow optimizations to use it in vertex shader when possible for the uv computation
     */
    public get fragmentOnly(): boolean {
        return this._fragmentOnly;
    }

    public set fragmentOnly(value: boolean) {
        this._fragmentOnly = value;
    }

    /**
     * Gets or sets the texture associated with the node
     */
    public get texture(): Nullable<Texture> {
        if (this.source.isConnected) {
            return (this.source.connectedPoint?.ownerBlock as ImageSourceBlock).texture;
        }
        return this._texture;
    }

    public set texture(texture: Nullable<Texture>) {
        if (this._texture === texture) {
            return;
        }

        const scene = texture?.getScene() ?? EngineStore.LastCreatedScene;

        if (!texture && scene) {
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this._texture!);
            });
        }

        this._texture = texture;

        if (texture && scene) {
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(texture);
            });
        }
    }

    private static _IsPrePassTextureBlock(block: Nullable<ImageSourceBlock | PrePassTextureBlock>): block is PrePassTextureBlock {
        return block?.getClassName() === "PrePassTextureBlock";
    }

    private get _isSourcePrePass() {
        return TextureBlock._IsPrePassTextureBlock(this._imageSource);
    }

    /**
     * Gets the sampler name associated with this texture
     */
    public get samplerName(): string {
        if (this._imageSource) {
            if (!TextureBlock._IsPrePassTextureBlock(this._imageSource)) {
                return this._imageSource.samplerName;
            }
            if (this.source.connectedPoint) {
                return this._imageSource.getSamplerName(this.source.connectedPoint);
            }
        }
        return this._samplerName;
    }

    /**
     * Gets a boolean indicating that this block is linked to an ImageSourceBlock
     */
    public get hasImageSource(): boolean {
        return this.source.isConnected;
    }

    private _convertToGammaSpace = false;
    /**
     * Gets or sets a boolean indicating if content needs to be converted to gamma space
     */
    public set convertToGammaSpace(value: boolean) {
        if (value === this._convertToGammaSpace) {
            return;
        }

        this._convertToGammaSpace = value;
        if (this.texture) {
            const scene = this.texture.getScene() ?? EngineStore.LastCreatedScene;
            scene?.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this.texture!);
            });
        }
    }
    public get convertToGammaSpace(): boolean {
        return this._convertToGammaSpace;
    }

    private _convertToLinearSpace = false;
    /**
     * Gets or sets a boolean indicating if content needs to be converted to linear space
     */
    public set convertToLinearSpace(value: boolean) {
        if (value === this._convertToLinearSpace) {
            return;
        }

        this._convertToLinearSpace = value;
        if (this.texture) {
            const scene = this.texture.getScene() ?? EngineStore.LastCreatedScene;
            scene?.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this.texture!);
            });
        }
    }
    public get convertToLinearSpace(): boolean {
        return this._convertToLinearSpace;
    }

    /**
     * Gets or sets a boolean indicating if multiplication of texture with level should be disabled
     */
    public disableLevelMultiplication = false;

    /**
     * Create a new TextureBlock
     * @param name defines the block name
     * @param fragmentOnly
     */
    public constructor(name: string, fragmentOnly = false) {
        super(name, fragmentOnly ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.VertexAndFragment);

        this._fragmentOnly = fragmentOnly;

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.AutoDetect, false, NodeMaterialBlockTargets.VertexAndFragment);
        this.registerInput(
            "source",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("source", this, NodeMaterialConnectionPointDirection.Input, ImageSourceBlock, "ImageSourceBlock")
        );
        this.registerInput("layer", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("lod", NodeMaterialBlockConnectionPointTypes.Float, true);

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);

        this.registerOutput("level", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Vector2 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4
        );

        this._inputs[0]._prioritizeVertex = !fragmentOnly;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "TextureBlock";
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the source input component
     */
    public get source(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the layer input component
     */
    public get layer(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the LOD input component
     */
    public get lod(): NodeMaterialConnectionPoint {
        return this._inputs[3];
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
     * Gets the level output component
     */
    public get level(): NodeMaterialConnectionPoint {
        return this._outputs[6];
    }

    private _isTiedToFragment(input: NodeMaterialConnectionPoint) {
        if (input.target === NodeMaterialBlockTargets.Fragment) {
            return true;
        }

        if (input.target === NodeMaterialBlockTargets.Vertex) {
            return false;
        }

        if (input.target === NodeMaterialBlockTargets.Neutral || input.target === NodeMaterialBlockTargets.VertexAndFragment) {
            const parentBlock = input.ownerBlock;

            if (parentBlock.target === NodeMaterialBlockTargets.Fragment) {
                return true;
            }

            for (const input of parentBlock.inputs) {
                if (!input.isConnected) {
                    continue;
                }
                if (this._isTiedToFragment(input.connectedPoint!)) {
                    return true;
                }
            }
        }

        return false;
    }

    private _getEffectiveTarget() {
        if (this._fragmentOnly) {
            return NodeMaterialBlockTargets.Fragment;
        }

        // TextureBlock has a special optimizations for uvs that come from the vertex shaders as they can be packed into a single varyings.
        // But we need to detect uvs coming from fragment then
        if (!this.uv.isConnected) {
            return NodeMaterialBlockTargets.VertexAndFragment;
        }

        if (this.uv.sourceBlock!.isInput) {
            return NodeMaterialBlockTargets.VertexAndFragment;
        }

        if (this._isTiedToFragment(this.uv.connectedPoint!)) {
            return NodeMaterialBlockTargets.Fragment;
        }

        return NodeMaterialBlockTargets.VertexAndFragment;
    }

    public override get target() {
        return this._getEffectiveTarget();
    }

    public override set target(value: NodeMaterialBlockTargets) {}

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.uv.isConnected) {
            if (material.mode === NodeMaterialModes.PostProcess) {
                const uvInput = material.getBlockByPredicate((b) => b.name === "uv" && additionalFilteringInfo(b));

                if (uvInput) {
                    uvInput.connectTo(this);
                }
            } else if (material.mode !== NodeMaterialModes.ProceduralTexture) {
                const attributeName = material.mode === NodeMaterialModes.Particle ? "particle_uv" : "uv";

                let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === attributeName && additionalFilteringInfo(b));

                if (!uvInput) {
                    uvInput = new InputBlock("uv");
                    uvInput.setAsAttribute(attributeName);
                }
                uvInput.output.connectTo(this.uv);
            }
        }
    }

    public override initializeDefines(defines: NodeMaterialDefines) {
        if (!defines._areTexturesDirty) {
            return;
        }

        if (this._mainUVDefineName !== undefined) {
            defines.setValue(this._mainUVDefineName, false, true);
        }
    }

    public override prepareDefines(defines: NodeMaterialDefines) {
        if (!defines._areTexturesDirty) {
            return;
        }

        if (!this.texture || !this.texture.getTextureMatrix) {
            if (this._isMixed) {
                defines.setValue(this._defineName, false, true);
                defines.setValue(this._mainUVDefineName, true, true);
            }
            return;
        }

        const toGamma = this.convertToGammaSpace && this.texture && !this.texture.gammaSpace;
        const toLinear = this.convertToLinearSpace && this.texture && this.texture.gammaSpace;

        // Not a bug... Name defines the texture space not the required conversion
        defines.setValue(this._linearDefineName, toGamma, true);
        defines.setValue(this._gammaDefineName, toLinear, true);

        if (this._isMixed) {
            if (!this.texture.getTextureMatrix().isIdentityAs3x2()) {
                defines.setValue(this._defineName, true);
                if (defines[this._mainUVDefineName] == undefined) {
                    defines.setValue(this._mainUVDefineName, false, true);
                }
            } else {
                defines.setValue(this._defineName, false, true);
                defines.setValue(this._mainUVDefineName, true, true);
            }
        }
    }

    public override isReady() {
        if (this._isSourcePrePass) {
            return true;
        }

        if (this.texture && !this.texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    public override bind(effect: Effect) {
        if (this._isSourcePrePass) {
            effect.setFloat(this._textureInfoName, 1);
        }

        if (!this.texture) {
            return;
        }

        if (this._isMixed) {
            effect.setFloat(this._textureInfoName, this.texture.level);
            effect.setMatrix(this._textureTransformName, this.texture.getTextureMatrix());
        }

        if (!this._imageSource) {
            effect.setTexture(this._samplerName, this.texture);
        }
    }

    private get _isMixed() {
        return this.target !== NodeMaterialBlockTargets.Fragment;
    }

    private _injectVertexCode(state: NodeMaterialBuildState) {
        const uvInput = this.uv;

        // Inject code in vertex
        this._defineName = state._getFreeDefineName("UVTRANSFORM");
        this._mainUVDefineName = "VMAIN" + uvInput.declarationVariableName.toUpperCase();

        this._mainUVName = "vMain" + uvInput.declarationVariableName;
        this._transformedUVName = state._getFreeVariableName("transformedUV");
        this._textureTransformName = state._getFreeVariableName("textureTransform");
        this._textureInfoName = state._getFreeVariableName("textureInfoName");

        this.level.associatedVariableName = this._textureInfoName;

        state._emitVaryingFromString(this._transformedUVName, NodeMaterialBlockConnectionPointTypes.Vector2, this._defineName);
        state._emitVaryingFromString(this._mainUVName, NodeMaterialBlockConnectionPointTypes.Vector2, this._mainUVDefineName);

        state._emitUniformFromString(this._textureTransformName, NodeMaterialBlockConnectionPointTypes.Matrix, this._defineName);

        const vec4 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector4);
        const vec2 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector2);

        state.compilationString += `#ifdef ${this._defineName}\n`;
        state.compilationString += `${state._getVaryingName(this._transformedUVName)} = ${vec2}(${this._textureTransformName} * ${vec4}(${uvInput.associatedVariableName}.xy, 1.0, 0.0));\n`;
        state.compilationString += `#elif defined(${this._mainUVDefineName})\n`;

        let automaticPrefix = "";
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            if (uvInput.isConnectedToInputBlock && uvInput.associatedVariableName.indexOf("vertexInputs.") === -1) {
                automaticPrefix = "vertexInputs."; // Force the prefix
            }
        }

        state.compilationString += `${state._getVaryingName(this._mainUVName)} = ${automaticPrefix}${uvInput.associatedVariableName}.xy;\n`;
        state.compilationString += `#endif\n`;

        if (!this._outputs.some((o) => o.isConnectedInVertexShader)) {
            return;
        }

        this._writeTextureRead(state, true);

        for (const output of this._outputs) {
            if (output.hasEndpoints && output.name !== "level") {
                this._writeOutput(state, output, output.name, true);
            }
        }
    }

    private _getUVW(uvName: string): string {
        let coords = uvName;

        const is2DArrayTexture = this._texture?._texture?.is2DArray ?? false;
        const is3D = this._texture?._texture?.is3D ?? false;

        if (is2DArrayTexture) {
            const layerValue = this.layer.isConnected ? this.layer.associatedVariableName : "0";
            coords = `vec3(${uvName}, ${layerValue})`;
        } else if (is3D) {
            const layerValue = this.layer.isConnected ? this.layer.associatedVariableName : "0";
            coords = `vec3(${uvName}, ${layerValue})`;
        }

        return coords;
    }

    private _samplerFunc(state: NodeMaterialBuildState) {
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            return state.target === NodeMaterialBlockTargets.Vertex ? "textureSampleLevel" : "textureSample";
        }
        return this.lod.isConnected ? "texture2DLodEXT" : "texture2D";
    }

    private get _samplerLodSuffix() {
        return this.lod.isConnected ? `, ${this.lod.associatedVariableName}` : "";
    }

    private _generateTextureSample(uv: string, state: NodeMaterialBuildState) {
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            const isVertex = state.target === NodeMaterialBlockTargets.Vertex;
            return `${this._samplerFunc(state)}(${this.samplerName},${this.samplerName + Constants.AUTOSAMPLERSUFFIX}, ${this._getUVW(uv)}${this._samplerLodSuffix}${isVertex ? ", 0" : ""})`;
        }
        return `${this._samplerFunc(state)}(${this.samplerName}, ${this._getUVW(uv)}${this._samplerLodSuffix})`;
    }

    private _generateTextureLookup(state: NodeMaterialBuildState): void {
        state.compilationString += `#ifdef ${this._defineName}\n`;
        state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this._generateTextureSample(state._getVaryingName(this._transformedUVName), state)};\n`;
        state.compilationString += `#elif defined(${this._mainUVDefineName})\n`;
        state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this._generateTextureSample(this._mainUVName ? state._getVaryingName(this._mainUVName) : this.uv.associatedVariableName, state)}${this._samplerLodSuffix};\n`;
        state.compilationString += `#endif\n`;
    }

    private _writeTextureRead(state: NodeMaterialBuildState, vertexMode = false) {
        const uvInput = this.uv;

        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }

            this._generateTextureLookup(state);
            return;
        }

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this._generateTextureSample(uvInput.associatedVariableName, state)}${this._samplerLodSuffix};\n`;
            return;
        }

        this._generateTextureLookup(state);
    }

    private _generateConversionCode(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string): void {
        if (swizzle !== "a") {
            // no conversion if the output is "a" (alpha)
            if (!this.texture || !this.texture.gammaSpace) {
                state.compilationString += `#ifdef ${this._linearDefineName}
                    ${output.associatedVariableName} = toGammaSpace(${output.associatedVariableName});
                    #endif
                `;
            }

            state.compilationString += `#ifdef ${this._gammaDefineName}
                ${output.associatedVariableName} = ${state._toLinearSpace(output)};
                #endif
            `;
        }
    }

    private _writeOutput(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string, vertexMode = false) {
        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }

            state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle};\n`;
            this._generateConversionCode(state, output, swizzle);
            return;
        }

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle};\n`;
            this._generateConversionCode(state, output, swizzle);
            return;
        }
        let complement = "";

        if (!this.disableLevelMultiplication) {
            complement = ` * ${(state.shaderLanguage === ShaderLanguage.WGSL ? "uniforms." : "") + this._textureInfoName}`;
        }

        state.compilationString += `${state._declareOutput(output)} = ${this._tempTextureRead}.${swizzle}${complement};\n`;
        this._generateConversionCode(state, output, swizzle);
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (this.source.isConnected) {
            this._imageSource = this.source.connectedPoint!.ownerBlock as ImageSourceBlock;
        } else {
            this._imageSource = null;
        }

        if (state.target === NodeMaterialBlockTargets.Vertex || this._fragmentOnly || state.target === NodeMaterialBlockTargets.Fragment) {
            this._tempTextureRead = state._getFreeVariableName("tempTextureRead");
            this._linearDefineName = state._getFreeDefineName("ISLINEAR");
            this._gammaDefineName = state._getFreeDefineName("ISGAMMA");
        }

        if ((!this._isMixed && state.target === NodeMaterialBlockTargets.Fragment) || (this._isMixed && state.target === NodeMaterialBlockTargets.Vertex)) {
            if (!this._imageSource) {
                const varName = state._getFreeVariableName(this.name);
                this._samplerName = varName + "Texture";

                if (this._texture?._texture?.is2DArray) {
                    state._emit2DArraySampler(this._samplerName);
                } else {
                    state._emit2DSampler(this._samplerName);
                }
            }

            // Declarations
            state.sharedData.blockingBlocks.push(this);
            state.sharedData.textureBlocks.push(this);
            state.sharedData.blocksWithDefines.push(this);
            state.sharedData.bindableBlocks.push(this);
        }

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            this._injectVertexCode(state);
            return;
        }

        // Fragment
        if (!this._outputs.some((o) => o.isConnectedInFragmentShader)) {
            return;
        }

        if (this._isMixed && !this._imageSource) {
            // Reexport the sampler
            if (this._texture?._texture?.is2DArray) {
                state._emit2DArraySampler(this._samplerName);
            } else {
                state._emit2DSampler(this._samplerName);
            }
        }

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        if (this._isMixed) {
            state._emitUniformFromString(this._textureInfoName, NodeMaterialBlockConnectionPointTypes.Float);
        }

        this._writeTextureRead(state);

        for (const output of this._outputs) {
            if (output.hasEndpoints && output.name !== "level") {
                this._writeOutput(state, output, output.name);
            }
        }

        return this;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.convertToGammaSpace = ${this.convertToGammaSpace};\n`;
        codeString += `${this._codeVariableName}.convertToLinearSpace = ${this.convertToLinearSpace};\n`;
        codeString += `${this._codeVariableName}.disableLevelMultiplication = ${this.disableLevelMultiplication};\n`;

        if (!this.texture) {
            return codeString;
        }

        codeString += `${this._codeVariableName}.texture = new BABYLON.Texture("${this.texture.name}", null, ${this.texture.noMipmap}, ${this.texture.invertY}, ${this.texture.samplingMode});\n`;
        codeString += `${this._codeVariableName}.texture.wrapU = ${this.texture.wrapU};\n`;
        codeString += `${this._codeVariableName}.texture.wrapV = ${this.texture.wrapV};\n`;
        codeString += `${this._codeVariableName}.texture.uAng = ${this.texture.uAng};\n`;
        codeString += `${this._codeVariableName}.texture.vAng = ${this.texture.vAng};\n`;
        codeString += `${this._codeVariableName}.texture.wAng = ${this.texture.wAng};\n`;
        codeString += `${this._codeVariableName}.texture.uOffset = ${this.texture.uOffset};\n`;
        codeString += `${this._codeVariableName}.texture.vOffset = ${this.texture.vOffset};\n`;
        codeString += `${this._codeVariableName}.texture.uScale = ${this.texture.uScale};\n`;
        codeString += `${this._codeVariableName}.texture.vScale = ${this.texture.vScale};\n`;
        codeString += `${this._codeVariableName}.texture.coordinatesMode = ${this.texture.coordinatesMode};\n`;

        return codeString;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;
        serializationObject.fragmentOnly = this._fragmentOnly;
        serializationObject.disableLevelMultiplication = this.disableLevelMultiplication;
        if (
            !this.hasImageSource &&
            this.texture &&
            (NodeMaterial.AllowSerializationOfRenderTargetTextures || !this.texture.isRenderTarget) &&
            this.texture.getClassName() !== "VideoTexture"
        ) {
            serializationObject.texture = this.texture.serialize();
        }

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string, urlRewriter?: (url: string) => string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.convertToGammaSpace = serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = !!serializationObject.convertToLinearSpace;
        this._fragmentOnly = !!serializationObject.fragmentOnly;
        this.disableLevelMultiplication = !!serializationObject.disableLevelMultiplication;

        if (serializationObject.texture && !NodeMaterial.IgnoreTexturesAtLoadTime) {
            if (serializationObject.texture.url !== undefined) {
                if (serializationObject.texture.url.indexOf("data:") === 0) {
                    rootUrl = "";
                } else if (urlRewriter) {
                    serializationObject.texture.url = urlRewriter(serializationObject.texture.url);
                    serializationObject.texture.name = serializationObject.texture.url;
                }
            }
            if (serializationObject.texture.base64String || serializationObject.texture.url !== undefined) {
                this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl) as Texture;
            }
        }
    }
}

RegisterClass("BABYLON.TextureBlock", TextureBlock);
