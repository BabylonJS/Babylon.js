import { Nullable } from "../../types";
import { SerializationHelper } from "../../Misc/decorators";
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
    public ENABLE_TRANSITION = false

    constructor() {
        super();
        this._needNormals = true;
        this._needUVs = true;
        this.rebuild();
    }
}

export class MRTKBoundingBoxMaterial extends PushMaterial {
    // TODO: Allow access through member variables

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
        this._activeEffect.setFloat("_Near_Width_", 0.01);
        this._activeEffect.setFloat("_Far_Width_", 0.05);
        this._activeEffect.setFloat("_Near_Distance_", 1);
        this._activeEffect.setFloat("_Far_Distance_", 5);
        this._activeEffect.setDirectColor4("_Edge_Color_", new Color4(0.27451, 0.27451, 0.27451, 1));

        // "Proximity"
        this._activeEffect.setFloat("_Proximity_Max_Intensity_", 0.59);
        this._activeEffect.setFloat("_Proximity_Far_Radius_", 0.51);
        this._activeEffect.setFloat("_Proximity_Near_Radius_", 0.01);

        // "Blob"
        this._activeEffect.setFloat("_Blob_Enable_", true ? 1.0 : 0.0);
        this._activeEffect.setVector3("_Blob_Position_", new Vector3(0.2, 0, 0));
        this._activeEffect.setFloat("_Blob_Intensity_", 0.2);
        this._activeEffect.setFloat("_Blob_Near_Size_", 0.03);
        this._activeEffect.setFloat("_Blob_Far_Size_", 0.06);
        this._activeEffect.setFloat("_Blob_Near_Distance_", 0.02);
        this._activeEffect.setFloat("_Blob_Far_Distance_", 0.08);
        this._activeEffect.setFloat("_Blob_Fade_Length_", 0.08);
        this._activeEffect.setFloat("_Blob_Inner_Fade_", 0.1);
        this._activeEffect.setFloat("_Blob_Pulse_", 0);
        this._activeEffect.setFloat("_Blob_Fade_", 1);

        // "Blob Texture"
        this._activeEffect.setTexture("_Blob_Texture_", new Texture("https://raw.githubusercontent.com/rgerd/TestAssets/master/PNG/blob1_linear.png", this.getScene()));

        // "Blob 2"
        this._activeEffect.setFloat("_Blob_Enable_2_", false ? 1.0 : 0.0);
        this._activeEffect.setVector3("_Blob_Position_2_", new Vector3(-1, 0, 0));
        this._activeEffect.setFloat("_Blob_Near_Size_2_", 0.02);
        this._activeEffect.setFloat("_Blob_Inner_Fade_2_", 0.1);
        this._activeEffect.setFloat("_Blob_Pulse_2_", 0);
        this._activeEffect.setFloat("_Blob_Fade_2_", 1);

        // "Transition"
        //define ENABLE_TRANSITION false;
        this._activeEffect.setVector3("_Center_", new Vector3(0.5, 0.3, 0.2));
        this._activeEffect.setFloat("_Transition_", 0.92);
        this._activeEffect.setFloat("_Radius_", 4);
        this._activeEffect.setFloat("_Fuzz_", 0.92);
        this._activeEffect.setFloat("_Start_Time_", 0);
        this._activeEffect.setFloat("_Transition_Period_", 1);
        this._activeEffect.setDirectColor4("_Flash_Color_", new Color4(0.635294, 0, 1, 1));
        this._activeEffect.setDirectColor4("_Trim_Color_", new Color4(0.113725, 0, 1, 1));
        this._activeEffect.setFloat("_Invert_", true ? 1.0 : 0.0);

        // "Hololens Edge Fade"
        //define ENABLE_FADE true;
        this._activeEffect.setFloat("_Fade_Width_", 1.5);

        // "Hide Faces"
        this._activeEffect.setFloat("_Hide_XY_Faces_", false ? 1.0 : 0.0);

        // "Debug"
        this._activeEffect.setFloat("_Show_Frame_", true ? 1.0 : 0.0);


        // Global inputs
        this._activeEffect.setFloat("Use_Global_Left_Index", 1.0);
        this._activeEffect.setFloat("Use_Global_Right_Index", 1.0);

        this._activeEffect.setVector4("Global_Left_Index_Tip_Position", new Vector4(0.5, 0.0, -0.55, 1.0));
        this._activeEffect.setVector4("Global_Right_Index_Tip_Position", new Vector4(0.0, 0.0, 0.0, 1.0));

        this._activeEffect.setVector4("Global_Left_Thumb_Tip_Position", new Vector4(0.5, 0.0, -0.55, 1.0));
        this._activeEffect.setVector4("Global_Right_Thumb_Tip_Position", new Vector4(0.0, 0.0, 0.0, 1.0));

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
