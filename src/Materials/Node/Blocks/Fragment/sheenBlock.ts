import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { Nullable } from '../../../../types';
import { _TypeStore } from '../../../../Misc/typeStore';

import { BaseTexture } from '../../../Textures/baseTexture';

export class SheenBlock extends NodeMaterialBlock {

    public texture: Nullable<BaseTexture>;

    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("albedoScaling", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("sheen", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "SheenBlock";
    }

    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    public get roughness(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    public get albedoScaling(): NodeMaterialConnectionPoint {
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