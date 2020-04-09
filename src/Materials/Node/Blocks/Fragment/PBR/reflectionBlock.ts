import { NodeMaterialBlock } from '../../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../../Enums/nodeMaterialBlockTargets';
//import { Nullable } from "../../../../types";
import { _TypeStore } from '../../../../../Misc/typeStore';
//import { editableInPropertyPage } from "../../../nodeMaterialDecorator";
import { NodeMaterialConnectionPointCustomObject } from "../../../nodeMaterialConnectionPointCustomObject";

export class ReflectionBlock extends NodeMaterialBlock {

    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        //this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("reflection", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("reflection", this, NodeMaterialConnectionPointDirection.Output, ReflectionBlock, "ReflectionBlock"));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ReflectionBlock";
    }

    public get reflection(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ReflectionBlock"] = ReflectionBlock;