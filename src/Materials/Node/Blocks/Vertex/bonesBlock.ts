import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialWellKnownValues } from '../../nodeMaterialWellKnownValues';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { Mesh } from '../../../../Meshes/mesh';
import { Effect, EffectFallbacks } from '../../../effect';
import { MaterialHelper } from '../../../materialHelper';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';

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
        this.registerInput("matricesIndicesExtra", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("matricesWeightsExtra", NodeMaterialBlockConnectionPointTypes.Vector4);
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

    public autoConfigure() {
        if (!this.matricesIndices.connectedPoint) {
            this.matricesIndices.setAsAttribute();
        }
        if (!this.matricesWeights.connectedPoint) {
            this.matricesWeights.setAsAttribute();
        }
        if (!this.matricesIndicesExtra.connectedPoint) {
            this.matricesIndicesExtra.setAsAttribute();
        }
        if (!this.matricesWeightsExtra.connectedPoint) {
            this.matricesWeightsExtra.setAsAttribute();
        }
        if (!this.world.connectedPoint) {
            this.world.setAsWellKnownValue(NodeMaterialWellKnownValues.World);
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
        state._emitFunctionFromInclude("bonesDeclaration", {
            removeAttributes: true,
            removeUniforms: false,
            removeVaryings: true,
            removeIfDef: false
        });

        let influenceVariablename = state._getFreeVariableName("influence");

        state.compilationString += state._emitCodeFromInclude("bonesVertex", {
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

        state.compilationString += this._declareOutput(output, state) + ` = ${worldInput.associatedVariableName} * ${influenceVariablename};`;
        return this;
    }
}