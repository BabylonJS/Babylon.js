import { Constants } from "../Engines/constants";
import type { AbstractEngine } from "../Engines/abstractEngine";

import type { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import type { TextureSize } from "../Materials/Textures/textureCreationOptions";
import { ProceduralTexture } from "../Materials/Textures/Procedurals/proceduralTexture";
import type { IProceduralTextureCreationOptions } from "../Materials/Textures/Procedurals/proceduralTexture";
import { PostProcess } from "../PostProcesses/postProcess";
import type { PostProcessOptions } from "../PostProcesses/postProcess";
import { Vector4 } from "../Maths/math.vector";
import { RawTexture } from "../Materials/Textures/rawTexture";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import { Observable } from "../Misc/observable";
import type { CubeTexture } from "../Materials/Textures/cubeTexture";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Engine } from "../Engines/engine";
import { _WarnImport } from "../Misc/devTools";
import type { Nullable } from "../types";
import { EngineStore } from "../Engines/engineStore";

/**
 * Build cdf maps to be used for IBL importance sampling.
 */
export class IblCdfGenerator {
    private _scene: Nullable<Scene>;
    private _engine: AbstractEngine;

    private _cdfyPT: ProceduralTexture;
    private _cdfxPT: ProceduralTexture;
    private _icdfPT: ProceduralTexture;
    private _scaledLuminancePT: ProceduralTexture;
    private _iblSource: Nullable<BaseTexture>;
    private _dummyTexture: RawTexture;
    /**
     * Gets the IBL source texture being used by the CDF renderer
     */
    public get iblSource(): Nullable<BaseTexture> {
        return this._iblSource;
    }

    /**
     * Sets the IBL source texture to be used by the CDF renderer.
     * This will trigger recreation of the CDF assets.
     */
    public set iblSource(source: Nullable<BaseTexture>) {
        if (this._iblSource === source) {
            return;
        }
        this._disposeTextures();
        this._iblSource = source;
        if (!source) {
            return;
        }
        if (source.isCube) {
            if (source.isReadyOrNotBlocking()) {
                this._recreateAssetsFromNewIbl();
            } else {
                (source as CubeTexture).onLoadObservable.addOnce(this._recreateAssetsFromNewIbl.bind(this, source));
            }
        } else {
            if (source.isReadyOrNotBlocking()) {
                this._recreateAssetsFromNewIbl();
            } else {
                (source as Texture).onLoadObservable.addOnce(this._recreateAssetsFromNewIbl.bind(this, source));
            }
        }
    }

    private _recreateAssetsFromNewIbl() {
        if (this._debugPass) {
            this._debugPass.dispose();
        }

        this._createTextures();

        if (this._debugPass) {
            // Recreate the debug pass because of the new textures
            this._createDebugPass();
        }
    }

    /**
     * Return the cumulative distribution function (CDF) texture
     * @returns Return the cumulative distribution function (CDF) texture
     */
    public getIcdfTexture(): Texture {
        return this._icdfPT ? this._icdfPT : this._dummyTexture;
    }

    /** Enable the debug view for this pass */
    public debugEnabled: boolean = false;
    private _debugPass: PostProcess;
    private _debugSizeParams: Vector4 = new Vector4(0.0, 0.0, 1.0, 1.0);

    /**
     * Sets params that control the position and scaling of the debug display on the screen.
     * @param x Screen X offset of the debug display (0-1)
     * @param y Screen Y offset of the debug display (0-1)
     * @param widthScale X scale of the debug display (0-1)
     * @param heightScale Y scale of the debug display (0-1)
     */
    public setDebugDisplayParams(x: number, y: number, widthScale: number, heightScale: number) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }

    /**
     * The name of the debug pass post process
     */
    public get debugPassName(): string {
        return this._debugPassName;
    }
    private _debugPassName: string = "CDF Debug";

    /**
     * Gets the debug pass post process
     * @returns The post process
     */
    public getDebugPassPP(): PostProcess {
        if (!this._debugPass) {
            this._createDebugPass();
        }
        return this._debugPass;
    }

    /**
     * @internal
     */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _WarnImport("IblCdfGeneratorSceneComponentSceneComponent");
    };

    /**
     * Instanciates the CDF renderer
     * @param sceneOrEngine Scene to attach to
     * @returns The CDF renderer
     */
    constructor(sceneOrEngine: Nullable<Scene | AbstractEngine>) {
        if (sceneOrEngine) {
            if (IblCdfGenerator._IsScene(sceneOrEngine)) {
                this._scene = sceneOrEngine;
            } else {
                this._engine = sceneOrEngine;
            }
        } else {
            this._scene = EngineStore.LastCreatedScene;
        }
        if (this._scene) {
            this._engine = this._scene.getEngine();
        }
        const blackPixels = new Uint16Array([0, 0, 0, 255]);
        this._dummyTexture = new RawTexture(blackPixels, 1, 1, Engine.TEXTUREFORMAT_RGBA, sceneOrEngine, false, false, undefined, Constants.TEXTURETYPE_HALF_FLOAT);
        if (this._scene) {
            IblCdfGenerator._SceneComponentInitialization(this._scene);
        }
    }

    /**
     * Observable that triggers when the CDF renderer is ready
     */
    public onGeneratedObservable: Observable<void> = new Observable<void>();

    private _createTextures() {
        const size: TextureSize = this._iblSource ? { width: this._iblSource.getSize().width, height: this._iblSource.getSize().height } : { width: 1, height: 1 };
        if (!this._iblSource) {
            this._iblSource = RawTexture.CreateRTexture(
                new Uint8Array([255]),
                1,
                1,
                this._engine,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            this._iblSource.name = "Placeholder IBL Source";
        }

        if (this._iblSource!.isCube) {
            size.width *= 4;
            size.height *= 2;
            // Force the resolution to be a power of 2 because we rely on the
            // auto-mipmap generation for the scaled luminance texture to produce
            // a 1x1 mip that represents the true average pixel intensity of the IBL.
            size.width = 1 << Math.floor(Math.log2(size.width));
            size.height = 1 << Math.floor(Math.log2(size.height));
        }

        const isWebGPU = this._engine.isWebGPU;
        // Create CDF maps (Cumulative Distribution Function) to assist in importance sampling
        const cdfOptions: IProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_R,
            type: Constants.TEXTURETYPE_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            gammaSpace: false,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../ShadersWGSL/iblCdfx.fragment"), import("../ShadersWGSL/iblCdfy.fragment"), import("../ShadersWGSL/iblScaledLuminance.fragment")]);
                } else {
                    await Promise.all([import("../Shaders/iblCdfx.fragment"), import("../Shaders/iblCdfy.fragment"), import("../Shaders/iblScaledLuminance.fragment")]);
                }
            },
        };
        const icdfOptions: IProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            gammaSpace: false,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../ShadersWGSL/iblIcdf.fragment")]);
                } else {
                    await Promise.all([import("../Shaders/iblIcdf.fragment")]);
                }
            },
        };
        this._cdfyPT = new ProceduralTexture("cdfyTexture", { width: size.width, height: size.height + 1 }, "iblCdfy", this._scene, cdfOptions, false, false);
        this._cdfyPT.autoClear = false;
        this._cdfyPT.setTexture("iblSource", this._iblSource);
        this._cdfyPT.setInt("iblHeight", size.height);
        this._cdfyPT.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this._cdfyPT.refreshRate = 0;
        if (this._iblSource.isCube) {
            this._cdfyPT.defines = "#define IBL_USE_CUBE_MAP\n";
        }

        this._cdfxPT = new ProceduralTexture("cdfxTexture", { width: size.width + 1, height: 1 }, "iblCdfx", this._scene, cdfOptions, false, false);
        this._cdfxPT.autoClear = false;
        this._cdfxPT.setTexture("cdfy", this._cdfyPT);
        this._cdfxPT.refreshRate = 0;
        this._cdfxPT.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;

        this._scaledLuminancePT = new ProceduralTexture(
            "iblScaledLuminance",
            { width: size.width, height: size.height },
            "iblScaledLuminance",
            this._scene,
            { ...cdfOptions, samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, generateMipMaps: true },
            true,
            false
        );
        this._scaledLuminancePT.autoClear = false;
        this._scaledLuminancePT.setTexture("iblSource", this._iblSource);
        this._scaledLuminancePT.setInt("iblHeight", size.height);
        this._scaledLuminancePT.setInt("iblWidth", size.width);
        this._scaledLuminancePT.refreshRate = 0;
        if (this._iblSource.isCube) {
            this._scaledLuminancePT.defines = "#define IBL_USE_CUBE_MAP\n";
        }
        this._icdfPT = new ProceduralTexture("icdfTexture", { width: size.width, height: size.height }, "iblIcdf", this._scene, icdfOptions, false, false);
        this._icdfPT.autoClear = false;
        this._icdfPT.setTexture("cdfy", this._cdfyPT);
        this._icdfPT.setTexture("cdfx", this._cdfxPT);
        this._icdfPT.setTexture("iblSource", this._iblSource);
        this._icdfPT.setTexture("scaledLuminanceSampler", this._scaledLuminancePT);
        this._icdfPT.refreshRate = 0;
        this._icdfPT.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        this._icdfPT.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        if (this._iblSource.isCube) {
            this._icdfPT.defines = "#define IBL_USE_CUBE_MAP\n";
        }
        // Once the textures are generated, notify that they are ready to use.
        this._icdfPT.onGeneratedObservable.addOnce(() => {
            this.onGeneratedObservable.notifyObservers();
        });
    }

    private _disposeTextures() {
        this._cdfyPT?.dispose();
        this._cdfxPT?.dispose();
        this._icdfPT?.dispose();
        this._scaledLuminancePT?.dispose();
    }

    private _createDebugPass() {
        if (this._debugPass) {
            this._debugPass.dispose();
        }
        const isWebGPU = this._engine.isWebGPU;
        const debugOptions: PostProcessOptions = {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine: this._engine,
            textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            uniforms: ["sizeParams"],
            samplers: ["cdfy", "icdf", "cdfx", "iblSource"],
            defines: this._iblSource?.isCube ? "#define IBL_USE_CUBE_MAP\n" : "",
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                if (useWebGPU) {
                    list.push(import("../ShadersWGSL/iblCdfDebug.fragment"));
                } else {
                    list.push(import("../Shaders/iblCdfDebug.fragment"));
                }
            },
        };
        this._debugPass = new PostProcess(this._debugPassName, "iblCdfDebug", debugOptions);
        const debugEffect = this._debugPass.getEffect();
        if (debugEffect) {
            debugEffect.defines = this._iblSource?.isCube ? "#define IBL_USE_CUBE_MAP\n" : "";
        }
        if (this._iblSource?.isCube) {
            this._debugPass.updateEffect("#define IBL_USE_CUBE_MAP\n");
        }
        this._debugPass.onApplyObservable.add((effect) => {
            effect.setTexture("cdfy", this._cdfyPT);
            effect.setTexture("icdf", this._icdfPT);
            effect.setTexture("cdfx", this._cdfxPT);
            effect.setTexture("iblSource", this._iblSource);
            effect.setFloat4("sizeParams", this._debugSizeParams.x, this._debugSizeParams.y, this._debugSizeParams.z, this._debugSizeParams.w);
        });
    }

    /**
     * Checks if the CDF renderer is ready
     * @returns true if the CDF renderer is ready
     */
    public isReady() {
        return (
            this._iblSource &&
            this._iblSource.name !== "Placeholder IBL Source" &&
            this._iblSource.isReady() &&
            this._cdfyPT &&
            this._cdfyPT.isReady() &&
            this._icdfPT &&
            this._icdfPT.isReady() &&
            this._cdfxPT &&
            this._cdfxPT.isReady() &&
            this._scaledLuminancePT &&
            this._scaledLuminancePT.isReady()
        );
    }

    /**
     * Explicitly trigger generation of CDF maps when they are ready to render.
     * @returns Promise that resolves when the CDF maps are rendered.
     */
    public renderWhenReady(): Promise<void> {
        // Once the textures are generated, notify that they are ready to use.
        this._icdfPT.onGeneratedObservable.addOnce(() => {
            this.onGeneratedObservable.notifyObservers();
        });
        const promises: Array<Promise<void>> = [];
        const renderTargets: Array<ProceduralTexture> = [this._cdfyPT, this._cdfxPT, this._scaledLuminancePT, this._icdfPT];
        for (const target of renderTargets) {
            promises.push(
                new Promise((resolve) => {
                    if (target.isReady()) {
                        resolve();
                    } else {
                        target.getEffect().executeWhenCompiled(() => {
                            resolve();
                        });
                    }
                })
            );
        }
        return Promise.all(promises).then(() => {
            for (const target of renderTargets) {
                target.render();
            }
        });
    }

    /**
     * Disposes the CDF renderer and associated resources
     */
    public dispose() {
        this._disposeTextures();
        this._dummyTexture.dispose();
        if (this._debugPass) {
            this._debugPass.dispose();
        }
        this.onGeneratedObservable.clear();
    }

    private static _IsScene(sceneOrEngine: Scene | AbstractEngine): sceneOrEngine is Scene {
        return sceneOrEngine.getClassName() === "Scene";
    }
}
