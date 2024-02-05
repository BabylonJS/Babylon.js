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

import "./shaders/mrdlInnerquad.fragment";
import "./shaders/mrdlInnerquad.vertex";

class MRDLInnerquadMaterialDefines extends MaterialDefines {
    constructor() {
        super();
        this._needNormals = true;
        this._needUVs = true;
        this.rebuild();
    }
}

export class MRDLInnerquadMaterial extends PushMaterial {
    /**
     * Gets or sets the color of the innerquad.
     */
    @serialize()
    public color: Color4 = new Color4(1, 1, 1, 0.05);
    /**
     * Gets or sets the corner radius on the innerquad. If this value is changed, update the lineWidth to match.
     */
    @serialize()
    public radius = 0.12;

    /**
     * Gets or sets whether the radius of the innerquad should be fixed.
     */
    @serialize()
    public fixedRadius = true;

    /** @hidden */
    public _filterWidth = 1.0;

    /**
     * Gets or sets the glow fraction of the innerquad.
     */
    @serialize()
    public glowFraction = 0.0;

    /**
     * Gets or sets the maximum glow intensity of the innerquad.
     */
    @serialize()
    public glowMax = 0.5;

    /**
     * Gets or sets the glow falloff effect of the innerquad.
     */
    @serialize()
    public glowFalloff = 2.0;

    constructor(name: string, scene: Scene) {
        super(name, scene);
        this.alphaMode = Constants.ALPHA_COMBINE;
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
            subMesh.materialDefines = new MRDLInnerquadMaterialDefines();
        }

        const defines = <MRDLInnerquadMaterialDefines>subMesh.materialDefines;
        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, false);

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
            const shaderName = "mrdlInnerquad";
            const join = defines.toString();

            const uniforms = [
                "world",
                "worldView",
                "worldViewProjection",
                "view",
                "projection",
                "viewProjection",
                "cameraPosition",
                "_Color_",
                "_Radius_",
                "_Fixed_Radius_",
                "_Filter_Width_",
                "_Glow_Fraction_",
                "_Glow_Max_",
                "_Glow_Falloff_",
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

        const defines = <MRDLInnerquadMaterialDefines>subMesh.materialDefines;
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

        // "Color"
        this._activeEffect.setDirectColor4("_Color_", this.color);

        // "Shape"
        this._activeEffect.setFloat("_Radius_", this.radius);
        this._activeEffect.setFloat("_Fixed_Radius_", this.fixedRadius ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Filter_Width_", this._filterWidth);

        // "Glow"
        this._activeEffect.setFloat("_Glow_Fraction_", this.glowFraction);
        this._activeEffect.setFloat("_Glow_Max_", this.glowMax);
        this._activeEffect.setFloat("_Glow_Falloff_", this.glowFalloff);

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

    public clone(name: string): MRDLInnerquadMaterial {
        return SerializationHelper.Clone(() => new MRDLInnerquadMaterial(name, this.getScene()), this);
    }

    public serialize(): unknown {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.MRDLInnerquadMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "MRDLInnerquadMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): MRDLInnerquadMaterial {
        return SerializationHelper.Parse(() => new MRDLInnerquadMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GUI.MRDLInnerquadMaterial", MRDLInnerquadMaterial);
