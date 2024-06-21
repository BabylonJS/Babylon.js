import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { NodeMaterial } from "../../nodeMaterial";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues";
import { InputBlock } from "../Input/inputBlock";

/**
 * Block used to transform a vector3 or a vector4 into screen space
 */
export class ScreenSpaceBlock extends NodeMaterialBlock {
    /**
     * Creates a new ScreenSpaceBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("vector", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("worldViewProjection", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerOutput("x", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("y", NodeMaterialBlockConnectionPointTypes.Float);

        this.inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ScreenSpaceBlock";
    }

    /**
     * Gets the vector input
     */
    public get vector(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the worldViewProjection transform input
     */
    public get worldViewProjection(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the x output component
     */
    public get x(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the y output component
     */
    public get y(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.worldViewProjection.isConnected) {
            let worldViewProjectionInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.WorldViewProjection && additionalFilteringInfo(b));

            if (!worldViewProjectionInput) {
                worldViewProjectionInput = new InputBlock("worldViewProjection");
                worldViewProjectionInput.setAsSystemValue(NodeMaterialSystemValues.WorldViewProjection);
            }
            worldViewProjectionInput.output.connectTo(this.worldViewProjection);
        }
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const vector = this.vector;
        const worldViewProjection = this.worldViewProjection;

        if (!vector.connectedPoint) {
            return;
        }

        const worldViewProjectionName = worldViewProjection.associatedVariableName;

        const tempVariableName = state._getFreeVariableName("screenSpaceTemp");

        switch (vector.connectedPoint.type) {
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                state.compilationString += `${state._declareLocalVar(tempVariableName, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${worldViewProjectionName} * vec4${state.fSuffix}(${vector.associatedVariableName}, 1.0);\n`;
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                state.compilationString += `${state._declareLocalVar(tempVariableName, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${worldViewProjectionName} * ${vector.associatedVariableName};\n`;
                break;
        }

        state.compilationString += `${tempVariableName} = vec4${state.fSuffix}(${tempVariableName}.xy / ${tempVariableName}.w, ${tempVariableName}.zw);`;
        state.compilationString += `${tempVariableName} = vec4${state.fSuffix}(${tempVariableName}.xy * 0.5 + vec2${state.fSuffix}(0.5, 0.5), ${tempVariableName}.zw);`;

        if (this.output.hasEndpoints) {
            state.compilationString += state._declareOutput(this.output) + ` = ${tempVariableName}.xy;\n`;
        }
        if (this.x.hasEndpoints) {
            state.compilationString += state._declareOutput(this.x) + ` = ${tempVariableName}.x;\n`;
        }
        if (this.y.hasEndpoints) {
            state.compilationString += state._declareOutput(this.y) + ` = ${tempVariableName}.y;\n`;
        }

        return this;
    }
}

RegisterClass("BABYLON.ScreenSpaceBlock", ScreenSpaceBlock);
