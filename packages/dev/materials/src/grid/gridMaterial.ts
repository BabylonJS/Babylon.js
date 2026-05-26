/* eslint-disable @typescript-eslint/naming-convention */
import { serializeAsTexture, serialize, expandToProperty, serializeAsColor3, serializeAsVector3 } from "core/Misc/decorators";
import { SerializationHelper } from "core/Misc/decorators.serialization";
import { type Matrix, Vector4, Vector2, Vector3 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { type Nullable } from "core/types";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { MaterialDefines } from "core/Materials/materialDefines";
import { PushMaterial } from "core/Materials/pushMaterial";
import { MaterialFlags } from "core/Materials/materialFlags";
import { VertexBuffer } from "core/Buffers/buffer";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type SubMesh } from "core/Meshes/subMesh";
import { type Mesh } from "core/Meshes/mesh";
import { type Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

import {
    BindFogParameters,
    BindLogDepth,
    PrepareAttributesForInstances,
    PrepareDefinesForAttributes,
    PrepareDefinesForFrameBoundValues,
    PrepareDefinesForMisc,
} from "core/Materials/materialHelper.functions";
import { AddClipPlaneUniforms, BindClipPlane } from "core/Materials/clipPlaneMaterialHelper";

/**
 * Antialiasing mode for GridMaterial grid lines.
 */
export enum GridMaterialAntialiasMode {
    /** No antialiasing — hard pixel edges */
    None = 0,
    /** Cosine-smoothed edges (original behavior) */
    Cosine = 1,
    /** Box-filter integral — higher quality, required for ORIGIN_MARKER */
    BoxFilter = 2,
}

class GridMaterialDefines extends MaterialDefines {
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public OPACITY = false;
    public ANTIALIAS_COSINE = false;
    public ANTIALIAS_BOX = false;
    public TRANSPARENT = false;
    public FOG = false;
    public PREMULTIPLYALPHA = false;
    public MAX_LINE = false;
    public UV1 = false;
    public UV2 = false;
    public INSTANCES = false;
    public THIN_INSTANCES = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public SKIPFINALCOLORCLAMP = false;
    public LOGARITHMICDEPTH = false;
    public MULTI_SCALE = false;
    public HORIZON_FADE = false;
    public BELOW_LINE_COLOR = false;
    public ORIGIN_MARKER = false;

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
    @serializeAsVector3()
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
     * Antialiasing mode for grid lines. Defaults to Cosine (original behavior).
     * @deprecated Use antialiasMode instead.
     */
    public get antialias(): boolean {
        return this.antialiasMode !== GridMaterialAntialiasMode.None;
    }
    public set antialias(value: boolean) {
        this.antialiasMode = value ? GridMaterialAntialiasMode.Cosine : GridMaterialAntialiasMode.None;
    }

    /**
     * Antialiasing mode for grid lines. Defaults to Cosine (original behavior).
     */
    @serialize()
    public antialiasMode: GridMaterialAntialiasMode = GridMaterialAntialiasMode.Cosine;

    /**
     * Color of grid lines when the camera is below the surface.
     * When set, lineColor acts as the above-surface color.
     */
    @serializeAsColor3()
    public belowLineColor: Nullable<Color3> = null;

    /**
     * Enable multi-scale (10-octave) grid LOD.
     */
    @serialize()
    public useMultiScale: boolean = false;

    /**
     * World-unit spacing of the finest octave. Default 0.001.
     */
    @serialize()
    public minGridSpacing: number = 0.001;

    /**
     * Number of logarithmic octaves rendered (1–16). Default 10.
     */
    @serialize()
    public gridOctaves: number = 10;

    /**
     * Enable camera-distance-aware horizon (grazing-angle) fade.
     */
    @serialize()
    public useHorizonFade: boolean = false;

    /**
     * Render an ultra-fine crosshair at the world origin (requires BoxFilter AA).
     */
    @serialize()
    public useOriginMarker: boolean = false;

    /**
     * When true, only grid lines are visible — non-grid pixels are discarded.
     * Also enables a depth pre-pass so grid lines correctly occlude translucent objects (e.g. Gaussian splats).
     * This is independent of the opacity property.
     */
    @serialize()
    public get linesOnly(): boolean {
        return this._linesOnly;
    }
    public set linesOnly(value: boolean) {
        if (this._linesOnly === value) {
            return;
        }
        this._linesOnly = value;
        this.needDepthPrePass = value;
        this._markAllSubMeshesAsTexturesDirty();
    }
    private _linesOnly = false;

    /**
     * Scales grid line width. Values > 1 produce thicker lines. Default 1.0.
     */
    @serialize()
    public gridThicknessModifier: number = 1.0;

    /**
     * Determine RBG output is premultiplied by alpha value.
     */
    @serialize()
    public preMultiplyAlpha = false;

    /**
     * Determines if the max line value will be used instead of the sum wherever grid lines intersect.
     */
    @serialize()
    public useMaxLine = false;

    @serializeAsTexture("opacityTexture")
    private _opacityTexture: BaseTexture;
    /**
     * Texture to define opacity of the grid
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public opacityTexture: BaseTexture;

    private _gridControl: Vector4 = new Vector4(this.gridRatio, this.majorUnitFrequency, this.minorUnitVisibility, this.opacity);

    /**
     * constructor
     * @param name The name given to the material in order to identify it afterwards.
     * @param scene The scene the material is used in.
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name: string, scene?: Scene, forceGLSL = false) {
        super(name, scene, undefined, forceGLSL);
    }

    private _shadersLoaded = false;

    /**
     * @returns whether or not the grid requires alpha blending.
     */
    public override needAlphaBlending(): boolean {
        return this.opacity < 1.0 || this.linesOnly || (this._opacityTexture && this._opacityTexture.isReady());
    }

    public override needAlphaBlendingForMesh(mesh: AbstractMesh): boolean {
        return mesh.visibility < 1.0 || this.needAlphaBlending();
    }

    public override isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new GridMaterialDefines();
        }

        const defines = <GridMaterialDefines>subMesh.materialDefines;
        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        if (defines.TRANSPARENT !== this.linesOnly) {
            defines.TRANSPARENT = this.linesOnly;
            defines.markAsUnprocessed();
        }

        if (defines.PREMULTIPLYALPHA != this.preMultiplyAlpha) {
            defines.PREMULTIPLYALPHA = !defines.PREMULTIPLYALPHA;
            defines.markAsUnprocessed();
        }

        if (defines.MAX_LINE !== this.useMaxLine) {
            defines.MAX_LINE = !defines.MAX_LINE;
            defines.markAsUnprocessed();
        }

        const wantsCosinAA = this.antialiasMode === GridMaterialAntialiasMode.Cosine;
        const wantsBoxAA = this.antialiasMode === GridMaterialAntialiasMode.BoxFilter;
        if (defines.ANTIALIAS_COSINE !== wantsCosinAA || defines.ANTIALIAS_BOX !== wantsBoxAA) {
            defines.ANTIALIAS_COSINE = wantsCosinAA;
            defines.ANTIALIAS_BOX = wantsBoxAA;
            defines.markAsUnprocessed();
        }

        if (defines.MULTI_SCALE !== this.useMultiScale) {
            defines.MULTI_SCALE = this.useMultiScale;
            defines.markAsUnprocessed();
        }

        if (defines.HORIZON_FADE !== this.useHorizonFade) {
            defines.HORIZON_FADE = this.useHorizonFade;
            defines.markAsUnprocessed();
        }

        const wantsBelowColor = this.belowLineColor !== null;
        if (defines.BELOW_LINE_COLOR !== wantsBelowColor) {
            defines.BELOW_LINE_COLOR = wantsBelowColor;
            defines.markAsUnprocessed();
        }

        if (defines.ORIGIN_MARKER !== this.useOriginMarker) {
            defines.ORIGIN_MARKER = this.useOriginMarker;
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

        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, false, this.fogEnabled, false, defines, undefined, undefined, undefined, this._isVertexOutputInvariant);

        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, scene.getEngine(), this, defines, !!useInstances);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            // Attributes
            PrepareDefinesForAttributes(mesh, defines, false, false);
            const attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }
            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }

            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;

            PrepareAttributesForInstances(attribs, defines);

            const uniforms = [
                "projection",
                "mainColor",
                "lineColor",
                "gridControl",
                "gridOffset",
                "vFogInfos",
                "vFogColor",
                "world",
                "view",
                "opacityMatrix",
                "vOpacityInfos",
                "visibility",
                "logarithmicDepthConstant",
                "cameraPosition",
                "cameraDirection",
                "viewportSize",
                "belowLineColor",
                "gridOctaves",
                "minGridSpacing",
                "gridThicknessModifier",
            ];
            // Defines
            const join = defines.toString();
            AddClipPlaneUniforms(uniforms);
            subMesh.setEffect(
                scene.getEngine().createEffect(
                    "grid",
                    {
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: ["Scene"],
                        samplers: ["opacitySampler"],
                        defines: join,
                        fallbacks: null,
                        onCompiled: this.onCompiled,
                        onError: this.onError,
                        shaderLanguage: this._shaderLanguage,
                        extraInitializationsAsync: this._shadersLoaded
                            ? undefined
                            : async () => {
                                  if (this.shaderLanguage === ShaderLanguage.WGSL) {
                                      await Promise.all([import("./wgsl/grid.vertex"), import("./wgsl/grid.fragment")]);
                                  } else {
                                      await Promise.all([import("./grid.vertex"), import("./grid.fragment")]);
                                  }

                                  this._shadersLoaded = true;
                              },
                    },
                    scene.getEngine()
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
        drawWrapper._wasPreviouslyUsingInstances = !!useInstances;

        return true;
    }

    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const scene = this.getScene();

        const defines = <GridMaterialDefines>subMesh.materialDefines;
        if (!defines) {
            return;
        }

        const effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;

        this._activeEffect.setFloat("visibility", mesh.visibility);

        // Matrices
        if (!defines.INSTANCES || defines.THIN_INSTANCE) {
            this.bindOnlyWorldMatrix(world);
        }
        this.bindView(effect);
        this.bindViewProjection(effect);

        // Uniforms
        if (this._mustRebind(scene, effect, subMesh)) {
            this._activeEffect.setColor3("mainColor", this.mainColor);
            this._activeEffect.setColor3("lineColor", this.lineColor);

            this._activeEffect.setVector3("gridOffset", this.gridOffset);

            this._gridControl.x = this.gridRatio;
            this._gridControl.y = Math.round(this.majorUnitFrequency);
            this._gridControl.z = this.minorUnitVisibility;
            this._gridControl.w = this.opacity;
            this._activeEffect.setVector4("gridControl", this._gridControl);
            this._activeEffect.setFloat("gridThicknessModifier", this.gridThicknessModifier);

            if (defines.BELOW_LINE_COLOR && this.belowLineColor) {
                this._activeEffect.setColor3("belowLineColor", this.belowLineColor);
            }

            if (defines.MULTI_SCALE) {
                this._activeEffect.setFloat("minGridSpacing", this.minGridSpacing);
                this._activeEffect.setInt("gridOctaves", Math.max(1, Math.min(16, Math.round(this.gridOctaves))));
            }

            if (this._opacityTexture && MaterialFlags.OpacityTextureEnabled) {
                this._activeEffect.setTexture("opacitySampler", this._opacityTexture);
                this._activeEffect.setFloat2("vOpacityInfos", this._opacityTexture.coordinatesIndex, this._opacityTexture.level);
                this._activeEffect.setMatrix("opacityMatrix", this._opacityTexture.getTextureMatrix());
            }

            // Clip plane
            BindClipPlane(effect, this, scene);
            // Log. depth
            if (this._useLogarithmicDepth) {
                BindLogDepth(defines, effect, scene);
            }
        }
        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);

        // Camera uniforms — must be updated every frame
        if (defines.HORIZON_FADE || defines.BELOW_LINE_COLOR) {
            const cam = scene.activeCamera;
            if (cam) {
                this._activeEffect.setVector3("cameraPosition", cam.position);
                this._activeEffect.setVector3("cameraDirection", cam.getForwardRay().direction);
                const engine = scene.getEngine();
                this._activeEffect.setVector2("viewportSize", new Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
            }
        }

        this._afterBind(mesh, this._activeEffect, subMesh);
    }

    /**
     * Dispose the material and its associated resources.
     * @param forceDisposeEffect will also dispose the used effect when true
     */
    public override dispose(forceDisposeEffect?: boolean): void {
        super.dispose(forceDisposeEffect);
    }

    public override clone(name: string): GridMaterial {
        return SerializationHelper.Clone(() => new GridMaterial(name, this.getScene()), this);
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.GridMaterial";
        return serializationObject;
    }

    public override getClassName(): string {
        return "GridMaterial";
    }

    public static override Parse(source: any, scene: Scene, rootUrl: string): GridMaterial {
        return SerializationHelper.Parse(() => new GridMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GridMaterial", GridMaterial);
