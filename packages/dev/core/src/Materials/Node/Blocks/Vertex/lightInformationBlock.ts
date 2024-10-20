import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Nullable } from "../../../../types";
import type { Scene } from "../../../../scene";
import type { Effect } from "../../../effect";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import type { Mesh } from "../../../../Meshes/mesh";
import type { Light } from "../../../../Lights/light";
import { PointLight } from "../../../../Lights/pointLight";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { ShadowGenerator } from "../../../../Lights/Shadows/shadowGenerator";
import type { ShadowLight } from "../../../../Lights";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to get data information from a light
 */
export class LightInformationBlock extends NodeMaterialBlock {
    private _lightDataUniformName: string;
    private _lightColorUniformName: string;
    private _lightShadowUniformName: string;
    private _lightShadowExtraUniformName: string;
    private _lightTypeDefineName: string;
    private _forcePrepareDefines: boolean;

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
        this.registerOutput("intensity", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("shadowBias", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("shadowNormalBias", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("shadowDepthScale", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("shadowDepthRange", NodeMaterialBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
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

    /**
     * Gets the direction output component
     */
    public get intensity(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the shadow bias output component
     */
    public get shadowBias(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the shadow normal bias output component
     */
    public get shadowNormalBias(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the shadow depth scale component
     */
    public get shadowDepthScale(): NodeMaterialConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the shadow depth range component
     */
    public get shadowDepthRange(): NodeMaterialConnectionPoint {
        return this._outputs[6];
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        if (this.light && this.light.isDisposed()) {
            this.light = null;
        }

        let light = this.light;
        const scene = nodeMaterial.getScene();

        if (!light && scene.lights.length) {
            light = this.light = scene.lights[0];
            this._forcePrepareDefines = true;
        }

        if (!light || !light.isEnabled) {
            effect.setFloat3(this._lightDataUniformName, 0, 0, 0);
            effect.setFloat4(this._lightColorUniformName, 0, 0, 0, 0);
            return;
        }

        light.transferToNodeMaterialEffect(effect, this._lightDataUniformName);

        effect.setColor4(this._lightColorUniformName, light.diffuse, light.intensity);

        const generator = light.getShadowGenerator() as ShadowGenerator;
        if (this.shadowBias.hasEndpoints || this.shadowNormalBias.hasEndpoints || this.shadowDepthScale.hasEndpoints) {
            if (generator) {
                effect.setFloat3(this._lightShadowUniformName, generator.bias, generator.normalBias, generator.depthScale);
            } else {
                effect.setFloat3(this._lightShadowUniformName, 0, 0, 0);
            }
        }

        if (this.shadowDepthRange) {
            if (generator && scene.activeCamera) {
                const shadowLight = light as ShadowLight;
                effect.setFloat2(
                    this._lightShadowExtraUniformName,
                    shadowLight.getDepthMinZ(scene.activeCamera),
                    shadowLight.getDepthMinZ(scene.activeCamera) + shadowLight.getDepthMaxZ(scene.activeCamera)
                );
            } else {
                effect.setFloat2(this._lightShadowExtraUniformName, 0, 0);
            }
        }
    }

    public override prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (!defines._areLightsDirty && !this._forcePrepareDefines) {
            return;
        }

        this._forcePrepareDefines = false;

        const light = this.light;
        defines.setValue(this._lightTypeDefineName, light && light instanceof PointLight ? true : false, true);
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        state.sharedData.bindableBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);

        const direction = this.direction;
        const color = this.color;
        const intensity = this.intensity;
        const shadowBias = this.shadowBias;
        const shadowNormalBias = this.shadowNormalBias;
        const shadowDepthScale = this.shadowDepthScale;
        const shadowDepthRange = this.shadowDepthRange;

        this._lightDataUniformName = state._getFreeVariableName("lightData");
        this._lightColorUniformName = state._getFreeVariableName("lightColor");
        this._lightShadowUniformName = state._getFreeVariableName("shadowData");
        this._lightShadowExtraUniformName = state._getFreeVariableName("shadowExtraData");
        this._lightTypeDefineName = state._getFreeDefineName("LIGHTPOINTTYPE");

        const uniformAdd = state.shaderLanguage === ShaderLanguage.WGSL ? "uniforms." : "";

        state._emitUniformFromString(this._lightDataUniformName, NodeMaterialBlockConnectionPointTypes.Vector3);
        state._emitUniformFromString(this._lightColorUniformName, NodeMaterialBlockConnectionPointTypes.Vector4);

        state.compilationString += `#ifdef ${this._lightTypeDefineName}\n`;
        state.compilationString +=
            state._declareOutput(direction) + ` = normalize(${this.worldPosition.associatedVariableName}.xyz - ${uniformAdd}${this._lightDataUniformName});\n`;
        state.compilationString += `#else\n`;
        state.compilationString += state._declareOutput(direction) + ` = ${uniformAdd}${this._lightDataUniformName};\n`;
        state.compilationString += `#endif\n`;

        state.compilationString += state._declareOutput(color) + ` = ${uniformAdd}${this._lightColorUniformName}.rgb;\n`;
        state.compilationString += state._declareOutput(intensity) + ` = ${uniformAdd}${this._lightColorUniformName}.a;\n`;

        if (shadowBias.hasEndpoints || shadowNormalBias.hasEndpoints || shadowDepthScale.hasEndpoints) {
            state._emitUniformFromString(this._lightShadowUniformName, NodeMaterialBlockConnectionPointTypes.Vector3);
            if (shadowBias.hasEndpoints) {
                state.compilationString += state._declareOutput(shadowBias) + ` = ${uniformAdd}${this._lightShadowUniformName}.x;\n`;
            }
            if (shadowNormalBias.hasEndpoints) {
                state.compilationString += state._declareOutput(shadowNormalBias) + ` = ${uniformAdd}${this._lightShadowUniformName}.y;\n`;
            }
            if (shadowDepthScale.hasEndpoints) {
                state.compilationString += state._declareOutput(shadowDepthScale) + ` = ${uniformAdd}${this._lightShadowUniformName}.z;\n`;
            }
        }

        if (shadowDepthRange.hasEndpoints) {
            state._emitUniformFromString(this._lightShadowExtraUniformName, NodeMaterialBlockConnectionPointTypes.Vector2);
            state.compilationString += state._declareOutput(shadowDepthRange) + ` = ${this._lightShadowUniformName};\n`;
        }

        return this;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        if (this.light) {
            serializationObject.lightId = this.light.id;
        }

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        if (serializationObject.lightId) {
            this.light = scene.getLightById(serializationObject.lightId);
        }
    }
}

RegisterClass("BABYLON.LightInformationBlock", LightInformationBlock);
