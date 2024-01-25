/* eslint-disable @typescript-eslint/naming-convention */
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
import { Vector3 } from "core/Maths/math.vector";
import { VertexBuffer } from "core/Buffers/buffer";
import { Texture } from "core/Materials/Textures/texture";

import "./shaders/mrdlFrontplate.fragment";
import "./shaders/mrdlFrontplate.vertex";

/** @hidden */
class MRDLFrontplateMaterialDefines extends MaterialDefines {
    /**
     * Sets default value for "SMOOTH_EDGES"
     */
    public SMOOTH_EDGES = true;

    constructor() {
        super();
        this._needNormals = true;
        this._needUVs = true;
        this.rebuild();
    }
}

export class MRDLFrontplateMaterial extends PushMaterial {
    /**
     * Gets or sets the corner radius on the frontplate. If this value is changed, update the lineWidth to match.
     */
    @serialize()
    public radius = 0.12;

    /**
     * Gets or sets the line width of the frontplate.
     */
    @serialize()
    public lineWidth = 0.01;

    /**
     * Gets or sets whether the scale is relative to the frontplate height.
     */
    @serialize()
    public relativeToHeight = false;

    /** @hidden */
    public _filterWidth = 1.0;

    /**
     * Gets or sets the edge color of the frontplate.
     */
    @serialize()
    public edgeColor: Color4 = new Color4(0.53, 0.53, 0.53, 1);

    /**
     * Gets or sets whether to enable blob effects on the frontplate.
     */
    @serialize()
    public blobEnable = true;

    /**
     * Gets or sets the blob position on the frontplate.
     */
    @serialize()
    public blobPosition: Vector3 = new Vector3(100, 100, 100);

    /**
     * Gets or sets the blob intensity of the frontplate.
     */
    @serialize()
    public blobIntensity = 0.5;

    /**
     * Gets or sets the blob near size of the frontplate.
     */
    @serialize()
    public blobNearSize = 0.032;

    /**
     * Gets or sets the blob far size of the frontplate.
     */
    @serialize()
    public blobFarSize = 0.048;

    /**
     * Gets or sets the blob near distance of the frontplate.
     */
    @serialize()
    public blobNearDistance = 0.008;

    /**
     * Gets or sets the blob far distance of the frontplate.
     */
    @serialize()
    public blobFarDistance = 0.064;

    /**
     * Gets or sets the blob fade length of the frontplate.
     */
    @serialize()
    public blobFadeLength = 0.04;

    /**
     * Gets or sets the blob inner fade of the frontplate.
     */
    @serialize()
    public blobInnerFade = 0.01;

    /**
     * Gets or sets the blob pulse of the frontplate.
     */
    @serialize()
    public blobPulse = 0.0;

    /**
     * Gets or sets the blob fade effect on the frontplate.
     */
    @serialize()
    public blobFade = 1.0;

    /**
     * Gets or sets the maximum size of the blob pulse on the frontplate.
     */
    @serialize()
    public blobPulseMaxSize = 0.05;

    /**
     * Gets or sets whether to enable extra blob effects of the frontplate.
     */
    @serialize()
    public blobEnable2 = true;

    /**
     * Gets or sets blob2 position of the frontplate.
     */
    @serialize()
    public blobPosition2: Vector3 = new Vector3(10, 10.1, -0.6);

    /**
     * Gets or sets the blob2 near size of the frontplate.
     */
    @serialize()
    public blobNearSize2 = 0.008;

    /**
     * Gets or sets the blob2 inner fade of the frontplate.
     */
    @serialize()
    public blobInnerFade2 = 0.1;

    /**
     * Gets or sets the blob2 pulse of the frontplate.
     */
    @serialize()
    public blobPulse2 = 0.0;

    /**
     * Gets or sets the blob2 fade effect on the frontplate.
     */
    @serialize()
    public blobFade2 = 1.0;

    /**
     * Gets or sets the gaze intensity of the frontplate.
     */
    @serialize()
    public gazeIntensity = 0.8;

    /**
     * Gets or sets the gaze focus of the frontplate.
     */
    @serialize()
    public gazeFocus = 0.0;

    /**
     * Gets or sets the selection fuzz of the frontplate.
     */
    @serialize()
    public selectionFuzz = 0.5;

    /**
     * Gets or sets the fade intensity of the frontplate.
     */
    @serialize()
    public selected = 1.0;

    /**
     * Gets or sets the selection fade intensity of the frontplate.
     */
    @serialize()
    public selectionFade = 0.2;

    /**
     * Gets or sets the selection fade size of the frontplate.
     */
    @serialize()
    public selectionFadeSize = 0.0;

    /**
     * Gets or sets the selected distance of the frontplate.
     */
    @serialize()
    public selectedDistance = 0.08;

    /**
     * Gets or sets the selected fade length of the frontplate.
     */
    @serialize()
    public selectedFadeLength = 0.08;

    /**
     * Gets or sets the proximity maximum intensity of the frontplate.
     */
    @serialize()
    public proximityMaxIntensity = 0.45;

    /**
     * Gets or sets the proximity far distance of the frontplate.
     */
    @serialize()
    public proximityFarDistance = 0.16;

    /**
     * Gets or sets the proximity near radius of the frontplate.
     */
    @serialize()
    public proximityNearRadius = 0.016;

    /**
     * Gets or sets the proximity anisotropy of the frontplate.
     */
    @serialize()
    public proximityAnisotropy = 1.0;

    /**
     * Gets or sets whether to use global left index on the frontplate.
     */
    @serialize()
    public useGlobalLeftIndex = true;

    /**
     * Gets or sets  whether to use global right index of the frontplate.
     */
    @serialize()
    public useGlobalRightIndex = true;

    /**
     * URL pointing to the texture used to define the coloring for the BLOB.
     */
    public static BLOB_TEXTURE_URL = "";

    /**
     * Gets or sets the opacity of the frontplate (0.0 - 1.0).
     */
    public fadeOut = 1.0;

    private _blobTexture: Texture;

    constructor(name: string, scene: Scene) {
        super(name, scene);
        this.alphaMode = Constants.ALPHA_ADD;
        this.disableDepthWrite = true;
        this.backFaceCulling = false;
        this._blobTexture = new Texture(MRDLFrontplateMaterial.BLOB_TEXTURE_URL, scene, true, false, Texture.NEAREST_SAMPLINGMODE);
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
            subMesh.materialDefines = new MRDLFrontplateMaterialDefines();
        }

        const defines = <MRDLFrontplateMaterialDefines>subMesh.materialDefines;
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
            const shaderName = "mrdlFrontplate";
            const join = defines.toString();

            const uniforms = [
                "world",
                "worldView",
                "worldViewProjection",
                "view",
                "projection",
                "viewProjection",
                "cameraPosition",
                "_Radius_",
                "_Line_Width_",
                "_Relative_To_Height_",
                "_Filter_Width_",
                "_Edge_Color_",
                "_Fade_Out_",
                "_Smooth_Edges_",
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
                "_Blob_Pulse_Max_Size_",
                "_Blob_Enable_2_",
                "_Blob_Position_2_",
                "_Blob_Near_Size_2_",
                "_Blob_Inner_Fade_2_",
                "_Blob_Pulse_2_",
                "_Blob_Fade_2_",
                "_Gaze_Intensity_",
                "_Gaze_Focus_",
                "_Blob_Texture_",
                "_Selection_Fuzz_",
                "_Selected_",
                "_Selection_Fade_",
                "_Selection_Fade_Size_",
                "_Selected_Distance_",
                "_Selected_Fade_Length_",
                "_Proximity_Max_Intensity_",
                "_Proximity_Far_Distance_",
                "_Proximity_Near_Radius_",
                "_Proximity_Anisotropy_",
                "Global_Left_Index_Tip_Position",
                "Global_Right_Index_Tip_Position",
                "_Use_Global_Left_Index_",
                "_Use_Global_Right_Index_",
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

        const defines = <MRDLFrontplateMaterialDefines>subMesh.materialDefines;
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

        // "Round Rect"
        this._activeEffect.setFloat("_Radius_", this.radius);
        this._activeEffect.setFloat("_Line_Width_", this.lineWidth);
        this._activeEffect.setFloat("_Relative_To_Height_", this.relativeToHeight ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Filter_Width_", this._filterWidth);
        this._activeEffect.setDirectColor4("_Edge_Color_", this.edgeColor);

        // "Fade"
        this._activeEffect.setFloat("_Fade_Out_", this.fadeOut);

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
        this._activeEffect.setFloat("_Blob_Pulse_Max_Size_", this.blobPulseMaxSize);

        // "Blob 2"
        this._activeEffect.setFloat("_Blob_Enable_2_", this.blobEnable2 ? 1.0 : 0.0);
        this._activeEffect.setVector3("_Blob_Position_2_", this.blobPosition2);
        this._activeEffect.setFloat("_Blob_Near_Size_2_", this.blobNearSize2);
        this._activeEffect.setFloat("_Blob_Inner_Fade_2_", this.blobInnerFade2);
        this._activeEffect.setFloat("_Blob_Pulse_2_", this.blobPulse2);
        this._activeEffect.setFloat("_Blob_Fade_2_", this.blobFade2);

        // "Gaze"
        this._activeEffect.setFloat("_Gaze_Intensity_", this.gazeIntensity);
        this._activeEffect.setFloat("_Gaze_Focus_", this.gazeFocus);

        // "Blob Texture"
        this._activeEffect.setTexture("_Blob_Texture_", this._blobTexture);

        // "Selection"
        this._activeEffect.setFloat("_Selection_Fuzz_", this.selectionFuzz);
        this._activeEffect.setFloat("_Selected_", this.selected);
        this._activeEffect.setFloat("_Selection_Fade_", this.selectionFade);
        this._activeEffect.setFloat("_Selection_Fade_Size_", this.selectionFadeSize);
        this._activeEffect.setFloat("_Selected_Distance_", this.selectedDistance);
        this._activeEffect.setFloat("_Selected_Fade_Length_", this.selectedFadeLength);

        // "Proximity"
        this._activeEffect.setFloat("_Proximity_Max_Intensity_", this.proximityMaxIntensity);
        this._activeEffect.setFloat("_Proximity_Far_Distance_", this.proximityFarDistance);
        this._activeEffect.setFloat("_Proximity_Near_Radius_", this.proximityNearRadius);
        this._activeEffect.setFloat("_Proximity_Anisotropy_", this.proximityAnisotropy);

        // "Global"
        this._activeEffect.setFloat("_Use_Global_Left_Index_", this.useGlobalLeftIndex ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Use_Global_Right_Index_", this.useGlobalRightIndex ? 1.0 : 0.0);

        // "Antialiasing"
        //define SMOOTH_EDGES true;

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

    public clone(name: string): MRDLFrontplateMaterial {
        return SerializationHelper.Clone(() => new MRDLFrontplateMaterial(name, this.getScene()), this);
    }

    public serialize(): unknown {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.MRDLFrontplateMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "MRDLFrontplateMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): MRDLFrontplateMaterial {
        return SerializationHelper.Parse(() => new MRDLFrontplateMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GUI.MRDLFrontplateMaterial", MRDLFrontplateMaterial);
