import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";

import "../../../Shaders/ShadersInclude/helperFunctions";

/**
 * Block used to get a random number
 */
export class RandomNumberBlock extends NodeMaterialBlock {
    /**
     * Creates a new RandomNumberBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("seed", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Vector2 |
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
    public getClassName() {
        return "RandomNumberBlock";
    }

    /**
     * Gets the seed input component
     */
    public get seed(): NodeMaterialConnectionPoint {
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

        const output = this._outputs[0];

        const comments = `//${this.name}`;
        state._emitFunctionFromInclude("helperFunctions", comments);

        state.compilationString += this._declareOutput(output, state) + ` = getRand(${this.seed.associatedVariableName}.xy);\n`;

        return this;
    }
}

RegisterClass("BABYLON.RandomNumberBlock", RandomNumberBlock);
