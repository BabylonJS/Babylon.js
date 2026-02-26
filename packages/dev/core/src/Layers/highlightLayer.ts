/* eslint-disable @typescript-eslint/no-unused-vars */
import { serialize } from "../Misc/decorators";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import { Scene } from "../scene";
import { Vector2 } from "../Maths/math.vector";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Mesh } from "../Meshes/mesh";
import type { Effect } from "../Materials/effect";
import type { Material } from "../Materials/material";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { PostProcessOptions } from "../PostProcesses/postProcess";
import { PostProcess } from "../PostProcesses/postProcess";
import { PassPostProcess } from "../PostProcesses/passPostProcess";
import { BlurPostProcess } from "../PostProcesses/blurPostProcess";
import { EffectLayer } from "./effectLayer";
import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";
import { RegisterClass } from "../Misc/typeStore";
import type { Color4 } from "../Maths/math.color";
import { Color3 } from "../Maths/math.color";

import type { ThinPassPostProcess } from "core/PostProcesses/thinPassPostProcess";
import type { ThinBlurPostProcess } from "core/PostProcesses/thinBlurPostProcess";
import type { IThinHighlightLayerOptions } from "./thinHighlightLayer";
import { SerializationHelper } from "../Misc/decorators.serialization";
import { GetExponentOfTwo } from "../Misc/tools.functions";
import { ThinHighlightLayer } from "./thinHighlightLayer";
import { ThinGlowBlurPostProcess } from "./thinEffectLayer";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * Return a the first highlight layer of the scene with a given name.
         * @param name The name of the highlight layer to look for.
         * @returns The highlight layer if found otherwise null.
         */
        getHighlightLayerByName(name: string): Nullable<HighlightLayer>;
    }
}

Scene.prototype.getHighlightLayerByName = function (name: string): Nullable<HighlightLayer> {
    for (let index = 0; index < this.effectLayers?.length; index++) {
        if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === HighlightLayer.EffectName) {
            return (<any>this.effectLayers[index]) as HighlightLayer;
        }
    }

    return null;
};

interface IBlurPostProcess extends PostProcess {
    kernel: number;
}

/**
 * Special Glow Blur post process only blurring the alpha channel
 * It enforces keeping the most luminous color in the color channel.
 */
class GlowBlurPostProcess extends PostProcess {
    protected override _effectWrapper: ThinGlowBlurPostProcess;

    constructor(
        name: string,
        public direction: Vector2,
        public kernel: number,
        options: number | PostProcessOptions,
        camera: Nullable<Camera> = null,
        samplingMode: number = Texture.BILINEAR_SAMPLINGMODE,
        engine?: AbstractEngine,
        reusable?: boolean
    ) {
        const localOptions = {
            uniforms: ThinGlowBlurPostProcess.Uniforms,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            ...(options as PostProcessOptions),
        };

        super(name, ThinGlowBlurPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinGlowBlurPostProcess(name, engine, direction, kernel, localOptions) : undefined,
            ...localOptions,
        });

        this.onApplyObservable.add(() => {
            this._effectWrapper.textureWidth = this.width;
            this._effectWrapper.textureHeight = this.height;
        });
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/glowBlurPostProcess.fragment"));
        } else {
            list.push(import("../Shaders/glowBlurPostProcess.fragment"));
        }

        super._gatherImports(useWebGPU, list);
    }
}

/**
 * Highlight layer options. This helps customizing the behaviour
 * of the highlight layer.
 */
export interface IHighlightLayerOptions extends IThinHighlightLayerOptions {
    /**
     * Whether or not to generate a stencil buffer. Default: false
     */
    generateStencilBuffer?: boolean;
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
    public static get NeutralColor() {
        return ThinHighlightLayer.NeutralColor;
    }

    public static set NeutralColor(value: Color4) {
        ThinHighlightLayer.NeutralColor = value;
    }

    /**
     * Specifies whether or not the inner glow is ACTIVE in the layer.
     */
    @serialize()
    public get innerGlow() {
        return this._thinEffectLayer.innerGlow;
    }

    public set innerGlow(value: boolean) {
        this._thinEffectLayer.innerGlow = value;
    }

    /**
     * Specifies whether or not the outer glow is ACTIVE in the layer.
     */
    @serialize()
    public get outerGlow() {
        return this._thinEffectLayer.outerGlow;
    }

    public set outerGlow(value: boolean) {
        this._thinEffectLayer.outerGlow = value;
    }

    /**
     * Specifies the horizontal size of the blur.
     */
    public set blurHorizontalSize(value: number) {
        this._thinEffectLayer.blurHorizontalSize = value;
    }

    /**
     * Specifies the vertical size of the blur.
     */
    public set blurVerticalSize(value: number) {
        this._thinEffectLayer.blurVerticalSize = value;
    }

    /**
     * Gets the horizontal size of the blur.
     */
    @serialize()
    public get blurHorizontalSize(): number {
        return this._thinEffectLayer.blurHorizontalSize;
    }

    /**
     * Gets the vertical size of the blur.
     */
    @serialize()
    public get blurVerticalSize(): number {
        return this._thinEffectLayer.blurVerticalSize;
    }

    /**
     * Number of stencil bits used by the highlight layer (default: 8).
     * The layer uses the numStencilBits highest bits of the stencil buffer.
     */
    @serialize()
    public get numStencilBits(): number {
        return this._thinEffectLayer.numStencilBits;
    }

    public set numStencilBits(value: number) {
        this._thinEffectLayer.numStencilBits = value;
    }

    /**
     * Gets the stencil reference value used for the meshes rendered by the highlight layer.
     */
    public get stencilReference(): number {
        return this._thinEffectLayer.stencilReference;
    }

    /**
     * An event triggered when the highlight layer is being blurred.
     */
    public onBeforeBlurObservable = new Observable<HighlightLayer>();

    /**
     * An event triggered when the highlight layer has been blurred.
     */
    public onAfterBlurObservable = new Observable<HighlightLayer>();

    @serialize("options")
    private _options: Required<IHighlightLayerOptions>;

    protected override readonly _thinEffectLayer: ThinHighlightLayer;
    private _downSamplePostprocess: PassPostProcess;
    private _horizontalBlurPostprocess: IBlurPostProcess;
    private _verticalBlurPostprocess: IBlurPostProcess;
    private _blurTexture: RenderTargetTexture;

    /**
     * Instantiates a new highlight Layer and references it to the scene..
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param options Sets of none mandatory options to use with the layer (see IHighlightLayerOptions for more information)
     */
    constructor(name: string, scene?: Scene, options?: Partial<IHighlightLayerOptions>) {
        super(name, scene, options !== undefined ? !!options.forceGLSL : false, new ThinHighlightLayer(name, scene, options));

        // Warn on stencil
        if (!this._engine.isStencilEnable) {
            Logger.Warn("Rendering the Highlight Layer requires the stencil to be active on the canvas. var engine = new Engine(canvas, antialias, { stencil: true }");
        }

        // Adapt options
        this._options = {
            mainTextureRatio: 0.5,
            blurTextureSizeRatio: 0.5,
            mainTextureFixedSize: 0,
            blurHorizontalSize: 1.0,
            blurVerticalSize: 1.0,
            alphaBlendingMode: Constants.ALPHA_COMBINE,
            camera: null,
            renderingGroupId: -1,
            mainTextureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            mainTextureFormat: Constants.TEXTUREFORMAT_RGBA,
            forceGLSL: false,
            isStroke: false,
            generateStencilBuffer: false,
            ...options,
        };

        // Initialize the layer
        this._init(this._options);

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

    protected override _numInternalDraws(): number {
        return 2; // we need two rendering, one for the inner glow and the other for the outer glow
    }

    /**
     * Create the merge effect. This is the shader use to blit the information back
     * to the main canvas at the end of the scene rendering.
     * @returns The effect created
     */
    protected _createMergeEffect(): Effect {
        return this._thinEffectLayer._createMergeEffect();
    }

    /**
     * Creates the render target textures and post processes used in the highlight layer.
     */
    protected _createTextureAndPostProcesses(): void {
        let blurTextureWidth = this._mainTextureDesiredSize.width * this._options.blurTextureSizeRatio;
        let blurTextureHeight = this._mainTextureDesiredSize.height * this._options.blurTextureSizeRatio;
        blurTextureWidth = this._engine.needPOTTextures ? GetExponentOfTwo(blurTextureWidth, this._maxSize) : blurTextureWidth;
        blurTextureHeight = this._engine.needPOTTextures ? GetExponentOfTwo(blurTextureHeight, this._maxSize) : blurTextureHeight;

        let textureType = 0;
        if (this._engine.getCaps().textureHalfFloatRender) {
            textureType = Constants.TEXTURETYPE_HALF_FLOAT;
        } else {
            textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
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

        this._thinEffectLayer.bindTexturesForCompose = (effect: Effect) => {
            effect.setTexture("textureSampler", this._blurTexture);
        };

        this._thinEffectLayer._createTextureAndPostProcesses();

        if (this._options.alphaBlendingMode === Constants.ALPHA_COMBINE) {
            this._downSamplePostprocess = new PassPostProcess("HighlightLayerPPP", {
                size: this._options.blurTextureSizeRatio,
                samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                engine: this._scene.getEngine(),
                effectWrapper: this._thinEffectLayer._postProcesses[0] as ThinPassPostProcess,
            });
            this._downSamplePostprocess.externalTextureSamplerBinding = true;
            this._downSamplePostprocess.onApplyObservable.add((effect) => {
                effect.setTexture("textureSampler", this._mainTexture);
            });

            this._horizontalBlurPostprocess = new GlowBlurPostProcess("HighlightLayerHBP", new Vector2(1.0, 0), this._options.blurHorizontalSize, {
                samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                engine: this._scene.getEngine(),
                effectWrapper: this._thinEffectLayer._postProcesses[1] as ThinGlowBlurPostProcess,
            });
            this._horizontalBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
            });

            this._verticalBlurPostprocess = new GlowBlurPostProcess("HighlightLayerVBP", new Vector2(0, 1.0), this._options.blurVerticalSize, {
                samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                engine: this._scene.getEngine(),
                effectWrapper: this._thinEffectLayer._postProcesses[2] as ThinGlowBlurPostProcess,
            });
            this._verticalBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
            });

            this._postProcesses = [this._downSamplePostprocess, this._horizontalBlurPostprocess, this._verticalBlurPostprocess];
        } else {
            this._horizontalBlurPostprocess = new BlurPostProcess("HighlightLayerHBP", new Vector2(1.0, 0), this._options.blurHorizontalSize / 2, {
                size: {
                    width: blurTextureWidth,
                    height: blurTextureHeight,
                },
                samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                engine: this._scene.getEngine(),
                textureType,
                effectWrapper: this._thinEffectLayer._postProcesses[0] as ThinBlurPostProcess,
            });
            this._horizontalBlurPostprocess.width = blurTextureWidth;
            this._horizontalBlurPostprocess.height = blurTextureHeight;
            this._horizontalBlurPostprocess.externalTextureSamplerBinding = true;
            this._horizontalBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setTexture("textureSampler", this._mainTexture);
            });

            this._verticalBlurPostprocess = new BlurPostProcess("HighlightLayerVBP", new Vector2(0, 1.0), this._options.blurVerticalSize / 2, {
                size: {
                    width: blurTextureWidth,
                    height: blurTextureHeight,
                },
                samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                engine: this._scene.getEngine(),
                textureType,
            });

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

        this._mainTextureCreatedSize.width = this._mainTextureDesiredSize.width;
        this._mainTextureCreatedSize.height = this._mainTextureDesiredSize.height;
    }

    /**
     * @returns whether or not the layer needs stencil enabled during the mesh rendering.
     */
    public needStencil(): boolean {
        return this._thinEffectLayer.needStencil();
    }

    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @returns true if ready otherwise, false
     */
    public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        return this._thinEffectLayer.isReady(subMesh, useInstances);
    }

    /**
     * Implementation specific of rendering the generating effect on the main canvas.
     * @param effect The effect used to render through
     * @param renderIndex
     */
    protected _internalRender(effect: Effect, renderIndex: number): void {
        this._thinEffectLayer._internalCompose(effect, renderIndex);
    }

    /**
     * @returns true if the layer contains information to display, otherwise false.
     */
    public override shouldRender(): boolean {
        return this._thinEffectLayer.shouldRender();
    }

    /**
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    protected override _shouldRenderMesh(mesh: Mesh): boolean {
        return this._thinEffectLayer._shouldRenderMesh(mesh);
    }

    /**
     * Returns true if the mesh can be rendered, otherwise false.
     * @param mesh The mesh to render
     * @param material The material used on the mesh
     * @returns true if it can be rendered otherwise false
     */
    protected override _canRenderMesh(mesh: AbstractMesh, material: Material): boolean {
        return this._thinEffectLayer._canRenderMesh(mesh, material);
    }

    /**
     * Adds specific effects defines.
     * @param defines The defines to add specifics to.
     */
    protected override _addCustomEffectDefines(defines: string[]): void {
        this._thinEffectLayer._addCustomEffectDefines(defines);
    }

    /**
     * Sets the required values for both the emissive texture and and the main color.
     * @param mesh
     * @param subMesh
     * @param material
     */
    protected _setEmissiveTextureAndColor(mesh: Mesh, subMesh: SubMesh, material: Material): void {
        this._thinEffectLayer._setEmissiveTextureAndColor(mesh, subMesh, material);
    }

    /**
     * Add a mesh in the exclusion list to prevent it to impact or being impacted by the highlight layer.
     * @param mesh The mesh to exclude from the highlight layer
     */
    public addExcludedMesh(mesh: Mesh) {
        this._thinEffectLayer.addExcludedMesh(mesh);
    }

    /**
     * Remove a mesh from the exclusion list to let it impact or being impacted by the highlight layer.
     * @param mesh The mesh to highlight
     */
    public removeExcludedMesh(mesh: Mesh) {
        this._thinEffectLayer.removeExcludedMesh(mesh);
    }

    /**
     * Determine if a given mesh will be highlighted by the current HighlightLayer
     * @param mesh mesh to test
     * @returns true if the mesh will be highlighted by the current HighlightLayer
     */
    public override hasMesh(mesh: AbstractMesh): boolean {
        return this._thinEffectLayer.hasMesh(mesh);
    }

    /**
     * Add a mesh in the highlight layer in order to make it glow with the chosen color.
     * @param mesh The mesh to highlight
     * @param color The color of the highlight
     * @param glowEmissiveOnly Extract the glow from the emissive texture
     */
    public addMesh(mesh: Mesh, color: Color3, glowEmissiveOnly = false) {
        this._thinEffectLayer.addMesh(mesh, color, glowEmissiveOnly);
    }

    /**
     * Remove a mesh from the highlight layer in order to make it stop glowing.
     * @param mesh The mesh to highlight
     */
    public removeMesh(mesh: Mesh) {
        this._thinEffectLayer.removeMesh(mesh);
    }

    /**
     * Remove all the meshes currently referenced in the highlight layer
     */
    public removeAllMeshes(): void {
        this._thinEffectLayer.removeAllMeshes();
    }

    /**
     * Free any resources and references associated to a mesh.
     * Internal use
     * @param mesh The mesh to free.
     * @internal
     */
    public _disposeMesh(mesh: Mesh): void {
        this._thinEffectLayer._disposeMesh(mesh);
    }

    /**
     * Gets the class name of the effect layer
     * @returns the string with the class name of the effect layer
     */
    public override getClassName(): string {
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

        const meshes = this._thinEffectLayer._meshes;
        if (meshes) {
            for (const m in meshes) {
                const mesh = meshes[m];

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

        const excludedMeshes = this._thinEffectLayer._excludedMeshes;
        if (excludedMeshes) {
            for (const e in excludedMeshes) {
                const excludedMesh = excludedMeshes[e];

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
    public static override Parse(parsedHightlightLayer: any, scene: Scene, rootUrl: string): HighlightLayer {
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
