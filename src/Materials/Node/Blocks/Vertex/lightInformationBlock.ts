import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { _TypeStore } from '../../../../Misc/typeStore';
import { Nullable } from '../../../../types';
import { Scene } from '../../../../scene';
import { Effect } from '../../../effect';
import { NodeMaterial } from '../../nodeMaterial';
import { Mesh } from '../../../../Meshes/mesh';
import { Light } from '../../../../Lights/light';
import { PointLight } from '../../../../Lights/pointLight';
/**
 * Block used to get data information from a light
 */
export class LightInformationBlock extends NodeMaterialBlock {
    private _lightDataDefineName: string;
    private _lightColorDefineName: string;

    /**
     * Gets or sets the light associated with this block
     */
    public light: Nullable<Light>;

    /**
     * Creates a new LightInformationBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex);

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerOutput("direction", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("color", NodeMaterialBlockConnectionPointTypes.Color3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "LightInformationBlock";
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the direction output component
     */
    public get direction(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the direction output component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        if (!this.light || !this.light.isEnabled) {
            effect.setFloat3(this._lightDataDefineName, 0, 0, 0);
            effect.setFloat3(this._lightColorDefineName, 0, 0, 0);
            return;
        }

        this.light.transferToNodeMaterialEffect(effect, this._lightDataDefineName);

        effect.setColor3(this._lightColorDefineName, this.light.diffuse);
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        state.sharedData.bindableBlocks.push(this);

        let direction = this.direction;
        let color = this.color;

        if (!this.light) {
            state.compilationString += this._declareOutput(direction, state) + ` = vec3(0.);\r\n`;
            state.compilationString += this._declareOutput(color, state) + ` = vec3(0.);\r\n`;
        } else {
            this._lightDataDefineName = state._getFreeDefineName("lightData");
            state._emitUniformFromString(this._lightDataDefineName, "vec3");

            this._lightColorDefineName = state._getFreeDefineName("lightColor");
            state._emitUniformFromString(this._lightColorDefineName, "vec3");

            if (this.light instanceof PointLight) {
                state.compilationString += this._declareOutput(direction, state) + ` = normalize(${this._lightDataDefineName} - ${this.worldPosition.associatedVariableName}.xyz);\r\n`;
            } else {
                state.compilationString += this._declareOutput(direction, state) + ` = ${this._lightDataDefineName};\r\n`;
            }

            state.compilationString += this._declareOutput(color, state) + ` = ${this._lightColorDefineName};\r\n`;
        }

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        if (this.light) {
            serializationObject.lightId = this.light.id;
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        if (serializationObject.lightId) {
            this.light = scene.getLightByID(serializationObject.lightId);
        }
    }
}

_TypeStore.RegisteredTypes["BABYLON.LightInformationBlock"] = LightInformationBlock;