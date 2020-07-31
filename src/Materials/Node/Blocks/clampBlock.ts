import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
import { Scene } from '../../../scene';
import { editableInPropertyPage, PropertyTypeForEdition } from "../nodeMaterialDecorator";

/**
 * Block used to clamp a float
 */
export class ClampBlock extends NodeMaterialBlock {

    /** Gets or sets the minimum range */
    @editableInPropertyPage("Minimum", PropertyTypeForEdition.Float)
    public minimum = 0.0;
    /** Gets or sets the maximum range */
    @editableInPropertyPage("Maximum", PropertyTypeForEdition.Float)
    public maximum = 1.0;

    /**
     * Creates a new ClampBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ClampBlock";
    }

    /**
     * Gets the value input component
     */
    public get value(): NodeMaterialConnectionPoint {
        return this._inputs[0];
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

        state.compilationString += this._declareOutput(output, state) + ` = clamp(${this.value.associatedVariableName}, ${this._writeFloat(this.minimum)}, ${this._writeFloat(this.maximum)});\r\n`;

        return this;
    }

    protected _dumpPropertiesCode() {
        var codeString = `${this._codeVariableName}.minimum = ${this.minimum};\r\n`;

        codeString += `${this._codeVariableName}.maximum = ${this.maximum};\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.minimum = this.minimum;
        serializationObject.maximum = this.maximum;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.minimum = serializationObject.minimum;
        this.maximum = serializationObject.maximum;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ClampBlock"] = ClampBlock;