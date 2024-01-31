/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { serializeAsColor4, serializeAsVector3, serialize, SerializationHelper } from "core/Misc/decorators";
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
import { Color3, Color4 } from "core/Maths/math.color";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { Constants } from "core/Engines/constants";

import "./shaders/fluentButton.fragment";
import "./shaders/fluentButton.vertex";

/** @internal */
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
 * Class used to render square buttons with fluent design
 * @since 5.0.0
 */
export class FluentButtonMaterial extends PushMaterial {
    /**
     * URL pointing to the texture used to define the coloring for the fluent blob effect.
     */
    public static BLOB_TEXTURE_URL = "https://assets.babylonjs.com/meshes/MRTK/mrtk-fluent-button-blob.png";

    /**
     * Gets or sets the width of the glowing edge, relative to the scale of the button.
     * (Default is 4% of the height).
     */
    @serialize()
    public edgeWidth = 0.04;

    /**
     * Gets or sets the color of the glowing edge.
     */
    @serializeAsColor4()
    public edgeColor = new Color4(0.592157, 0.592157, 0.592157, 1.0);

    /**
     * Gets or sets the maximum intensity of the proximity light.
     */
    @serialize()
    public proximityMaxIntensity = 0.45;

    /**
     * Gets or sets the maximum distance for the proximity light (Default is 16mm).
     */
    @serialize()
    public proximityFarDistance = 0.16;

    /**
     * Gets or sets the radius of the proximity light when near to the surface.
     */
    @serialize()
    public proximityNearRadius = 1.5;

    /**
     * Gets or sets the anisotropy of the proximity light.
     */
    @serialize()
    public proximityAnisotropy = 1;

    /**
     * Gets or sets the amount of fuzzing in the selection focus.
     */
    @serialize()
    public selectionFuzz = 0.5;

    /**
     * Gets or sets an override value to display the button as selected.
     */
    @serialize()
    public selected = 0;

    /**
     * Gets or sets a value to manually fade the blob size.
     */
    @serialize()
    public selectionFade = 0;

    /**
     * Gets or sets a value to manually shrink the blob size as it fades (see selectionFade).
     */
    @serialize()
    public selectionFadeSize = 0.3;

    /**
     * Gets or sets the distance from the button the cursor should be for the button
     * to appear selected (Default is 8cm).
     */
    @serialize()
    public selectedDistance = 0.08;

    /**
     * Gets or sets the fall-off distance for the selection fade (Default is 8cm).
     */
    @serialize()
    public selectedFadeLength = 0.08;

    /**
     * Gets or sets the intensity of the luminous blob (Ranges 0-1, default is 0.5).
     */
    @serialize()
    public blobIntensity = 0.5;

    /**
     * The size of the blob when the pointer is at the blobFarDistance (Default is 5cm).
     */
    @serialize()
    public blobFarSize = 0.05;

    /**
     * The distance at which the pointer is considered near. See [left|right]BlobNearSize. (Default is 0cm).
     */
    @serialize()
    public blobNearDistance = 0;

    /**
     * The distance at which the pointer is considered far. See [left|right]BlobFarSize. (Default is 8cm).
     */
    @serialize()
    public blobFarDistance = 0.08;

    /**
     * The distance over which the blob intensity fades from full to none (Default is 8cm).
     */
    @serialize()
    public blobFadeLength = 0.08;

    /**
     * Gets or sets whether the blob corresponding to the left index finger is enabled.
     */
    @serialize()
    public leftBlobEnable = true;

    /**
     * Gets or sets the size of the left blob when the left pointer is considered near. See blobNearDistance. (Default is 2.5cm).
     */
    @serialize()
    public leftBlobNearSize = 0.025;

    /**
     * Gets or sets the progress of the pulse animation on the left blob (Ranges 0-1).
     */
    @serialize()
    public leftBlobPulse = 0;

    /**
     * Gets or sets the fade factor on the left blob.
     */
    @serialize()
    public leftBlobFade = 1;

    /**
     * Gets or sets the inner fade on the left blob;
     */
    @serialize()
    public leftBlobInnerFade = 0.01;

    /**
     * Gets or sets whether the blob corresponding to the right index finger is enabled.
     */
    @serialize()
    public rightBlobEnable = true;

    /**
     * Gets or sets the size of the right blob when the right pointer is considered near. See blobNearDistance. (Default is 2.5cm).
     */
    @serialize()
    public rightBlobNearSize = 0.025;

    /**
     * Gets or sets the progress of the pulse animation on the right blob (Ranges 0-1).
     */
    @serialize()
    public rightBlobPulse = 0;

    /**
     * Gets or sets the fade factor on the right blob.
     */
    @serialize()
    public rightBlobFade = 1;

    /**
     * Gets or sets the inner fade on the right blob;
     */
    @serialize()
    public rightBlobInnerFade = 0.01;

    /**
     * Gets or sets the direction of the active face before the world transform is applied.
     * This should almost always be set to -z.
     */
    @serializeAsVector3()
    public activeFaceDir = new Vector3(0, 0, -1);

    /**
     * Gets or sets the button's up direction before the world transform is applied.
     * This should almost always be set to +y.
     */
    @serializeAsVector3()
    public activeFaceUp = new Vector3(0, 1, 0);

    /**
     * Gets or sets whether the edge fade effect is enabled.
     */
    @serialize()
    public enableFade = true;

    /**
     * Gets or sets a value corresponding to the width of the edge fade effect (Default 1.5).
     */
    @serialize()
    public fadeWidth = 1.5;

    /**
     * Gets or sets whether the active face is smoothly interpolated.
     */
    @serialize()
    public smoothActiveFace = true;

    /**
     * Gets or sets whether the frame of the fluent button model is visible.
     * This is usually only enabled for debugging purposes.
     */
    @serialize()
    public showFrame = false;

    /**
     * Gets or sets whether the blob color texture is used for the proximity
     * light effect. This is usually only disabled for debugging purposes.
     */
    @serialize()
    public useBlobTexture = true;

    /**
     * Gets or sets the world-space position of the tip of the left index finger.
     */
    @serializeAsVector3()
    public globalLeftIndexTipPosition = Vector3.Zero();

    /**
     * Gets or sets the world-space position of the tip of the right index finger.
     */
    @serializeAsVector3()
    public globalRightIndexTipPosition = Vector3.Zero();

    private _blobTexture: Texture;

    constructor(name: string, scene?: Scene) {
        super(name, scene);
        this.alphaMode = Constants.ALPHA_ADD;
        this.disableDepthWrite = true;
        this.backFaceCulling = false;

        this._blobTexture = new Texture(FluentButtonMaterial.BLOB_TEXTURE_URL, this.getScene(), true, false, Texture.NEAREST_SAMPLINGMODE);
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
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh): boolean {
        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new FluentButtonMaterialDefines();
        }

        const defines = <FluentButtonMaterialDefines>subMesh.materialDefines;
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
            const shaderName = "fluentButton";
            const join = defines.toString();

            const uniforms = [
                "world",
                "viewProjection",
                "cameraPosition",

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
                "Global_Right_Index_Tip_Proximity",
            ];
            const samplers: string[] = ["_Blob_Texture_"];
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
        const scene = this.getScene();

        const defines = <FluentButtonMaterialDefines>subMesh.materialDefines;
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
        this._activeEffect.setFloat("_Blob_Enable_", this.leftBlobEnable ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Blob_Intensity_", this.blobIntensity);
        this._activeEffect.setFloat("_Blob_Near_Size_", this.leftBlobNearSize);
        this._activeEffect.setFloat("_Blob_Far_Size_", this.blobFarSize);
        this._activeEffect.setFloat("_Blob_Near_Distance_", this.blobNearDistance);
        this._activeEffect.setFloat("_Blob_Far_Distance_", this.blobFarDistance);
        this._activeEffect.setFloat("_Blob_Fade_Length_", this.blobFadeLength);
        this._activeEffect.setFloat("_Blob_Inner_Fade_", this.leftBlobInnerFade);
        this._activeEffect.setFloat("_Blob_Pulse_", this.leftBlobPulse);
        this._activeEffect.setFloat("_Blob_Fade_", this.leftBlobFade);

        // "Blob 2"
        this._activeEffect.setFloat("_Blob_Enable_2_", this.rightBlobEnable ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Blob_Near_Size_2_", this.rightBlobNearSize);
        this._activeEffect.setFloat("_Blob_Inner_Fade_2_", this.rightBlobInnerFade);
        this._activeEffect.setFloat("_Blob_Pulse_2_", this.rightBlobPulse);
        this._activeEffect.setFloat("_Blob_Fade_2_", this.rightBlobFade);

        // "Active Face"
        this._activeEffect.setVector3("_Active_Face_Dir_", this.activeFaceDir);
        this._activeEffect.setVector3("_Active_Face_Up_", this.activeFaceUp);

        // "Hololens Edge Fade"
        //define _Enable_Fade_ true;
        this._activeEffect.setFloat("_Fade_Width_", this.fadeWidth);
        this._activeEffect.setFloat("_Smooth_Active_Face_", this.smoothActiveFace ? 1.0 : 0.0);

        // "Debug"
        this._activeEffect.setFloat("_Show_Frame_", this.showFrame ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Use_Blob_Texture_", this.useBlobTexture ? 1.0 : 0.0);

        // Global inputs
        this._activeEffect.setFloat("Use_Global_Left_Index", 1.0);
        this._activeEffect.setFloat("Use_Global_Right_Index", 1.0);

        this._activeEffect.setVector4(
            "Global_Left_Index_Tip_Position",
            new Vector4(this.globalLeftIndexTipPosition.x, this.globalLeftIndexTipPosition.y, this.globalLeftIndexTipPosition.z, 1.0)
        );
        this._activeEffect.setVector4(
            "Global_Right_Index_Tip_Position",
            new Vector4(this.globalRightIndexTipPosition.x, this.globalRightIndexTipPosition.y, this.globalRightIndexTipPosition.z, 1.0)
        );

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

    public clone(name: string): FluentButtonMaterial {
        return SerializationHelper.Clone(() => new FluentButtonMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = super.serialize();
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

RegisterClass("BABYLON.GUI.FluentButtonMaterial", FluentButtonMaterial);
