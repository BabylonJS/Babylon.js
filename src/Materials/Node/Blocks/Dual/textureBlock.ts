import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { BaseTexture } from '../../../Textures/baseTexture';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { InputBlock } from '../Input/inputBlock';
import { Effect } from '../../../effect';
import { Mesh } from '../../../../Meshes/mesh';
import { Nullable } from '../../../../types';
import { _TypeStore } from '../../../../Misc/typeStore';
import { Texture } from '../../../Textures/texture';
import { Scene } from '../../../../scene';

/**
 * Block used to read a texture from a sampler
 */
export class TextureBlock extends NodeMaterialBlock {
    private _defineName: string;
    private _samplerName: string;
    private _transformedUVName: string;
    private _textureTransformName: string;
    private _textureInfoName: string;
    private _mainUVName: string;
    private _mainUVDefineName: string;

    /**
     * Gets or sets the texture associated with the node
     */
    public texture: Nullable<BaseTexture>;

    /**
     * Create a new TextureBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, false, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);
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

    public get target() {
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

    public autoConfigure(material: NodeMaterial) {
        if (!this.uv.isConnected) {
            let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "uv");

            if (!uvInput) {
                uvInput = new InputBlock("uv");
                uvInput.setAsAttribute();
            }
            uvInput.output.connectTo(this.uv);
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
            return;
        }

        if (!this.texture.getTextureMatrix().isIdentityAs3x2()) {
            defines.setValue(this._defineName, true);
        } else {
            defines.setValue(this._defineName, false);
            defines.setValue(this._mainUVDefineName, true);
        }
    }

    public isReady() {
        if (this.texture && !this.texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh || !this.texture) {
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
        this._mainUVDefineName = state._getFreeDefineName("vMain" + uvInput.associatedVariableName);

        if (uvInput.connectedPoint!.ownerBlock.isInput) {
            let uvInputOwnerBlock = uvInput.connectedPoint!.ownerBlock as InputBlock;

            if (!uvInputOwnerBlock.isAttribute) {
                state._emitUniformFromString(uvInput.associatedVariableName, "vec2");
            }
        }

        this._mainUVName = "vMain" + uvInput.associatedVariableName;
        this._transformedUVName = state._getFreeVariableName("transformedUV");
        this._textureTransformName = state._getFreeVariableName("textureTransform");
        this._textureInfoName = state._getFreeVariableName("textureInfoName");

        state._emitVaryingFromString(this._transformedUVName, "vec2", this._defineName);
        state._emitVaryingFromString(this._mainUVName, "vec2", this._mainUVDefineName);

        state._emitUniformFromString(this._textureTransformName, "mat4", this._defineName);

        state.compilationString += `#ifdef ${this._defineName}\r\n`;
        state.compilationString += `${this._transformedUVName} = vec2(${this._textureTransformName} * vec4(${uvInput.associatedVariableName}.xy, 1.0, 0.0));\r\n`;
        state.compilationString += `#else\r\n`;
        state.compilationString += `${this._mainUVName} = ${uvInput.associatedVariableName}.xy;\r\n`;
        state.compilationString += `#endif\r\n`;
    }

    private _writeOutput(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string) {
        let uvInput = this.uv;

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `${this._declareOutput(output, state)} = texture2D(${this._samplerName}, ${uvInput.associatedVariableName}).${swizzle};\r\n`;
            return;
        }

        const complement = ` * ${this._textureInfoName}`;

        state.compilationString += `#ifdef ${this._defineName}\r\n`;
        state.compilationString += `${this._declareOutput(output, state)} = texture2D(${this._samplerName}, ${this._transformedUVName}).${swizzle}${complement};\r\n`;
        state.compilationString += `#else\r\n`;
        state.compilationString += `${this._declareOutput(output, state)} = texture2D(${this._samplerName}, ${"vMain" + uvInput.associatedVariableName}).${swizzle}${complement};\r\n`;
        state.compilationString += `#endif\r\n`;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            this._injectVertexCode(state);
            return;
        }

        state.sharedData.blockingBlocks.push(this);
        state.sharedData.textureBlocks.push(this);

        this._samplerName = state._getFreeVariableName(this.name + "Sampler");
        state.samplers.push(this._samplerName);
        state._samplerDeclaration += `uniform sampler2D ${this._samplerName};\r\n`;

        // Fragment
        state.sharedData.bindableBlocks.push(this);
        if (this._isMixed) {
            state.sharedData.blocksWithDefines.push(this);
            state._emitUniformFromString(this._textureInfoName, "float");
        }

        for (var output of this._outputs) {
            if (output.hasEndpoints) {
                this._writeOutput(state, output, output.name);
            }
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        if (!this.texture) {
            return "";
        }

        var codeString = `${this._codeVariableName}.texture = new BABYLON.Texture("${this.texture.name}");\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        if (this.texture) {
            serializationObject.texture = this.texture.serialize();
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        if (serializationObject.texture) {
            this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl);
        }
    }
}

_TypeStore.RegisteredTypes["BABYLON.TextureBlock"] = TextureBlock;