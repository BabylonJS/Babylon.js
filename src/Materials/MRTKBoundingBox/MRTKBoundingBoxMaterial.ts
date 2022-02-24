import { Nullable } from "../../types";
import { SerializationHelper, serialize } from "../../Misc/decorators";
import { Vector3, Matrix, Vector4 } from "../../Maths/math.vector";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { MaterialDefines } from "../../Materials/materialDefines";
import { IEffectCreationOptions } from "../../Materials/effect";
import { MaterialHelper } from "../../Materials/materialHelper";
import { PushMaterial } from "../../Materials/pushMaterial";
import { VertexBuffer } from "../../Buffers/buffer";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { SubMesh } from "../../Meshes/subMesh";
import { Mesh } from "../../Meshes/mesh";
import { Scene } from "../../scene";
import { RegisterClass } from "../../Misc/typeStore";
import { Color4 } from "../../Maths/math.color";
import { Constants } from "../../Engines/constants";
import { EffectFallbacks } from "../effectFallbacks";
import { Texture } from "../Textures/texture";
import { IAnimatable } from "../../Animations/animatable.interface";

import "../../shaders/mrtkBoundingBox.fragment";
import "../../shaders/mrtkBoundingBox.vertex";

/** @hidden */
class MRTKBoundingBoxMaterialDefines extends MaterialDefines {
    /*
        "ENABLE_FADE"
    */
    public ENABLE_FADE = true;
    //public BLOB_ENABLE = true;
    public ENABLE_TRANSITION = false

    constructor() {
        super();
        this._needNormals = true;
        this._needUVs = true;
        this.rebuild();
    }
}

export class MRTKBoundingBoxMaterial extends PushMaterial {
    public static BLOB_TEXTURE_URL = "https://raw.githubusercontent.com/rgerd/TestAssets/master/PNG/blob1_linear.png";

    /**
     * Gets or sets the near width.
     */
    @serialize()
    public nearWidth = 0.01;

    /**
     * Gets or sets the far width.
     */
    @serialize()
    public farWidth = 0.05;

    /**
     * Gets or sets the near distance.
     */
    @serialize()
    public nearDistance = 1;

    /**
     * Gets or sets the far distance.
     */
    @serialize()
    public farDistance = 5;

    /**
     * Gets or sets the edge color.
     */
    @serialize()
    public edgeColor = new Color4(0.27451, 0.27451, 0.27451, 1);

    // "Proximity"    
    /**
     * Gets or sets the proximity max intensity.
     */
    @serialize()
    public proximityMaxIntensity = 0.59;

    /**
     * Gets or sets the proximity far radius.
     */
    @serialize()
    public proximityFarRadius = 0.51;

    /**
     * Gets or sets the proximity near radius.
     */
    @serialize()
    public proximityNearRadius = 0.01;

    // "Blob"

    /**
     * Gets or sets the whether there is a hover glow effect.
     */
    @serialize()
    public blobEnable = true;

    /**
     * Gets or sets the position of the hover glow effect.
     */
    @serialize()
    public blobPosition = new Vector3(0.2, 0, 0);

    /**
     * Gets or sets the intensity of the hover glow effect.
     */
    @serialize()
    public blobIntensity = 0.2;

    /**
     * Gets or sets the near size of the hover glow effect.
     */
    @serialize()
    public blobNearSize = 0.03;

    /**
     * Gets or sets the far size of the hover glow effect.
     */
    @serialize()
    public blobFarSize = 0.06;

    /**
     * Gets or sets the distance considered "near" to the mesh, which controls the size of the hover glow effect (see blobNearSize).
     */
    @serialize()
    public blobNearDistance = 0.02;

    /**
     * Gets or sets the distance considered "far" from the mesh, which controls the size of the hover glow effect (see blobFarSize).
     */
    @serialize()
    public blobFarDistance = 0.08;

    /**
     * Gets or sets the length of the hover glow effect fade.
     */
    @serialize()
    public blobFadeLength = 0.08;

    /**
     * Gets or sets the inner size of the hover glow effect fade.
     */
    @serialize()
    public blobInnerFade = 0.1;

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

    // "Blob Texture"

    /**
     * Gets or sets the texture of the hover glow effect.
     */
    @serialize()
    public blobTexture = new Texture(MRTKBoundingBoxMaterial.BLOB_TEXTURE_URL, this.getScene());

    // "Blob 2"

    /**
     * Gets or sets the near width.
     */
    @serialize()
    public BlobEnable2 = false;

    /**
     * Gets or sets the position of the hover glow effect.
     */
    @serialize()
    public blobPosition2 = new Vector3(-1, 0, 0);

    /**
     * Gets or sets the size of the hover glow effect when the right pointer is considered "near" to the mesh (see blobNearDistance).
     */
    @serialize()
    public blobNearSize2 = 0.02;

    /**
     * Gets or sets the inner size of the hover glow effect fade.
     */
    @serialize()
    public blobInnerFade2 = 0.1;

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

    // "Transition"
    //define ENABLE_TRANSITION false;

    /**
     * Gets or sets the center position.
     */
    @serialize()
    public center = new Vector3(0.5, 0.3, 0.2);

    /**
     * Gets or sets the transition value.
     */
    @serialize()
    public transition = 0.92;

    /**
     * Gets or sets the transition radius value.
     */
    @serialize()
    public radius = 4;

    /**
     * Gets or sets the transition fuzz value.
     */
    @serialize()
    public fuzz = 0.92;

    /**
     * Gets or sets the transition start time, default is 0.
     */
    @serialize()
    public startTime = 0;

    /**
     * Gets or sets the transition period.
     */
    @serialize()
    public transitionPeriod = 1;

    /**
     * Gets or sets the flash color.
     */
    @serialize()
    public flashColor = new Color4(0.635294, 0, 1, 1);

    /**
     * Gets or sets the trim color.
     */
    @serialize()
    public trimColor = new Color4(0.113725, 0, 1, 1);

    /**
     * Gets or sets if the transion is inverted.
     */
    @serialize()
    public invert = true;

    // "Hololens Edge Fade"
    //define ENABLEFADE true;

    /**
     * Gets or sets a value corresponding to the width of the edge fade effect (Default 1.5).
     */
    @serialize()
    public fadeWidth = 1.5;

    // "Hide Faces"

    /**
     * Gets or sets the whether to hide the faces of the mesh.
     */
    @serialize()
    public hideXYFaces = false;

    // "Debug"

    /**
     * Gets or sets whether the frame of the model is visible.
     */
    @serialize()
    public showFrame = true;


    // Global inputs

    /**
     * @hidden
     */
    @serialize()
    public useGlobalLeftIndex = 1.0;

    /**
     * @hidden
     */
    @serialize()
    public useGlobalRightIndex = 1.0;


    /**
     * Gets or sets the world-space position of the tip of the left index finger.
     */
    @serialize()
    public globalLeftIndexTipPosition = new Vector4(0.5, 0.0, -0.55, 1.0);

    /**
     *Gets or sets the world-space position of the tip of the right index finger.
     */
    @serialize()
    public globalRightIndexTipPosition = new Vector4(0.0, 0.0, 0.0, 1.0);


    /**
     * Gets or sets the near width.
     */
    @serialize()
    public globalLeftThumbTipPosition = new Vector4(0.5, 0.0, -0.55, 1.0);

    /**
     * Gets or sets the near width.
     */
    @serialize()
    public globalRightThumbTipPosition = new Vector4(0.0, 0.0, 0.0, 1.0);


    /**
     * Gets or sets the near width.
     */
    @serialize()
    public globalLeftIndexTipProximity = 0.0;

    /**
     * Gets or sets the near width.
     */
    @serialize()
    public globalRightIndexTipProximity = 0.0;

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
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        if (this.isFrozen) {
            if (subMesh.effect && subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new MRTKBoundingBoxMaterialDefines();
        }

        const defines = <MRTKBoundingBoxMaterialDefines>subMesh.materialDefines;
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
            const shaderName = "mrtkBoundingBox";
            const join = defines.toString();

            const uniforms = [
                "world", "worldView", "worldViewProjection", "view", "projection", "viewProjection", "cameraPosition"
                , "_Near_Width_", "_Far_Width_", "_Near_Distance_", "_Far_Distance_", "_Edge_Color_", "_Proximity_Max_Intensity_"
                , "_Proximity_Far_Radius_", "_Proximity_Near_Radius_", "_Blob_Enable_", "_Blob_Position_"
                , "_Blob_Intensity_", "_Blob_Near_Size_", "_Blob_Far_Size_", "_Blob_Near_Distance_", "_Blob_Far_Distance_"
                , "_Blob_Fade_Length_", "_Blob_Inner_Fade_", "_Blob_Pulse_", "_Blob_Fade_", "_Blob_Texture_"
                , "_Blob_Enable_2_", "_Blob_Position_2_", "_Blob_Near_Size_2_", "_Blob_Inner_Fade_2_", "_Blob_Pulse_2_"
                , "_Blob_Fade_2_", "_Center_", "_Transition_", "_Radius_", "_Fuzz_", "_Start_Time_", "_Transition_Period_"
                , "_Flash_Color_", "_Trim_Color_", "_Invert_", "_Fade_Width_", "_Hide_XY_Faces_", "_Show_Frame_"
                , "Use_Global_Left_Index", "Use_Global_Right_Index", "Global_Left_Index_Tip_Position", "Global_Right_Index_Tip_Position"
                , "Global_Left_Thumb_Tip_Position", "Global_Right_Thumb_Tip_Position", "Global_Left_Index_Tip_Proximity", "Global_Right_Index_Tip_Proximity"
            ];
            const samplers: string[] = [];
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
        const defines = <MRTKBoundingBoxMaterialDefines>subMesh.materialDefines;
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

        // "Wireframe"
        this._activeEffect.setFloat("_Near_Width_", this.nearWidth);
        this._activeEffect.setFloat("_Far_Width_", this.farWidth);
        this._activeEffect.setFloat("_Near_Distance_", this.nearDistance);
        this._activeEffect.setFloat("_Far_Distance_", this.farDistance);
        this._activeEffect.setDirectColor4("_Edge_Color_", this.edgeColor);

        // "Proximity"
        this._activeEffect.setFloat("_Proximity_Max_Intensity_", this.proximityMaxIntensity);
        this._activeEffect.setFloat("_Proximity_Far_Radius_", this.proximityFarRadius);
        this._activeEffect.setFloat("_Proximity_Near_Radius_", this.proximityNearRadius);

        // "Blob"
        this._activeEffect.setFloat("_Blob_Enable_", this.blobEnable ? 1.0 : 0.0);
        this._activeEffect.setVector3("_Blob_Position_", this.blobPosition);
        this._activeEffect.setFloat("_Blob_Intensity_", this.blobIntensity);
        this._activeEffect.setFloat("_Blob_Near_Size_", this.blobNearSize);
        this._activeEffect.setFloat("_Blob_Far_Size_", this.blobFarSize);
        this._activeEffect.setFloat("_Blob_Near_Distance_", this.blobNearDistance);
        this._activeEffect.setFloat("_Blob_Far_Distance_", this.blobFarDistance);
        this._activeEffect.setFloat("_Blob_Fade_Length_", this.blobFadeLength);
        this._activeEffect.setFloat("_Blob_Inner_Fade_", this.blobInnerFade);
        this._activeEffect.setFloat("_Blob_Pulse_", this.blobPulse);
        this._activeEffect.setFloat("_Blob_Fade_", this.blobFade);

        // "Blob Texture"
        this._activeEffect.setTexture("_Blob_Texture_", new Texture("https://raw.githubusercontent.com/rgerd/TestAssets/master/PNG/blob1_linear.png", this.getScene()));

        // "Blob 2"
        this._activeEffect.setFloat("_Blob_Enable_2_", this.BlobEnable2 ? 1.0 : 0.0);
        this._activeEffect.setVector3("_Blob_Position_2_", this.blobPosition2);
        this._activeEffect.setFloat("_Blob_Near_Size_2_", this.blobNearSize2);
        this._activeEffect.setFloat("_Blob_Inner_Fade_2_", this.blobInnerFade2);
        this._activeEffect.setFloat("_Blob_Pulse_2_", this.blobPulse2);
        this._activeEffect.setFloat("_Blob_Fade_2_", this.blobFade2);

        // "Transition"
        //define ENABLE_TRANSITION false;
        this._activeEffect.setVector3("_Center_", this.center);
        this._activeEffect.setFloat("_Transition_", this.transition);
        this._activeEffect.setFloat("_Radius_", this.radius);
        this._activeEffect.setFloat("_Fuzz_", this.fuzz);
        this._activeEffect.setFloat("_Start_Time_", this.startTime);
        this._activeEffect.setFloat("_Transition_Period_", this.transitionPeriod);
        this._activeEffect.setDirectColor4("_Flash_Color_", this.flashColor);
        this._activeEffect.setDirectColor4("_Trim_Color_", this.trimColor);
        this._activeEffect.setFloat("_Invert_", this.invert ? 1.0 : 0.0);

        // "Hololens Edge Fade"
        //define ENABLE_FADE true;
        this._activeEffect.setFloat("_Fade_Width_", this.fadeWidth);

        // "Hide Faces"
        this._activeEffect.setFloat("_Hide_XY_Faces_", this.hideXYFaces ? 1.0 : 0.0);

        // "Debug"
        this._activeEffect.setFloat("_Show_Frame_", this.showFrame ? 1.0 : 0.0);


        // Global inputs
        this._activeEffect.setFloat("Use_Global_Left_Index", this.useGlobalLeftIndex);
        this._activeEffect.setFloat("Use_Global_Right_Index", this.useGlobalRightIndex);

        this._activeEffect.setVector4("Global_Left_Index_Tip_Position", this.globalLeftIndexTipPosition);
        this._activeEffect.setVector4("Global_Right_Index_Tip_Position", this.globalRightIndexTipPosition);

        this._activeEffect.setVector4("Global_Left_Thumb_Tip_Position", this.globalLeftThumbTipPosition);
        this._activeEffect.setVector4("Global_Right_Thumb_Tip_Position", this.globalRightThumbTipPosition);

        this._activeEffect.setFloat("Global_Left_Index_Tip_Proximity", this.globalLeftIndexTipProximity);
        this._activeEffect.setFloat("Global_Right_Index_Tip_Proximity", this.globalRightIndexTipProximity);

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

    public clone(name: string): MRTKBoundingBoxMaterial {
        return SerializationHelper.Clone(() => new MRTKBoundingBoxMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.MRTKBoundingBoxMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "MRTKBoundingBoxMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): MRTKBoundingBoxMaterial {
        return SerializationHelper.Parse(() => new MRTKBoundingBoxMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GUI.MRTKBoundingBoxMaterial", MRTKBoundingBoxMaterial);
