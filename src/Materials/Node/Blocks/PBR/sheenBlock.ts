import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../../Misc/typeStore';
import { editableInPropertyPage } from "../../nodeMaterialDecorator";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";

export class SheenBlock extends NodeMaterialBlock {

    /**
     * Create a new SheenBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("sheen", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("sheen", this, NodeMaterialConnectionPointDirection.Output, SheenBlock, "SheenBlock"));
    }

    /**
     * If true, the sheen effect is layered above the base BRDF with the albedo-scaling technique.
     * It allows the strength of the sheen effect to not depend on the base color of the material,
     * making it easier to setup and tweak the effect
     */
    @editableInPropertyPage("Albedo scaling")
    public albedoScaling: boolean = false;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "SheenBlock";
    }

    /**
     * Gets the texture input component
     */
    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the intensity input component
     */
    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the color input component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the roughness input component
     */
    public get roughness(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the sheen object output component
     */
    public get sheen(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.SheenBlock"] = SheenBlock;