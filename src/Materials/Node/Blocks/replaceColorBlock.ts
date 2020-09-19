import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
/**
 * Block used to replace a color by another one
 */
export class ReplaceColorBlock extends NodeMaterialBlock {
    /**
     * Creates a new ReplaceColorBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("reference", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("distance", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("replacement", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);
        this._linkConnectionTypes(0, 3);

        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
        this._inputs[1].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
        this._inputs[1].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
        this._inputs[3].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
        this._inputs[3].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ReplaceColorBlock";
    }

    /**
     * Gets the value input component
     */
    public get value(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the reference input component
     */
    public get reference(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the distance input component
     */
    public get distance(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the replacement input component
     */
    public get replacement(): NodeMaterialConnectionPoint {
        return this._inputs[3];
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

        state.compilationString += this._declareOutput(output, state) + `;\r\n`;
        state.compilationString += `if (length(${this.value.associatedVariableName} - ${this.reference.associatedVariableName}) < ${this.distance.associatedVariableName}) {\r\n`;
        state.compilationString += `${output.associatedVariableName} = ${this.replacement.associatedVariableName};\r\n`;
        state.compilationString += `} else {\r\n`;
        state.compilationString += `${output.associatedVariableName} = ${this.value.associatedVariableName};\r\n`;
        state.compilationString += `}\r\n`;
        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ReplaceColorBlock"] = ReplaceColorBlock;