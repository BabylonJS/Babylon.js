import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import type { NodeMaterial } from "../nodeMaterial";
import { NodeMaterialSystemValues } from "../Enums/nodeMaterialSystemValues";
import { InputBlock } from "./Input/inputBlock";
/**
 * Block used to get the view direction
 */
export class ViewDirectionBlock extends NodeMaterialBlock {
    /**
     * Creates a new ViewDirectionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ViewDirectionBlock";
    }

    /**
     * Gets the world position component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the camera position component
     */
    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.cameraPosition.isConnected) {
            let cameraPositionInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.CameraPosition);

            if (!cameraPositionInput) {
                cameraPositionInput = new InputBlock("cameraPosition");
                cameraPositionInput.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);
            }
            cameraPositionInput.output.connectTo(this.cameraPosition);
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        state.compilationString +=
            this._declareOutput(output, state) + ` = normalize(${this.cameraPosition.associatedVariableName} - ${this.worldPosition.associatedVariableName}.xyz);\r\n`;

        return this;
    }
}

RegisterClass("BABYLON.ViewDirectionBlock", ViewDirectionBlock);
