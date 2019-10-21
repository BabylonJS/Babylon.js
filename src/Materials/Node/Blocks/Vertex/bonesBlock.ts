import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialSystemValues } from '../../Enums/nodeMaterialSystemValues';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { Mesh } from '../../../../Meshes/mesh';
import { Effect } from '../../../effect';
import { MaterialHelper } from '../../../materialHelper';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { InputBlock } from '../Input/inputBlock';
import { _TypeStore } from '../../../../Misc/typeStore';

import "../../../../Shaders/ShadersInclude/bonesDeclaration";
import "../../../../Shaders/ShadersInclude/bonesVertex";
import { EffectFallbacks } from '../../../effectFallbacks';

/**
 * Block used to add support for vertex skinning (bones)
 */
export class BonesBlock extends NodeMaterialBlock {
    /**
     * Creates a new BonesBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex);

        this.registerInput("matricesIndices", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("matricesWeights", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("matricesIndicesExtra", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("matricesWeightsExtra", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Matrix);
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("boneSampler");
        state._excludeVariableName("boneTextureWidth");
        state._excludeVariableName("mBones");
        state._excludeVariableName("BonesPerMesh");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "BonesBlock";
    }

    /**
     * Gets the matrix indices input component
     */
    public get matricesIndices(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the matrix weights input component
     */
    public get matricesWeights(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the extra matrix indices input component
     */
    public get matricesIndicesExtra(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the extra matrix weights input component
     */
    public get matricesWeightsExtra(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the world input component
     */
    public get world(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.matricesIndices.isConnected) {
            let matricesIndicesInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "matricesIndices");

            if (!matricesIndicesInput) {
                matricesIndicesInput = new InputBlock("matricesIndices");
                matricesIndicesInput.setAsAttribute("matricesIndices");
            }
            matricesIndicesInput.output.connectTo(this.matricesIndices);
        }
        if (!this.matricesWeights.isConnected) {
            let matricesWeightsInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "matricesWeights");

            if (!matricesWeightsInput) {
                matricesWeightsInput = new InputBlock("matricesWeights");
                matricesWeightsInput.setAsAttribute("matricesWeights");
            }
            matricesWeightsInput.output.connectTo(this.matricesWeights);
        }
        if (!this.world.isConnected) {
            let worldInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.World);

            if (!worldInput) {
                worldInput = new InputBlock("world");
                worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
            }
            worldInput.output.connectTo(this.world);
        }
    }

    public provideFallbacks(mesh: AbstractMesh, fallbacks: EffectFallbacks) {
        if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            fallbacks.addCPUSkinningFallback(0, mesh);
        }
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        MaterialHelper.BindBonesParameters(mesh, effect);
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (!defines._areAttributesDirty) {
            return;
        }
        MaterialHelper.PrepareDefinesForBones(mesh, defines);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        // Register for compilation fallbacks
        state.sharedData.blocksWithFallbacks.push(this);

        // Register for binding
        state.sharedData.bindableBlocks.push(this);

        // Register for defines
        state.sharedData.blocksWithDefines.push(this);

        // Register internal uniforms and samplers
        state.uniforms.push("boneTextureWidth");
        state.uniforms.push("mBones");

        state.samplers.push("boneSampler");

        // Emit code
        let comments = `//${this.name}`;
        state._emitFunctionFromInclude("bonesDeclaration", comments, {
            removeAttributes: true,
            removeUniforms: false,
            removeVaryings: true,
            removeIfDef: false
        });

        let influenceVariablename = state._getFreeVariableName("influence");

        state.compilationString += state._emitCodeFromInclude("bonesVertex", comments, {
            replaceStrings: [
                {
                    search: /finalWorld=finalWorld\*influence;/,
                    replace: ""
                },
                {
                    search: /influence/gm,
                    replace: influenceVariablename
                }
            ]
        });

        let output = this._outputs[0];
        let worldInput = this.world;

        state.compilationString += `#if NUM_BONE_INFLUENCERS>0\r\n`;
        state.compilationString += this._declareOutput(output, state) + ` = ${worldInput.associatedVariableName} * ${influenceVariablename};\r\n`;
        state.compilationString += `#else\r\n`;
        state.compilationString += this._declareOutput(output, state) + ` = ${worldInput.associatedVariableName};\r\n`;
        state.compilationString += `#endif\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.BonesBlock"] = BonesBlock;