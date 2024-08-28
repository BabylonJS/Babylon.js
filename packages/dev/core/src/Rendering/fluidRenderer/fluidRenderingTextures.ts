import type { Camera } from "core/Cameras/camera";
import { Constants } from "core/Engines/constants";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { Texture } from "core/Materials/Textures/texture";
import type { ThinTexture } from "core/Materials/Textures/thinTexture";
import { Vector2 } from "core/Maths/math.vector";
import { PostProcess } from "core/PostProcesses/postProcess";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { Observable } from "core/Misc/observable";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/** @internal */
export class FluidRenderingTextures {
    protected _name: string;
    protected _scene: Scene;
    protected _camera: Nullable<Camera>;
    protected _engine: AbstractEngine;
    protected _width: number;
    protected _height: number;
    protected _blurTextureSizeX: number;
    protected _blurTextureSizeY: number;
    protected _textureType: number;
    protected _textureFormat: number;
    protected _blurTextureType: number;
    protected _blurTextureFormat: number;
    protected _useStandardBlur: boolean;
    protected _generateDepthBuffer: boolean;
    protected _samples: number;
    protected _postProcessRunningIndex: number;

    protected _rt: Nullable<RenderTargetWrapper>;
    protected _texture: Nullable<Texture>;
    protected _rtBlur: Nullable<RenderTargetWrapper>;
    protected _textureBlurred: Nullable<Texture>;
    protected _blurPostProcesses: Nullable<PostProcess[]>;

    public enableBlur = true;

    public blurSizeDivisor = 1;

    public blurFilterSize = 7;

    private _blurNumIterations = 3;

    public get blurNumIterations() {
        return this._blurNumIterations;
    }

    public set blurNumIterations(numIterations: number) {
        if (this._blurNumIterations === numIterations) {
            return;
        }

        this._blurNumIterations = numIterations;
        if (this._blurPostProcesses !== null) {
            const blurX = this._blurPostProcesses[0];
            const blurY = this._blurPostProcesses[1];

            this._blurPostProcesses = [];
            for (let i = 0; i < this._blurNumIterations * 2; ++i) {
                this._blurPostProcesses[i] = i & 1 ? blurY : blurX;
            }
        }
    }

    public blurMaxFilterSize = 100;

    public blurDepthScale = 10;

    public particleSize = 0.02;

    public onDisposeObservable: Observable<FluidRenderingTextures> = new Observable<FluidRenderingTextures>();

    public get renderTarget() {
        return this._rt;
    }

    public get renderTargetBlur() {
        return this._rtBlur;
    }

    public get texture() {
        return this._texture;
    }

    public get textureBlur() {
        return this._textureBlurred;
    }

    /** Shader language used by the texture */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in the texture
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    constructor(
        name: string,
        scene: Scene,
        width: number,
        height: number,
        blurTextureSizeX: number,
        blurTextureSizeY: number,
        textureType: number = Constants.TEXTURETYPE_FLOAT,
        textureFormat: number = Constants.TEXTUREFORMAT_R,
        blurTextureType: number = Constants.TEXTURETYPE_FLOAT,
        blurTextureFormat: number = Constants.TEXTUREFORMAT_R,
        useStandardBlur = false,
        camera: Nullable<Camera> = null,
        generateDepthBuffer = true,
        samples = 1,
        shaderLanguage?: ShaderLanguage
    ) {
        this._name = name;
        this._scene = scene;
        this._camera = camera;
        this._engine = scene.getEngine();
        this._width = width;
        this._height = height;
        this._blurTextureSizeX = blurTextureSizeX;
        this._blurTextureSizeY = blurTextureSizeY;
        this._textureType = textureType;
        this._textureFormat = textureFormat;
        this._blurTextureType = blurTextureType;
        this._blurTextureFormat = blurTextureFormat;
        this._useStandardBlur = useStandardBlur;
        this._generateDepthBuffer = generateDepthBuffer;
        this._samples = samples;
        this._postProcessRunningIndex = 0;
        this.enableBlur = blurTextureSizeX !== 0 && blurTextureSizeY !== 0;

        this._rt = null;
        this._texture = null;
        this._rtBlur = null;
        this._textureBlurred = null;
        this._blurPostProcesses = null;

        this._shaderLanguage = shaderLanguage ?? (this._engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL);
    }

    public initialize(): void {
        this.dispose();

        this._createRenderTarget();

        if (this.enableBlur && this._texture) {
            const [rtBlur, textureBlurred, blurPostProcesses] = this._createBlurPostProcesses(
                this._texture,
                this._blurTextureType,
                this._blurTextureFormat,
                this.blurSizeDivisor,
                this._name,
                this._useStandardBlur
            );
            this._rtBlur = rtBlur;
            this._textureBlurred = textureBlurred;
            this._blurPostProcesses = blurPostProcesses;
        }
    }

    public applyBlurPostProcesses(): void {
        if (this.enableBlur && this._blurPostProcesses) {
            this._postProcessRunningIndex = 0;
            this._scene.postProcessManager.directRender(this._blurPostProcesses, this._rtBlur, true);
            this._engine.unBindFramebuffer(this._rtBlur!);
        }
    }

    protected _createRenderTarget(): void {
        this._rt = this._engine.createRenderTargetTexture(
            { width: this._width, height: this._height },
            {
                generateMipMaps: false,
                type: this._textureType,
                format: this._textureFormat,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                generateDepthBuffer: this._generateDepthBuffer,
                generateStencilBuffer: false,
                samples: this._samples,
                label: `FluidRenderingRTT-${this._name}`,
            }
        );

        const renderTexture = this._rt.texture!;

        renderTexture.incrementReferences();

        this._texture = new Texture(null, this._scene);
        this._texture.name = "rtt" + this._name;
        this._texture._texture = renderTexture;
        this._texture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._texture.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._texture.anisotropicFilteringLevel = 1;
    }

    protected _createBlurPostProcesses(
        textureBlurSource: ThinTexture,
        textureType: number,
        textureFormat: number,
        blurSizeDivisor: number,
        debugName: string,
        useStandardBlur = false
    ): [RenderTargetWrapper, Texture, PostProcess[]] {
        const engine = this._scene.getEngine();
        const targetSize = new Vector2(Math.floor(this._blurTextureSizeX / blurSizeDivisor), Math.floor(this._blurTextureSizeY / blurSizeDivisor));
        const useBilinearFiltering =
            (textureType === Constants.TEXTURETYPE_FLOAT && engine.getCaps().textureFloatLinearFiltering) ||
            (textureType === Constants.TEXTURETYPE_HALF_FLOAT && engine.getCaps().textureHalfFloatLinearFiltering);

        const rtBlur = this._engine.createRenderTargetTexture(
            { width: targetSize.x, height: targetSize.y },
            {
                generateMipMaps: false,
                type: textureType,
                format: textureFormat,
                samplingMode: useBilinearFiltering ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                generateDepthBuffer: false,
                generateStencilBuffer: false,
                samples: this._samples,
                label: `FluidRenderingRTTBlur-${debugName}`,
            }
        );

        const renderTexture = rtBlur.texture!;

        renderTexture.incrementReferences();

        const texture = new Texture(null, this._scene);
        texture.name = "rttBlurred" + debugName;
        texture._texture = renderTexture;
        texture.wrapU = Texture.CLAMP_ADDRESSMODE;
        texture.wrapV = Texture.CLAMP_ADDRESSMODE;
        texture.anisotropicFilteringLevel = 1;

        if (useStandardBlur) {
            const kernelBlurXPostprocess = new PostProcess(
                "BilateralBlurX",
                "fluidRenderingStandardBlur",
                ["filterSize", "blurDir"],
                null,
                1,
                null,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                engine,
                true,
                null,
                textureType,
                undefined,
                undefined,
                undefined,
                textureFormat,
                this._shaderLanguage,
                async () => {
                    if (this.shaderLanguage === ShaderLanguage.WGSL) {
                        await import("../../ShadersWGSL/fluidRenderingStandardBlur.fragment");
                    } else {
                        await import("../../Shaders/fluidRenderingStandardBlur.fragment");
                    }
                }
            );
            kernelBlurXPostprocess.samples = this._samples;
            kernelBlurXPostprocess.externalTextureSamplerBinding = true;
            kernelBlurXPostprocess.onApplyObservable.add((effect) => {
                if (this._postProcessRunningIndex === 0) {
                    effect.setTexture("textureSampler", textureBlurSource);
                } else {
                    effect._bindTexture("textureSampler", kernelBlurXPostprocess.inputTexture.texture);
                }
                effect.setInt("filterSize", this.blurFilterSize);
                effect.setFloat2("blurDir", 1 / this._blurTextureSizeX, 0);
                this._postProcessRunningIndex++;
            });
            kernelBlurXPostprocess.onSizeChangedObservable.add(() => {
                kernelBlurXPostprocess._textures.forEach((rt) => {
                    rt.texture!.wrapU = Texture.CLAMP_ADDRESSMODE;
                    rt.texture!.wrapV = Texture.CLAMP_ADDRESSMODE;
                });
            });
            this._fixReusablePostProcess(kernelBlurXPostprocess);

            const kernelBlurYPostprocess = new PostProcess(
                "BilateralBlurY",
                "fluidRenderingStandardBlur",
                ["filterSize", "blurDir"],
                null,
                1,
                null,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                engine,
                true,
                null,
                textureType,
                undefined,
                undefined,
                undefined,
                textureFormat,
                this._shaderLanguage,
                async () => {
                    if (this.shaderLanguage === ShaderLanguage.WGSL) {
                        await import("../../ShadersWGSL/fluidRenderingStandardBlur.fragment");
                    } else {
                        await import("../../Shaders/fluidRenderingStandardBlur.fragment");
                    }
                }
            );
            kernelBlurYPostprocess.samples = this._samples;
            kernelBlurYPostprocess.onApplyObservable.add((effect) => {
                effect.setInt("filterSize", this.blurFilterSize);
                effect.setFloat2("blurDir", 0, 1 / this._blurTextureSizeY);
                this._postProcessRunningIndex++;
            });
            kernelBlurYPostprocess.onSizeChangedObservable.add(() => {
                kernelBlurYPostprocess._textures.forEach((rt) => {
                    rt.texture!.wrapU = Texture.CLAMP_ADDRESSMODE;
                    rt.texture!.wrapV = Texture.CLAMP_ADDRESSMODE;
                });
            });
            this._fixReusablePostProcess(kernelBlurYPostprocess);

            kernelBlurXPostprocess.autoClear = false;
            kernelBlurYPostprocess.autoClear = false;

            const blurList = [];
            for (let i = 0; i < this._blurNumIterations * 2; ++i) {
                blurList[i] = i & 1 ? kernelBlurYPostprocess : kernelBlurXPostprocess;
            }

            return [rtBlur, texture, blurList];
        } else {
            const uniforms: string[] = ["maxFilterSize", "blurDir", "projectedParticleConstant", "depthThreshold"];

            const kernelBlurXPostprocess = new PostProcess(
                "BilateralBlurX",
                "fluidRenderingBilateralBlur",
                uniforms,
                null,
                1,
                null,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                engine,
                true,
                null,
                textureType,
                undefined,
                undefined,
                undefined,
                textureFormat,
                this._shaderLanguage,
                async () => {
                    if (this.shaderLanguage === ShaderLanguage.WGSL) {
                        await import("../../ShadersWGSL/fluidRenderingBilateralBlur.fragment");
                    } else {
                        await import("../../Shaders/fluidRenderingBilateralBlur.fragment");
                    }
                }
            );
            kernelBlurXPostprocess.samples = this._samples;
            kernelBlurXPostprocess.externalTextureSamplerBinding = true;
            kernelBlurXPostprocess.onApplyObservable.add((effect) => {
                if (this._postProcessRunningIndex === 0) {
                    effect.setTexture("textureSampler", textureBlurSource);
                } else {
                    effect._bindTexture("textureSampler", kernelBlurXPostprocess.inputTexture.texture);
                }
                effect.setInt("maxFilterSize", this.blurMaxFilterSize);
                effect.setFloat2("blurDir", 1 / this._blurTextureSizeX, 0);
                effect.setFloat("projectedParticleConstant", this._getProjectedParticleConstant());
                effect.setFloat("depthThreshold", this._getDepthThreshold());
                this._postProcessRunningIndex++;
            });
            kernelBlurXPostprocess.onSizeChangedObservable.add(() => {
                kernelBlurXPostprocess._textures.forEach((rt) => {
                    rt.texture!.wrapU = Texture.CLAMP_ADDRESSMODE;
                    rt.texture!.wrapV = Texture.CLAMP_ADDRESSMODE;
                });
            });
            this._fixReusablePostProcess(kernelBlurXPostprocess);

            const kernelBlurYPostprocess = new PostProcess(
                "BilateralBlurY",
                "fluidRenderingBilateralBlur",
                uniforms,
                null,
                1,
                null,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                engine,
                true,
                null,
                textureType,
                undefined,
                undefined,
                undefined,
                textureFormat,
                this._shaderLanguage,
                async () => {
                    if (this.shaderLanguage === ShaderLanguage.WGSL) {
                        await import("../../ShadersWGSL/fluidRenderingBilateralBlur.fragment");
                    } else {
                        await import("../../Shaders/fluidRenderingBilateralBlur.fragment");
                    }
                }
            );
            kernelBlurYPostprocess.samples = this._samples;
            kernelBlurYPostprocess.onApplyObservable.add((effect) => {
                effect.setInt("maxFilterSize", this.blurMaxFilterSize);
                effect.setFloat2("blurDir", 0, 1 / this._blurTextureSizeY);
                effect.setFloat("projectedParticleConstant", this._getProjectedParticleConstant());
                effect.setFloat("depthThreshold", this._getDepthThreshold());
                this._postProcessRunningIndex++;
            });
            kernelBlurYPostprocess.onSizeChangedObservable.add(() => {
                kernelBlurYPostprocess._textures.forEach((rt) => {
                    rt.texture!.wrapU = Texture.CLAMP_ADDRESSMODE;
                    rt.texture!.wrapV = Texture.CLAMP_ADDRESSMODE;
                });
            });
            this._fixReusablePostProcess(kernelBlurYPostprocess);

            kernelBlurXPostprocess.autoClear = false;
            kernelBlurYPostprocess.autoClear = false;

            const blurList = [];
            for (let i = 0; i < this._blurNumIterations * 2; ++i) {
                blurList[i] = i & 1 ? kernelBlurYPostprocess : kernelBlurXPostprocess;
            }

            return [rtBlur, texture, blurList];
        }
    }

    private _fixReusablePostProcess(pp: PostProcess) {
        if (!pp.isReusable()) {
            return;
        }

        pp.onActivateObservable.add(() => {
            // undo what calling activate() does which will make sure we will retrieve the right texture when getting the input for the post process
            pp._currentRenderTextureInd = (pp._currentRenderTextureInd + 1) % 2;
        });
        pp.onApplyObservable.add(() => {
            // now we can advance to the next texture
            pp._currentRenderTextureInd = (pp._currentRenderTextureInd + 1) % 2;
        });
    }

    private _getProjectedParticleConstant() {
        return (this.blurFilterSize * this.particleSize * 0.05 * (this._height / 2)) / Math.tan((this._camera?.fov ?? (45 * Math.PI) / 180) / 2);
    }

    private _getDepthThreshold() {
        return (this.particleSize / 2) * this.blurDepthScale;
    }

    public dispose(): void {
        if (this.onDisposeObservable.hasObservers()) {
            this.onDisposeObservable.notifyObservers(this);
        }

        this._rt?.dispose();
        this._rt = null;
        this._texture?.dispose();
        this._texture = null;
        this._rtBlur?.dispose();
        this._rtBlur = null;
        this._textureBlurred?.dispose();
        this._textureBlurred = null;
        if (this._blurPostProcesses) {
            this._blurPostProcesses[0].dispose();
            this._blurPostProcesses[1].dispose();
        }
        this._blurPostProcesses = null;
    }
}
