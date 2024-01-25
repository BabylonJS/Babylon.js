/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { SerializationHelper, serialize } from "core/Misc/decorators";
import type { Matrix } from "core/Maths/math.vector";
import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
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

import "./shaders/mrdlSliderThumb.fragment";
import "./shaders/mrdlSliderThumb.vertex";

/** @internal */
class MRDLSliderThumbMaterialDefines extends MaterialDefines {
    /*
        "SKY_ENABLED", "BLOB_ENABLE_2", "IRIDESCENCE_ENABLED"
    */
    public SKY_ENABLED = true;
    public BLOB_ENABLE_2 = true;
    public IRIDESCENCE_ENABLED = true;

    constructor() {
        super();
        this._needNormals = true;
        this._needUVs = true;
        this.rebuild();
    }
}

/**
 * Class used to render Slider Thumb material with MRDL
 */
export class MRDLSliderThumbMaterial extends PushMaterial {
    /**
     * URL pointing to the texture used to define the coloring for the Iridescent Map effect.
     */
    public static BLUE_GRADIENT_TEXTURE_URL = "https://assets.babylonjs.com/meshes/MRTK/MRDL/mrtk-mrdl-blue-gradient.png";
    private _blueGradientTexture: Texture;
    private _decalTexture: Texture;
    private _reflectionMapTexture: Texture;
    private _indirectEnvTexture: Texture;

    /**
     * Gets or sets the corner Radius on the slider thumb.
     */
    @serialize()
    public radius = 0.157;

    /**
     * Gets or sets the Bevel Front on the slider thumb.
     */
    @serialize()
    public bevelFront = 0.065;

    /**
     * Gets or sets the Bevel Front Stretch on the slider thumb.
     */
    @serialize()
    public bevelFrontStretch = 0.077;

    /**
     * Gets or sets the Bevel Back on the slider thumb.
     */
    @serialize()
    public bevelBack = 0.031;

    /**
     * Gets or sets the Bevel Back Stretch on the slider thumb.
     */
    @serialize()
    public bevelBackStretch = 0;

    /**
     * Gets or sets the top left Radii Multiplier.
     */
    @serialize()
    public radiusTopLeft = 1.0;

    /**
     * Gets or sets the top left Radii Multiplier.
     */
    @serialize()
    public radiusTopRight = 1.0;

    /**
     * Gets or sets the top left Radii Multiplier.
     */
    @serialize()
    public radiusBottomLeft = 1.0;

    /**
     * Gets or sets the top left Radii Multiplier.
     */
    @serialize()
    public radiusBottomRight = 1.0;

    /**
     * Gets or sets whether Bulge is enabled.
     * Default is false.
     */
    @serialize()
    public bulgeEnabled = false;

    /**
     * Gets or sets the Bulge Height.
     */
    @serialize()
    public bulgeHeight = -0.323;

    /**
     * Gets or sets the Bulge Radius.
     */
    @serialize()
    public bulgeRadius = 0.73;

    /**
     * Gets or sets the Sun Intensity.
     */
    @serialize()
    public sunIntensity = 2;

    /**
     * Gets or sets the Sun Theta.
     */
    @serialize()
    public sunTheta = 0.937;

    /**
     * Gets or sets the Sun Phi.
     */
    @serialize()
    public sunPhi = 0.555;

    /**
     * Gets or sets the Indirect Diffuse.
     */
    @serialize()
    public indirectDiffuse = 1;

    /**
     * Gets or sets the base albedo.
     */
    @serialize()
    public albedo = new Color4(0.0117647, 0.505882, 0.996078, 1);

    /**
     * Gets or sets the Specular value.
     */
    @serialize()
    public specular = 0;

    /**
     * Gets or sets the Shininess value.
     */
    @serialize()
    public shininess = 10;

    /**
     * Gets or sets the Sharpness value.
     */
    @serialize()
    public sharpness = 0;

    /**
     * Gets or sets the Subsurface value.
     */
    @serialize()
    public subsurface = 0.31;

    /**
     * Gets or sets the left gradient color.
     */
    @serialize()
    public leftGradientColor = new Color4(0.0117647, 0.505882, 0.996078, 1);

    /**
     * Gets or sets the right gradient color.
     */
    @serialize()
    public rightGradientColor = new Color4(0.0117647, 0.505882, 0.996078, 1);

    /**
     * Gets or sets the reflection value.
     */
    @serialize()
    public reflection = 0.749;

    /**
     * Gets or sets the front reflect value.
     */
    @serialize()
    public frontReflect = 0;

    /**
     * Gets or sets the edge reflect value.
     */
    @serialize()
    public edgeReflect = 0.09;

    /**
     * Gets or sets the power value.
     */
    @serialize()
    public power = 8.1;

    /**
     * Gets or sets the sky color.
     */
    @serialize()
    public skyColor = new Color4(0.0117647, 0.960784, 0.996078, 1);

    /**
     * Gets or sets the horizon color.
     */
    @serialize()
    public horizonColor = new Color4(0.0117647, 0.333333, 0.996078, 1);

    /**
     * Gets or sets the ground color.
     */
    @serialize()
    public groundColor = new Color4(0, 0.254902, 0.996078, 1);

    /**
     * Gets or sets the horizon power value.
     */
    @serialize()
    public horizonPower = 1;

    /**
     * Gets or sets the finger occlusion width value.
     */
    @serialize()
    public width = 0.02;

    /**
     * Gets or sets the finger occlusion fuzz value.
     */
    @serialize()
    public fuzz = 0.5;

    /**
     * Gets or sets the minimum finger occlusion fuzz value.
     */
    @serialize()
    public minFuzz = 0.001;

    /**
     * Gets or sets the finger occlusion clip fade value.
     */
    @serialize()
    public clipFade = 0.01;

    /**
     * Gets or sets the hue shift value.
     */
    @serialize()
    public hueShift = 0;

    /**
     * Gets or sets the saturation shift value.
     */
    @serialize()
    public saturationShift = 0;

    /**
     * Gets or sets the value shift.
     */
    @serialize()
    public valueShift = 0;

    /**
     * Gets or sets the position of the hover glow effect.
     */
    @serialize()
    public blobPosition = new Vector3(0, 0, 0.1);

    /**
     * Gets or sets the intensity of the hover glow effect.
     */
    @serialize()
    public blobIntensity = 0.5;

    /**
     * Gets or sets the near size of the hover glow effect.
     */
    @serialize()
    public blobNearSize = 0.01;

    /**
     * Gets or sets the far size of the hover glow effect.
     */
    @serialize()
    public blobFarSize = 0.03;

    /**
     * Gets or sets the distance considered "near" to the mesh, which controls the size of the hover glow effect (see blobNearSize).
     */
    @serialize()
    public blobNearDistance = 0;

    /**
     * Gets or sets the distance considered "far" from the mesh, which controls the size of the hover glow effect (see blobFarSize).
     */
    @serialize()
    public blobFarDistance = 0.08;

    /**
     * Gets or sets the length of the hover glow effect fade.
     */
    @serialize()
    public blobFadeLength = 0.576;

    /**
     * Gets or sets the progress of the hover glow effect selection animation corresponding to the left pointer (0.0 - 1.0).
     */
    @serialize()
    public blobPulse = 0;

    /**
     * Gets or sets the opacity of the hover glow effect corresponding to the left pointer (0.0 - 1.0). Default is 0.
     */
    @serialize()
    public blobFade = 1;

    /**
     * Gets or sets the position of the hover glow effect.
     */
    @serialize()
    public blobPosition2 = new Vector3(0.2, 0, 0.1);

    /**
     * Gets or sets the size of the hover glow effect when the right pointer is considered "near" to the mesh (see blobNearDistance).
     */
    @serialize()
    public blobNearSize2 = 0.01;

    /**
     * Gets or sets the progress of the hover glow effect selection animation corresponding to the right pointer (0.0 - 1.0).
     */
    @serialize()
    public blobPulse2 = 0;

    /**
     * Gets or sets the opacity of the hover glow effect corresponding to the right pointer (0.0 - 1.0). Default is 1.
     */
    @serialize()
    public blobFade2 = 1;

    /**
     * Gets or sets the texture of the hover glow effect.
     */
    @serialize()
    public blobTexture = new Texture("", this.getScene());

    /**
     * Gets or sets the finger position for left index.
     */
    @serialize()
    public leftIndexPosition = new Vector3(0, 0, 1);

    /**
     * Gets or sets the finger position for right index.
     */
    @serialize()
    public rightIndexPosition = new Vector3(-1, -1, -1);

    /**
     * Gets or sets the finger position for left index middle position.
     */
    @serialize()
    public leftIndexMiddlePosition = new Vector3(0, 0, 0);

    /**
     * Gets or sets the finger position for right index middle position.
     */
    @serialize()
    public rightIndexMiddlePosition = new Vector3(0, 0, 0);

    /**
     * Gets or sets the Decal Scale for XY.
     */
    @serialize()
    public decalScaleXY = new Vector2(1.5, 1.5);

    /**
     * Gets or sets decalFrontOnly
     * Default is true
     */
    @serialize()
    public decalFrontOnly = true;

    /**
     * Gets or sets the Rim Light intensity.
     */
    @serialize()
    public rimIntensity = 0.287;

    /**
     * Gets or sets the Rim Light hue shift value.
     */
    @serialize()
    public rimHueShift = 0;

    /**
     * Gets or sets the Rim Light saturation shift value.
     */
    @serialize()
    public rimSaturationShift = 0;

    /**
     * Gets or sets the Rim Light value shift.
     */
    @serialize()
    public rimValueShift = -1;

    /**
     * Gets or sets the intensity of the iridescence effect.
     */
    @serialize()
    public iridescenceIntensity = 0;

    /**
     * @internal
     */
    public useGlobalLeftIndex = 1.0;

    /**
     * @internal
     */
    public useGlobalRightIndex = 1.0;

    /**
     * @internal
     */
    public globalLeftIndexTipProximity = 0.0;

    /**
     * @internal
     */
    public globalRightIndexTipProximity = 0.0;

    /**
     * @internal
     */
    public globalLeftIndexTipPosition = new Vector4(0.5, 0.0, -0.55, 1.0);

    /**
     * @internal
     */
    public globaRightIndexTipPosition = new Vector4(0.0, 0.0, 0.0, 1.0);

    /**
     * @internal
     */
    public globalLeftThumbTipPosition = new Vector4(0.5, 0.0, -0.55, 1.0);

    /**
     * @internal
     */
    public globalRightThumbTipPosition = new Vector4(0.0, 0.0, 0.0, 1.0);

    /**
     * @internal
     */
    public globalLeftIndexMiddlePosition = new Vector4(0.5, 0.0, -0.55, 1.0);

    /**
     * @internal
     */
    public globalRightIndexMiddlePosition = new Vector4(0.0, 0.0, 0.0, 1.0);

    constructor(name: string, scene?: Scene) {
        super(name, scene);
        this.alphaMode = Constants.ALPHA_DISABLE;
        this.backFaceCulling = false;
        this._blueGradientTexture = new Texture(MRDLSliderThumbMaterial.BLUE_GRADIENT_TEXTURE_URL, scene, true, false, Texture.NEAREST_SAMPLINGMODE);
        this._decalTexture = new Texture("", this.getScene());
        this._reflectionMapTexture = new Texture("", this.getScene());
        this._indirectEnvTexture = new Texture("", this.getScene());
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

    // Methods
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh): boolean {
        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new MRDLSliderThumbMaterialDefines();
        }

        const defines = <MRDLSliderThumbMaterialDefines>subMesh.materialDefines;
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
            const shaderName = "mrdlSliderThumb";
            const join = defines.toString();

            const uniforms = [
                "world",
                "viewProjection",
                "cameraPosition",
                "_Radius_",
                "_Bevel_Front_",
                "_Bevel_Front_Stretch_",
                "_Bevel_Back_",
                "_Bevel_Back_Stretch_",
                "_Radius_Top_Left_",
                "_Radius_Top_Right_",
                "_Radius_Bottom_Left_",
                "_Radius_Bottom_Right_",
                "_Bulge_Enabled_",
                "_Bulge_Height_",
                "_Bulge_Radius_",
                "_Sun_Intensity_",
                "_Sun_Theta_",
                "_Sun_Phi_",
                "_Indirect_Diffuse_",
                "_Albedo_",
                "_Specular_",
                "_Shininess_",
                "_Sharpness_",
                "_Subsurface_",
                "_Left_Color_",
                "_Right_Color_",
                "_Reflection_",
                "_Front_Reflect_",
                "_Edge_Reflect_",
                "_Power_",
                "_Sky_Color_",
                "_Horizon_Color_",
                "_Ground_Color_",
                "_Horizon_Power_",
                "_Reflection_Map_",
                "_Indirect_Environment_",
                "_Width_",
                "_Fuzz_",
                "_Min_Fuzz_",
                "_Clip_Fade_",
                "_Hue_Shift_",
                "_Saturation_Shift_",
                "_Value_Shift_",
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
                "_Left_Index_Pos_",
                "_Right_Index_Pos_",
                "_Left_Index_Middle_Pos_",
                "_Right_Index_Middle_Pos_",
                "_Decal_",
                "_Decal_Scale_XY_",
                "_Decal_Front_Only_",
                "_Rim_Intensity_",
                "_Rim_Texture_",
                "_Rim_Hue_Shift_",
                "_Rim_Saturation_Shift_",
                "_Rim_Value_Shift_",
                "_Iridescence_Intensity_",
                "_Iridescence_Texture_",
                "Use_Global_Left_Index",
                "Use_Global_Right_Index",
                "Global_Left_Index_Tip_Position",
                "Global_Right_Index_Tip_Position",
                "Global_Left_Thumb_Tip_Position",
                "Global_Right_Thumb_Tip_Position",
                "Global_Left_Index_Middle_Position;",
                "Global_Right_Index_Middle_Position",
                "Global_Left_Index_Tip_Proximity",
                "Global_Right_Index_Tip_Proximity",
            ];
            const samplers: string[] = ["_Rim_Texture_", "_Iridescence_Texture_"];
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
        const defines = <MRDLSliderThumbMaterialDefines>subMesh.materialDefines;
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
        this._activeEffect.setVector3("cameraPosition", this.getScene().activeCamera!.position);

        // "Round Rect"
        this._activeEffect.setFloat("_Radius_", this.radius);
        this._activeEffect.setFloat("_Bevel_Front_", this.bevelFront);
        this._activeEffect.setFloat("_Bevel_Front_Stretch_", this.bevelFrontStretch);
        this._activeEffect.setFloat("_Bevel_Back_", this.bevelBack);
        this._activeEffect.setFloat("_Bevel_Back_Stretch_", this.bevelBackStretch);

        // "Radii Multipliers"
        this._activeEffect.setFloat("_Radius_Top_Left_", this.radiusTopLeft);
        this._activeEffect.setFloat("_Radius_Top_Right_", this.radiusTopRight);
        this._activeEffect.setFloat("_Radius_Bottom_Left_", this.radiusBottomLeft);
        this._activeEffect.setFloat("_Radius_Bottom_Right_", this.radiusBottomRight);

        // "Bulge"
        this._activeEffect.setFloat("_Bulge_Enabled_", this.bulgeEnabled ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Bulge_Height_", this.bulgeHeight);
        this._activeEffect.setFloat("_Bulge_Radius_", this.bulgeRadius);

        // "Sun"
        this._activeEffect.setFloat("_Sun_Intensity_", this.sunIntensity);
        this._activeEffect.setFloat("_Sun_Theta_", this.sunTheta);
        this._activeEffect.setFloat("_Sun_Phi_", this.sunPhi);
        this._activeEffect.setFloat("_Indirect_Diffuse_", this.indirectDiffuse);

        // "Diffuse And Specular"
        this._activeEffect.setDirectColor4("_Albedo_", this.albedo);
        this._activeEffect.setFloat("_Specular_", this.specular);
        this._activeEffect.setFloat("_Shininess_", this.shininess);
        this._activeEffect.setFloat("_Sharpness_", this.sharpness);
        this._activeEffect.setFloat("_Subsurface_", this.subsurface);

        // "Gradient"
        this._activeEffect.setDirectColor4("_Left_Color_", this.leftGradientColor);
        this._activeEffect.setDirectColor4("_Right_Color_", this.rightGradientColor);

        // "Reflection"
        this._activeEffect.setFloat("_Reflection_", this.reflection);
        this._activeEffect.setFloat("_Front_Reflect_", this.frontReflect);
        this._activeEffect.setFloat("_Edge_Reflect_", this.edgeReflect);
        this._activeEffect.setFloat("_Power_", this.power);

        // "Sky Environment"
        //define SKY_ENABLED true;
        this._activeEffect.setDirectColor4("_Sky_Color_", this.skyColor);
        this._activeEffect.setDirectColor4("_Horizon_Color_", this.horizonColor);
        this._activeEffect.setDirectColor4("_Ground_Color_", this.groundColor);
        this._activeEffect.setFloat("_Horizon_Power_", this.horizonPower);

        // "Mapped Environment"
        //define ENV_ENABLE false;
        this._activeEffect.setTexture("_Reflection_Map_", this._reflectionMapTexture);
        this._activeEffect.setTexture("_Indirect_Environment_", this._indirectEnvTexture);

        // "FingerOcclusion"
        //define OCCLUSION_ENABLED false;
        this._activeEffect.setFloat("_Width_", this.width);
        this._activeEffect.setFloat("_Fuzz_", this.fuzz);
        this._activeEffect.setFloat("_Min_Fuzz_", this.minFuzz);
        this._activeEffect.setFloat("_Clip_Fade_", this.clipFade);

        // "View Based Color Shift"
        this._activeEffect.setFloat("_Hue_Shift_", this.hueShift);
        this._activeEffect.setFloat("_Saturation_Shift_", this.saturationShift);
        this._activeEffect.setFloat("_Value_Shift_", this.valueShift);

        // "Blob"
        //define BLOB_ENABLE false;
        this._activeEffect.setVector3("_Blob_Position_", this.blobPosition);
        this._activeEffect.setFloat("_Blob_Intensity_", this.blobIntensity);
        this._activeEffect.setFloat("_Blob_Near_Size_", this.blobNearSize);
        this._activeEffect.setFloat("_Blob_Far_Size_", this.blobFarSize);
        this._activeEffect.setFloat("_Blob_Near_Distance_", this.blobNearDistance);
        this._activeEffect.setFloat("_Blob_Far_Distance_", this.blobFarDistance);
        this._activeEffect.setFloat("_Blob_Fade_Length_", this.blobFadeLength);
        this._activeEffect.setFloat("_Blob_Pulse_", this.blobPulse);
        this._activeEffect.setFloat("_Blob_Fade_", this.blobFade);

        // "Blob Texture"
        this._activeEffect.setTexture("_Blob_Texture_", this.blobTexture);

        // "Blob 2"
        //define BLOB_ENABLE_2 true;
        this._activeEffect.setVector3("_Blob_Position_2_", this.blobPosition2);
        this._activeEffect.setFloat("_Blob_Near_Size_2_", this.blobNearSize2);
        this._activeEffect.setFloat("_Blob_Pulse_2_", this.blobPulse2);
        this._activeEffect.setFloat("_Blob_Fade_2_", this.blobFade2);

        // "Finger Positions"
        this._activeEffect.setVector3("_Left_Index_Pos_", this.leftIndexPosition);
        this._activeEffect.setVector3("_Right_Index_Pos_", this.rightIndexPosition);
        this._activeEffect.setVector3("_Left_Index_Middle_Pos_", this.leftIndexMiddlePosition);
        this._activeEffect.setVector3("_Right_Index_Middle_Pos_", this.rightIndexMiddlePosition);

        // "Decal Texture"
        //define DECAL_ENABLE false;
        this._activeEffect.setTexture("_Decal_", this._decalTexture);
        this._activeEffect.setVector2("_Decal_Scale_XY_", this.decalScaleXY);
        this._activeEffect.setFloat("_Decal_Front_Only_", this.decalFrontOnly ? 1.0 : 0.0);

        // "Rim Light"
        this._activeEffect.setFloat("_Rim_Intensity_", this.rimIntensity);
        this._activeEffect.setTexture("_Rim_Texture_", this._blueGradientTexture);
        this._activeEffect.setFloat("_Rim_Hue_Shift_", this.rimHueShift);
        this._activeEffect.setFloat("_Rim_Saturation_Shift_", this.rimSaturationShift);
        this._activeEffect.setFloat("_Rim_Value_Shift_", this.rimValueShift);

        // "Iridescence"
        //define IRIDESCENCE_ENABLED true;
        this._activeEffect.setFloat("_Iridescence_Intensity_", this.iridescenceIntensity);
        this._activeEffect.setTexture("_Iridescence_Texture_", this._blueGradientTexture);

        // Global inputs
        this._activeEffect.setFloat("Use_Global_Left_Index", this.useGlobalLeftIndex);
        this._activeEffect.setFloat("Use_Global_Right_Index", this.useGlobalRightIndex);

        this._activeEffect.setVector4("Global_Left_Index_Tip_Position", this.globalLeftIndexTipPosition);
        this._activeEffect.setVector4("Global_Right_Index_Tip_Position", this.globaRightIndexTipPosition);

        this._activeEffect.setVector4("Global_Left_Thumb_Tip_Position", this.globalLeftThumbTipPosition);
        this._activeEffect.setVector4("Global_Right_Thumb_Tip_Position", this.globalRightThumbTipPosition);

        this._activeEffect.setVector4("Global_Left_Index_Middle_Position", this.globalLeftIndexMiddlePosition);
        this._activeEffect.setVector4("Global_Right_Index_Middle_Position", this.globalRightIndexMiddlePosition);

        this._activeEffect.setFloat("Global_Left_Index_Tip_Proximity", this.globalLeftIndexTipProximity);
        this._activeEffect.setFloat("Global_Right_Index_Tip_Proximity", this.globalRightIndexTipProximity);

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
        this._reflectionMapTexture.dispose();
        this._indirectEnvTexture.dispose();
        this._blueGradientTexture.dispose();
        this._decalTexture.dispose();
    }

    public clone(name: string): MRDLSliderThumbMaterial {
        return SerializationHelper.Clone(() => new MRDLSliderThumbMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.MRDLSliderThumbMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "MRDLSliderThumbMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): MRDLSliderThumbMaterial {
        return SerializationHelper.Parse(() => new MRDLSliderThumbMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GUI.MRDLSliderThumbMaterial", MRDLSliderThumbMaterial);
