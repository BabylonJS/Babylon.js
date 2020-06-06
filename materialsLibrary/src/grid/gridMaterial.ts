import { serializeAsTexture, serialize, expandToProperty, serializeAsColor3, SerializationHelper } from "babylonjs/Misc/decorators";
import { Matrix, Vector4, Vector3 } from "babylonjs/Maths/math.vector";
import { Color3 } from "babylonjs/Maths/math.color";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { MaterialDefines } from "babylonjs/Materials/materialDefines";
import { MaterialHelper } from "babylonjs/Materials/materialHelper";
import { PushMaterial } from "babylonjs/Materials/pushMaterial";
import { MaterialFlags } from "babylonjs/Materials/materialFlags";
import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

import "./grid.fragment";
import "./grid.vertex";

class GridMaterialDefines extends MaterialDefines {
    public OPACITY = false;
    public TRANSPARENT = false;
    public FOG = false;
    public PREMULTIPLYALPHA = false;
    public UV1 = false;
    public UV2 = false;
    public INSTANCES = false;
    public THIN_INSTANCES = false;

    constructor() {
        super();
        this.rebuild();
    }
}

/**
 * The grid materials allows you to wrap any shape with a grid.
 * Colors are customizable.
 */
export class GridMaterial extends PushMaterial {

    /**
     * Main color of the grid (e.g. between lines)
     */
    @serializeAsColor3()
    public mainColor = Color3.Black();

    /**
     * Color of the grid lines.
     */
    @serializeAsColor3()
    public lineColor = Color3.Teal();

    /**
     * The scale of the grid compared to unit.
     */
    @serialize()
    public gridRatio = 1.0;

    /**
     * Allows setting an offset for the grid lines.
     */
    @serializeAsColor3()
    public gridOffset = Vector3.Zero();

    /**
     * The frequency of thicker lines.
     */
    @serialize()
    public majorUnitFrequency = 10;

    /**
     * The visibility of minor units in the grid.
     */
    @serialize()
    public minorUnitVisibility = 0.33;

    /**
     * The grid opacity outside of the lines.
     */
    @serialize()
    public opacity = 1.0;

    /**
     * Determine RBG output is premultiplied by alpha value.
     */
    @serialize()
    public preMultiplyAlpha = false;

    @serializeAsTexture("opacityTexture")
    private _opacityTexture: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public opacityTexture: BaseTexture;

    private _gridControl: Vector4 = new Vector4(this.gridRatio, this.majorUnitFrequency, this.minorUnitVisibility, this.opacity);

    /**
     * constructor
     * @param name The name given to the material in order to identify it afterwards.
     * @param scene The scene the material is used in.
     */
    constructor(name: string, scene: Scene) {
        super(name, scene);
    }

    /**
     * Returns wehter or not the grid requires alpha blending.
     */
    public needAlphaBlending(): boolean {
        return this.opacity < 1.0 || this._opacityTexture && this._opacityTexture.isReady();
    }

    public needAlphaBlendingForMesh(mesh: AbstractMesh): boolean {
        return this.needAlphaBlending();
    }

    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        if (this.isFrozen) {
            if (subMesh.effect && subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh._materialDefines) {
            subMesh._materialDefines = new GridMaterialDefines();
        }

        var defines = <GridMaterialDefines>subMesh._materialDefines;
        var scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        if (defines.TRANSPARENT !== (this.opacity < 1.0)) {
            defines.TRANSPARENT = !defines.TRANSPARENT;
            defines.markAsUnprocessed();
        }

        if (defines.PREMULTIPLYALPHA != this.preMultiplyAlpha) {
            defines.PREMULTIPLYALPHA = !defines.PREMULTIPLYALPHA;
            defines.markAsUnprocessed();
        }

        // Textures
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            if (scene.texturesEnabled) {
                if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                    if (!this._opacityTexture.isReady()) {
                        return false;
                    } else {
                        defines._needUVs = true;
                        defines.OPACITY = true;
                    }
                }
            }
        }

        MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, false, this.fogEnabled, false, defines);

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, scene.getEngine(), defines, !!useInstances);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            // Attributes
            MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, false);
            var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }
            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }

            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            // Defines
            var join = defines.toString();
            subMesh.setEffect(scene.getEngine().createEffect("grid",
                attribs,
                ["projection", "mainColor", "lineColor", "gridControl", "gridOffset", "vFogInfos", "vFogColor", "world", "view",
                    "opacityMatrix", "vOpacityInfos"],
                ["opacitySampler"],
                join,
                undefined,
                this.onCompiled,
                this.onError), defines);
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

        var defines = <GridMaterialDefines>subMesh._materialDefines;
        if (!defines) {
            return;
        }

        var effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;

        // Matrices
        if (!defines.INSTANCES || defines.THIN_INSTANCE) {
            this.bindOnlyWorldMatrix(world);
        }
        this._activeEffect.setMatrix("view", scene.getViewMatrix());
        this._activeEffect.setMatrix("projection", scene.getProjectionMatrix());

        // Uniforms
        if (this._mustRebind(scene, effect)) {
            this._activeEffect.setColor3("mainColor", this.mainColor);
            this._activeEffect.setColor3("lineColor", this.lineColor);

            this._activeEffect.setVector3("gridOffset", this.gridOffset);

            this._gridControl.x = this.gridRatio;
            this._gridControl.y = Math.round(this.majorUnitFrequency);
            this._gridControl.z = this.minorUnitVisibility;
            this._gridControl.w = this.opacity;
            this._activeEffect.setVector4("gridControl", this._gridControl);

            if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                this._activeEffect.setTexture("opacitySampler", this._opacityTexture);
                this._activeEffect.setFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                this._activeEffect.setMatrix("opacityMatrix", this._opacityTexture.getTextureMatrix());
            }
        }
        // Fog
        MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

        this._afterBind(mesh, this._activeEffect);
    }

    /**
     * Dispose the material and its associated resources.
     * @param forceDisposeEffect will also dispose the used effect when true
     */
    public dispose(forceDisposeEffect?: boolean): void {
        super.dispose(forceDisposeEffect);
    }

    public clone(name: string): GridMaterial {
        return SerializationHelper.Clone(() => new GridMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.GridMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "GridMaterial";
    }

    public static Parse(source: any, scene: Scene, rootUrl: string): GridMaterial {
        return SerializationHelper.Parse(() => new GridMaterial(source.name, scene), source, scene, rootUrl);
    }
}

_TypeStore.RegisteredTypes["BABYLON.GridMaterial"] = GridMaterial;