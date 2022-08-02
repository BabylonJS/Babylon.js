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

/**
 * Block used to implement TBN matrix
 */
export class TBNBlock extends NodeMaterialBlock {
    /**
     * Create a new TBNBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("normal", NodeMaterialBlockConnectionPointTypes.Vector4, false);
        this.normal.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
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
    public getClassName() {
        return "TBNBlock";
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
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

    public get target() {
        return NodeMaterialBlockTargets.Fragment;
    }

    public set target(value: NodeMaterialBlockTargets) {}

    public autoConfigure(material: NodeMaterial) {
        if (!this.world.isConnected) {
            let worldInput = material.getInputBlockByPredicate((b) => b.isSystemValue && b.systemValue === NodeMaterialSystemValues.World);

            if (!worldInput) {
                worldInput = new InputBlock("world");
                worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
            }
            worldInput.output.connectTo(this.world);
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
            let tangentInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "tangent" && b.type === NodeMaterialBlockConnectionPointTypes.Vector4);

            if (!tangentInput) {
                tangentInput = new InputBlock("tangent");
                tangentInput.setAsAttribute("tangent");
            }
            tangentInput.output.connectTo(this.tangent);
        }
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
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

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const normal = this.normal;
        const tangent = this.tangent;
        const world = this.world;
        const TBN = this.TBN;
        const row0 = this.row0;
        const row1 = this.row1;
        const row2 = this.row2;

        // Fragment
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.compilationString += `
                // ${this.name}
                vec3 tbnNormal = normalize(${normal.associatedVariableName}).xyz;
                vec3 tbnTangent = normalize(${tangent.associatedVariableName}.xyz);
                vec3 tbnBitangent = cross(tbnNormal, tbnTangent) * ${tangent.associatedVariableName}.w;
                mat3 ${TBN.associatedVariableName} = mat3(${world.associatedVariableName}) * mat3(tbnTangent, tbnBitangent, tbnNormal);
            `;

            if (row0.hasEndpoints) {
                state.compilationString +=
                    this._declareOutput(row0, state) +
                    ` = vec3(${TBN.associatedVariableName}[0][0], ${TBN.associatedVariableName}[0][1], ${TBN.associatedVariableName}[0][2]);\r\n`;
            }
            if (row1.hasEndpoints) {
                state.compilationString +=
                    this._declareOutput(row1, state) + ` = vec3(${TBN.associatedVariableName}[1[0], ${TBN.associatedVariableName}[1][1], ${TBN.associatedVariableName}[1][2]);\r\n`;
            }
            if (row2.hasEndpoints) {
                state.compilationString +=
                    this._declareOutput(row2, state) +
                    ` = vec3(${TBN.associatedVariableName}[2][0], ${TBN.associatedVariableName}[2][1], ${TBN.associatedVariableName}[2][2]);\r\n`;
            }

            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }
}

RegisterClass("BABYLON.TBNBlock", TBNBlock);
