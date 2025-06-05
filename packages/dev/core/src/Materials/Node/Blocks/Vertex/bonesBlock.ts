import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { Mesh } from "../../../../Meshes/mesh";
import type { Effect } from "../../../effect";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import { InputBlock } from "../Input/inputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";

import type { EffectFallbacks } from "../../../effectFallbacks";
import { BindBonesParameters, PrepareDefinesForBones } from "../../../materialHelper.functions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

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
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("boneSampler");
        state._excludeVariableName("boneTextureWidth");
        state._excludeVariableName("mBones");
        state._excludeVariableName("BonesPerMesh");

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._initShaderSourceAsync(state.shaderLanguage);
    }

    private async _initShaderSourceAsync(shaderLanguage: ShaderLanguage) {
        this._codeIsReady = false;
        if (shaderLanguage === ShaderLanguage.WGSL) {
            await Promise.all([import("../../../../ShadersWGSL/ShadersInclude/bonesDeclaration"), import("../../../../ShadersWGSL/ShadersInclude/bonesVertex")]);
        } else {
            await Promise.all([import("../../../../Shaders/ShadersInclude/bonesDeclaration"), import("../../../../Shaders/ShadersInclude/bonesVertex")]);
        }

        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
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

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.matricesIndices.isConnected) {
            let matricesIndicesInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "matricesIndices" && additionalFilteringInfo(b));

            if (!matricesIndicesInput) {
                matricesIndicesInput = new InputBlock("matricesIndices");
                matricesIndicesInput.setAsAttribute("matricesIndices");
            }
            matricesIndicesInput.output.connectTo(this.matricesIndices);
        }
        if (!this.matricesWeights.isConnected) {
            let matricesWeightsInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "matricesWeights" && additionalFilteringInfo(b));

            if (!matricesWeightsInput) {
                matricesWeightsInput = new InputBlock("matricesWeights");
                matricesWeightsInput.setAsAttribute("matricesWeights");
            }
            matricesWeightsInput.output.connectTo(this.matricesWeights);
        }
        if (!this.world.isConnected) {
            let worldInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.World && additionalFilteringInfo(b));

            if (!worldInput) {
                worldInput = new InputBlock("world");
                worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
            }
            worldInput.output.connectTo(this.world);
        }
    }

    public override provideFallbacks(fallbacks: EffectFallbacks, mesh?: AbstractMesh) {
        if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            fallbacks.addCPUSkinningFallback(0, mesh);
        }
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        BindBonesParameters(mesh, effect);
    }

    public override prepareDefines(defines: NodeMaterialDefines, nodeMaterial: NodeMaterial, mesh?: AbstractMesh) {
        if (!defines._areAttributesDirty || !mesh) {
            return;
        }
        PrepareDefinesForBones(mesh, defines);
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        // Register for compilation fallbacks
        state.sharedData.blocksWithFallbacks.push(this);

        // Register for binding
        state.sharedData.forcedBindableBlocks.push(this);

        // Register for defines
        state.sharedData.blocksWithDefines.push(this);

        // Register internal uniforms and samplers
        state.uniforms.push("boneTextureWidth");
        state.uniforms.push("mBones");

        state.samplers.push("boneSampler");

        // Emit code
        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("bonesDeclaration", comments, {
            removeAttributes: true,
            removeUniforms: false,
            removeVaryings: true,
            removeIfDef: false,
        });

        const influenceVariablename = state._getFreeVariableName("influence");

        state.compilationString += state._emitCodeFromInclude("bonesVertex", comments, {
            replaceStrings: [
                {
                    search: /finalWorld=finalWorld\*influence;/,
                    replace: "",
                },
                {
                    search: /influence/gm,
                    replace: influenceVariablename,
                },
            ],
        });

        const output = this._outputs[0];
        const worldInput = this.world;

        state.compilationString += `#if NUM_BONE_INFLUENCERS>0\n`;
        state.compilationString += state._declareOutput(output) + ` = ${worldInput.associatedVariableName} * ${influenceVariablename};\n`;
        state.compilationString += `#else\n`;
        state.compilationString += state._declareOutput(output) + ` = ${worldInput.associatedVariableName};\n`;
        state.compilationString += `#endif\n`;

        return this;
    }
}

RegisterClass("BABYLON.BonesBlock", BonesBlock);
