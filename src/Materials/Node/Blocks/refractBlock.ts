import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
/**
 * Block used to get the refracted vector from a direction and a normal
 */
export class RefractBlock extends NodeMaterialBlock {
    /**
     * Creates a new RefractBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("incident", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("normal", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("ior", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color3);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color4);
        this._inputs[1].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);
        this._inputs[1].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color3);
        this._inputs[1].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "RefractBlock";
    }

    /**
     * Gets the incident component
     */
    public get incident(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the normal component
     */
    public get normal(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the index of refraction component
     */
    public get ior(): NodeMaterialConnectionPoint {
        return this._inputs[2];
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

        state.compilationString += this._declareOutput(output, state) + ` = refract(${this.incident.associatedVariableName}.xyz, ${this.normal.associatedVariableName}.xyz, ${this.ior.associatedVariableName});\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.RefractBlock"] = RefractBlock;