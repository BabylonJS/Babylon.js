/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { serialize, expandToProperty, serializeAsColor3 } from "core/Misc/decorators";
import { SerializationHelper } from "core/Misc/decorators.serialization";
import type { Matrix } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { MaterialDefines } from "core/Materials/materialDefines";
import type { IEffectCreationOptions } from "core/Materials/effect";
import { PushMaterial } from "core/Materials/pushMaterial";
import { VertexBuffer } from "core/Buffers/buffer";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { SubMesh } from "core/Meshes/subMesh";
import type { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";

import "./gradient.fragment";
import "./gradient.vertex";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { AddClipPlaneUniforms, BindClipPlane } from "core/Materials/clipPlaneMaterialHelper";
import {
    BindBonesParameters,
    BindFogParameters,
    BindLights,
    BindLogDepth,
    HandleFallbacksForShadows,
    PrepareAttributesForBones,
    PrepareAttributesForInstances,
    PrepareDefinesForAttributes,
    PrepareDefinesForFrameBoundValues,
    PrepareDefinesForLights,
    PrepareDefinesForMisc,
    PrepareUniformsAndSamplersList,
} from "core/Materials/materialHelper.functions";

class GradientMaterialDefines extends MaterialDefines {
    public EMISSIVE = false;
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public ALPHATEST = false;
    public DEPTHPREPASS = false;
    public POINTSIZE = false;
    public FOG = false;
    public NORMAL = false;
    public UV1 = false;
    public UV2 = false;
    public VERTEXCOLOR = false;
    public VERTEXALPHA = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public INSTANCES = false;
    public INSTANCESCOLOR = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public SKIPFINALCOLORCLAMP = false;
    public LOGARITHMICDEPTH = false;
    public AREALIGHTSUPPORTED = true;
    public AREALIGHTNOROUGHTNESS = true;

    constructor() {
        super();
        this.rebuild();
    }
}

export class GradientMaterial extends PushMaterial {
    @serialize("maxSimultaneousLights")
    private _maxSimultaneousLights = 4;
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public maxSimultaneousLights: number;

    // The gradient top color, red by default
    @serializeAsColor3()
    public topColor = new Color3(1, 0, 0);

    @serialize()
    public topColorAlpha = 1.0;

    // The gradient top color, blue by default
    @serializeAsColor3()
    public bottomColor = new Color3(0, 0, 1);

    @serialize()
    public bottomColorAlpha = 1.0;

    // Gradient offset
    @serialize()
    public offset = 0;

    @serialize()
    public scale = 1.0;

    @serialize()
    public smoothness = 1.0;

    @serialize("disableLighting")
    private _disableLighting = false;
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public disableLighting: boolean;

    constructor(name: string, scene?: Scene) {
        super(name, scene);
    }

    public override needAlphaBlending(): boolean {
        return this.alpha < 1.0 || this.topColorAlpha < 1.0 || this.bottomColorAlpha < 1.0;
    }

    public override needAlphaTesting(): boolean {
        return true;
    }

    public override getAlphaTestTexture(): Nullable<BaseTexture> {
        return null;
    }

    // Methods
    public override isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new GradientMaterialDefines();
        }

        const defines = <GradientMaterialDefines>subMesh.materialDefines;
        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();

        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false);

        PrepareDefinesForMisc(
            mesh,
            scene,
            this._useLogarithmicDepth,
            this.pointsCloud,
            this.fogEnabled,
            this.needAlphaTestingForMesh(mesh),
            defines,
            undefined,
            undefined,
            undefined,
            this._isVertexOutputInvariant
        );

        defines._needNormals = PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);

        defines.EMISSIVE = this._disableLighting;

        // Attribs
        PrepareDefinesForAttributes(mesh, defines, false, true);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();

            scene.resetCachedMaterial();

            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            HandleFallbacksForShadows(defines, fallbacks);

            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }

            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;

            //Attributes
            const attribs = [VertexBuffer.PositionKind];

            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }

            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }

            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }

            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }

            PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            PrepareAttributesForInstances(attribs, defines);

            // Legacy browser patch
            const shaderName = "gradient";
            const join = defines.toString();

            const uniforms = [
                "world",
                "view",
                "viewProjection",
                "vEyePosition",
                "vLightsType",
                "vFogInfos",
                "vFogColor",
                "pointSize",
                "mBones",
                "logarithmicDepthConstant",
                "topColor",
                "bottomColor",
                "offset",
                "smoothness",
                "scale",
            ];
            AddClipPlaneUniforms(uniforms);
            const samplers: string[] = ["areaLightsLTC1Sampler", "areaLightsLTC2Sampler"];
            const uniformBuffers: string[] = [];

            PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 4,
            });

            subMesh.setEffect(
                scene.getEngine().createEffect(
                    shaderName,
                    <IEffectCreationOptions>{
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: uniformBuffers,
                        samplers: samplers,
                        defines: join,
                        fallbacks: fallbacks,
                        onCompiled: this.onCompiled,
                        onError: this.onError,
                        indexParameters: { maxSimultaneousLights: 4 },
                    },
                    engine
                ),
                defines,
                this._materialContext
            );
        }

        // Check if Area Lights have LTC texture.
        if (defines["AREALIGHTUSED"]) {
            for (let index = 0; index < mesh.lightSources.length; index++) {
                if (!mesh.lightSources[index]._isReady()) {
                    return false;
                }
            }
        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;
        drawWrapper._wasPreviouslyUsingInstances = !!useInstances;

        return true;
    }

    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const scene = this.getScene();

        const defines = <GradientMaterialDefines>subMesh.materialDefines;
        if (!defines) {
            return;
        }

        const effect = subMesh.effect;
        if (!effect) {
            return;
        }

        this._activeEffect = effect;

        // Matrices
        this.bindOnlyWorldMatrix(world);
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

        // Bones
        BindBonesParameters(mesh, effect);

        if (this._mustRebind(scene, effect, subMesh)) {
            // Clip plane
            BindClipPlane(effect, this, scene);

            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }

            // Log. depth
            if (this._useLogarithmicDepth) {
                BindLogDepth(defines, effect, scene);
            }

            scene.bindEyePosition(effect);
        }

        if (scene.lightsEnabled && !this.disableLighting) {
            BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
        }

        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }

        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);

        this._activeEffect.setColor4("topColor", this.topColor, this.topColorAlpha);
        this._activeEffect.setColor4("bottomColor", this.bottomColor, this.bottomColorAlpha);
        this._activeEffect.setFloat("offset", this.offset);
        this._activeEffect.setFloat("scale", this.scale);
        this._activeEffect.setFloat("smoothness", this.smoothness);

        this._afterBind(mesh, this._activeEffect, subMesh);
    }

    public override getAnimatables(): IAnimatable[] {
        return [];
    }

    public override dispose(forceDisposeEffect?: boolean): void {
        super.dispose(forceDisposeEffect);
    }

    public override clone(name: string): GradientMaterial {
        return SerializationHelper.Clone(() => new GradientMaterial(name, this.getScene()), this);
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.GradientMaterial";
        return serializationObject;
    }

    public override getClassName(): string {
        return "GradientMaterial";
    }

    // Statics
    public static override Parse(source: any, scene: Scene, rootUrl: string): GradientMaterial {
        return SerializationHelper.Parse(() => new GradientMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GradientMaterial", GradientMaterial);
