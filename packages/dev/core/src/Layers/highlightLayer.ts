/* eslint-disable @typescript-eslint/no-unused-vars */
import { serialize, SerializationHelper } from "../Misc/decorators";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Scene } from "../scene";
import { Vector2 } from "../Maths/math.vector";
import { Engine } from "../Engines/engine";
import { VertexBuffer } from "../Buffers/buffer";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Mesh } from "../Meshes/mesh";
import type { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { PostProcessOptions } from "../PostProcesses/postProcess";
import { PostProcess } from "../PostProcesses/postProcess";
import { PassPostProcess } from "../PostProcesses/passPostProcess";
import { BlurPostProcess } from "../PostProcesses/blurPostProcess";
import { EffectLayer } from "./effectLayer";
import { AbstractScene } from "../abstractScene";
import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";
import { RegisterClass } from "../Misc/typeStore";
import { Color4, Color3 } from "../Maths/math.color";

import "../Shaders/glowMapMerge.fragment";
import "../Shaders/glowMapMerge.vertex";
import "../Shaders/glowBlurPostProcess.fragment";
import "../Layers/effectLayerSceneComponent";

declare module "../abstractScene" {
    export interface AbstractScene {
        /**
         * Return a the first highlight layer of the scene with a given name.
         * @param name The name of the highlight layer to look for.
         * @returns The highlight layer if found otherwise null.
         */
        getHighlightLayerByName(name: string): Nullable<HighlightLayer>;
    }
}

AbstractScene.prototype.getHighlightLayerByName = function (name: string): Nullable<HighlightLayer> {
    for (let index = 0; index < this.effectLayers?.length; index++) {
        if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === HighlightLayer.EffectName) {
            return (<any>this.effectLayers[index]) as HighlightLayer;
        }
    }

    return null;
};

/**
 * Special Glow Blur post process only blurring the alpha channel
 * It enforces keeping the most luminous color in the color channel.
 */
class GlowBlurPostProcess extends PostProcess {
    constructor(
        name: string,
        public direction: Vector2,
        public kernel: number,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode: number = Texture.BILINEAR_SAMPLINGMODE,
        engine?: Engine,
        reusable?: boolean
    ) {
        super(name, "glowBlurPostProcess", ["screenSize", "direction", "blurWidth"], null, options, camera, samplingMode, engine, reusable);

        this.onApplyObservable.add((effect: Effect) => {
            effect.setFloat2("screenSize", this.width, this.height);
            effect.setVector2("direction", this.direction);
            effect.setFloat("blurWidth", this.kernel);
        });
    }
}

/**
 * Highlight layer options. This helps customizing the behaviour
 * of the highlight layer.
 */
export interface IHighlightLayerOptions {
    /**
     * Multiplication factor apply to the canvas size to compute the render target size
     * used to generated the glowing objects (the smaller the faster). Default: 0.5
     */
    mainTextureRatio: number;

    /**
     * Enforces a fixed size texture to ensure resize independent blur. Default: undefined
     */
    mainTextureFixedSize?: number;

    /**
     * Multiplication factor apply to the main texture size in the first step of the blur to reduce the size
     * of the picture to blur (the smaller the faster). Default: 0.5
     */
    blurTextureSizeRatio: number;

    /**
     * How big in texel of the blur texture is the vertical blur. Default: 1
     */
    blurVerticalSize: number;

    /**
     * How big in texel of the blur texture is the horizontal blur. Default: 1
     */
    blurHorizontalSize: number;

    /**
     * Alpha blending mode used to apply the blur.  Default: ALPHA_COMBINE
     */
    alphaBlendingMode: number;

    /**
     * The camera attached to the layer. Default: null
     */
    camera: Nullable<Camera>;

    /**
     * Should we display highlight as a solid stroke? Default: false
     */
    isStroke?: boolean;

    /**
     * The rendering group to draw the layer in. Default: -1
     */
    renderingGroupId: number;

    /**
     * The type of the main texture. Default: TEXTURETYPE_UNSIGNED_INT
     */
    mainTextureType: number;
}

/**
 * Storage interface grouping all the information required for glowing a mesh.
 */
interface IHighlightLayerMesh {
    /**
     * The glowy mesh
     */
    mesh: Mesh;
    /**
     * The color of the glow
     */
    color: Color3;
    /**
     * The mesh render callback use to insert stencil information
     */
    observerHighlight: Nullable<Observer<Mesh>>;
    /**
     * The mesh render callback use to come to the default behavior
     */
    observerDefault: Nullable<Observer<Mesh>>;
    /**
     * If it exists, the emissive color of the material will be used to generate the glow.
     * Else it falls back to the current color.
     */
    glowEmissiveOnly: boolean;
}

/**
 * Storage interface grouping all the information required for an excluded mesh.
 */
interface IHighlightLayerExcludedMesh {
    /**
     * The glowy mesh
     */
    mesh: Mesh;
    /**
     * The mesh render callback use to prevent stencil use
     */
    beforeBind: Nullable<Observer<Mesh>>;
    /**
     * The mesh render callback use to restore previous stencil use
     */
    afterRender: Nullable<Observer<Mesh>>;
    /**
     * Current stencil state of the engine
     */
    stencilState: boolean;
}

/**
 * The highlight layer Helps adding a glow effect around a mesh.
 *
 * Once instantiated in a scene, simply use the addMesh or removeMesh method to add or remove
 * glowy meshes to your scene.
 *
 * !!! THIS REQUIRES AN ACTIVE STENCIL BUFFER ON THE CANVAS !!!
 */
export class HighlightLayer extends EffectLayer {
    /**
     * Effect Name of the highlight layer.
     */
    public static readonly EffectName = "HighlightLayer";

    /**
     * The neutral color used during the preparation of the glow effect.
     * This is black by default as the blend operation is a blend operation.
     */
    public static NeutralColor: Color4 = new Color4(0, 0, 0, 0);

    /**
     * Stencil value used for glowing meshes.
     */
    public static GlowingMeshStencilReference = 0x02;

    /**
     * Stencil value used for the other meshes in the scene.
     */
    public static NormalMeshStencilReference = 0x01;

    /**
     * Specifies whether or not the inner glow is ACTIVE in the layer.
     */
    @serialize()
    public innerGlow: boolean = true;

    /**
     * Specifies whether or not the outer glow is ACTIVE in the layer.
     */
    @serialize()
    public outerGlow: boolean = true;

    /**
     * Specifies the horizontal size of the blur.
     */
    public set blurHorizontalSize(value: number) {
        this._horizontalBlurPostprocess.kernel = value;
        this._options.blurHorizontalSize = value;
    }

    /**
     * Specifies the vertical size of the blur.
     */
    public set blurVerticalSize(value: number) {
        this._verticalBlurPostprocess.kernel = value;
        this._options.blurVerticalSize = value;
    }

    /**
     * Gets the horizontal size of the blur.
     */
    @serialize()
    public get blurHorizontalSize(): number {
        return this._horizontalBlurPostprocess.kernel;
    }

    /**
     * Gets the vertical size of the blur.
     */
    @serialize()
    public get blurVerticalSize(): number {
        return this._verticalBlurPostprocess.kernel;
    }

    /**
     * An event triggered when the highlight layer is being blurred.
     */
    public onBeforeBlurObservable = new Observable<HighlightLayer>();

    /**
     * An event triggered when the highlight layer has been blurred.
     */
    public onAfterBlurObservable = new Observable<HighlightLayer>();

    private _instanceGlowingMeshStencilReference = HighlightLayer.GlowingMeshStencilReference++;

    @serialize("options")
    private _options: IHighlightLayerOptions;
    private _downSamplePostprocess: PassPostProcess;
    private _horizontalBlurPostprocess: GlowBlurPostProcess;
    private _verticalBlurPostprocess: GlowBlurPostProcess;
    private _blurTexture: RenderTargetTexture;

    private _meshes: Nullable<{ [id: string]: Nullable<IHighlightLayerMesh> }> = {};
    private _excludedMeshes: Nullable<{ [id: string]: Nullable<IHighlightLayerExcludedMesh> }> = {};

    /**
     * Instantiates a new highlight Layer and references it to the scene..
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param options Sets of none mandatory options to use with the layer (see IHighlightLayerOptions for more information)
     */
    constructor(
        public name: string,
        scene?: Scene,
        options?: Partial<IHighlightLayerOptions>
    ) {
        super(name, scene);
        this.neutralColor = HighlightLayer.NeutralColor;

        // Warn on stencil
        if (!this._engine.isStencilEnable) {
            Logger.Warn("Rendering the Highlight Layer requires the stencil to be active on the canvas. var engine = new Engine(canvas, antialias, { stencil: true }");
        }

        // Adapt options
        this._options = {
            mainTextureRatio: 0.5,
            blurTextureSizeRatio: 0.5,
            blurHorizontalSize: 1.0,
            blurVerticalSize: 1.0,
            alphaBlendingMode: Constants.ALPHA_COMBINE,
            camera: null,
            renderingGroupId: -1,
            mainTextureType: Constants.TEXTURETYPE_UNSIGNED_INT,
            ...options,
        };

        // Initialize the layer
        this._init({
            alphaBlendingMode: this._options.alphaBlendingMode,
            camera: this._options.camera,
            mainTextureFixedSize: this._options.mainTextureFixedSize,
            mainTextureRatio: this._options.mainTextureRatio,
            renderingGroupId: this._options.renderingGroupId,
            mainTextureType: this._options.mainTextureType,
        });

        // Do not render as long as no meshes have been added
        this._shouldRender = false;
    }

    /**
     * Get the effect name of the layer.
     * @returns The effect name
     */
    public getEffectName(): string {
        return HighlightLayer.EffectName;
    }

    protected _numInternalDraws(): number {
        return 2; // we need two rendering, one for the inner glow and the other for the outer glow
    }

    /**
     * Create the merge effect. This is the shader use to blit the information back
     * to the main canvas at the end of the scene rendering.
     * @returns The effect created
     */
    protected _createMergeEffect(): Effect {
        // Effect
        return this._engine.createEffect("glowMapMerge", [VertexBuffer.PositionKind], ["offset"], ["textureSampler"], this._options.isStroke ? "#define STROKE \n" : undefined);
    }

    /**
     * Creates the render target textures and post processes used in the highlight layer.
     */
    protected _createTextureAndPostProcesses(): void {
        let blurTextureWidth = this._mainTextureDesiredSize.width * this._options.blurTextureSizeRatio;
        let blurTextureHeight = this._mainTextureDesiredSize.height * this._options.blurTextureSizeRatio;
        blurTextureWidth = this._engine.needPOTTextures ? Engine.GetExponentOfTwo(blurTextureWidth, this._maxSize) : blurTextureWidth;
        blurTextureHeight = this._engine.needPOTTextures ? Engine.GetExponentOfTwo(blurTextureHeight, this._maxSize) : blurTextureHeight;

        let textureType = 0;
        if (this._engine.getCaps().textureHalfFloatRender) {
            textureType = Constants.TEXTURETYPE_HALF_FLOAT;
        } else {
            textureType = Constants.TEXTURETYPE_UNSIGNED_INT;
        }

        this._blurTexture = new RenderTargetTexture(
            "HighlightLayerBlurRTT",
            {
                width: blurTextureWidth,
                height: blurTextureHeight,
            },
            this._scene,
            false,
            true,
            textureType
        );
        this._blurTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture.anisotropicFilteringLevel = 16;
        this._blurTexture.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);
        this._blurTexture.renderParticles = false;
        this._blurTexture.ignoreCameraViewport = true;

        this._textures = [this._blurTexture];

        if (this._options.alphaBlendingMode === Constants.ALPHA_COMBINE) {
            this._downSamplePostprocess = new PassPostProcess(
                "HighlightLayerPPP",
                this._options.blurTextureSizeRatio,
                null,
                Texture.BILINEAR_SAMPLINGMODE,
                this._scene.getEngine()
            );
            this._downSamplePostprocess.externalTextureSamplerBinding = true;
            this._downSamplePostprocess.onApplyObservable.add((effect) => {
                effect.setTexture("textureSampler", this._mainTexture);
            });

            this._horizontalBlurPostprocess = new GlowBlurPostProcess(
                "HighlightLayerHBP",
                new Vector2(1.0, 0),
                this._options.blurHorizontalSize,
                1,
                null,
                Texture.BILINEAR_SAMPLINGMODE,
                this._scene.getEngine()
            );
            this._horizontalBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
            });

            this._verticalBlurPostprocess = new GlowBlurPostProcess(
                "HighlightLayerVBP",
                new Vector2(0, 1.0),
                this._options.blurVerticalSize,
                1,
                null,
                Texture.BILINEAR_SAMPLINGMODE,
                this._scene.getEngine()
            );
            this._verticalBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
            });

            this._postProcesses = [this._downSamplePostprocess, this._horizontalBlurPostprocess, this._verticalBlurPostprocess];
        } else {
            this._horizontalBlurPostprocess = new BlurPostProcess(
                "HighlightLayerHBP",
                new Vector2(1.0, 0),
                this._options.blurHorizontalSize / 2,
                {
                    width: blurTextureWidth,
                    height: blurTextureHeight,
                },
                null,
                Texture.BILINEAR_SAMPLINGMODE,
                this._scene.getEngine(),
                false,
                textureType
            );
            this._horizontalBlurPostprocess.width = blurTextureWidth;
            this._horizontalBlurPostprocess.height = blurTextureHeight;
            this._horizontalBlurPostprocess.externalTextureSamplerBinding = true;
            this._horizontalBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setTexture("textureSampler", this._mainTexture);
            });

            this._verticalBlurPostprocess = new BlurPostProcess(
                "HighlightLayerVBP",
                new Vector2(0, 1.0),
                this._options.blurVerticalSize / 2,
                {
                    width: blurTextureWidth,
                    height: blurTextureHeight,
                },
                null,
                Texture.BILINEAR_SAMPLINGMODE,
                this._scene.getEngine(),
                false,
                textureType
            );

            this._postProcesses = [this._horizontalBlurPostprocess, this._verticalBlurPostprocess];
        }

        this._mainTexture.onAfterUnbindObservable.add(() => {
            this.onBeforeBlurObservable.notifyObservers(this);

            const internalTexture = this._blurTexture.renderTarget;
            if (internalTexture) {
                this._scene.postProcessManager.directRender(this._postProcesses, internalTexture, true);
                this._engine.unBindFramebuffer(internalTexture, true);
            }

            this.onAfterBlurObservable.notifyObservers(this);
        });

        // Prevent autoClear.
        this._postProcesses.map((pp) => {
            pp.autoClear = false;
        });
    }

    /**
     * @returns whether or not the layer needs stencil enabled during the mesh rendering.
     */
    public needStencil(): boolean {
        return true;
    }

    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @returns true if ready otherwise, false
     */
    public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        const material = subMesh.getMaterial();
        const mesh = subMesh.getRenderingMesh();

        if (!material || !mesh || !this._meshes) {
            return false;
        }

        let emissiveTexture: Nullable<Texture> = null;
        const highlightLayerMesh = this._meshes[mesh.uniqueId];

        if (highlightLayerMesh && highlightLayerMesh.glowEmissiveOnly && material) {
            emissiveTexture = (<any>material).emissiveTexture;
        }
        return super._isReady(subMesh, useInstances, emissiveTexture);
    }

    /**
     * Implementation specific of rendering the generating effect on the main canvas.
     * @param effect The effect used to render through
     * @param renderIndex
     */
    protected _internalRender(effect: Effect, renderIndex: number): void {
        // Texture
        effect.setTexture("textureSampler", this._blurTexture);

        // Cache
        const engine = this._engine;
        engine.cacheStencilState();

        // Stencil operations
        engine.setStencilOperationPass(Constants.REPLACE);
        engine.setStencilOperationFail(Constants.KEEP);
        engine.setStencilOperationDepthFail(Constants.KEEP);

        // Draw order
        engine.setStencilMask(0x00);
        engine.setStencilBuffer(true);
        engine.setStencilFunctionReference(this._instanceGlowingMeshStencilReference);

        // 2 passes inner outer
        if (this.outerGlow && renderIndex === 0) {
            // the outer glow is rendered the first time _internalRender is called, so when renderIndex == 0 (and only if outerGlow is enabled)
            effect.setFloat("offset", 0);
            engine.setStencilFunction(Constants.NOTEQUAL);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }
        if (this.innerGlow && renderIndex === 1) {
            // the inner glow is rendered the second time _internalRender is called, so when renderIndex == 1 (and only if innerGlow is enabled)
            effect.setFloat("offset", 1);
            engine.setStencilFunction(Constants.EQUAL);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }

        // Restore Cache
        engine.restoreStencilState();
    }

    /**
     * @returns true if the layer contains information to display, otherwise false.
     */
    public shouldRender(): boolean {
        if (super.shouldRender()) {
            return this._meshes ? true : false;
        }

        return false;
    }

    /**
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    protected _shouldRenderMesh(mesh: Mesh): boolean {
        // Excluded Mesh
        if (this._excludedMeshes && this._excludedMeshes[mesh.uniqueId]) {
            return false;
        }

        if (!super.hasMesh(mesh)) {
            return false;
        }

        return true;
    }

    /**
     * Returns true if the mesh can be rendered, otherwise false.
     * @param mesh The mesh to render
     * @param material The material used on the mesh
     * @returns true if it can be rendered otherwise false
     */
    protected _canRenderMesh(mesh: AbstractMesh, material: Material): boolean {
        // all meshes can be rendered in the highlight layer, even transparent ones
        return true;
    }

    /**
     * Adds specific effects defines.
     * @param defines The defines to add specifics to.
     */
    protected _addCustomEffectDefines(defines: string[]): void {
        defines.push("#define HIGHLIGHT");
    }

    /**
     * Sets the required values for both the emissive texture and and the main color.
     * @param mesh
     * @param subMesh
     * @param material
     */
    protected _setEmissiveTextureAndColor(mesh: Mesh, subMesh: SubMesh, material: Material): void {
        const highlightLayerMesh = this._meshes![mesh.uniqueId];
        if (highlightLayerMesh) {
            this._emissiveTextureAndColor.color.set(highlightLayerMesh.color.r, highlightLayerMesh.color.g, highlightLayerMesh.color.b, 1.0);
        } else {
            this._emissiveTextureAndColor.color.set(this.neutralColor.r, this.neutralColor.g, this.neutralColor.b, this.neutralColor.a);
        }

        if (highlightLayerMesh && highlightLayerMesh.glowEmissiveOnly && material) {
            this._emissiveTextureAndColor.texture = (<any>material).emissiveTexture;
            this._emissiveTextureAndColor.color.set(1.0, 1.0, 1.0, 1.0);
        } else {
            this._emissiveTextureAndColor.texture = null;
        }
    }

    /**
     * Add a mesh in the exclusion list to prevent it to impact or being impacted by the highlight layer.
     * @param mesh The mesh to exclude from the highlight layer
     */
    public addExcludedMesh(mesh: Mesh) {
        if (!this._excludedMeshes) {
            return;
        }

        const meshExcluded = this._excludedMeshes[mesh.uniqueId];
        if (!meshExcluded) {
            const obj: IHighlightLayerExcludedMesh = {
                mesh: mesh,
                beforeBind: null,
                afterRender: null,
                stencilState: false,
            };

            obj.beforeBind = mesh.onBeforeBindObservable.add((mesh: Mesh) => {
                obj.stencilState = mesh.getEngine().getStencilBuffer();
                mesh.getEngine().setStencilBuffer(false);
            });

            obj.afterRender = mesh.onAfterRenderObservable.add((mesh: Mesh) => {
                mesh.getEngine().setStencilBuffer(obj.stencilState);
            });

            this._excludedMeshes[mesh.uniqueId] = obj;
        }
    }

    /**
     * Remove a mesh from the exclusion list to let it impact or being impacted by the highlight layer.
     * @param mesh The mesh to highlight
     */
    public removeExcludedMesh(mesh: Mesh) {
        if (!this._excludedMeshes) {
            return;
        }

        const meshExcluded = this._excludedMeshes[mesh.uniqueId];
        if (meshExcluded) {
            if (meshExcluded.beforeBind) {
                mesh.onBeforeBindObservable.remove(meshExcluded.beforeBind);
            }

            if (meshExcluded.afterRender) {
                mesh.onAfterRenderObservable.remove(meshExcluded.afterRender);
            }
        }

        this._excludedMeshes[mesh.uniqueId] = null;
    }

    /**
     * Determine if a given mesh will be highlighted by the current HighlightLayer
     * @param mesh mesh to test
     * @returns true if the mesh will be highlighted by the current HighlightLayer
     */
    public hasMesh(mesh: AbstractMesh): boolean {
        if (!this._meshes) {
            return false;
        }

        if (!super.hasMesh(mesh)) {
            return false;
        }

        return this._meshes[mesh.uniqueId] !== undefined && this._meshes[mesh.uniqueId] !== null;
    }

    /**
     * Add a mesh in the highlight layer in order to make it glow with the chosen color.
     * @param mesh The mesh to highlight
     * @param color The color of the highlight
     * @param glowEmissiveOnly Extract the glow from the emissive texture
     */
    public addMesh(mesh: Mesh, color: Color3, glowEmissiveOnly = false) {
        if (!this._meshes) {
            return;
        }

        const meshHighlight = this._meshes[mesh.uniqueId];
        if (meshHighlight) {
            meshHighlight.color = color;
        } else {
            this._meshes[mesh.uniqueId] = {
                mesh: mesh,
                color: color,
                // Lambda required for capture due to Observable this context
                observerHighlight: mesh.onBeforeBindObservable.add((mesh: Mesh) => {
                    if (this.isEnabled) {
                        if (this._excludedMeshes && this._excludedMeshes[mesh.uniqueId]) {
                            this._defaultStencilReference(mesh);
                        } else {
                            mesh.getScene().getEngine().setStencilFunctionReference(this._instanceGlowingMeshStencilReference);
                        }
                    }
                }),
                observerDefault: mesh.onAfterRenderObservable.add((mesh: Mesh) => {
                    if (this.isEnabled) {
                        this._defaultStencilReference(mesh);
                    }
                }),
                glowEmissiveOnly: glowEmissiveOnly,
            };

            mesh.onDisposeObservable.add(() => {
                this._disposeMesh(mesh);
            });
        }

        this._shouldRender = true;
    }

    /**
     * Remove a mesh from the highlight layer in order to make it stop glowing.
     * @param mesh The mesh to highlight
     */
    public removeMesh(mesh: Mesh) {
        if (!this._meshes) {
            return;
        }

        const meshHighlight = this._meshes[mesh.uniqueId];
        if (meshHighlight) {
            if (meshHighlight.observerHighlight) {
                mesh.onBeforeBindObservable.remove(meshHighlight.observerHighlight);
            }

            if (meshHighlight.observerDefault) {
                mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
            }
            delete this._meshes[mesh.uniqueId];
        }

        this._shouldRender = false;
        for (const meshHighlightToCheck in this._meshes) {
            if (this._meshes[meshHighlightToCheck]) {
                this._shouldRender = true;
                break;
            }
        }
    }

    /**
     * Remove all the meshes currently referenced in the highlight layer
     */
    public removeAllMeshes(): void {
        if (!this._meshes) {
            return;
        }

        for (const uniqueId in this._meshes) {
            if (Object.prototype.hasOwnProperty.call(this._meshes, uniqueId)) {
                const mesh = this._meshes[uniqueId];
                if (mesh) {
                    this.removeMesh(mesh.mesh);
                }
            }
        }
    }

    /**
     * Force the stencil to the normal expected value for none glowing parts
     * @param mesh
     */
    private _defaultStencilReference(mesh: Mesh) {
        mesh.getScene().getEngine().setStencilFunctionReference(HighlightLayer.NormalMeshStencilReference);
    }

    /**
     * Free any resources and references associated to a mesh.
     * Internal use
     * @param mesh The mesh to free.
     * @internal
     */
    public _disposeMesh(mesh: Mesh): void {
        this.removeMesh(mesh);
        this.removeExcludedMesh(mesh);
    }

    /**
     * Dispose the highlight layer and free resources.
     */
    public dispose(): void {
        if (this._meshes) {
            // Clean mesh references
            for (const id in this._meshes) {
                const meshHighlight = this._meshes[id];
                if (meshHighlight && meshHighlight.mesh) {
                    if (meshHighlight.observerHighlight) {
                        meshHighlight.mesh.onBeforeBindObservable.remove(meshHighlight.observerHighlight);
                    }

                    if (meshHighlight.observerDefault) {
                        meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
                    }
                }
            }
            this._meshes = null;
        }

        if (this._excludedMeshes) {
            for (const id in this._excludedMeshes) {
                const meshHighlight = this._excludedMeshes[id];
                if (meshHighlight) {
                    if (meshHighlight.beforeBind) {
                        meshHighlight.mesh.onBeforeBindObservable.remove(meshHighlight.beforeBind);
                    }

                    if (meshHighlight.afterRender) {
                        meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.afterRender);
                    }
                }
            }
            this._excludedMeshes = null;
        }

        super.dispose();
    }

    /**
     * Gets the class name of the effect layer
     * @returns the string with the class name of the effect layer
     */
    public getClassName(): string {
        return "HighlightLayer";
    }

    /**
     * Serializes this Highlight layer
     * @returns a serialized Highlight layer object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.HighlightLayer";

        // Highlighted meshes
        serializationObject.meshes = [];

        if (this._meshes) {
            for (const m in this._meshes) {
                const mesh = this._meshes[m];

                if (mesh) {
                    serializationObject.meshes.push({
                        glowEmissiveOnly: mesh.glowEmissiveOnly,
                        color: mesh.color.asArray(),
                        meshId: mesh.mesh.id,
                    });
                }
            }
        }

        // Excluded meshes
        serializationObject.excludedMeshes = [];

        if (this._excludedMeshes) {
            for (const e in this._excludedMeshes) {
                const excludedMesh = this._excludedMeshes[e];

                if (excludedMesh) {
                    serializationObject.excludedMeshes.push(excludedMesh.mesh.id);
                }
            }
        }

        return serializationObject;
    }

    /**
     * Creates a Highlight layer from parsed Highlight layer data
     * @param parsedHightlightLayer defines the Highlight layer data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing the Highlight layer information
     * @returns a parsed Highlight layer
     */
    public static Parse(parsedHightlightLayer: any, scene: Scene, rootUrl: string): HighlightLayer {
        const hl = SerializationHelper.Parse(() => new HighlightLayer(parsedHightlightLayer.name, scene, parsedHightlightLayer.options), parsedHightlightLayer, scene, rootUrl);
        let index;

        // Excluded meshes
        for (index = 0; index < parsedHightlightLayer.excludedMeshes.length; index++) {
            const mesh = scene.getMeshById(parsedHightlightLayer.excludedMeshes[index]);
            if (mesh) {
                hl.addExcludedMesh(<Mesh>mesh);
            }
        }

        // Included meshes
        for (index = 0; index < parsedHightlightLayer.meshes.length; index++) {
            const highlightedMesh = parsedHightlightLayer.meshes[index];
            const mesh = scene.getMeshById(highlightedMesh.meshId);

            if (mesh) {
                hl.addMesh(<Mesh>mesh, Color3.FromArray(highlightedMesh.color), highlightedMesh.glowEmissiveOnly);
            }
        }

        return hl;
    }
}

RegisterClass("BABYLON.HighlightLayer", HighlightLayer);
