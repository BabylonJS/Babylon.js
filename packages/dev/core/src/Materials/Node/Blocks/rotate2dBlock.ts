import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeMaterial } from "../nodeMaterial";
import { InputBlock } from "./Input/inputBlock";

/**
 * Block used to rotate a 2d vector by a given angle
 */
export class Rotate2dBlock extends NodeMaterialBlock {
    /**
     * Creates a new Rotate2dBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("angle", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector2);
    }

    /**
     * @returns the current class name
     * @returns the class name
     */
    public getClassName() {
        return "Rotate2dBlock";
    }

    /**
     * @returns the input vector
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * @returns the input angle
     */
    public get angle(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * @returns the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.angle.isConnected) {
            const angleInput = new InputBlock("angle");
            angleInput.value = 0;
            angleInput.output.connectTo(this.angle);
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];
        const angle = this.angle;
        const input = this.input;

        state.compilationString +=
            this._declareOutput(output, state) +
            ` = vec2(cos(${angle.associatedVariableName}) * ${input.associatedVariableName}.x - sin(${angle.associatedVariableName}) * ${input.associatedVariableName}.y, sin(${angle.associatedVariableName}) * ${input.associatedVariableName}.x + cos(${angle.associatedVariableName}) * ${input.associatedVariableName}.y);\r\n`;

        return this;
    }
}

RegisterClass("BABYLON.Rotate2dBlock", Rotate2dBlock);
