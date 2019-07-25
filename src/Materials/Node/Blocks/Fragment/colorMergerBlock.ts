import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';

/**
 * Block used to create a Color3/4 out of individual inputs (one for each component)
 */
export class ColorMergerBlock extends NodeMaterialBlock {
    /**
     * Create a new ColorMergerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("r", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("g", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("b", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float, true);

        this.registerOutput("rgba", NodeMaterialBlockConnectionPointTypes.Color4);
        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ColorMergerBlock";
    }

    /**
     * Gets the r component input
     */
    public get r(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the g component input
     */
    public get g(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the b component input
     */
    public get b(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the a component input
     */
    public get a(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let rInput = this.r;
        let gInput = this.g;
        let bInput = this.b;
        let aInput = this.a;

        let color4Output = this._outputs[0];
        let color3Output = this._outputs[1];

        if (color4Output.endpoints.length) {
            state.compilationString += this._declareOutput(color4Output, state) + ` = vec4(${this._writeVariable(rInput)}, ${this._writeVariable(gInput)}, ${this._writeVariable(bInput)}, ${aInput.isConnected ? this._writeVariable(aInput) : "0.0"});\r\n`;
        } else if (color3Output.endpoints.length) {
            state.compilationString += this._declareOutput(color3Output, state) + ` = vec3(${this._writeVariable(rInput)}, ${this._writeVariable(gInput)}, ${this._writeVariable(bInput)});\r\n`;
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ColorMergerBlock"] = ColorMergerBlock;