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

        this.registerInput("vector", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("worldViewProjection", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerOutput("x", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("y", NodeMaterialBlockConnectionPointTypes.Float);

        this.inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
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

    public autoConfigure(material: NodeMaterial) {
        if (!this.worldViewProjection.isConnected) {
            let worldViewProjectionInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.WorldViewProjection);

            if (!worldViewProjectionInput) {
                worldViewProjectionInput = new InputBlock("worldViewProjection");
                worldViewProjectionInput.setAsSystemValue(NodeMaterialSystemValues.WorldViewProjection);
            }
            worldViewProjectionInput.output.connectTo(this.worldViewProjection);
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
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
                state.compilationString += `vec4 ${tempVariableName} = ${worldViewProjectionName} * vec4(${vector.associatedVariableName}, 1.0);\r\n`;
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                state.compilationString += `vec4 ${tempVariableName} = ${worldViewProjectionName} * ${vector.associatedVariableName};\r\n`;
                break;
        }

        state.compilationString += `${tempVariableName}.xy /= ${tempVariableName}.w;`;
        state.compilationString += `${tempVariableName}.xy = ${tempVariableName}.xy * 0.5 + vec2(0.5, 0.5);`;

        if (this.output.hasEndpoints) {
            state.compilationString += this._declareOutput(this.output, state) + ` = ${tempVariableName}.xy;\r\n`;
        }
        if (this.x.hasEndpoints) {
            state.compilationString += this._declareOutput(this.x, state) + ` = ${tempVariableName}.x;\r\n`;
        }
        if (this.y.hasEndpoints) {
            state.compilationString += this._declareOutput(this.y, state) + ` = ${tempVariableName}.y;\r\n`;
        }

        return this;
    }
}

RegisterClass("BABYLON.ScreenSpaceBlock", ScreenSpaceBlock);
