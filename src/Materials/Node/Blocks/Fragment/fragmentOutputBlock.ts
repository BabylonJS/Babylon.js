import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';

/**
 * Block used to output the final color
 */
export class FragmentOutputBlock extends NodeMaterialBlock {
    /**
     * Create a new FragmentOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("rgba", NodeMaterialBlockConnectionPointTypes.Color4, true);
        this.registerInput("rgb", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float, true);

        this.rgb.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
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
        state.sharedData.hints.needAlphaBlending = rgba.isConnected || a.isConnected;

        if (rgba.connectedPoint) {
            if (a.isConnected) {
                state.compilationString += `gl_FragColor = vec4(${rgba.associatedVariableName}.rgb, ${a.associatedVariableName});\r\n`;
            } else {
                state.compilationString += `gl_FragColor = ${rgba.associatedVariableName};\r\n`;
            }
        } else if (rgb.connectedPoint) {
            let aValue = "1.0";

            if (a.connectedPoint) {
                aValue = a.associatedVariableName;
            }

            if (rgb.connectedPoint.type === NodeMaterialBlockConnectionPointTypes.Float) {
                state.compilationString += `gl_FragColor = vec4(${rgb.associatedVariableName}, ${rgb.associatedVariableName}, ${rgb.associatedVariableName}, ${aValue});\r\n`;
            } else {
                state.compilationString += `gl_FragColor = vec4(${rgb.associatedVariableName}, ${aValue});\r\n`;
            }
        } else {
            state.sharedData.checks.notConnectedNonOptionalInputs.push(rgba);
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.FragmentOutputBlock"] = FragmentOutputBlock;