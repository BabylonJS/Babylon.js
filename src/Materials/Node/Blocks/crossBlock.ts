import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
/**
 * Block used to apply a cross product between 2 vectors
 */
export class CrossBlock extends NodeMaterialBlock {
    /**
     * Creates a new CrossBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("left", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);

        this._linkConnectionTypes(0, 1);

        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector2);
        this._inputs[1].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
        this._inputs[1].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
        this._inputs[1].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "CrossBlock";
    }

    /**
     * Gets the left operand input component
     */
    public get left(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the right operand input component
     */
    public get right(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];

        state.compilationString += this._declareOutput(output, state) + ` = cross(${this.left.associatedVariableName}.xyz, ${this.right.associatedVariableName}.xyz);\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.CrossBlock"] = CrossBlock;