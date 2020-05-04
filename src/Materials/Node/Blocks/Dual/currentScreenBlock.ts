import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterialDefines } from '../../nodeMaterial';
import { BaseTexture } from '../../../Textures/baseTexture';
import { Nullable } from '../../../../types';
import { _TypeStore } from '../../../../Misc/typeStore';
import { Texture } from '../../../Textures/texture';
import { Scene } from '../../../../scene';
import { InputBlock } from '../Input/inputBlock';

declare type NodeMaterial = import("../../nodeMaterial").NodeMaterial;

/**
 * Base block used as input for post process
 */
export class CurrentScreenBlock extends NodeMaterialBlock {

    private _samplerName = "textureSampler";
    private _linearDefineName: string;
    private _gammaDefineName: string;
    private _mainUVName: string;
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
     * Create a new CurrentScreenBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this._isUnique = true;

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, false, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("r", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("g", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("b", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);
        this.registerOutput("a", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);

        this._inputs[0]._prioritizeVertex = true;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
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
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("textureSampler");
    }

    public get target() {
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

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        defines.setValue(this._linearDefineName, this.convertToGammaSpace, true);
        defines.setValue(this._gammaDefineName, this.convertToLinearSpace, true);
    }

    public isReady() {
        if (this.texture && !this.texture.isReadyOrNotBlocking()) {
            return false;
        }

        return true;
    }

    private _injectVertexCode(state: NodeMaterialBuildState) {
        let uvInput = this.uv;

        if (uvInput.connectedPoint!.ownerBlock.isInput) {
            let uvInputOwnerBlock = uvInput.connectedPoint!.ownerBlock as InputBlock;

            if (!uvInputOwnerBlock.isAttribute) {
                state._emitUniformFromString(uvInput.associatedVariableName, "vec2");
            }
        }

        this._mainUVName = "vMain" + uvInput.associatedVariableName;

        state._emitVaryingFromString(this._mainUVName, "vec2");

        state.compilationString += `${this._mainUVName} = ${uvInput.associatedVariableName}.xy;\r\n`;

        if (!this._outputs.some((o) => o.isConnectedInVertexShader)) {
            return;
        }

        this._writeTextureRead(state, true);

        for (var output of this._outputs) {
            if (output.hasEndpoints) {
                this._writeOutput(state, output, output.name, true);
            }
        }
    }

    private _writeTextureRead(state: NodeMaterialBuildState, vertexMode = false) {
        let uvInput = this.uv;

        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }

            state.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${uvInput.associatedVariableName});\r\n`;
            return;
        }

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${uvInput.associatedVariableName});\r\n`;
            return;
        }

        state.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${this._mainUVName});\r\n`;
    }

    private _writeOutput(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string, vertexMode = false) {
        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }

            state.compilationString += `${this._declareOutput(output, state)} = ${this._tempTextureRead}.${swizzle};\r\n`;

            return;
        }

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `${this._declareOutput(output, state)} = ${this._tempTextureRead}.${swizzle};\r\n`;
            return;
        }

        state.compilationString += `${this._declareOutput(output, state)} = ${this._tempTextureRead}.${swizzle};\r\n`;

        state.compilationString += `#ifdef ${this._linearDefineName}\r\n`;
        state.compilationString += `${output.associatedVariableName} = toGammaSpace(${output.associatedVariableName});\r\n`;
        state.compilationString += `#endif\r\n`;

        state.compilationString += `#ifdef ${this._gammaDefineName}\r\n`;
        state.compilationString += `${output.associatedVariableName} = toLinearSpace(${output.associatedVariableName});\r\n`;
        state.compilationString += `#endif\r\n`;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            this._tempTextureRead = state._getFreeVariableName("tempTextureRead");

            state._emit2DSampler(this._samplerName);

            state.sharedData.blockingBlocks.push(this);
            state.sharedData.textureBlocks.push(this);
            state.sharedData.blocksWithDefines.push(this);
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

        state._emit2DSampler(this._samplerName);

        this._linearDefineName = state._getFreeDefineName("ISLINEAR");
        this._gammaDefineName = state._getFreeDefineName("ISGAMMA");

        let comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        this._writeTextureRead(state);

        for (var output of this._outputs) {
            if (output.hasEndpoints) {
                this._writeOutput(state, output, output.name);
            }
        }

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.convertToGammaSpace = this.convertToGammaSpace;
        serializationObject.convertToLinearSpace = this.convertToLinearSpace;
        if (this.texture) {
            serializationObject.texture = this.texture.serialize();
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.convertToGammaSpace = serializationObject.convertToGammaSpace;
        this.convertToLinearSpace = !!serializationObject.convertToLinearSpace;

        if (serializationObject.texture) {
            rootUrl = serializationObject.texture.url.indexOf("data:") === 0 ? "" : rootUrl;
            this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl) as Texture;
        }
    }
}

_TypeStore.RegisteredTypes["BABYLON.CurrentScreenBlock"] = CurrentScreenBlock;