import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { IEffectCreationOptions } from "core/Materials/effect";
import type { Matrix } from "core/Maths/math.vector";
import type { Mesh } from "core/Meshes/mesh";
import type { Nullable } from "core/types";
import type { Scene } from "core/scene";
import type { SubMesh } from "core/Meshes/subMesh";

import { Color4 } from "core/Maths/math.color";
import { Constants } from "core/Engines/constants";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { MaterialDefines } from "core/Materials/materialDefines";
import { MaterialHelper } from "core/Materials/materialHelper";
import { PushMaterial } from "core/Materials/pushMaterial";
import { RegisterClass } from "core/Misc/typeStore";
import { SerializationHelper, serialize } from "core/Misc/decorators";
import { VertexBuffer } from "core/Buffers/buffer";

import "./shaders/mrdlBackglow.fragment";
import "./shaders/mrdlBackglow.vertex";

/** @hidden */
class MRDLBackglowMaterialDefines extends MaterialDefines {
    constructor() {
        super();
        this._needNormals = true;
        this._needUVs = true;
        this.rebuild();
    }
}

export class MRDLBackglowMaterial extends PushMaterial {
    /**
     * Gets or sets the bevel radius on the backglow. If this value is changed, update the lineWidth to match.
     */
    @serialize()
    public bevelRadius = 0.16;

    /**
     * Gets or sets the line width of the backglow.
     */
    @serialize()
    public lineWidth = 0.16;

    /**
     * Gets or sets whether to use absolute sizes when calculating effects on the backglow.
     * Since desktop and VR/AR have different relative sizes, it's usually best to keep this false.
     */
    @serialize()
    public absoluteSizes = false;

    /**
     * Gets or sets the tuning motion of the backglow.
     */
    @serialize()
    public tuningMotion = 0.0;

    /**
     * Gets or sets the motion of the backglow.
     */
    @serialize()
    public motion = 1.0;

    /**
     * Gets or sets the maximum intensity of the backglow.
     */
    @serialize()
    public maxIntensity = 0.7;

    /**
     * Gets or sets the fade-in exponent of the intensity of the backglow.
     */
    @serialize()
    public intensityFadeInExponent = 2.0;

    /**
     * Gets or sets the start of the outer fuzz effect on the backglow.
     */
    @serialize()
    public outerFuzzStart = 0.04;

    /**
     * Gets or sets the end of the outer fuzz effect on the backglow.
     */
    @serialize()
    public outerFuzzEnd = 0.04;

    /**
     * Gets or sets the color of the backglow.
     */
    @serialize()
    public color: Color4 = new Color4(0.682353, 0.698039, 1, 1);

    /**
     * Gets or sets the inner color of the backglow.
     */
    @serialize()
    public innerColor: Color4 = new Color4(0.356863, 0.392157, 0.796078, 1);

    /**
     * Gets or sets the blend exponent of the backglow.
     */
    @serialize()
    public blendExponent = 1.5;

    /**
     * Gets or sets the falloff of the backglow.
     */
    @serialize()
    public falloff = 2.0;

    /**
     * Gets or sets the bias of the backglow.
     */
    @serialize()
    public bias = 0.5;

    constructor(name: string, scene: Scene) {
        super(name, scene);
        this.alphaMode = Constants.ALPHA_ADD;
        this.disableDepthWrite = true;
        this.backFaceCulling = false;
    }

    public needAlphaBlending(): boolean {
        return true;
    }

    public needAlphaTesting(): boolean {
        return false;
    }

    public getAlphaTestTexture(): Nullable<BaseTexture> {
        return null;
    }

    // Methods
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh): boolean {
        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new MRDLBackglowMaterialDefines();
        }

        const defines = <MRDLBackglowMaterialDefines>subMesh.materialDefines;
        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, false);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();

            scene.resetCachedMaterial();

            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks);

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

            if (defines.TANGENT) {
                attribs.push(VertexBuffer.TangentKind);
            }

            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            // Legacy browser patch
            const shaderName = "mrdlBackglow";
            const join = defines.toString();

            const uniforms = [
                "world",
                "worldView",
                "worldViewProjection",
                "view",
                "projection",
                "viewProjection",
                "cameraPosition",
                "_Bevel_Radius_",
                "_Line_Width_",
                "_Absolute_Sizes_",
                "_Tuning_Motion_",
                "_Motion_",
                "_Max_Intensity_",
                "_Intensity_Fade_In_Exponent_",
                "_Outer_Fuzz_Start_",
                "_Outer_Fuzz_End_",
                "_Color_",
                "_Inner_Color_",
                "_Blend_Exponent_",
                "_Falloff_",
                "_Bias_",
            ];
            const samplers: string[] = [];
            const uniformBuffers: string[] = [];

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
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
                defines
            );
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;

        return true;
    }

    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const scene = this.getScene();

        const defines = <MRDLBackglowMaterialDefines>subMesh.materialDefines;
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
        this._activeEffect.setVector3("cameraPosition", scene.activeCamera!.position);

        // "Rounded Rectangle"
        this._activeEffect.setFloat("_Bevel_Radius_", this.bevelRadius);
        this._activeEffect.setFloat("_Line_Width_", this.lineWidth);
        this._activeEffect.setFloat("_Absolute_Sizes_", this.absoluteSizes ? 1.0 : 0.0);

        // "Animation"
        this._activeEffect.setFloat("_Tuning_Motion_", this.tuningMotion);
        this._activeEffect.setFloat("_Motion_", this.motion);
        this._activeEffect.setFloat("_Max_Intensity_", this.maxIntensity);
        this._activeEffect.setFloat("_Intensity_Fade_In_Exponent_", this.intensityFadeInExponent);
        this._activeEffect.setFloat("_Outer_Fuzz_Start_", this.outerFuzzStart);
        this._activeEffect.setFloat("_Outer_Fuzz_End_", this.outerFuzzEnd);

        // "Color"
        this._activeEffect.setDirectColor4("_Color_", this.color);
        this._activeEffect.setDirectColor4("_Inner_Color_", this.innerColor);
        this._activeEffect.setFloat("_Blend_Exponent_", this.blendExponent);

        // "Inner Transition"
        this._activeEffect.setFloat("_Falloff_", this.falloff);
        this._activeEffect.setFloat("_Bias_", this.bias);

        this._afterBind(mesh, this._activeEffect, subMesh);
    }

    /**
     * Get the list of animatables in the material.
     * @returns the list of animatables object used in the material
     */
    public getAnimatables(): IAnimatable[] {
        return [];
    }

    public dispose(forceDisposeEffect?: boolean): void {
        super.dispose(forceDisposeEffect);
    }

    public clone(name: string): MRDLBackglowMaterial {
        return SerializationHelper.Clone(() => new MRDLBackglowMaterial(name, this.getScene()), this);
    }

    public serialize(): unknown {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.MRDLBackglowMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "MRDLBackglowMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): MRDLBackglowMaterial {
        return SerializationHelper.Parse(() => new MRDLBackglowMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GUI.MRDLBackglowMaterial", MRDLBackglowMaterial);
