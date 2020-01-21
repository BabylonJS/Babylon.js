import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { Effect } from '../../../effect';
import { Mesh } from '../../../../Meshes/mesh';
import { MaterialHelper } from '../../../materialHelper';
import { VertexBuffer } from '../../../../Meshes/buffer';
import { InputBlock } from '../Input/inputBlock';
import { _TypeStore } from '../../../../Misc/typeStore';

import "../../../../Shaders/ShadersInclude/morphTargetsVertexDeclaration";
import "../../../../Shaders/ShadersInclude/morphTargetsVertexGlobalDeclaration";

/**
 * Block used to add morph targets support to vertex shader
 */
export class MorphTargetsBlock extends NodeMaterialBlock {
    private _repeatableContentAnchor: string;

    /**
     * Create a new MorphTargetsBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex);

        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("normal", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("tangent", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerOutput("positionOutput", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("normalOutput", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("tangentOutput", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("uvOutput", NodeMaterialBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MorphTargetsBlock";
    }

    /**
     * Gets the position input component
     */
    public get position(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the normal input component
     */
    public get normal(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the tangent input component
     */
    public get tangent(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the tangent input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the position output component
     */
    public get positionOutput(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the normal output component
     */
    public get normalOutput(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the tangent output component
     */
    public get tangentOutput(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the tangent output component
     */
    public get uvOutput(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("morphTargetInfluences");
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.position.isConnected) {
            let positionInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "position");

            if (!positionInput) {
                positionInput = new InputBlock("position");
                positionInput.setAsAttribute();
            }
            positionInput.output.connectTo(this.position);
        }
        if (!this.normal.isConnected) {
            let normalInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "normal");

            if (!normalInput) {
                normalInput = new InputBlock("normal");
                normalInput.setAsAttribute("normal");
            }
            normalInput.output.connectTo(this.normal);
        }
        if (!this.tangent.isConnected) {
            let tangentInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "tangent");

            if (!tangentInput) {
                tangentInput = new InputBlock("tangent");
                tangentInput.setAsAttribute("tangent");
            }
            tangentInput.output.connectTo(this.tangent);
        }
        if (!this.uv.isConnected) {
            let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "uv");

            if (!uvInput) {
                uvInput = new InputBlock("uv");
                uvInput.setAsAttribute("uv");
            }
            uvInput.output.connectTo(this.uv);
        }
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (!defines._areAttributesDirty) {
            return;
        }
        MaterialHelper.PrepareDefinesForMorphTargets(mesh, defines);
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (mesh && mesh.morphTargetManager && mesh.morphTargetManager.numInfluencers > 0) {
            MaterialHelper.BindMorphTargetParameters(mesh, effect);
        }
    }

    public replaceRepeatableContent(vertexShaderState: NodeMaterialBuildState, fragmentShaderState: NodeMaterialBuildState, mesh: AbstractMesh, defines: NodeMaterialDefines) {
        let position = this.position;
        let normal = this.normal;
        let tangent = this.tangent;
        let uv = this.uv;
        let positionOutput = this.positionOutput;
        let normalOutput = this.normalOutput;
        let tangentOutput = this.tangentOutput;
        let uvOutput = this.uvOutput;
        let state = vertexShaderState;
        let repeatCount = defines.NUM_MORPH_INFLUENCERS as number;

        var manager = (<Mesh>mesh).morphTargetManager;
        var hasNormals = manager && manager.supportsNormals && defines["NORMAL"];
        var hasTangents = manager && manager.supportsTangents && defines["TANGENT"];
        var hasUVs = manager && manager.supportsUVs && defines["UV1"];

        let injectionCode = "";

        for (var index = 0; index < repeatCount; index++) {
            injectionCode += `#ifdef MORPHTARGETS\r\n`;
            injectionCode += `${positionOutput.associatedVariableName} += (position${index} - ${position.associatedVariableName}) * morphTargetInfluences[${index}];\r\n`;

            if (hasNormals) {
                injectionCode += `#ifdef MORPHTARGETS_NORMAL\r\n`;
                injectionCode += `${normalOutput.associatedVariableName} += (normal${index} - ${normal.associatedVariableName}) * morphTargetInfluences[${index}];\r\n`;
                injectionCode += `#endif\r\n`;
            }

            if (hasTangents) {
                injectionCode += `#ifdef MORPHTARGETS_TANGENT\r\n`;
                injectionCode += `${tangentOutput.associatedVariableName}.xyz += (tangent${index} - ${tangent.associatedVariableName}.xyz) * morphTargetInfluences[${index}];\r\n`;
                injectionCode += `#endif\r\n`;
            }

            if (hasUVs) {
                injectionCode += `#ifdef MORPHTARGETS_UV\r\n`;
                injectionCode += `${uvOutput.associatedVariableName}.xy += (uv_${index} - ${uv.associatedVariableName}.xy) * morphTargetInfluences[${index}];\r\n`;
                injectionCode += `#endif\r\n`;
            }

            injectionCode += `#endif\r\n`;
        }

        state.compilationString = state.compilationString.replace(this._repeatableContentAnchor, injectionCode);

        if (repeatCount > 0) {
            for (var index = 0; index < repeatCount; index++) {
                state.attributes.push(VertexBuffer.PositionKind + index);

                if (hasNormals) {
                    state.attributes.push(VertexBuffer.NormalKind + index);
                }

                if (hasTangents) {
                    state.attributes.push(VertexBuffer.TangentKind + index);
                }

                if (hasUVs) {
                    state.attributes.push(VertexBuffer.UVKind + "_" + index);
                }
            }
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        // Register for defines
        state.sharedData.blocksWithDefines.push(this);

        // Register for binding
        state.sharedData.bindableBlocks.push(this);

        // Register for repeatable content generation
        state.sharedData.repeatableContentBlocks.push(this);

        // Emit code
        let position = this.position;
        let normal = this.normal;
        let tangent = this.tangent;
        let uv = this.uv;
        let positionOutput = this.positionOutput;
        let normalOutput = this.normalOutput;
        let tangentOutput = this.tangentOutput;
        let uvOutput = this.uvOutput;
        let comments = `//${this.name}`;

        state.uniforms.push("morphTargetInfluences");

        state._emitFunctionFromInclude("morphTargetsVertexGlobalDeclaration", comments);
        state._emitFunctionFromInclude("morphTargetsVertexDeclaration", comments, {
            repeatKey: "maxSimultaneousMorphTargets"
        });

        state.compilationString += `${this._declareOutput(positionOutput, state)} = ${position.associatedVariableName};\r\n`;
        state.compilationString += `#ifdef NORMAL\r\n`;
        state.compilationString += `${this._declareOutput(normalOutput, state)} = ${normal.associatedVariableName};\r\n`;
        state.compilationString += `#else\r\n`;
        state.compilationString += `${this._declareOutput(normalOutput, state)} = vec3(0., 0., 0.);\r\n`;
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#ifdef TANGENT\r\n`;
        state.compilationString += `${this._declareOutput(tangentOutput, state)} = ${tangent.associatedVariableName};\r\n`;
        state.compilationString += `#else\r\n`;
        state.compilationString += `${this._declareOutput(tangentOutput, state)} = vec3(0., 0., 0.);\r\n`;
        state.compilationString += `#endif\r\n`;
        state.compilationString += `#ifdef UV1\r\n`;
        state.compilationString += `${this._declareOutput(uvOutput, state)} = ${uv.associatedVariableName};\r\n`;
        state.compilationString += `#else\r\n`;
        state.compilationString += `${this._declareOutput(uvOutput, state)} = vec2(0., 0.);\r\n`;
        state.compilationString += `#endif\r\n`;

        // Repeatable content
        this._repeatableContentAnchor = state._repeatableContentAnchor;
        state.compilationString += this._repeatableContentAnchor;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.MorphTargetsBlock"] = MorphTargetsBlock;