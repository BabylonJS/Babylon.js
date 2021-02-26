import { Nullable } from "babylonjs/types";
import { serializeAsColor4, serializeAsVector3, serialize, SerializationHelper } from "babylonjs/Misc/decorators";
import { Matrix, Vector3, Vector4 } from "babylonjs/Maths/math.vector";
import { IAnimatable } from "babylonjs/Animations/animatable.interface";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { MaterialDefines } from "babylonjs/Materials/materialDefines";
import { MaterialHelper } from "babylonjs/Materials/materialHelper";
import { IEffectCreationOptions } from "babylonjs/Materials/effect";
import { PushMaterial } from "babylonjs/Materials/pushMaterial";
import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from "babylonjs/Misc/typeStore";
import { Color3, Color4 } from "babylonjs/Maths/math.color";
import { EffectFallbacks } from "babylonjs/Materials/effectFallbacks";
import { Constants } from "babylonjs/Engines/constants";

import "./shaders/fluentButton.fragment";
import "./shaders/fluentButton.vertex";

/** @hidden */
class FluentButtonMaterialDefines extends MaterialDefines {
    public RELATIVE_WIDTH = true;
    public ENABLE_FADE = true;

    constructor() {
        super();
        this._needNormals = true;
        this._needUVs = true;
        this.rebuild();
    }
}

/**
 * Class used to render square buttons with fluent desgin
 */
export class FluentButtonMaterial extends PushMaterial {
    public static BLOB_TEXTURE_URL = "https://assets.babylonjs.com/meshes/MRTK/mrtk-fluent-button-blob.png";

    // "Wireframe"
    @serialize()
    public edgeWidth = 0.04;

    @serializeAsColor4()
    public edgeColor = new Color4(0.592157, 0.592157, 0.592157, 1.0);

    // "Proximity"
    @serialize()
    public proximityMaxIntensity = 0.45;

    @serialize()
    public proximityFarDistance = 0.16;

    @serialize()
    public proximityNearRadius = 1.5;

    @serialize()
    public proximityAnisotropy = 1;

    // "Selection"
    @serialize()
    public selectionFuzz = 0.5;

    @serialize()
    public selected = 0;

    @serialize()
    public selectionFade = 0;

    @serialize()
    public selectionFadeSize = 0.3;

    @serialize()
    public selectedDistance = 0.08;

    @serialize()
    public selectedFadeLength = 0.08;

    // "Blob"
    @serialize()
    public blobEnable = true;

    @serializeAsVector3()
    public blobPosition = new Vector3(0.5, 0.0, -0.55);

    @serialize()
    public blobIntensity = 0.5;

    @serialize()
    public blobNearSize = 0.025;

    @serialize()
    public blobFarSize = 0.05;

    @serialize()
    public blobNearDistance = 0;

    @serialize()
    public blobFarDistance = 0.08;

    @serialize()
    public blobFadeLength = 0.08;

    @serialize()
    public blobInnerFade = 0.01;

    @serialize()
    public blobPulse = 0;

    @serialize()
    public blobFade = 1;

    // "Blob 2"
    @serialize()
    public blobEnable2 = true;

    @serializeAsVector3()
    public blobPosition2 = new Vector3(10, 10.1, -0.6);

    @serialize()
    public blobNearSize2 = 0.025;

    @serialize()
    public blobInnerFade2 = 0.1;

    @serialize()
    public blobPulse2 = 0;

    @serialize()
    public blobFade2 = 1;

    // "Active Face"
    @serializeAsVector3()
    public activeFaceDir = new Vector3(0, 0, -1);

    @serializeAsVector3()
    public activeFaceUp = new Vector3(0, 1, 0);

    // "Hololens Edge Fade"
    @serialize()
    public enableFade = true;

    @serialize()
    public fadeWidth = 1.5;

    @serialize()
    public smoothActiveFace = true ? 1.0 : 0.0;

    // "Debug"
    @serialize()
    public showFrame = false;

    @serialize()
    public useBlobTexture = true;

    // Global inputs
    @serialize()
    public useGlobalLeftIndex = true;

    @serialize()
    public useGlobalRightIndex = true;

    @serializeAsVector3()
    public globalLeftIndexTipPosition = Vector3.Zero();

    @serializeAsVector3()
    public globalRightIndexTipPosition = Vector3.Zero();

    @serializeAsVector3()
    public globalLeftThumbTipPosition = Vector3.Zero();

    @serializeAsVector3()
    public globalRightThumbTipPosition = Vector3.Zero();

    @serialize()
    public globalLeftIndexTipProximity = 0.0;

    @serialize()
    public globalRightIndexTipProximity = 0.0;

    private _blobTexture: Texture;

    constructor(name: string, scene: Scene) {
        super(name, scene);
        this.alphaMode = Constants.ALPHA_ADD;
        this.disableDepthWrite = true;
        this.backFaceCulling = false;

        this._blobTexture = new Texture(FluentButtonMaterial.BLOB_TEXTURE_URL, scene, true, false, Texture.NEAREST_SAMPLINGMODE);
    }

    public needAlphaBlending(): boolean {
        return true;
    }

    public needAlphaTesting(): boolean {
        return true;
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
            subMesh._materialDefines = new FluentButtonMaterialDefines();
        }

        var defines = <FluentButtonMaterialDefines>subMesh._materialDefines;
        var scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        var engine = scene.getEngine();

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, false);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();

            scene.resetCachedMaterial();

            // Fallbacks
            var fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks);

            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;

            //Attributes
            var attribs = [VertexBuffer.PositionKind];

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
            var shaderName = "fluentButton";
            var join = defines.toString();

            var uniforms = [
                "world", "viewProjection", "cameraPosition",

                "_Edge_Width_",
                "_Edge_Color_",
                "_Relative_Width_",
                "_Proximity_Max_Intensity_",
                "_Proximity_Far_Distance_",
                "_Proximity_Near_Radius_",
                "_Proximity_Anisotropy_",
                "_Selection_Fuzz_",
                "_Selected_",
                "_Selection_Fade_",
                "_Selection_Fade_Size_",
                "_Selected_Distance_",
                "_Selected_Fade_Length_",
                "_Blob_Enable_",
                "_Blob_Position_",
                "_Blob_Intensity_",
                "_Blob_Near_Size_",
                "_Blob_Far_Size_",
                "_Blob_Near_Distance_",
                "_Blob_Far_Distance_",
                "_Blob_Fade_Length_",
                "_Blob_Inner_Fade_",
                "_Blob_Pulse_",
                "_Blob_Fade_",
                "_Blob_Texture_",
                "_Blob_Enable_2_",
                "_Blob_Position_2_",
                "_Blob_Near_Size_2_",
                "_Blob_Inner_Fade_2_",
                "_Blob_Pulse_2_",
                "_Blob_Fade_2_",
                "_Active_Face_Dir_",
                "_Active_Face_Up_",
                "_Enable_Fade_",
                "_Fade_Width_",
                "_Smooth_Active_Face_",
                "_Show_Frame_",
                "_Use_Blob_Texture_",

                "Use_Global_Left_Index",
                "Use_Global_Right_Index",
                "Global_Left_Index_Tip_Position",
                "Global_Right_Index_Tip_Position",
                "Global_Left_Thumb_Tip_Position",
                "Global_Right_Thumb_Tip_Position",
                "Global_Left_Index_Tip_Proximity",
                "Global_Right_Index_Tip_Proximity"
            ];
            var samplers: string[] = ["_Blob_Texture_"];
            var uniformBuffers = new Array<string>();

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
        var scene = this.getScene();

        var defines = <FluentButtonMaterialDefines>subMesh._materialDefines;
        if (!defines) {
            return;
        }

        var effect = subMesh.effect;
        if (!effect) {
            return;
        }

        this._activeEffect = effect;

        // Matrices
        this.bindOnlyWorldMatrix(world);
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
        this._activeEffect.setVector3("cameraPosition", scene.activeCamera!.position);

        // "Blob Texture"
        this._activeEffect.setTexture("_Blob_Texture_", this._blobTexture);

        // "Wireframe"
        this._activeEffect.setFloat("_Edge_Width_", this.edgeWidth);
        this._activeEffect.setColor4("_Edge_Color_", new Color3(this.edgeColor.r, this.edgeColor.g, this.edgeColor.b), this.edgeColor.a);
        //define _Relative_Width_ true;

        // "Proximity"
        this._activeEffect.setFloat("_Proximity_Max_Intensity_", this.proximityMaxIntensity);
        this._activeEffect.setFloat("_Proximity_Far_Distance_", this.proximityFarDistance);
        this._activeEffect.setFloat("_Proximity_Near_Radius_", this.proximityNearRadius);
        this._activeEffect.setFloat("_Proximity_Anisotropy_", this.proximityAnisotropy);

        // "Selection"
        this._activeEffect.setFloat("_Selection_Fuzz_", this.selectionFuzz);
        this._activeEffect.setFloat("_Selected_", this.selected);
        this._activeEffect.setFloat("_Selection_Fade_", this.selectionFade);
        this._activeEffect.setFloat("_Selection_Fade_Size_", this.selectionFadeSize);
        this._activeEffect.setFloat("_Selected_Distance_", this.selectedDistance);
        this._activeEffect.setFloat("_Selected_Fade_Length_", this.selectedFadeLength);

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

        // "Blob 2"
        this._activeEffect.setFloat("_Blob_Enable_2_", this.blobEnable2 ? 1.0 : 0.0);
        this._activeEffect.setVector3("_Blob_Position_2_", this.blobPosition2);
        this._activeEffect.setFloat("_Blob_Near_Size_2_", this.blobNearSize2);
        this._activeEffect.setFloat("_Blob_Inner_Fade_2_", this.blobInnerFade2);
        this._activeEffect.setFloat("_Blob_Pulse_2_", this.blobPulse2);
        this._activeEffect.setFloat("_Blob_Fade_2_", this.blobFade2);

        // "Active Face"
        this._activeEffect.setVector3("_Active_Face_Dir_", this.activeFaceDir);
        this._activeEffect.setVector3("_Active_Face_Up_", this.activeFaceUp);

        // "Hololens Edge Fade"
        //define _Enable_Fade_ true;
        this._activeEffect.setFloat("_Fade_Width_", this.fadeWidth);
        this._activeEffect.setFloat("_Smooth_Active_Face_", this.smoothActiveFace);

        // "Debug"
        this._activeEffect.setFloat("_Show_Frame_", this.showFrame ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Use_Blob_Texture_", this.useBlobTexture ? 1.0 : 0.0);

        // Global inputs
        this._activeEffect.setFloat("Use_Global_Left_Index", this.useGlobalLeftIndex ? 1.0 : 0.0);
        this._activeEffect.setFloat("Use_Global_Right_Index", this.useGlobalRightIndex ? 1.0 : 0.0);

        this._activeEffect.setVector4("Global_Left_Index_Tip_Position",
            new Vector4(
                this.globalLeftIndexTipPosition.x,
                this.globalLeftIndexTipPosition.y,
                this.globalLeftIndexTipPosition.z,
                1.0));
        this._activeEffect.setVector4("Global_Right_Index_Tip_Position",
            new Vector4(
                this.globalRightIndexTipPosition.x,
                this.globalRightIndexTipPosition.y,
                this.globalRightIndexTipPosition.z,
                1.0));

        this._activeEffect.setFloat("Global_Left_Index_Tip_Proximity", this.globalLeftIndexTipProximity);
        this._activeEffect.setFloat("Global_Right_Index_Tip_Proximity", this.globalRightIndexTipProximity);

        this._afterBind(mesh, this._activeEffect);
    }

    public getAnimatables(): IAnimatable[] {
        return [];
    }

    public dispose(forceDisposeEffect?: boolean): void {
        super.dispose(forceDisposeEffect);
    }

    public clone(name: string): FluentButtonMaterial {
        return SerializationHelper.Clone(() => new FluentButtonMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.FluentButtonMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "FluentButtonMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): FluentButtonMaterial {
        return SerializationHelper.Parse(() => new FluentButtonMaterial(source.name, scene), source, scene, rootUrl);
    }
}

_TypeStore.RegisteredTypes["BABYLON.GUI.FluentButtonMaterial"] = FluentButtonMaterial;