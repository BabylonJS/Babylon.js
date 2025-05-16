/* eslint-disable @typescript-eslint/no-unused-vars */
import { serialize } from "../Misc/decorators";
import type { Nullable } from "../types";
import { Scene } from "../scene";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Mesh } from "../Meshes/mesh";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { Effect } from "../Materials/effect";
import type { Material } from "../Materials/material";
import type { PostProcess } from "../PostProcesses/postProcess";
import { BlurPostProcess } from "../PostProcesses/blurPostProcess";
import type { IThinGlowLayerOptions } from "./thinGlowLayer";
import { EffectLayer } from "./effectLayer";
import { Constants } from "../Engines/constants";
import { RegisterClass } from "../Misc/typeStore";
import type { Color4 } from "core/Maths/math.color";

import "../Layers/effectLayerSceneComponent";
import { SerializationHelper } from "../Misc/decorators.serialization";
import { GetExponentOfTwo } from "../Misc/tools.functions";
import { ThinGlowLayer } from "./thinGlowLayer";
import type { ThinBlurPostProcess } from "core/PostProcesses/thinBlurPostProcess";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * Return the first glow layer of the scene with a given name.
         * @param name The name of the glow layer to look for.
         * @returns The glow layer if found otherwise null.
         */
        getGlowLayerByName(name: string): Nullable<GlowLayer>;
    }
}

Scene.prototype.getGlowLayerByName = function (name: string): Nullable<GlowLayer> {
    for (let index = 0; index < this.effectLayers?.length; index++) {
        if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === GlowLayer.EffectName) {
            return (<any>this.effectLayers[index]) as GlowLayer;
        }
    }

    return null;
};

/**
 * Glow layer options. This helps customizing the behaviour
 * of the glow layer.
 */
export interface IGlowLayerOptions extends IThinGlowLayerOptions {
    /**
     * Enable MSAA by choosing the number of samples. Default: 1
     */
    mainTextureSamples?: number;

    /**
     * Whether or not to generate a stencil buffer. Default: false
     */
    generateStencilBuffer?: boolean;
}

/**
 * The glow layer Helps adding a glow effect around the emissive parts of a mesh.
 *
 * Once instantiated in a scene, by default, all the emissive meshes will glow.
 *
 * Documentation: https://doc.babylonjs.com/features/featuresDeepDive/mesh/glowLayer
 */
export class GlowLayer extends EffectLayer {
    /**
     * Effect Name of the layer.
     */
    public static get EffectName() {
        return ThinGlowLayer.EffectName;
    }

    /**
     * The default blur kernel size used for the glow.
     */
    public static DefaultBlurKernelSize = 32;

    /**
     * The default texture size ratio used for the glow.
     */
    public static DefaultTextureRatio = 0.5;

    /**
     * Sets the kernel size of the blur.
     */
    public set blurKernelSize(value: number) {
        this._thinEffectLayer.blurKernelSize = value;
    }

    /**
     * Gets the kernel size of the blur.
     */
    @serialize()
    public get blurKernelSize(): number {
        return this._thinEffectLayer.blurKernelSize;
    }

    /**
     * Sets the glow intensity.
     */
    public set intensity(value: number) {
        this._thinEffectLayer.intensity = value;
    }

    /**
     * Gets the glow intensity.
     */
    @serialize()
    public get intensity(): number {
        return this._thinEffectLayer.intensity;
    }

    @serialize("options")
    protected _options: IGlowLayerOptions;

    protected override readonly _thinEffectLayer: ThinGlowLayer;
    private _horizontalBlurPostprocess1: BlurPostProcess;
    private _verticalBlurPostprocess1: BlurPostProcess;
    private _horizontalBlurPostprocess2: BlurPostProcess;
    private _verticalBlurPostprocess2: BlurPostProcess;
    private _blurTexture1: RenderTargetTexture;
    private _blurTexture2: RenderTargetTexture;
    private _postProcesses1: PostProcess[];
    private _postProcesses2: PostProcess[];
    /**
     * Callback used to let the user override the color selection on a per mesh basis
     */
    public get customEmissiveColorSelector(): (mesh: Mesh, subMesh: SubMesh, material: Material, result: Color4) => void {
        return this._thinEffectLayer.customEmissiveColorSelector;
    }

    public set customEmissiveColorSelector(value: (mesh: Mesh, subMesh: SubMesh, material: Material, result: Color4) => void) {
        this._thinEffectLayer.customEmissiveColorSelector = value;
    }

    /**
     * Callback used to let the user override the texture selection on a per mesh basis
     */
    public get customEmissiveTextureSelector(): (mesh: Mesh, subMesh: SubMesh, material: Material) => Texture {
        return this._thinEffectLayer.customEmissiveTextureSelector;
    }

    public set customEmissiveTextureSelector(value: (mesh: Mesh, subMesh: SubMesh, material: Material) => Texture) {
        this._thinEffectLayer.customEmissiveTextureSelector = value;
    }

    /**
     * Instantiates a new glow Layer and references it to the scene.
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param options Sets of none mandatory options to use with the layer (see IGlowLayerOptions for more information)
     */
    constructor(name: string, scene?: Scene, options?: Partial<IGlowLayerOptions>) {
        super(name, scene, false, new ThinGlowLayer(name, scene, options));

        // Adapt options
        this._options = {
            mainTextureRatio: GlowLayer.DefaultTextureRatio,
            blurKernelSize: 32,
            mainTextureFixedSize: undefined,
            camera: null,
            mainTextureSamples: 1,
            renderingGroupId: -1,
            ldrMerge: false,
            alphaBlendingMode: Constants.ALPHA_ADD,
            mainTextureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            generateStencilBuffer: false,
            ...options,
        };

        // Initialize the layer
        this._init(this._options);
    }

    /**
     * Get the effect name of the layer.
     * @returns The effect name
     */
    public getEffectName(): string {
        return GlowLayer.EffectName;
    }

    /**
     * @internal
     * Create the merge effect. This is the shader use to blit the information back
     * to the main canvas at the end of the scene rendering.
     */
    protected _createMergeEffect(): Effect {
        return this._thinEffectLayer._createMergeEffect();
    }

    /**
     * Creates the render target textures and post processes used in the glow layer.
     */
    protected _createTextureAndPostProcesses(): void {
        this._thinEffectLayer._renderPassId = this._mainTexture.renderPassId;

        let blurTextureWidth = this._mainTextureDesiredSize.width;
        let blurTextureHeight = this._mainTextureDesiredSize.height;
        blurTextureWidth = this._engine.needPOTTextures ? GetExponentOfTwo(blurTextureWidth, this._maxSize) : blurTextureWidth;
        blurTextureHeight = this._engine.needPOTTextures ? GetExponentOfTwo(blurTextureHeight, this._maxSize) : blurTextureHeight;

        let textureType = 0;
        if (this._engine.getCaps().textureHalfFloatRender) {
            textureType = Constants.TEXTURETYPE_HALF_FLOAT;
        } else {
            textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        }

        this._blurTexture1 = new RenderTargetTexture(
            "GlowLayerBlurRTT",
            {
                width: blurTextureWidth,
                height: blurTextureHeight,
            },
            this._scene,
            false,
            true,
            textureType
        );
        this._blurTexture1.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture1.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture1.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._blurTexture1.renderParticles = false;
        this._blurTexture1.ignoreCameraViewport = true;

        const blurTextureWidth2 = Math.floor(blurTextureWidth / 2);
        const blurTextureHeight2 = Math.floor(blurTextureHeight / 2);

        this._blurTexture2 = new RenderTargetTexture(
            "GlowLayerBlurRTT2",
            {
                width: blurTextureWidth2,
                height: blurTextureHeight2,
            },
            this._scene,
            false,
            true,
            textureType
        );
        this._blurTexture2.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture2.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture2.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._blurTexture2.renderParticles = false;
        this._blurTexture2.ignoreCameraViewport = true;

        this._textures = [this._blurTexture1, this._blurTexture2];

        this._thinEffectLayer.bindTexturesForCompose = (effect: Effect) => {
            effect.setTexture("textureSampler", this._blurTexture1);
            effect.setTexture("textureSampler2", this._blurTexture2);
            effect.setFloat("offset", this.intensity);
        };

        this._thinEffectLayer._createTextureAndPostProcesses();

        const thinBlurPostProcesses1 = this._thinEffectLayer._postProcesses[0] as ThinBlurPostProcess;
        this._horizontalBlurPostprocess1 = new BlurPostProcess("GlowLayerHBP1", thinBlurPostProcesses1.direction, thinBlurPostProcesses1.kernel, {
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            width: blurTextureWidth,
            height: blurTextureHeight,
            textureType,
            effectWrapper: thinBlurPostProcesses1,
        });
        this._horizontalBlurPostprocess1.width = blurTextureWidth;
        this._horizontalBlurPostprocess1.height = blurTextureHeight;
        this._horizontalBlurPostprocess1.externalTextureSamplerBinding = true;
        this._horizontalBlurPostprocess1.onApplyObservable.add((effect) => {
            effect.setTexture("textureSampler", this._mainTexture);
        });

        const thinBlurPostProcesses2 = this._thinEffectLayer._postProcesses[1] as ThinBlurPostProcess;
        this._verticalBlurPostprocess1 = new BlurPostProcess("GlowLayerVBP1", thinBlurPostProcesses2.direction, thinBlurPostProcesses2.kernel, {
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            width: blurTextureWidth,
            height: blurTextureHeight,
            textureType,
            effectWrapper: thinBlurPostProcesses2,
        });

        const thinBlurPostProcesses3 = this._thinEffectLayer._postProcesses[2] as ThinBlurPostProcess;
        this._horizontalBlurPostprocess2 = new BlurPostProcess("GlowLayerHBP2", thinBlurPostProcesses3.direction, thinBlurPostProcesses3.kernel, {
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            width: blurTextureWidth2,
            height: blurTextureHeight2,
            textureType,
            effectWrapper: thinBlurPostProcesses3,
        });
        this._horizontalBlurPostprocess2.width = blurTextureWidth2;
        this._horizontalBlurPostprocess2.height = blurTextureHeight2;
        this._horizontalBlurPostprocess2.externalTextureSamplerBinding = true;
        this._horizontalBlurPostprocess2.onApplyObservable.add((effect) => {
            effect.setTexture("textureSampler", this._blurTexture1);
        });

        const thinBlurPostProcesses4 = this._thinEffectLayer._postProcesses[3] as ThinBlurPostProcess;
        this._verticalBlurPostprocess2 = new BlurPostProcess("GlowLayerVBP2", thinBlurPostProcesses4.direction, thinBlurPostProcesses4.kernel, {
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            width: blurTextureWidth2,
            height: blurTextureHeight2,
            textureType,
            effectWrapper: thinBlurPostProcesses4,
        });

        this._postProcesses = [this._horizontalBlurPostprocess1, this._verticalBlurPostprocess1, this._horizontalBlurPostprocess2, this._verticalBlurPostprocess2];
        this._postProcesses1 = [this._horizontalBlurPostprocess1, this._verticalBlurPostprocess1];
        this._postProcesses2 = [this._horizontalBlurPostprocess2, this._verticalBlurPostprocess2];

        this._mainTexture.samples = this._options.mainTextureSamples!;
        this._mainTexture.onAfterUnbindObservable.add(() => {
            const internalTexture = this._blurTexture1.renderTarget;
            if (internalTexture) {
                this._scene.postProcessManager.directRender(this._postProcesses1, internalTexture, true);

                const internalTexture2 = this._blurTexture2.renderTarget;
                if (internalTexture2) {
                    this._scene.postProcessManager.directRender(this._postProcesses2, internalTexture2, true);
                }
                this._engine.unBindFramebuffer(internalTexture2 ?? internalTexture, true);
            }
        });

        // Prevent autoClear.
        this._postProcesses.map((pp) => {
            pp.autoClear = false;
        });
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
     * @returns whether or not the layer needs stencil enabled during the mesh rendering.
     */
    public needStencil(): boolean {
        return false;
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
     * Implementation specific of rendering the generating effect on the main canvas.
     * @param effect The effect used to render through
     */
    protected _internalRender(effect: Effect): void {
        this._thinEffectLayer._internalCompose(effect);
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
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    protected override _shouldRenderMesh(mesh: Mesh): boolean {
        return this._thinEffectLayer._shouldRenderMesh(mesh);
    }

    /**
     * Adds specific effects defines.
     * @param defines The defines to add specifics to.
     */
    protected override _addCustomEffectDefines(defines: string[]): void {
        this._thinEffectLayer._addCustomEffectDefines(defines);
    }

    /**
     * Add a mesh in the exclusion list to prevent it to impact or being impacted by the glow layer.
     * @param mesh The mesh to exclude from the glow layer
     */
    public addExcludedMesh(mesh: Mesh): void {
        this._thinEffectLayer.addExcludedMesh(mesh);
    }

    /**
     * Remove a mesh from the exclusion list to let it impact or being impacted by the glow layer.
     * @param mesh The mesh to remove
     */
    public removeExcludedMesh(mesh: Mesh): void {
        this._thinEffectLayer.removeExcludedMesh(mesh);
    }

    /**
     * Add a mesh in the inclusion list to impact or being impacted by the glow layer.
     * @param mesh The mesh to include in the glow layer
     */
    public addIncludedOnlyMesh(mesh: Mesh): void {
        this._thinEffectLayer.addIncludedOnlyMesh(mesh);
    }

    /**
     * Remove a mesh from the Inclusion list to prevent it to impact or being impacted by the glow layer.
     * @param mesh The mesh to remove
     */
    public removeIncludedOnlyMesh(mesh: Mesh): void {
        this._thinEffectLayer.removeIncludedOnlyMesh(mesh);
    }

    /**
     * Determine if a given mesh will be used in the glow layer
     * @param mesh The mesh to test
     * @returns true if the mesh will be highlighted by the current glow layer
     */
    public override hasMesh(mesh: AbstractMesh): boolean {
        return this._thinEffectLayer.hasMesh(mesh);
    }

    /**
     * Defines whether the current material of the mesh should be use to render the effect.
     * @param mesh defines the current mesh to render
     * @returns true if the material of the mesh should be use to render the effect
     */
    protected override _useMeshMaterial(mesh: AbstractMesh): boolean {
        return this._thinEffectLayer._useMeshMaterial(mesh);
    }

    /**
     * Add a mesh to be rendered through its own material and not with emissive only.
     * @param mesh The mesh for which we need to use its material
     */
    public referenceMeshToUseItsOwnMaterial(mesh: AbstractMesh): void {
        this._thinEffectLayer.referenceMeshToUseItsOwnMaterial(mesh);
    }

    /**
     * Remove a mesh from being rendered through its own material and not with emissive only.
     * @param mesh The mesh for which we need to not use its material
     */
    public unReferenceMeshFromUsingItsOwnMaterial(mesh: AbstractMesh): void {
        this._thinEffectLayer.unReferenceMeshFromUsingItsOwnMaterial(mesh, this._mainTexture.renderPassId);
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
        return "GlowLayer";
    }

    /**
     * Serializes this glow layer
     * @returns a serialized glow layer object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.GlowLayer";

        let index;

        // Included meshes
        serializationObject.includedMeshes = [];

        const includedOnlyMeshes = this._thinEffectLayer._includedOnlyMeshes;
        if (includedOnlyMeshes.length) {
            for (index = 0; index < includedOnlyMeshes.length; index++) {
                const mesh = this._scene.getMeshByUniqueId(includedOnlyMeshes[index]);
                if (mesh) {
                    serializationObject.includedMeshes.push(mesh.id);
                }
            }
        }

        // Excluded meshes
        serializationObject.excludedMeshes = [];

        const excludedMeshes = this._thinEffectLayer._excludedMeshes;
        if (excludedMeshes.length) {
            for (index = 0; index < excludedMeshes.length; index++) {
                const mesh = this._scene.getMeshByUniqueId(excludedMeshes[index]);
                if (mesh) {
                    serializationObject.excludedMeshes.push(mesh.id);
                }
            }
        }

        return serializationObject;
    }

    /**
     * Creates a Glow Layer from parsed glow layer data
     * @param parsedGlowLayer defines glow layer data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing the glow layer information
     * @returns a parsed Glow Layer
     */
    public static override Parse(parsedGlowLayer: any, scene: Scene, rootUrl: string): GlowLayer {
        const gl = SerializationHelper.Parse(() => new GlowLayer(parsedGlowLayer.name, scene, parsedGlowLayer.options), parsedGlowLayer, scene, rootUrl);
        let index;

        // Excluded meshes
        for (index = 0; index < parsedGlowLayer.excludedMeshes.length; index++) {
            const mesh = scene.getMeshById(parsedGlowLayer.excludedMeshes[index]);
            if (mesh) {
                gl.addExcludedMesh(<Mesh>mesh);
            }
        }

        // Included meshes
        for (index = 0; index < parsedGlowLayer.includedMeshes.length; index++) {
            const mesh = scene.getMeshById(parsedGlowLayer.includedMeshes[index]);
            if (mesh) {
                gl.addIncludedOnlyMesh(<Mesh>mesh);
            }
        }

        return gl;
    }
}

RegisterClass("BABYLON.GlowLayer", GlowLayer);
