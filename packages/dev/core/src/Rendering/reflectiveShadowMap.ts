import { Constants } from "core/Engines/constants";
import type { ShadowLight } from "core/Lights/shadowLight";
import { MultiRenderTarget } from "core/Materials/Textures/multiRenderTarget";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import { Color3, Color4 } from "core/Maths/math.color";
import { Matrix } from "core/Maths/math.vector";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Scene } from "core/scene";
import type { WebGPURenderTargetWrapper } from "core/Engines/WebGPU/webgpuRenderTargetWrapper";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import type { Material } from "core/Materials/material";
import type { StandardMaterial } from "core/Materials/standardMaterial";
import { MaterialDefines } from "core/Materials/materialDefines";
import type { SpotLight } from "core/Lights/spotLight";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { expandToProperty, serialize } from "core/Misc/decorators";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * Class used to generate the RSM (Reflective Shadow Map) textures for a given light.
 * The textures are: position (in world space), normal (in world space) and flux (light intensity)
 */
export class ReflectiveShadowMap {
    private _scene: Scene;
    private _light: ShadowLight;
    private _lightTransformMatrix: Matrix = Matrix.Identity();
    private _mrt: MultiRenderTarget;
    private _textureDimensions: { width: number; height: number };
    private _regularMatToMatWithPlugin: Map<Material, Material>;
    private _counters: Array<{ name: string; value: number }>;

    private _enable = false;

    public get enable() {
        return this._enable;
    }

    public set enable(value: boolean) {
        if (this._enable === value) {
            return;
        }

        this._enable = value;
        this._customRenderTarget(value);
    }

    public get positionWorldTexture() {
        return this._mrt.textures[0];
    }

    public get normalWorldTexture() {
        return this._mrt.textures[1];
    }

    public get fluxTexture() {
        return this._mrt.textures[2];
    }

    public get renderList() {
        return this._mrt.renderList;
    }

    public get light() {
        return this._light;
    }

    public forceUpdateLightParameters = false;

    constructor(scene: Scene, light: ShadowLight, textureDimensions = { width: 512, height: 512 }) {
        this._scene = scene;
        this._light = light;
        this._textureDimensions = textureDimensions;
        this._regularMatToMatWithPlugin = new Map();
        this._counters = [{ name: "RSM Generation " + light.name, value: 0 }];

        this._createMultiRenderTarget();
        this._recomputeLightTransformationMatrix();

        this.enable = true;
    }

    public setTextureDimensions(dimensions: { width: number; height: number }) {
        const renderList = this._mrt.renderList;

        this._textureDimensions = dimensions;
        this._disposeMultiRenderTarget();
        this._createMultiRenderTarget();

        renderList?.forEach((mesh) => {
            this._addMeshToMRT(mesh);
        });
    }

    public addMesh(mesh?: AbstractMesh) {
        if (mesh) {
            this._addMeshToMRT(mesh);
        } else {
            this._scene.meshes.forEach((mesh) => {
                this._addMeshToMRT(mesh);
            });
        }
    }

    public updateLightParameters() {
        this._recomputeLightTransformationMatrix();
    }

    public get lightTransformationMatrix() {
        if (this.forceUpdateLightParameters) {
            this.updateLightParameters();
        }
        return this._lightTransformMatrix;
    }

    public get countersGPU(): Array<{ name: string; value: number }> {
        return this._counters;
    }

    public dispose() {
        this._disposeMultiRenderTarget();
    }

    protected _createMultiRenderTarget() {
        const name = this._light.name;

        const caps = this._scene.getEngine().getCaps();

        const fluxTextureType = caps.rg11b10ufColorRenderable ? Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV : Constants.TEXTURETYPE_HALF_FLOAT;
        const fluxTextureFormat = caps.rg11b10ufColorRenderable ? Constants.TEXTUREFORMAT_RGB : Constants.TEXTUREFORMAT_RGBA;

        this._mrt = new MultiRenderTarget(
            "RSMmrt_" + name,
            this._textureDimensions,
            3, // number of RTT - position / normal / flux
            this._scene,
            {
                types: [Constants.TEXTURETYPE_HALF_FLOAT, Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV, fluxTextureType],
                samplingModes: [Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, Constants.TEXTURE_BILINEAR_SAMPLINGMODE],
                generateMipMaps: false,
                targetTypes: [Constants.TEXTURE_2D, Constants.TEXTURE_2D, Constants.TEXTURE_2D],
                formats: [Constants.TEXTUREFORMAT_RGBA, Constants.TEXTUREFORMAT_RGBA, fluxTextureFormat],
            },
            ["RSMPosition_" + name, "RSMNormal_" + name, "RSMFlux_" + name]
        );

        this._mrt.renderList = [];
        this._mrt.clearColor = new Color4(0, 0, 0, 1);
        this._mrt.noPrePassRenderer = true;

        let sceneUBOs: UniformBuffer[];
        let currentSceneUBO: UniformBuffer;

        const useUBO = this._scene.getEngine().supportsUniformBuffers;

        if (useUBO) {
            sceneUBOs = [];
            sceneUBOs.push(this._scene.createSceneUniformBuffer(`Scene for RSM (light "${name}")`));
        }

        let shadowEnabled: boolean;

        this._mrt.onBeforeBindObservable.add(() => {
            currentSceneUBO = this._scene.getSceneUniformBuffer();
            shadowEnabled = this._light.shadowEnabled;
            this._light.shadowEnabled = false; // we render from the light point of view, so we won't have any shadow anyway!
        });

        this._mrt.onBeforeRenderObservable.add((faceIndex: number) => {
            if (sceneUBOs) {
                this._scene.setSceneUniformBuffer(sceneUBOs[0]);
            }
            const viewMatrix = this._light.getViewMatrix(faceIndex);
            const projectionMatrix = this._light.getProjectionMatrix(viewMatrix || undefined, this._mrt.renderList || undefined);
            if (viewMatrix && projectionMatrix) {
                this._scene.setTransformMatrix(viewMatrix, projectionMatrix);
            }
            if (useUBO) {
                this._scene.getSceneUniformBuffer().unbindEffect();
                this._scene.finalizeSceneUbo();
            }
        });

        this._mrt.onAfterUnbindObservable.add(() => {
            if (sceneUBOs) {
                this._scene.setSceneUniformBuffer(currentSceneUBO);
            }
            this._scene.updateTransformMatrix(); // restore the view/projection matrices of the active camera
            this._light.shadowEnabled = shadowEnabled;
            this._counters[0].value = (this._mrt.renderTarget as WebGPURenderTargetWrapper).gpuTimeInFrame?.counter.lastSecAverage ?? 0;
        });

        this._customRenderTarget(true);
    }

    protected _customRenderTarget(add: boolean) {
        const idx = this._scene.customRenderTargets.indexOf(this._mrt);
        if (add) {
            if (idx === -1) {
                this._scene.customRenderTargets.push(this._mrt);
            }
        } else if (idx !== -1) {
            this._scene.customRenderTargets.splice(idx, 1);
        }
    }

    protected _recomputeLightTransformationMatrix() {
        const viewMatrix = this._light.getViewMatrix();
        const projectionMatrix = this._light.getProjectionMatrix(viewMatrix || undefined, this._mrt.renderList || undefined);
        if (viewMatrix && projectionMatrix) {
            viewMatrix.multiplyToRef(projectionMatrix, this._lightTransformMatrix);
        }
    }

    protected _addMeshToMRT(mesh: AbstractMesh) {
        this._mrt.renderList?.push(mesh);

        const material = mesh.material;
        if (mesh.getTotalVertices() > 0 && material) {
            let rsmMaterial = this._regularMatToMatWithPlugin.get(material);
            if (!rsmMaterial) {
                rsmMaterial = material.clone("RSMCreate_" + material.name) || undefined;
                if (rsmMaterial) {
                    // Disable the prepass renderer for this material
                    Object.defineProperty(rsmMaterial, "canRenderToMRT", {
                        get: function () {
                            return false;
                        },
                        enumerable: true,
                        configurable: true,
                    });

                    (rsmMaterial as any).disableLighting = true;

                    const rsmCreatePlugin = new RSMCreatePluginMaterial(rsmMaterial);

                    rsmCreatePlugin.isEnabled = true;
                    rsmCreatePlugin.light = this._light;

                    this._regularMatToMatWithPlugin.set(material, rsmMaterial);
                }
            }

            this._mrt.setMaterialForRendering(mesh, rsmMaterial);
        }
    }

    protected _disposeMultiRenderTarget() {
        this._customRenderTarget(false);
        this._mrt.dispose();
    }
}

/**
 * @internal
 */
class MaterialRSMCreateDefines extends MaterialDefines {
    public RSMCREATE = false;
    public RSMCREATE_PROJTEXTURE = false;
}

/**
 * Plugin that implements the creation of the RSM textures
 */
class RSMCreatePluginMaterial extends MaterialPluginBase {
    private _varAlbedoName: string;
    private _lightColor = new Color3();
    private _hasProjectionTexture = false;

    /**
     * Defines the light that should be used to generate the RSM textures.
     */
    @serialize()
    public light: ShadowLight;

    private _isEnabled = false;
    /**
     * Defines if the plugin is enabled in the material.
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public isEnabled = false;

    protected _markAllSubMeshesAsTexturesDirty(): void {
        this._enable(this._isEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }

    private _internalMarkAllSubMeshesAsTexturesDirty: () => void;

    constructor(material: Material | StandardMaterial | PBRBaseMaterial) {
        super(material, "RSMCreate", 200, new MaterialRSMCreateDefines());

        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag];

        this._varAlbedoName = material instanceof PBRBaseMaterial ? "surfaceAlbedo" : "baseColor.rgb";
    }

    public prepareDefines(defines: MaterialRSMCreateDefines) {
        defines.RSMCREATE = this._isEnabled;

        const projectionTexture = (this.light as SpotLight).projectionTexture;

        this._hasProjectionTexture = projectionTexture ? projectionTexture.isReady() : false;

        defines.RSMCREATE_PROJTEXTURE = this._hasProjectionTexture;
    }

    public getClassName() {
        return "RSMCreatePluginMaterial";
    }

    public getUniforms() {
        return {
            ubo: [
                { name: "rsmLightColor", size: 3, type: "vec3" },
                { name: "rsmTextureProjectionMatrix", size: 16, type: "mat4" },
            ],
            fragment: `#ifdef RSMCREATE
                    uniform vec3 rsmLightColor;
                    uniform mat4 rsmTextureProjectionMatrix;
                #endif`,
        };
    }

    public getSamplers(samplers: string[]) {
        samplers.push("rsmTextureProjectionSampler");
    }

    public bindForSubMesh(uniformBuffer: UniformBuffer) {
        if (!this._isEnabled) {
            return;
        }

        this.light.diffuse.scaleToRef(this.light.getScaledIntensity(), this._lightColor);
        uniformBuffer.updateColor3("rsmLightColor", this._lightColor);

        if (this._hasProjectionTexture) {
            uniformBuffer.updateMatrix("rsmTextureProjectionMatrix", (this.light as SpotLight).projectionTextureMatrix);
            uniformBuffer.setTexture("rsmTextureProjectionSampler", (this.light as SpotLight).projectionTexture);
        }
    }

    public getCustomCode(shaderType: string) {
        return shaderType === "vertex"
            ? null
            : {
                  CUSTOM_FRAGMENT_BEGIN: `
                #ifdef RSMCREATE
                    #extension GL_EXT_draw_buffers : require
                #endif
            `,

                  CUSTOM_FRAGMENT_DEFINITIONS: `
                #ifdef RSMCREATE
                    #ifdef RSMCREATE_PROJTEXTURE
                        uniform highp sampler2D rsmTextureProjectionSampler;                    
                    #endif
                    layout(location = 0) out highp vec4 glFragData[3];
                    vec4 glFragColor;
                #endif
            `,

                  CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
                #ifdef RSMCREATE
                    vec3 rsmColor = ${this._varAlbedoName} * rsmLightColor;
                    #ifdef RSMCREATE_PROJTEXTURE
                    {
                        vec4 strq = rsmTextureProjectionMatrix * vec4(vPositionW, 1.0);
                        strq /= strq.w;
                        rsmColor *= texture2D(rsmTextureProjectionSampler, strq.xy).rgb;
                    }
                    #endif
                    glFragData[0] = vec4(vPositionW, 1.);
                    glFragData[1] = vec4(normalize(normalW) * 0.5 + 0.5, 1.);
                    glFragData[2] = vec4(rsmColor, 1.);
                #endif
            `,
              };
    }
}

RegisterClass(`BABYLON.RSMCreatePluginMaterial`, RSMCreatePluginMaterial);
