import { NodeMaterialBlock } from '../../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../../Enums/nodeMaterialBlockTargets';
//import { Nullable } from "../../../../types";
import { _TypeStore } from '../../../../../Misc/typeStore';
import { editableInPropertyPage } from "../../../nodeMaterialDecorator";
import { NodeMaterialConnectionPointCustomObject } from "../../../nodeMaterialConnectionPointCustomObject";

export class SheenBlock extends NodeMaterialBlock {

    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("sheen", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("sheen", this, NodeMaterialConnectionPointDirection.Output, SheenBlock, "SheenBlock"));
    }

    @editableInPropertyPage("Albedo scaling")
    public albedoScaling: boolean = false;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "SheenBlock";
    }

    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    public get roughness(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    public get sheen(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.SheenBlock"] = SheenBlock;