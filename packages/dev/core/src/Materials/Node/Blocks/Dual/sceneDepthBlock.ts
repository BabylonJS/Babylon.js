import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { BaseTexture } from "../../../Textures/baseTexture";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Scene } from "../../../../scene";
import type { InputBlock } from "../Input/inputBlock";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { Effect } from "../../../effect";

import type { NodeMaterial } from "../../nodeMaterial";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "core/Engines/constants";

import "../../../../Rendering/depthRendererSceneComponent";

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
        embedded: true,
        notifiers: {
            activatePreviewCommand: true,
            callback: (scene, block) => {
                const sceneDepthBlock = block as SceneDepthBlock;
                let retVal = false;
                if (sceneDepthBlock.useNonLinearDepth) {
                    sceneDepthBlock.storeCameraSpaceZ = false;
                    retVal = true;
                }
                if (scene) {
                    scene.disableDepthRenderer();
                }
                return retVal;
            },
        },
    })
    public useNonLinearDepth = false;

    /**
     * Defines if the depth renderer should be setup in camera space Z mode (if set, useNonLinearDepth has no effect)
     */
    @editableInPropertyPage("Store Camera space Z", PropertyTypeForEdition.Boolean, "ADVANCED", {
        notifiers: {
            activatePreviewCommand: true,
            callback: (scene, block) => {
                const sceneDepthBlock = block as SceneDepthBlock;
                let retVal = false;
                if (sceneDepthBlock.storeCameraSpaceZ) {
                    sceneDepthBlock.useNonLinearDepth = false;
                    retVal = true;
                }
                if (scene) {
                    scene.disableDepthRenderer();
                }
                return retVal;
            },
        },
    })
    public storeCameraSpaceZ = false;

    /**
     * Defines if the depth renderer should be setup in full 32 bits float mode
     */
    @editableInPropertyPage("Force 32 bits float", PropertyTypeForEdition.Boolean, "ADVANCED", {
        notifiers: { activatePreviewCommand: true, callback: (scene) => scene?.disableDepthRenderer() },
    })
    public force32itsFloat = false;

    /**
     * Create a new SceneDepthBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this._isUnique = true;

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.AutoDetect, false, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerOutput("depth", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Neutral);

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
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("textureSampler");
    }

    /** {@inheritDoc} */
    public override get target() {
        if (!this.uv.isConnected) {
            return NodeMaterialBlockTargets.VertexAndFragment;
        }

        if (this.uv.sourceBlock!.isInput) {
            return NodeMaterialBlockTargets.VertexAndFragment;
        }

        return NodeMaterialBlockTargets.Fragment;
    }

    private _getTexture(scene: Scene): BaseTexture {
        const depthRenderer = scene.enableDepthRenderer(undefined, this.useNonLinearDepth, this.force32itsFloat, undefined, this.storeCameraSpaceZ);

        return depthRenderer.getDepthMap();
    }

    /**
     * Bind data to effect
     * @param effect - the effect to bind to
     * @param nodeMaterial - the node material
     */
    public override bind(effect: Effect, nodeMaterial: NodeMaterial) {
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
                    uvInput.type === NodeMaterialBlockConnectionPointTypes.Vector3
                        ? NodeMaterialBlockConnectionPointTypes.Vector3
                        : uvInput.type === NodeMaterialBlockConnectionPointTypes.Vector4
                          ? NodeMaterialBlockConnectionPointTypes.Vector4
                          : NodeMaterialBlockConnectionPointTypes.Vector2
                );
            }
        }

        this._mainUVName = "vMain" + uvInput.associatedVariableName;

        state._emitVaryingFromString(this._mainUVName, NodeMaterialBlockConnectionPointTypes.Vector2);

        state.compilationString += `${this._mainUVName} = ${uvInput.associatedVariableName}.xy;\n`;

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
            const textureReadFunc =
                state.shaderLanguage === ShaderLanguage.GLSL
                    ? `texture2D(${this._samplerName},`
                    : `textureSampleLevel(${this._samplerName}, ${this._samplerName + Constants.AUTOSAMPLERSUFFIX},`;

            const complement = state.shaderLanguage === ShaderLanguage.GLSL ? "" : ", 0";

            state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)}=  ${textureReadFunc} ${uvInput.associatedVariableName}.xy${complement});\n`;
            return;
        }

        const textureReadFunc =
            state.shaderLanguage === ShaderLanguage.GLSL
                ? `texture2D(${this._samplerName},`
                : `textureSample(${this._samplerName}, ${this._samplerName + Constants.AUTOSAMPLERSUFFIX},`;

        if (this.uv.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${textureReadFunc} ${uvInput.associatedVariableName}.xy);\n`;
            return;
        }

        state.compilationString += `${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${textureReadFunc} ${this._mainUVName});\n`;
    }

    private _writeOutput(state: NodeMaterialBuildState, output: NodeMaterialConnectionPoint, swizzle: string, vertexMode = false) {
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
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
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

    /**
     * Serializes the block
     * @returns the serialized object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.useNonLinearDepth = this.useNonLinearDepth;
        serializationObject.storeCameraSpaceZ = this.storeCameraSpaceZ;
        serializationObject.force32itsFloat = this.force32itsFloat;

        return serializationObject;
    }

    /**
     * Deserializes the block
     * @param serializationObject - the serialization object
     * @param scene - the scene
     * @param rootUrl - the root url
     */
    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.useNonLinearDepth = serializationObject.useNonLinearDepth;
        this.storeCameraSpaceZ = !!serializationObject.storeCameraSpaceZ;
        this.force32itsFloat = serializationObject.force32itsFloat;
    }
}

RegisterClass("BABYLON.SceneDepthBlock", SceneDepthBlock);
