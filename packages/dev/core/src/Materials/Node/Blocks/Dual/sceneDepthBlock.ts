import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { BaseTexture } from "../../../Textures/baseTexture";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Scene } from "../../../../scene";
import type { InputBlock } from "../Input/inputBlock";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../nodeMaterialDecorator";
import type { Effect } from "../../../effect";

declare type NodeMaterial = import("../../nodeMaterial").NodeMaterial;

/**
 * Block used to retrieve the depth (zbuffer) of the scene
 * @since 5.0.0
 */
export class SceneDepthBlock extends NodeMaterialBlock {
    private _samplerName: string;
    private _mainUVName: string;
    private _tempTextureRead: string;

    /**
     * Defines if the depth renderer should be setup in non linear mode
     */
    @editableInPropertyPage("Use non linear depth", PropertyTypeForEdition.Boolean, "ADVANCED", {
        notifiers: { activatePreviewCommand: true, callback: (scene) => scene.disableDepthRenderer() },
    })
    public useNonLinearDepth = false;

    /**
     * Defines if the depth renderer should be setup in full 32 bits float mode
     */
    @editableInPropertyPage("Force 32 bits float", PropertyTypeForEdition.Boolean, "ADVANCED", {
        notifiers: { activatePreviewCommand: true, callback: (scene) => scene.disableDepthRenderer() },
    })
    public force32itsFloat = false;

    /**
     * Create a new SceneDepthBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this._isUnique = true;

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, false, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerOutput("depth", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);

        this._inputs[0]._prioritizeVertex = false;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "SceneDepthBlock";
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the depth output component
     */
    public get depth(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("textureSampler");
    }

    public get target() {
        if (!this.uv.isConnected) {
            return NodeMaterialBlockTargets.VertexAndFragment;
        }

        if (this.uv.sourceBlock!.isInput) {
            return NodeMaterialBlockTargets.VertexAndFragment;
        }

        return NodeMaterialBlockTargets.Fragment;
    }

    private _getTexture(scene: Scene): BaseTexture {
        const depthRenderer = scene.enableDepthRenderer(undefined, this.useNonLinearDepth, this.force32itsFloat);

        return depthRenderer.getDepthMap();
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial) {
        const texture = this._getTexture(nodeMaterial.getScene());

        effect.setTexture(this._samplerName, texture);
    }

    private _injectVertexCode(state: NodeMaterialBuildState) {
        const uvInput = this.uv;

        if (uvInput.connectedPoint!.ownerBlock.isInput) {
            const uvInputOwnerBlock = uvInput.connectedPoint!.ownerBlock as InputBlock;

            if (!uvInputOwnerBlock.isAttribute) {
                state._emitUniformFromString(
                    uvInput.associatedVariableName,
                    "vec" + (uvInput.type === NodeMaterialBlockConnectionPointTypes.Vector3 ? "3" : uvInput.type === NodeMaterialBlockConnectionPointTypes.Vector4 ? "4" : "2")
                );
            }
        }

        this._mainUVName = "vMain" + uvInput.associatedVariableName;

        state._emitVaryingFromString(this._mainUVName, "vec2");

        state.compilationString += `${this._mainUVName} = ${uvInput.associatedVariableName}.xy;\r\n`;

        if (!this._outputs.some((o) => o.isConnectedInVertexShader)) {
            return;
        }

        this._writeTextureRead(state, true);

        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                this._writeOutput(state, output, "r", true);
            }
        }
    }

    private _writeTextureRead(state: NodeMaterialBuildState, vertexMode = false) {
        const uvInput = this.uv;

        if (vertexMode) {
            if (state.target === NodeMaterialBlockTargets.Fragment) {
                return;
            }

            state.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${uvInput.associatedVariableName}.xy);\r\n`;
            return;
        }

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `vec4 ${this._tempTextureRead} = texture2D(${this._samplerName}, ${uvInput.associatedVariableName}.xy);\r\n`;
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
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        this._samplerName = state._getFreeVariableName(this.name + "Sampler");
        this._tempTextureRead = state._getFreeVariableName("tempTextureRead");

        if (state.sharedData.bindableBlocks.indexOf(this) < 0) {
            state.sharedData.bindableBlocks.push(this);
        }

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            state._emit2DSampler(this._samplerName);
            this._injectVertexCode(state);
            return;
        }

        // Fragment
        if (!this._outputs.some((o) => o.isConnectedInFragmentShader)) {
            return;
        }

        state._emit2DSampler(this._samplerName);

        this._writeTextureRead(state);

        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                this._writeOutput(state, output, "r");
            }
        }

        return this;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.useNonLinearDepth = this.useNonLinearDepth;
        serializationObject.force32itsFloat = this.force32itsFloat;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.useNonLinearDepth = serializationObject.useNonLinearDepth;
        this.force32itsFloat = serializationObject.force32itsFloat;
    }
}

RegisterClass("BABYLON.SceneDepthBlock", SceneDepthBlock);
