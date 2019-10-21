import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
import { NodeMaterial } from '../nodeMaterial';
import { ViewDirectionBlock } from './viewDirectionBlock';
/**
 * Block used to test if the fragment shader is front facing
 */
export class FrontFacingBlock extends NodeMaterialBlock {
    /**
     * Creates a new FrontFacingBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("viewDirection", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FrontFacingBlock";
    }

    /**
     * Gets the world normal component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the view direction input component
     */
    public get viewDirection(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.viewDirection.isConnected) {
            let viewDirectionInput = new ViewDirectionBlock("View direction");
            viewDirectionInput.output.connectTo(this.viewDirection);
            viewDirectionInput.autoConfigure(material);
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];

        state.compilationString += this._declareOutput(output, state) + ` = max(0.0, sign(dot(${this.worldNormal.associatedVariableName}.xyz, ${this.viewDirection.associatedVariableName})));\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.FrontFacingBlock"] = FrontFacingBlock;