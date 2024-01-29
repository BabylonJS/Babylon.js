/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { SerializationHelper, serialize } from "core/Misc/decorators";
import type { Matrix } from "core/Maths/math.vector";
import { Vector4 } from "core/Maths/math.vector";
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

import "./shaders/mrdlBackplate.fragment";
import "./shaders/mrdlBackplate.vertex";

/** @internal */
class MRDLBackplateMaterialDefines extends MaterialDefines {
    /*
        "IRIDESCENCE_ENABLE", "SMOOTH_EDGES"
    */
    public IRIDESCENCE_ENABLE = true;
    public SMOOTH_EDGES = true;

    constructor() {
        super();
        this._needNormals = true;
        this.rebuild();
    }
}

/**
 * Class used to render backplate material with MRDL
 */
export class MRDLBackplateMaterial extends PushMaterial {
    /**
     * URL pointing to the texture used to define the coloring for the Iridescent Map effect.
     */
    public static IRIDESCENT_MAP_TEXTURE_URL = "https://assets.babylonjs.com/meshes/MRTK/MRDL/mrtk-mrdl-backplate-iridescence.png";
    private _iridescentMapTexture: Texture;

    /**
     * Gets or sets the corner radius on the backplate. If this value is changed, update the lineWidth to match.
     */
    @serialize()
    public radius = 0.3;

    /**
     * Gets or sets the line width of the backplate.
     */
    @serialize()
    public lineWidth = 0.003;

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
    public baseColor = new Color4(0, 0, 0, 1);

    /**
     * Gets or sets the line color of the backplate.
     */
    @serialize()
    public lineColor = new Color4(0.2, 0.262745, 0.4, 1);

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

    /** @internal */
    public _rate = 0;

    /**
     * Gets or sets the color of the highlights on the backplate line.
     */
    @serialize()
    public highlightColor = new Color4(0.239216, 0.435294, 0.827451, 1);

    /**
     * Gets or sets the width of the highlights on the backplate line.
     */
    @serialize()
    public highlightWidth = 0;

    /** @internal */
    public _highlightTransform = new Vector4(1, 1, 0, 0);

    /** @internal */
    public _highlight = 1;

    /**
     * Gets or sets the intensity of the iridescence effect.
     */
    @serialize()
    public iridescenceIntensity = 0.45;

    /**
     * Gets or sets the intensity of the iridescence effect on the backplate edges.
     */
    @serialize()
    public iridescenceEdgeIntensity = 1;

    /**
     * Gets or sets the Tint of the iridescence effect on the backplate.
     */
    @serialize()
    public iridescenceTint = new Color4(1, 1, 1, 1);

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
     * Gets or sets the gradient color effect on the backplate.
     */
    @serialize()
    public gradientColor = new Color4(0.74902, 0.74902, 0.74902, 1);

    /**
     * Gets or sets the top left gradient color effect on the backplate.
     */
    @serialize()
    public topLeftGradientColor = new Color4(0.00784314, 0.294118, 0.580392, 1);

    /**
     * Gets or sets the top right gradient color effect on the backplate.
     */
    @serialize()
    public topRightGradientColor = new Color4(0.305882, 0, 1, 1);

    /**
     * Gets or sets the bottom left gradient color effect on the backplate.
     */
    @serialize()
    public bottomLeftGradientColor = new Color4(0.133333, 0.258824, 0.992157, 1);

    /**
     * Gets or sets the bottom right gradient color effect on the backplate.
     */
    @serialize()
    public bottomRightGradientColor = new Color4(0.176471, 0.176471, 0.619608, 1);

    /**
     * Gets or sets the edge width of the backplate.
     */
    @serialize()
    public edgeWidth = 0.5;

    /**
     * Gets or sets the edge width of the backplate.
     */
    @serialize()
    public edgePower = 1;

    /**
     * Gets or sets the edge width of the backplate.
     */
    @serialize()
    public edgeLineGradientBlend = 0.5;

    constructor(name: string, scene?: Scene) {
        super(name, scene);
        this.alphaMode = Constants.ALPHA_DISABLE;
        this.backFaceCulling = false;

        this._iridescentMapTexture = new Texture(MRDLBackplateMaterial.IRIDESCENT_MAP_TEXTURE_URL, this.getScene(), true, false, Texture.NEAREST_SAMPLINGMODE);
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
            subMesh.materialDefines = new MRDLBackplateMaterialDefines();
        }

        const defines = <MRDLBackplateMaterialDefines>subMesh.materialDefines;
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
            const shaderName = "mrdlBackplate";
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
                "_Rate_",
                "_Highlight_Color_",
                "_Highlight_Width_",
                "_Highlight_Transform_",
                "_Highlight_",
                "_Iridescence_Intensity_",
                "_Iridescence_Edge_Intensity_",
                "_Iridescence_Tint_",
                "_Iridescent_Map_",
                "_Angle_",
                "_Reflected_",
                "_Frequency_",
                "_Vertical_Offset_",
                "_Gradient_Color_",
                "_Top_Left_",
                "_Top_Right_",
                "_Bottom_Left_",
                "_Bottom_Right_",
                "_Edge_Width_",
                "_Edge_Power_",
                "_Line_Gradient_Blend_",
                "_Fade_Out_",
            ];
            const samplers: string[] = ["_Iridescent_Map_"];
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
        const defines = <MRDLBackplateMaterialDefines>subMesh.materialDefines;
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
        this._activeEffect.setFloat("_Line_Width_", this.lineWidth);
        this._activeEffect.setFloat("_Absolute_Sizes_", this.absoluteSizes ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Filter_Width_", this._filterWidth);
        this._activeEffect.setDirectColor4("_Base_Color_", this.baseColor);
        this._activeEffect.setDirectColor4("_Line_Color_", this.lineColor);

        // "Radii Multipliers"
        this._activeEffect.setFloat("_Radius_Top_Left_", this.radiusTopLeft);
        this._activeEffect.setFloat("_Radius_Top_Right_", this.radiusTopRight);
        this._activeEffect.setFloat("_Radius_Bottom_Left_", this.radiusBottomLeft);
        this._activeEffect.setFloat("_Radius_Bottom_Right_", this.radiusBottomRight);

        // "Line Highlight"
        this._activeEffect.setFloat("_Rate_", this._rate);
        this._activeEffect.setDirectColor4("_Highlight_Color_", this.highlightColor);
        this._activeEffect.setFloat("_Highlight_Width_", this.highlightWidth);
        this._activeEffect.setVector4("_Highlight_Transform_", this._highlightTransform);
        this._activeEffect.setFloat("_Highlight_", this._highlight);

        // "Iridescence"
        //define IRIDESCENCE_ENABLE true;
        this._activeEffect.setFloat("_Iridescence_Intensity_", this.iridescenceIntensity);
        this._activeEffect.setFloat("_Iridescence_Edge_Intensity_", this.iridescenceEdgeIntensity);
        this._activeEffect.setDirectColor4("_Iridescence_Tint_", this.iridescenceTint);
        this._activeEffect.setTexture("_Iridescent_Map_", this._iridescentMapTexture);
        this._activeEffect.setFloat("_Angle_", this._angle);
        this._activeEffect.setFloat("_Reflected_", this._reflected ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Frequency_", this._frequency);
        this._activeEffect.setFloat("_Vertical_Offset_", this._verticalOffset);

        // "Gradient"
        this._activeEffect.setDirectColor4("_Gradient_Color_", this.gradientColor);
        this._activeEffect.setDirectColor4("_Top_Left_", this.topLeftGradientColor);
        this._activeEffect.setDirectColor4("_Top_Right_", this.topRightGradientColor);
        this._activeEffect.setDirectColor4("_Bottom_Left_", this.bottomLeftGradientColor);
        this._activeEffect.setDirectColor4("_Bottom_Right_", this.bottomRightGradientColor);
        //define EDGE_ONLY false;
        this._activeEffect.setFloat("_Edge_Width_", this.edgeWidth);
        this._activeEffect.setFloat("_Edge_Power_", this.edgePower);
        this._activeEffect.setFloat("_Line_Gradient_Blend_", this.edgeLineGradientBlend);

        // "Fade"
        this._activeEffect.setFloat("_Fade_Out_", this.fadeOut);

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

    public clone(name: string): MRDLBackplateMaterial {
        return SerializationHelper.Clone(() => new MRDLBackplateMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.MRDLBackplateMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "MRDLBackplateMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): MRDLBackplateMaterial {
        return SerializationHelper.Parse(() => new MRDLBackplateMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GUI.MRDLBackplateMaterial", MRDLBackplateMaterial);
