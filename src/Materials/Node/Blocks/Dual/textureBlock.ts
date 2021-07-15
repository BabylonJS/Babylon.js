import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { InputBlock } from '../Input/inputBlock';
import { Effect } from '../../../effect';
import { Mesh } from '../../../../Meshes/mesh';
import { Nullable } from '../../../../types';
import { _TypeStore } from '../../../../Misc/typeStore';
import { Texture } from '../../../Textures/texture';
import { Scene } from '../../../../scene';
import { NodeMaterialModes } from '../../Enums/nodeMaterialModes';
import { Engine } from "../../../../Engines/engine";
import { Constants } from '../../../../Engines/constants';
import "../../../../Shaders/ShadersInclude/helperFunctions";

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

    protected _texture: Nullable<Texture>;
    /**
     * Gets or sets the texture associated with the node
     */
    public get texture(): Nullable<Texture> {
        return this._texture;
    }

    public set texture(texture: Nullable<Texture>) {
        if (this._texture === texture) {
            return;
        }

        const scene = texture?.getScene() ?? Engine.LastCreatedScene;

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

    /**
     * Gets the sampler name associated with this texture
     */
    public get samplerName(): string {
        return this._samplerName;
    }

    /**
     * Gets or sets a boolean indicating if content needs to be converted to gamma space
     */
    public convertToGammaSpace = false;

    /**
     * Gets or sets a boolean indicating if content needs to be converted to linear space
     */
    public convertToLinearSpace = false;

    /**
     * Gets or sets a boolean indicating if multiplication of texture with level should be disabled
     */
    public disableLevelMultiplication = false;

    /**
     * Create a new TextureBlock
     * @param name defines the block name
     */
    public constructor(name: string, fragmentOnly = false) {
        super(name, fragmentOnly ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.VertexAndFragment);

        this._fragmentOnly = fragmentOnly;

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, false, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);

        this.registerOutput("level", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);

        this._inputs[0]._prioritizeVertex = !fragmentOnly;
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

    public get target() {
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

        let parent = this.uv.connectedPoint;

        while (parent) {
            if (parent.target === NodeMaterialBlockTargets.Fragment) {
                return NodeMaterialBlockTargets.Fragment;
            }

            if (parent.target === NodeMaterialBlockTargets.Vertex) {
                return NodeMaterialBlockTargets.VertexAndFragment;
            }

            if (parent.target === NodeMaterialBlockTargets.Neutral || parent.target === NodeMaterialBlockTargets.VertexAndFragment) {
                let parentBlock = parent.ownerBlock;

                if (parentBlock.target === NodeMaterialBlockTargets.Fragment) {
                    return NodeMaterialBlockTargets.Fragment;
                }

                parent = null;
                for (var input of parentBlock.inputs) {
                    if (input.connectedPoint) {
                        parent = input.connectedPoint;
                        break;
                    }
                }
            }

        }

        return NodeMaterialBlockTargets.VertexAndFragment;
    }

    public set target(value: NodeMaterialBlockTargets) {
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.uv.isConnected) {
            if (material.mode === NodeMaterialModes.PostProcess) {
                let uvInput = material.getBlockByPredicate((b) => b.name === "uv");

                if (uvInput) {
                    uvInput.connectTo(this);
                }
            } else {
                const attributeName = material.mode === NodeMaterialModes.Particle ? "particle_uv" : "uv";

                let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === attributeName);

                if (!uvInput) {
                    uvInput = new InputBlock("uv");
                    uvInput.setAsAttribute(attributeName);
                }
                uvInput.output.connectTo(this.uv);
            }
        }
    }

    public initializeDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines, useInstances: boolean = false) {
        if (!defines._areTexturesDirty) {
            return;
        }

        defines.setValue(this._mainUVDefineName, false);
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (!defines._areTexturesDirty) {
            return;
        }

        if (!this.texture || !this.texture.getTextureMatrix) {
            defines.setValue(this._defineName, false);
            defines.setValue(this._mainUVDefineName, true);
            return;
        }

        defines.setValue(this._linearDefineName, this.convertToGammaSpace);
        defines.setValue(this._gammaDefineName, this.convertToLinearSpace);
        if (this._isMixed) {
            if (!this.texture.getTextureMatrix().isIdentityAs3x2()) {
                defines.setValue(this._defineName, true);
                if (defines[this._mainUVDefineName] == undefined) {
                    defines.setValue(this._mainUVDefineName, false);
                }
            } else {
                defines.setValue(this._defineName, false);
                defines.setValue(this._mainUVDefineName, true);
            }
        }
    }

    public isReady() {
        if (this.texture && !this.texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!this.texture) {
            return;
        }

        if (this._isMixed) {
            effect.setFloat(this._textureInfoName, this.texture.level);
            effect.setMatrix(this._textureTransformName, this.texture.getTextureMatrix());
        }
        effect.setTexture(this._samplerName, this.texture);
    }

    private get _isMixed() {
        return this.target !== NodeMaterialBlockTargets.Fragment;
    }

    private _injectVertexCode(state: NodeMaterialBuildState) {
        let uvInput = this.uv;

        // Inject code in vertex
        this._defineName = state._getFreeDefineName("UVTRANSFORM");
        this._mainUVDefineName = "VMAIN" + uvInput.associatedVariableName.toUpperCase();

        this._mainUVName = "vMain" + uvInput.associatedVariableName;
        this._transformedUVName = state._getFreeVariableName("transformedUV");
        this._textureTransformName = state._getFreeVariableName("textureTransform");
        this._textureInfoName = state._getFreeVariableName("textureInfoName");

        this.level.associatedVariableName = this._textureInfoName;

        state._emitVaryingFromString(this._transformedUVName, "vec2", this._defineName);
        state._emitVaryingFromString(this._mainUVName, "vec2", this._mainUVDefineName);

        state._emitUniformFromString(this._textureTransformName, "mat4", this._defineName);

        state.compilationString += `#ifdef ${this._defineName}\r\n`;
        state.compilationString += `${this._transformedUVName} = vec2(${this._textureTransformName} * vec4(${uvInput.associatedVariableName}.xy, 1.0, 0.0));\r\n`;
        state.compilationString += `#elif defined(${this._mainUVDefineName})\r\n`;
        state.compilationString += `${this._mainUVName} = ${uvInput.associatedVariableName}.xy;\r\n`;
        state.compilationString += `#endif\r\n`;

        if (!this._outputs.some((o) => o.isConnectedInVertexShader)) {
            return;
        }

        this._writeTextureRead(state, true);

        for (var output of this._outputs) {
            if (output.hasEndpoints  && output.name !== "level") {
                this._writeOutput(state, output, output.name, true);
            }
        }
    }

    private _generateTextureLookup(state: NodeMaterialBuildState): void {
        state.compilationString += `#ifdef ${this._defineName}\r\n`;
        state.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${this._transformedUVName});\r\n`;
        state.compilationString += `#elif defined(${this._mainUVDefineName})\r\n`;
        state.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${this._mainUVName ? this._mainUVName : this.uv.associatedVariableName});\r\n`;
        state.compilationString += `#endif\r\n`;
    }

    private _writeTextureRead(state: NodeMaterialBuildState, vertexMode = false) {
        let uvInput = this.uv;

        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }

            this._generateTextureLookup(state);
            return;
        }

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${uvInput.associatedVariableName});\r\n`;
            return;
        }

        this._generateTextureLookup(state);
    }

    private _generateConversionCode(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string): void {
        if (swizzle !== 'a') { // no conversion if the output is "a" (alpha)
            state.compilationString += `#ifdef ${this._linearDefineName}\r\n`;
            state.compilationString += `${output.associatedVariableName} = toGammaSpace(${output.associatedVariableName});\r\n`;
            state.compilationString += `#endif\r\n`;

            state.compilationString += `#ifdef ${this._gammaDefineName}\r\n`;
            state.compilationString += `${output.associatedVariableName} = toLinearSpace(${output.associatedVariableName});\r\n`;
            state.compilationString += `#endif\r\n`;
        }
    }

    private _writeOutput(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string, vertexMode = false) {
        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }

            state.compilationString += `${this._declareOutput(output, state)} = ${this._tempTextureRead}.${swizzle};\r\n`;
            this._generateConversionCode(state, output, swizzle);
            return;
        }

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `${this._declareOutput(output, state)} = ${this._tempTextureRead}.${swizzle};\r\n`;
            this._generateConversionCode(state, output, swizzle);
            return;
        }
        let complement = "";

        if (!this.disableLevelMultiplication) {
            complement = ` * ${this._textureInfoName}`;
        }

        state.compilationString += `${this._declareOutput(output, state)} = ${this._tempTextureRead}.${swizzle}${complement};\r\n`;
        this._generateConversionCode(state, output, swizzle);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex || this._fragmentOnly || (state.target === NodeMaterialBlockTargets.Fragment && this._tempTextureRead === undefined)) {
            this._tempTextureRead = state._getFreeVariableName("tempTextureRead");
            this._linearDefineName = state._getFreeDefineName("ISLINEAR");
            this._gammaDefineName = state._getFreeDefineName("ISGAMMA");
        }

        if (!this._isMixed && state.target === NodeMaterialBlockTargets.Fragment || this._isMixed && state.target === NodeMaterialBlockTargets.Vertex) {
            this._samplerName = state._getFreeVariableName(this.name + "Sampler");

            state._emit2DSampler(this._samplerName);

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

        if (this._isMixed) {
            // Reexport the sampler
            state._emit2DSampler(this._samplerName);
        }

        let comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        if (this._isMixed) {
            state._emitUniformFromString(this._textureInfoName, "float");
        }

        this._writeTextureRead(state);

        for (var output of this._outputs) {
            if (output.hasEndpoints && output.name !== "level") {
                this._writeOutput(state, output, output.name);
            }
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.convertToGammaSpace = ${this.convertToGammaSpace};\r\n`;
        codeString += `${this._codeVariableName}.convertToLinearSpace = ${this.convertToLinearSpace};\r\n`;
        codeString += `${this._codeVariableName}.disableLevelMultiplication = ${this.disableLevelMultiplication};\r\n`;

        if (!this.texture) {
            return codeString;
        }

        codeString += `${this._codeVariableName}.texture = new BABYLON.Texture("${this.texture.name}", null, ${this.texture.noMipmap}, ${this.texture.invertY}, ${this.texture.samplingMode});\r\n`;
        codeString += `${this._codeVariableName}.texture.wrapU = ${this.texture.wrapU};\r\n`;
        codeString += `${this._codeVariableName}.texture.wrapV = ${this.texture.wrapV};\r\n`;
        codeString += `${this._codeVariableName}.texture.uAng = ${this.texture.uAng};\r\n`;
        codeString += `${this._codeVariableName}.texture.vAng = ${this.texture.vAng};\r\n`;
        codeString += `${this._codeVariableName}.texture.wAng = ${this.texture.wAng};\r\n`;
        codeString += `${this._codeVariableName}.texture.uOffset = ${this.texture.uOffset};\r\n`;
        codeString += `${this._codeVariableName}.texture.vOffset = ${this.texture.vOffset};\r\n`;
        codeString += `${this._codeVariableName}.texture.uScale = ${this.texture.uScale};\r\n`;
        codeString += `${this._codeVariableName}.texture.vScale = ${this.texture.vScale};\r\n`;
        codeString += `${this._codeVariableName}.texture.coordinatesMode = ${this.texture.coordinatesMode};\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;
        serializationObject.fragmentOnly = this._fragmentOnly;
        serializationObject.disableLevelMultiplication = this.disableLevelMultiplication;
        if (this.texture && !this.texture.isRenderTarget && this.texture.getClassName() !== "VideoTexture") {
            serializationObject.texture = this.texture.serialize();
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.convertToGammaSpace = serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = !!serializationObject.convertToLinearSpace;
        this._fragmentOnly = !!serializationObject.fragmentOnly;
        this.disableLevelMultiplication = !!serializationObject.disableLevelMultiplication;

        if (serializationObject.texture && !NodeMaterial.IgnoreTexturesAtLoadTime && serializationObject.texture.url !== undefined) {
            rootUrl = serializationObject.texture.url.indexOf("data:") === 0 ? "" : rootUrl;
            this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl) as Texture;
        }
    }
}

_TypeStore.RegisteredTypes["BABYLON.TextureBlock"] = TextureBlock;
