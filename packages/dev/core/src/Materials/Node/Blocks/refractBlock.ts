import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
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

        this.registerInput("incident", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("normal", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("ior", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Vector3 |
                NodeMaterialBlockConnectionPointTypes.Vector4 |
                NodeMaterialBlockConnectionPointTypes.Color3 |
                NodeMaterialBlockConnectionPointTypes.Color4
        );
        this._inputs[1].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Vector3 |
                NodeMaterialBlockConnectionPointTypes.Vector4 |
                NodeMaterialBlockConnectionPointTypes.Color3 |
                NodeMaterialBlockConnectionPointTypes.Color4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
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

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        state.compilationString +=
            state._declareOutput(output) +
            ` = refract(${this.incident.associatedVariableName}.xyz, ${this.normal.associatedVariableName}.xyz, ${this.ior.associatedVariableName});\n`;

        return this;
    }
}

RegisterClass("BABYLON.RefractBlock", RefractBlock);
