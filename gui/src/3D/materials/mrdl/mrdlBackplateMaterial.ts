import { Nullable } from "babylonjs/types";
import { SerializationHelper } from "babylonjs/Misc/decorators";
import { Matrix, Vector4 } from "babylonjs/Maths/math.vector";
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

import "./shaders/mrdlBackplate.fragment";
import "./shaders/mrdlBackplate.vertex";

/** @hidden */
class MRDLBackplateMaterialDefines extends MaterialDefines {
    /*
        "IRIDESCENCE_ENABLE", "SMOOTH_EDGES"
    */
    public IRIDESCENCE_ENABLED = true;
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
            subMesh.materialDefines = new MRDLBackplateMaterialDefines();
        }

        const defines = <MRDLBackplateMaterialDefines>subMesh._materialDefines;
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
                "world", "viewProjection", "cameraPosition"
                , "_Radius_", "_Line_Width_", "_Absolute_Sizes_", "_Filter_Width_", "_Base_Color_", "_Line_Color_"
                , "_Radius_Top_Left_", "_Radius_Top_Right_", "_Radius_Bottom_Left_", "_Radius_Bottom_Right_"
                , "_Rate_", "_Highlight_Color_", "_Highlight_Width_", "_Highlight_Transform_", "_Highlight_"
                , "_Iridescence_Intensity_", "_Iridescence_Edge_Intensity_", "_Iridescence_Tint_", "_Iridescent_Map_"
                , "_Angle_", "_Reflected_", "_Frequency_", "_Vertical_Offset_", "_Gradient_Color_", "_Top_Left_"
                , "_Top_Right_", "_Bottom_Left_", "_Bottom_Right_", "_Edge_Width_", "_Edge_Power_", "_Line_Gradient_Blend_"
                , "_Fade_Out_"
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
        const defines = <MRDLBackplateMaterialDefines>subMesh._materialDefines;
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
        this._activeEffect.setFloat("_Line_Width_", 0.001);
        this._activeEffect.setFloat("_Absolute_Sizes_", false ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Filter_Width_", 1);
        this._activeEffect.setDirectColor4("_Base_Color_", new Color4(0, 0, 0, 1));
        this._activeEffect.setDirectColor4("_Line_Color_", new Color4(0.2, 0.262745, 0.4, 1));

        // "Radii Multipliers"
        this._activeEffect.setFloat("_Radius_Top_Left_", 1);
        this._activeEffect.setFloat("_Radius_Top_Right_", 1.0);
        this._activeEffect.setFloat("_Radius_Bottom_Left_", 1.0);
        this._activeEffect.setFloat("_Radius_Bottom_Right_", 1.0);

        // "Line Highlight"
        this._activeEffect.setFloat("_Rate_", 0);
        this._activeEffect.setDirectColor4("_Highlight_Color_", new Color4(0.239216, 0.435294, 0.827451, 1));
        this._activeEffect.setFloat("_Highlight_Width_", 0);
        this._activeEffect.setVector4("_Highlight_Transform_", new Vector4(1, 1, 0, 0));
        this._activeEffect.setFloat("_Highlight_", 1);

        // "Iridescence"
        //define IRIDESCENCE_ENABLE true;
        this._activeEffect.setFloat("_Iridescence_Intensity_", 0.45);
        this._activeEffect.setFloat("_Iridescence_Edge_Intensity_", 1);
        this._activeEffect.setDirectColor4("_Iridescence_Tint_", new Color4(1, 1, 1, 1));
        this._activeEffect.setTexture("_Iridescent_Map_", new Texture("https://github.com/rgerd/TestAssets/blob/master/PNG/BackplateIridescence.png", this.getScene()));
        this._activeEffect.setFloat("_Angle_", -45);
        this._activeEffect.setFloat("_Reflected_", true ? 1.0 : 0.0);
        this._activeEffect.setFloat("_Frequency_", .96);
        this._activeEffect.setFloat("_Vertical_Offset_", 0);

        // "Gradient"
        this._activeEffect.setDirectColor4("_Gradient_Color_", new Color4(0.74902, 0.74902, 0.74902, 1));
        this._activeEffect.setDirectColor4("_Top_Left_", new Color4(0.00784314, 0.294118, 0.580392, 1));
        this._activeEffect.setDirectColor4("_Top_Right_", new Color4(0.305882, 0, 1, 1));
        this._activeEffect.setDirectColor4("_Bottom_Left_", new Color4(0.133333, 0.258824, 0.992157, 1));
        this._activeEffect.setDirectColor4("_Bottom_Right_", new Color4(0.176471, 0.176471, 0.619608, 1));
        //define EDGE_ONLY false;
        this._activeEffect.setFloat("_Edge_Width_", 0.5);
        this._activeEffect.setFloat("_Edge_Power_", 1);
        this._activeEffect.setFloat("_Line_Gradient_Blend_", 0.5);

        // "Fade"
        this._activeEffect.setFloat("_Fade_Out_", 1);

        // "Antialiasing"
        //define SMOOTH_EDGES true;

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

    public clone(name: string): MRDLBackplateMaterial {
        return SerializationHelper.Clone(() => new MRDLBackplateMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
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

_TypeStore.RegisteredTypes["BABYLON.GUI.MRDLBackplateMaterial"] = MRDLBackplateMaterial;
