import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues";
import { InputBlock } from "../Input/inputBlock";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import { ShaderLanguage } from "../../../../Materials/shaderLanguage";

/**
 * Block used to implement TBN matrix
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class TBNBlock extends NodeMaterialBlock {
    /**
     * Create a new TBNBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("normal", NodeMaterialBlockConnectionPointTypes.AutoDetect, false);
        this.normal.addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color4 | NodeMaterialBlockConnectionPointTypes.Vector4 | NodeMaterialBlockConnectionPointTypes.Vector3
        );
        this.registerInput("tangent", NodeMaterialBlockConnectionPointTypes.Vector4, false);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false);

        this.registerOutput(
            "TBN",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("TBN", this, NodeMaterialConnectionPointDirection.Output, TBNBlock, "TBNBlock")
        );

        this.registerOutput("row0", NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("row1", NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("row2", NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "TBNBlock";
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("tbnNormal");
        state._excludeVariableName("tbnTangent");
        state._excludeVariableName("tbnBitangent");
        state._excludeVariableName("TBN");
    }

    /**
     * Gets the normal input component
     */
    public get normal(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the tangent input component
     */
    public get tangent(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the world matrix input component
     */
    public get world(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the TBN output component
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public get TBN(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the row0 of the output matrix
     */
    public get row0(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the row1 of the output matrix
     */
    public get row1(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the row2 of the output matrix
     */
    public get row2(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    public override get target() {
        return NodeMaterialBlockTargets.Fragment;
    }

    public override set target(value: NodeMaterialBlockTargets) {}

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.world.isConnected) {
            let worldInput = material.getInputBlockByPredicate((b) => b.isSystemValue && b.systemValue === NodeMaterialSystemValues.World && additionalFilteringInfo(b));

            if (!worldInput) {
                worldInput = new InputBlock("world");
                worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
            }
            worldInput.output.connectTo(this.world);
        }

        if (!this.normal.isConnected) {
            let normalInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "normal" && additionalFilteringInfo(b));

            if (!normalInput) {
                normalInput = new InputBlock("normal");
                normalInput.setAsAttribute("normal");
            }
            normalInput.output.connectTo(this.normal);
        }

        if (!this.tangent.isConnected) {
            let tangentInput = material.getInputBlockByPredicate(
                (b) => b.isAttribute && b.name === "tangent" && b.type === NodeMaterialBlockConnectionPointTypes.Vector4 && additionalFilteringInfo(b)
            );

            if (!tangentInput) {
                tangentInput = new InputBlock("tangent");
                tangentInput.setAsAttribute("tangent");
            }
            tangentInput.output.connectTo(this.tangent);
        }
    }

    public override prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        const normal = this.normal;
        const tangent = this.tangent;

        let normalAvailable = normal.isConnected;
        if (normal.connectInputBlock?.isAttribute && !mesh.isVerticesDataPresent(normal.connectInputBlock?.name)) {
            normalAvailable = false;
        }

        let tangentAvailable = tangent.isConnected;
        if (tangent.connectInputBlock?.isAttribute && !mesh.isVerticesDataPresent(tangent.connectInputBlock?.name)) {
            tangentAvailable = false;
        }

        const useTBNBlock = normalAvailable && tangentAvailable;

        defines.setValue("TBNBLOCK", useTBNBlock, true);
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const normal = this.normal;
        const tangent = this.tangent;
        const world = this.world;
        const tbn = this.TBN;
        const row0 = this.row0;
        const row1 = this.row1;
        const row2 = this.row2;
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        const mat3 = isWebGPU ? "mat3x3f" : "mat3";
        const fSuffix = isWebGPU ? "f" : "";

        // Fragment
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `
                // ${this.name}
                ${state._declareLocalVar("tbnNormal", NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(${normal.associatedVariableName}).xyz;
                ${state._declareLocalVar("tbnTangent", NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(${tangent.associatedVariableName}.xyz);
                ${state._declareLocalVar("tbnBitangent", NodeMaterialBlockConnectionPointTypes.Vector3)} = cross(tbnNormal, tbnTangent) * ${tangent.associatedVariableName}.w;
                ${isWebGPU ? "var" : "mat3"} ${tbn.associatedVariableName} = ${mat3}(${world.associatedVariableName}[0].xyz, ${world.associatedVariableName}[1].xyz, ${world.associatedVariableName}[2].xyz) * ${mat3}(tbnTangent, tbnBitangent, tbnNormal);
            `;

            if (row0.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(row0) +
                    ` = vec3${fSuffix}(${tbn.associatedVariableName}[0][0], ${tbn.associatedVariableName}[0][1], ${tbn.associatedVariableName}[0][2]);\n`;
            }
            if (row1.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(row1) +
                    ` = vec3${fSuffix}(${tbn.associatedVariableName}[1[0], ${tbn.associatedVariableName}[1][1], ${tbn.associatedVariableName}[1][2]);\n`;
            }
            if (row2.hasEndpoints) {
                state.compilationString +=
                    state._declareOutput(row2) +
                    ` = vec3${fSuffix}(${tbn.associatedVariableName}[2][0], ${tbn.associatedVariableName}[2][1], ${tbn.associatedVariableName}[2][2]);\n`;
            }

            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }
}

RegisterClass("BABYLON.TBNBlock", TBNBlock);
