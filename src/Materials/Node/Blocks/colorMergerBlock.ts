import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../Misc/typeStore';

/**
 * Block used to create a Color3/4 out of individual inputs (one for each component)
 */
export class ColorMergerBlock extends NodeMaterialBlock {
    /**
     * Create a new ColorMergerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("rgb ", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.registerInput("r", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("g", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("b", NodeMaterialBlockConnectionPointTypes.Float, true);
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
     * Gets the rgb component (input)
     */
    public get rgbIn(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the r component (input)
     */
    public get r(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the g component (input)
     */
    public get g(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the b component (input)
     */
    public get b(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the a component (input)
     */
    public get a(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the rgba component (output)
     */
    public get rgba(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the rgb component (output)
     */
    public get rgbOut(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the rgb component (output)
     * @deprecated Please use rgbOut instead.
     */
    public get rgb(): NodeMaterialConnectionPoint {
        return this.rgbOut;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let rInput = this.r;
        let gInput = this.g;
        let bInput = this.b;
        let aInput = this.a;
        let rgbInput = this.rgbIn;

        let color4Output = this._outputs[0];
        let color3Output = this._outputs[1];

        if (rgbInput.isConnected) {
            if (color4Output.hasEndpoints) {
                state.compilationString += this._declareOutput(color4Output, state) + ` = vec4(${rgbInput.associatedVariableName}, ${aInput.isConnected ? this._writeVariable(aInput) : "0.0"});\r\n`;
            } else if (color3Output.hasEndpoints) {
                state.compilationString += this._declareOutput(color3Output, state) + ` = ${rgbInput.associatedVariableName};\r\n`;
            }
        } else {
            if (color4Output.hasEndpoints) {
                state.compilationString += this._declareOutput(color4Output, state) + ` = vec4(${rInput.isConnected ? this._writeVariable(rInput) : "0.0"}, ${gInput.isConnected ? this._writeVariable(gInput) : "0.0"}, ${bInput.isConnected ? this._writeVariable(bInput) : "0.0"}, ${aInput.isConnected ? this._writeVariable(aInput) : "0.0"});\r\n`;
            } else if (color3Output.hasEndpoints) {
                state.compilationString += this._declareOutput(color3Output, state) + ` = vec3(${rInput.isConnected ? this._writeVariable(rInput) : "0.0"}, ${gInput.isConnected ? this._writeVariable(gInput) : "0.0"}, ${bInput.isConnected ? this._writeVariable(bInput) : "0.0"});\r\n`;
            }
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ColorMergerBlock"] = ColorMergerBlock;