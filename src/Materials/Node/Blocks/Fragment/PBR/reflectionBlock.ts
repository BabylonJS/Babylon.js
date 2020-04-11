//import { NodeMaterialBlock } from '../../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../../Enums/nodeMaterialBlockTargets';
//import { Nullable } from "../../../../types";
import { _TypeStore } from '../../../../../Misc/typeStore';
//import { editableInPropertyPage } from "../../../nodeMaterialDecorator";
import { NodeMaterialConnectionPointCustomObject } from "../../../nodeMaterialConnectionPointCustomObject";
import { ReflectionTextureBaseBlock } from '../../Dual/reflectionTextureBaseBlock';

export class ReflectionBlock extends ReflectionTextureBaseBlock {

    public worldPositionConnectionPoint: NodeMaterialConnectionPoint;
    public worldNormalConnectionPoint: NodeMaterialConnectionPoint;
    public cameraPositionConnectionPoint: NodeMaterialConnectionPoint;

    public constructor(name: string) {
        super(name);

        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("reflection", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("reflection", this, NodeMaterialConnectionPointDirection.Output, ReflectionBlock, "ReflectionBlock"));
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ReflectionBlock";
    }

    /**
     * Gets the world position input component
     */
    public get position(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this.worldPositionConnectionPoint;
    }

    /**
     * Gets the world normal input component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this.worldNormalConnectionPoint;
    }

    /**
     * Gets the world input component
     */
    public get world(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
    * Gets the camera (or eye) position component
    */
    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this.cameraPositionConnectionPoint;
    }

    /**
     * Gets the view input component
     */
    public get view(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    public get reflection(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ReflectionBlock"] = ReflectionBlock;