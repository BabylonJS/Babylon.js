import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';

/**
 * Block used to output the final color
 */
export class FragmentOutputBlock extends NodeMaterialBlock {
    /**
     * Gets or sets a boolean indicating if this block will output an alpha value
     */
    public alphaBlendingEnabled = false;
    /**
     * Create a new FragmentOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, true);
        this.registerInput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float, true);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FragmentOutputBlock";
    }

    /**
     * Gets the rgba input component
     */
    public get rgba(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the rgb input component
     */
    public get rgb(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the a input component
     */
    public get a(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let rgba = this.rgba;
        let rgb = this.rgb;
        let a = this.a;
        state.sharedData.hints.needAlphaBlending = this.alphaBlendingEnabled;

        if (rgba.connectedPoint) {
            state.compilationString += `gl_FragColor = ${rgba.associatedVariableName};\r\n`;
        } else if (rgb.connectedPoint) {
            if (a.connectedPoint) {
                state.compilationString += `gl_FragColor = vec4(${rgb.associatedVariableName}, ${a.associatedVariableName});\r\n`;
            } else {
                state.compilationString += `gl_FragColor = vec4(${rgb.associatedVariableName}, 1.0);\r\n`;
            }
        } else {
            state.sharedData.checks.notConnectedNonOptionalInputs.push(rgba);
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.FragmentOutputBlock"] = FragmentOutputBlock;