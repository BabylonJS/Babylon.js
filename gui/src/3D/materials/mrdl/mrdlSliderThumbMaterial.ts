import { Nullable } from "babylonjs/types";
import { SerializationHelper } from "babylonjs/Misc/decorators";
import { Matrix, Vector2, Vector3, Vector4 } from "babylonjs/Maths/math.vector";
import { IAnimatable } from "babylonjs/Animations/animatable.interface";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { MaterialDefines } from "babylonjs/Materials/materialDefines";
import { MaterialHelper } from "babylonjs/Materials/materialHelper";
import { IEffectCreationOptions } from "babylonjs/Materials/effect";
import { PushMaterial } from "babylonjs/Materials/pushMaterial";
import { VertexBuffer } from "babylonjs/Buffers/buffer";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from "babylonjs/Misc/typeStore";
import { Color4 } from "babylonjs/Maths/math.color";
import { EffectFallbacks } from "babylonjs/Materials/effectFallbacks";
import { Constants } from "babylonjs/Engines/constants";

import "./shaders/mrdlSliderThumb.fragment";
import "./shaders/mrdlSliderThumb.vertex";

/** @hidden */
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
    // TODO: Allow access through member variables

    constructor(name: string, scene: Scene) {
        super(name, scene);
        this.alphaMode = Constants.ALPHA_DISABLE;
        this.backFaceCulling = false;
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
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        if (this.isFrozen) {
            if (subMesh.effect && subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh._materialDefines) {
            subMesh.materialDefines = new MRDLSliderThumbMaterialDefines();
        }

        const defines = <MRDLSliderThumbMaterialDefines>subMesh._materialDefines;
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
                "world", "viewProjection", "cameraPosition"
                , "_Radius_", "_Bevel_Front_", "_Bevel_Front_Stretch_", "_Bevel_Back_", "_Bevel_Back_Stretch_"
                , "_Radius_Top_Left_", "_Radius_Top_Right_", "_Radius_Bottom_Left_", "_Radius_Bottom_Right_"
                , "_Bulge_Enabled_", "_Bulge_Height_", "_Bulge_Radius_", "_Sun_Intensity_", "_Sun_Theta_", "_Sun_Phi_"
                , "_Indirect_Diffuse_", "_Albedo_", "_Specular_", "_Shininess_", "_Sharpness_", "_Subsurface_"
                , "_Left_Color_", "_Right_Color_", "_Reflection_", "_Front_Reflect_", "_Edge_Reflect_", "_Power_"
                , "_Sky_Color_", "_Horizon_Color_", "_Ground_Color_", "_Horizon_Power_", "_Reflection_Map_"
                , "_Indirect_Environment_", "_Width_", "_Fuzz_", "_Min_Fuzz_", "_Clip_Fade_", "_Hue_Shift_", "_Saturation_Shift_"
                , "_Value_Shift_", "_Blob_Position_", "_Blob_Intensity_", "_Blob_Near_Size_", "_Blob_Far_Size_"
                , "_Blob_Near_Distance_", "_Blob_Far_Distance_", "_Blob_Fade_Length_", "_Blob_Pulse_", "_Blob_Fade_"
                , "_Blob_Texture_", "_Blob_Position_2_", "_Blob_Near_Size_2_", "_Blob_Pulse_2_", "_Blob_Fade_2_"
                , "_Left_Index_Pos_", "_Right_Index_Pos_", "_Left_Index_Middle_Pos_", "_Right_Index_Middle_Pos_"
                , "_Decal_", "_Decal_Scale_XY_", "_Decal_Front_Only_", "_Rim_Intensity_", "_Rim_Texture_", "_Rim_Hue_Shift_"
                , "_Rim_Saturation_Shift_", "_Rim_Value_Shift_", "_Iridescence_Intensity_", "_Iridescence_Texture_"
                , "Use_Global_Left_Index", "Use_Global_Right_Index", "Global_Left_Index_Tip_Position", "Global_Right_Index_Tip_Position"
                , "Global_Left_Thumb_Tip_Position", "Global_Right_Thumb_Tip_Position", "Global_Left_Index_Middle_Position;", "Global_Right_Index_Middle_Position", "Global_Left_Index_Tip_Proximity", "Global_Right_Index_Tip_Proximity"
            ];
            const samplers: string[] = ["_Rim_Texture_", "_Iridescence_Texture_"];
            const uniformBuffers = new Array<string>();

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 4
            });

            subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                <IEffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: 4 }
                }, engine), defines);
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        subMesh.effect._wasPreviouslyReady = true;

        return true;
    }

    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const defines = <MRDLSliderThumbMaterialDefines>subMesh._materialDefines;
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
        this._activeEffect.setFloat("_Radius_", 0.2);
        this._activeEffect.setFloat("_Bevel_Front_", 0.035);
        this._activeEffect.setFloat("_Bevel_Front_Stretch_", 0.077);
        this._activeEffect.setFloat("_Bevel_Back_", 0.031);
        this._activeEffect.setFloat("_Bevel_Back_Stretch_", 0);

        // "Radii Multipliers"
        this._activeEffect.setFloat("_Radius_Top_Left_", 1);
        this._activeEffect.setFloat("_Radius_Top_Right_", 1.0);
        this._activeEffect.setFloat("_Radius_Bottom_Left_", 1.0);
        this._activeEffect.setFloat("_Radius_Bottom_Right_", 1.0);

        // "Bulge"
        this._activeEffect.setFloat("_Bulge_Enabled_", false ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Bulge_Height_", -0.323);
        this._activeEffect.setFloat("_Bulge_Radius_", 0.73);

        // "Sun"
        this._activeEffect.setFloat("_Sun_Intensity_", 2);
        this._activeEffect.setFloat("_Sun_Theta_", 0.937);
        this._activeEffect.setFloat("_Sun_Phi_", 0.555);
        this._activeEffect.setFloat("_Indirect_Diffuse_", 1);

        // "Diffuse And Specular"
        this._activeEffect.setDirectColor4("_Albedo_", new Color4(0.0117647, 0.505882, 0.996078, 1));
        this._activeEffect.setFloat("_Specular_", 0);
        this._activeEffect.setFloat("_Shininess_", 10);
        this._activeEffect.setFloat("_Sharpness_", 0);
        this._activeEffect.setFloat("_Subsurface_", 0.31);

        // "Gradient"
        this._activeEffect.setDirectColor4("_Left_Color_", new Color4(0.0117647, 0.505882, 0.996078, 1));
        this._activeEffect.setDirectColor4("_Right_Color_", new Color4(0.0117647, 0.505882, 0.996078, 1));

        // "Reflection"
        this._activeEffect.setFloat("_Reflection_", 0.749);
        this._activeEffect.setFloat("_Front_Reflect_", 0);
        this._activeEffect.setFloat("_Edge_Reflect_", .09);
        this._activeEffect.setFloat("_Power_", 8.1);

        // "Sky Environment"
        //define SKY_ENABLED true;
        this._activeEffect.setDirectColor4("_Sky_Color_", new Color4(0.0117647, 0.960784, 0.996078, 1));
        this._activeEffect.setDirectColor4("_Horizon_Color_", new Color4(0.0117647, 0.333333, 0.996078, 1));
        this._activeEffect.setDirectColor4("_Ground_Color_", new Color4(0, 0.254902, 0.996078, 1));
        this._activeEffect.setFloat("_Horizon_Power_", 1);

        // "Mapped Environment"
        //define ENV_ENABLE false;
        this._activeEffect.setTexture("_Reflection_Map_", new Texture("", this.getScene()));
        this._activeEffect.setTexture("_Indirect_Environment_", new Texture("", this.getScene()));

        // "FingerOcclusion"
        //define OCCLUSION_ENABLED false;
        this._activeEffect.setFloat("_Width_", 0.02);
        this._activeEffect.setFloat("_Fuzz_", 0.5);
        this._activeEffect.setFloat("_Min_Fuzz_", 0.001);
        this._activeEffect.setFloat("_Clip_Fade_", 0.01);

        // "View Based Color Shift"
        this._activeEffect.setFloat("_Hue_Shift_", 0);
        this._activeEffect.setFloat("_Saturation_Shift_", 0);
        this._activeEffect.setFloat("_Value_Shift_", 0);

        // "Blob"
        //define BLOB_ENABLE false;
        this._activeEffect.setVector3("_Blob_Position_", new Vector3(0, 0, 0.1));
        this._activeEffect.setFloat("_Blob_Intensity_", 0.5);
        this._activeEffect.setFloat("_Blob_Near_Size_", 0.01);
        this._activeEffect.setFloat("_Blob_Far_Size_", 0.03);
        this._activeEffect.setFloat("_Blob_Near_Distance_", 0);
        this._activeEffect.setFloat("_Blob_Far_Distance_", 0.08);
        this._activeEffect.setFloat("_Blob_Fade_Length_", 0.576);
        this._activeEffect.setFloat("_Blob_Pulse_", 0);
        this._activeEffect.setFloat("_Blob_Fade_", 1);

        // "Blob Texture"
        this._activeEffect.setTexture("_Blob_Texture_", new Texture("", this.getScene()));

        // "Blob 2"
        //define BLOB_ENABLE_2 true;
        this._activeEffect.setVector3("_Blob_Position_2_", new Vector3(0.2, 0, 0.1));
        this._activeEffect.setFloat("_Blob_Near_Size_2_", 0.01);
        this._activeEffect.setFloat("_Blob_Pulse_2_", 0);
        this._activeEffect.setFloat("_Blob_Fade_2_", 1);

        // "Finger Positions"
        this._activeEffect.setVector3("_Left_Index_Pos_", new Vector3(0, 0, 1));
        this._activeEffect.setVector3("_Right_Index_Pos_", new Vector3(-1, -1, -1));
        this._activeEffect.setVector3("_Left_Index_Middle_Pos_", new Vector3(0, 0, 0));
        this._activeEffect.setVector3("_Right_Index_Middle_Pos_", new Vector3(0, 0, 0));

        // "Decal Texture"
        //define DECAL_ENABLE false;
        this._activeEffect.setTexture("_Decal_", new Texture("", this.getScene()));
        this._activeEffect.setVector2("_Decal_Scale_XY_", new Vector2(1.5, 1.5));
        this._activeEffect.setFloat("_Decal_Front_Only_", true ? 1.0 : 0.0);

        // "Rim Light"
        this._activeEffect.setFloat("_Rim_Intensity_", 0.287);
        this._activeEffect.setTexture("_Rim_Texture_", new Texture("https://raw.githubusercontent.com/rgerd/TestAssets/master/PNG/BlueGradient.png", this.getScene()));
        this._activeEffect.setFloat("_Rim_Hue_Shift_", 0);
        this._activeEffect.setFloat("_Rim_Saturation_Shift_", 0.0);
        this._activeEffect.setFloat("_Rim_Value_Shift_", -1);

        // "Iridescence"
        //define IRIDESCENCE_ENABLED true;
        this._activeEffect.setFloat("_Iridescence_Intensity_", 0);
        this._activeEffect.setTexture("_Iridescence_Texture_", new Texture("https://raw.githubusercontent.com/rgerd/TestAssets/master/PNG/BlueGradient.png", this.getScene()));


        // Global inputs
        this._activeEffect.setFloat("Use_Global_Left_Index", 1.0);
        this._activeEffect.setFloat("Use_Global_Right_Index", 1.0);

        this._activeEffect.setVector4("Global_Left_Index_Tip_Position", new Vector4(0.5, 0.0, -0.55, 1.0));
        this._activeEffect.setVector4("Global_Right_Index_Tip_Position", new Vector4(0.0, 0.0, 0.0, 1.0));

        this._activeEffect.setVector4("Global_Left_Thumb_Tip_Position", new Vector4(0.5, 0.0, -0.55, 1.0));
        this._activeEffect.setVector4("Global_Right_Thumb_Tip_Position", new Vector4(0.0, 0.0, 0.0, 1.0));

        this._activeEffect.setVector4("Global_Left_Index_Middle_Position", new Vector4(0.5, 0.0, -0.55, 1.0));
        this._activeEffect.setVector4("Global_Right_Index_Middle_Position", new Vector4(0.0, 0.0, 0.0, 1.0));
        
        this._activeEffect.setFloat("Global_Left_Index_Tip_Proximity", 0.0);
        this._activeEffect.setFloat("Global_Right_Index_Tip_Proximity", 0.0);

        this._afterBind(mesh, this._activeEffect);
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

    public clone(name: string): MRDLSliderThumbMaterial {
        return SerializationHelper.Clone(() => new MRDLSliderThumbMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
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

_TypeStore.RegisteredTypes["BABYLON.GUI.MRDLSliderThumbMaterial"] = MRDLSliderThumbMaterial;
