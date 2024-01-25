/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { SerializationHelper, serialize, serializeAsVector3 } from "core/Misc/decorators";
import type { Matrix } from "core/Maths/math.vector";
import { Vector3, Vector4 } from "core/Maths/math.vector";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import { MaterialDefines } from "core/Materials/materialDefines";
import { MaterialHelper } from "core/Materials/materialHelper";
import type { IEffectCreationOptions } from "core/Materials/effect";
import { PushMaterial } from "core/Materials/pushMaterial";
import { VertexBuffer } from "core/Buffers/buffer";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { SubMesh } from "core/Meshes/subMesh";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";
import { Color4 } from "core/Maths/math.color";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { Constants } from "core/Engines/constants";

import "./shaders/fluentBackplate.fragment";
import "./shaders/fluentBackplate.vertex";

/** @internal */
class FluentBackplateMaterialDefines extends MaterialDefines {
    public BLOB_ENABLE = true;
    public BLOB_ENABLE_2 = true;
    public SMOOTH_EDGES = true;
    public IRIDESCENT_MAP_ENABLE = true;

    constructor() {
        super();
        this._needNormals = true;
        this.rebuild();
    }
}

/**
 * Class used to render square buttons with fluent design
 */
export class FluentBackplateMaterial extends PushMaterial {
    /**
     * URL pointing to the texture used to define the coloring for the fluent blob effect.
     */
    public static BLOB_TEXTURE_URL = "https://assets.babylonjs.com/meshes/MRTK/mrtk-fluent-backplate-blob.png";

    /**
     * URL pointing to the texture used to define iridescent map.
     */
    public static IM_TEXTURE_URL = "https://assets.babylonjs.com/meshes/MRTK/mrtk-fluent-backplate-iridescence.png";

    private _blobTexture: Texture;
    private _iridescentMap: Texture;

    /**
     * Gets or sets the corner radius on the backplate. Best to keep this value between 0.01 and 0.5. Default is 0.03.
     */
    @serialize()
    public radius = 0.03;

    /**
     * Gets or sets the line width of the backplate.
     */
    @serialize()
    public lineWidth = 0.01;

    /**
     * Gets or sets whether to use absolute sizes when calculating effects on the backplate.
     * Since desktop and VR/AR have different relative sizes, it's usually best to keep this false.
     */
    @serialize()
    public absoluteSizes = false;

    /** @internal */
    public _filterWidth = 1;

    /**
     * Gets or sets the base color of the backplate.
     */
    @serialize()
    public baseColor = new Color4(0.0392157, 0.0666667, 0.207843, 1);

    /**
     * Gets or sets the line color of the backplate.
     */
    @serialize()
    public lineColor = new Color4(0.14902, 0.133333, 0.384314, 1);

    /**
     * Gets or sets the intensity of the fluent hover glow effect.
     */
    @serialize()
    public blobIntensity = 0.98;

    /**
     * Gets or sets the far size of the fluent hover glow effect.
     */
    @serialize()
    public blobFarSize = 0.04;

    /**
     * Gets or sets the distance considered "near" to the backplate, which controls the size of the fluent hover glow effect (see blobNearSize).
     */
    @serialize()
    public blobNearDistance = 0;

    /**
     * Gets or sets the distance considered "far" from the backplate, which controls the size of the fluent hover glow effect (see blobFarSize).
     */
    @serialize()
    public blobFarDistance = 0.08;

    /**
     * Gets or sets the length of the fluent hover glow effect fade.
     */
    @serialize()
    public blobFadeLength = 0.08;

    /**
     * Gets or sets the size of the fluent hover glow effect when the left pointer is considered "near" to the backplate (see blobNearDistance).
     */
    @serialize()
    public blobNearSize = 0.22;

    /**
     * Gets or sets the progress of the fluent hover glow effect selection animation corresponding to the left pointer (0.0 - 1.0).
     */
    @serialize()
    public blobPulse = 0;

    /**
     * Gets or sets the opacity of the fluent hover glow effect corresponding to the left pointer (0.0 - 1.0). Default is 0.
     */
    @serialize()
    public blobFade = 0;

    /**
     * Gets or sets the size of the fluent hover glow effect when the right pointer is considered "near" to the backplate (see blobNearDistance).
     */
    @serialize()
    public blobNearSize2 = 0.22;

    /**
     * Gets or sets the progress of the fluent hover glow effect selection animation corresponding to the right pointer (0.0 - 1.0).
     */
    @serialize()
    public blobPulse2 = 0;

    /**
     * Gets or sets the opacity of the fluent hover glow effect corresponding to the right pointer (0.0 - 1.0). Default is 0.
     */
    @serialize()
    public blobFade2 = 0;

    /** @internal */
    public _rate = 0.135;

    /**
     * Gets or sets the color of the highlights on the backplate line.
     */
    @serialize()
    public highlightColor = new Color4(0.98, 0.98, 0.98, 1);

    /**
     * Gets or sets the width of the highlights on the backplate line.
     */
    @serialize()
    public highlightWidth = 0.25;

    /** @internal */
    public _highlightTransform = new Vector4(1, 1, 0, 0);

    /** @internal */
    public _highlight = 1;

    /**
     * Gets or sets the intensity of the iridescence effect.
     */
    @serialize()
    public iridescenceIntensity = 0;

    /**
     * Gets or sets the intensity of the iridescence effect on the backplate edges.
     */
    @serialize()
    public iridescenceEdgeIntensity = 1;

    /** @internal */
    public _angle = -45;

    /**
     * Gets or sets the opacity of the backplate (0.0 - 1.0).
     */
    @serialize()
    public fadeOut = 1;

    /** @internal */
    public _reflected = true;

    /** @internal */
    public _frequency = 1;

    /** @internal */
    public _verticalOffset = 0;

    /**
     * Gets or sets the world-space position of the tip of the left index finger.
     */
    @serializeAsVector3()
    public globalLeftIndexTipPosition = Vector3.Zero();
    private _globalLeftIndexTipPosition4 = Vector4.Zero();

    /**
     * Gets or sets the world-space position of the tip of the right index finger.
     */
    @serializeAsVector3()
    public globalRightIndexTipPosition = Vector3.Zero();
    private _globalRightIndexTipPosition4 = Vector4.Zero();

    constructor(name: string, scene?: Scene) {
        super(name, scene);
        this.alphaMode = Constants.ALPHA_DISABLE;
        this.backFaceCulling = false;

        this._blobTexture = new Texture(FluentBackplateMaterial.BLOB_TEXTURE_URL, this.getScene(), true, false, Texture.NEAREST_SAMPLINGMODE);
        this._iridescentMap = new Texture(FluentBackplateMaterial.IM_TEXTURE_URL, this.getScene(), true, false, Texture.NEAREST_SAMPLINGMODE);
    }

    public needAlphaBlending(): boolean {
        return false;
    }

    public needAlphaTesting(): boolean {
        return false;
    }

    public getAlphaTestTexture(): Nullable<BaseTexture> {
        return null;
    }

    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh): boolean {
        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new FluentBackplateMaterialDefines();
        }

        const defines = <FluentBackplateMaterialDefines>subMesh.materialDefines;
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
            const shaderName = "fluentBackplate";
            const join = defines.toString();

            const uniforms = [
                "world",
                "viewProjection",
                "cameraPosition",
                "_Radius_",
                "_Line_Width_",
                "_Absolute_Sizes_",
                "_Filter_Width_",
                "_Base_Color_",
                "_Line_Color_",
                "_Radius_Top_Left_",
                "_Radius_Top_Right_",
                "_Radius_Bottom_Left_",
                "_Radius_Bottom_Right_",
                "_Blob_Position_",
                "_Blob_Intensity_",
                "_Blob_Near_Size_",
                "_Blob_Far_Size_",
                "_Blob_Near_Distance_",
                "_Blob_Far_Distance_",
                "_Blob_Fade_Length_",
                "_Blob_Pulse_",
                "_Blob_Fade_",
                "_Blob_Texture_",
                "_Blob_Position_2_",
                "_Blob_Near_Size_2_",
                "_Blob_Pulse_2_",
                "_Blob_Fade_2_",
                "_Rate_",
                "_Highlight_Color_",
                "_Highlight_Width_",
                "_Highlight_Transform_",
                "_Highlight_",
                "_Iridescence_Intensity_",
                "_Iridescence_Edge_Intensity_",
                "_Angle_",
                "_Fade_Out_",
                "_Reflected_",
                "_Frequency_",
                "_Vertical_Offset_",
                "_Iridescent_Map_",
                "_Use_Global_Left_Index_",
                "_Use_Global_Right_Index_",
                "Global_Left_Index_Tip_Position",
                "Global_Right_Index_Tip_Position",
            ];
            const samplers: string[] = ["_Blob_Texture_", "_Iridescent_Map_"];
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
                defines,
                this._materialContext
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
        const defines = <FluentBackplateMaterialDefines>subMesh.materialDefines;
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
        this._activeEffect.setMatrix("viewProjection", this.getScene().getTransformMatrix());
        this._activeEffect.setVector3("cameraPosition", this.getScene().activeCamera?.position ?? Vector3.ZeroReadOnly);

        // "Round Rect"
        this._activeEffect.setFloat("_Radius_", this.radius);
        this._activeEffect.setFloat("_Line_Width_", this.lineWidth);
        this._activeEffect.setFloat("_Absolute_Sizes_", this.absoluteSizes ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Filter_Width_", this._filterWidth);
        this._activeEffect.setDirectColor4("_Base_Color_", this.baseColor);
        this._activeEffect.setDirectColor4("_Line_Color_", this.lineColor);

        // "Radii Multipliers"
        this._activeEffect.setFloat("_Radius_Top_Left_", 1);
        this._activeEffect.setFloat("_Radius_Top_Right_", 1.0);
        this._activeEffect.setFloat("_Radius_Bottom_Left_", 1.0);
        this._activeEffect.setFloat("_Radius_Bottom_Right_", 1.0);

        // "Blob"
        //define BLOB_ENABLE true;
        this._activeEffect.setFloat("_Blob_Intensity_", this.blobIntensity);
        this._activeEffect.setFloat("_Blob_Near_Size_", this.blobNearSize);
        this._activeEffect.setFloat("_Blob_Far_Size_", this.blobFarSize);
        this._activeEffect.setFloat("_Blob_Near_Distance_", this.blobNearDistance);
        this._activeEffect.setFloat("_Blob_Far_Distance_", this.blobFarDistance);
        this._activeEffect.setFloat("_Blob_Fade_Length_", this.blobFadeLength);
        this._activeEffect.setFloat("_Blob_Pulse_", this.blobPulse);
        this._activeEffect.setFloat("_Blob_Fade_", this.blobFade);

        // "Blob Texture"
        this._activeEffect.setTexture("_Blob_Texture_", this._blobTexture);

        // "Blob 2"
        //define BLOB_ENABLE_2 true;
        this._activeEffect.setFloat("_Blob_Near_Size_2_", this.blobNearSize2);
        this._activeEffect.setFloat("_Blob_Pulse_2_", this.blobPulse2);
        this._activeEffect.setFloat("_Blob_Fade_2_", this.blobFade2);

        // "Line Highlight"
        this._activeEffect.setFloat("_Rate_", this._rate);
        this._activeEffect.setDirectColor4("_Highlight_Color_", this.highlightColor);
        this._activeEffect.setFloat("_Highlight_Width_", this.highlightWidth);
        this._activeEffect.setVector4("_Highlight_Transform_", this._highlightTransform);
        this._activeEffect.setFloat("_Highlight_", this._highlight);

        // "Iridescence"
        this._activeEffect.setFloat("_Iridescence_Intensity_", this.iridescenceIntensity);
        this._activeEffect.setFloat("_Iridescence_Edge_Intensity_", this.iridescenceEdgeIntensity);
        this._activeEffect.setFloat("_Angle_", this._angle);

        // "Fade"
        this._activeEffect.setFloat("_Fade_Out_", this.fadeOut);

        // "Antialiasing"
        //define SMOOTH_EDGES true;

        // "ChooseAngle"
        this._activeEffect.setFloat("_Reflected_", this._reflected ? 1.0 : 0.0);

        // "Multiply"
        this._activeEffect.setFloat("_Frequency_", this._frequency);
        this._activeEffect.setFloat("_Vertical_Offset_", this._verticalOffset);

        // "Color Texture"
        //define IRIDESCENT_MAP_ENABLE true;
        this._activeEffect.setTexture("_Iridescent_Map_", this._iridescentMap);

        // "Global"
        this._activeEffect.setFloat("_Use_Global_Left_Index_", 1.0);
        this._activeEffect.setFloat("_Use_Global_Right_Index_", 1.0);

        this._globalLeftIndexTipPosition4.set(this.globalLeftIndexTipPosition.x, this.globalLeftIndexTipPosition.y, this.globalLeftIndexTipPosition.z, 1.0);
        this._activeEffect.setVector4("Global_Left_Index_Tip_Position", this._globalLeftIndexTipPosition4);

        this._globalRightIndexTipPosition4.set(this.globalRightIndexTipPosition.x, this.globalRightIndexTipPosition.y, this.globalRightIndexTipPosition.z, 1.0);
        this._activeEffect.setVector4("Global_Right_Index_Tip_Position", this._globalRightIndexTipPosition4);

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

        this._blobTexture.dispose();
        this._iridescentMap.dispose();
    }

    public clone(name: string): FluentBackplateMaterial {
        return SerializationHelper.Clone(() => new FluentBackplateMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.FluentBackplateMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "FluentBackplateMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): FluentBackplateMaterial {
        return SerializationHelper.Parse(() => new FluentBackplateMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GUI.FluentBackplateMaterial", FluentBackplateMaterial);
