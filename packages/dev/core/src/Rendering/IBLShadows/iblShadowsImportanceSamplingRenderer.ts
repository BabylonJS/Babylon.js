import { Constants } from "../../Engines/constants";
import type { AbstractEngine } from "../../Engines/abstractEngine";

import type { Scene } from "../../scene";
import { Texture } from "../../Materials/Textures/texture";
import type { TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { ProceduralTexture } from "../../Materials/Textures/Procedurals/proceduralTexture";
import type { IProceduralTextureCreationOptions } from "../../Materials/Textures/Procedurals/proceduralTexture";
import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import { Vector4 } from "../../Maths/math.vector";
import { RawTexture } from "../../Materials/Textures/rawTexture";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Observable } from "../../Misc/observable";
import type { CubeTexture } from "../../Materials/Textures/cubeTexture";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Build cdf maps for IBL importance sampling during IBL shadow computation.
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 */
export class _IblShadowsImportanceSamplingRenderer {
    private _scene: Scene;
    private _engine: AbstractEngine;

    private _cdfyPT: ProceduralTexture;
    private _icdfyPT: ProceduralTexture;
    private _cdfxPT: ProceduralTexture;
    private _icdfxPT: ProceduralTexture;
    private _iblSource: BaseTexture;

    /**
     * Gets the IBL source texture being used by the importance sampling renderer
     */
    public get iblSource(): BaseTexture {
        return this._iblSource;
    }

    /**
     * Sets the IBL source texture to be used by the importance sampling renderer.
     * This will trigger recreation of the importance sampling assets.
     */
    public set iblSource(source: BaseTexture) {
        if (this._iblSource === source) {
            return;
        }
        this._disposeTextures();
        this._iblSource = source;
        if (source.isCube) {
            if (source.isReadyOrNotBlocking()) {
                this._recreateAssetsFromNewIbl(source);
            } else {
                (source as CubeTexture).onLoadObservable.addOnce(this._recreateAssetsFromNewIbl.bind(this, source));
            }
        } else {
            if (source.isReadyOrNotBlocking()) {
                this._recreateAssetsFromNewIbl(source);
            } else {
                (source as Texture).onLoadObservable.addOnce(this._recreateAssetsFromNewIbl.bind(this, source));
            }
        }
    }

    private _recreateAssetsFromNewIbl(source: BaseTexture) {
        if (this._debugPass) {
            this._debugPass.dispose();
        }

        this._createTextures();

        if (this._debugPass) {
            // Recreate the debug pass because of the new textures
            this._createDebugPass();
        }

        // Once the textures are generated, notify that they are ready to use.
        this._icdfxPT.onGeneratedObservable.addOnce(() => {
            this.onReadyObservable.notifyObservers();
        });
    }

    /**
     * Return the cumulative distribution function (CDF) Y texture
     * @returns Return the cumulative distribution function (CDF) Y texture
     */
    public getIcdfyTexture(): ProceduralTexture {
        return this._icdfyPT;
    }

    /**
     * Return the cumulative distribution function (CDF) X texture
     * @returns Return the cumulative distribution function (CDF) X texture
     */
    public getIcdfxTexture(): ProceduralTexture {
        return this._icdfxPT;
    }

    /** Enable the debug view for this pass */
    public debugEnabled: boolean = false;
    private _debugPass: PostProcess;
    private _debugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);

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
    private _debugPassName: string = "Importance Sample Debug";

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
     * Instanciates the importance sampling renderer
     * @param scene Scene to attach to
     * @returns The importance sampling renderer
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();
    }

    /**
     * Observable that triggers when the importance sampling renderer is ready
     */
    public onReadyObservable: Observable<void> = new Observable<void>();

    private _createTextures() {
        const size: TextureSize = this._iblSource ? this._iblSource.getSize() : { width: 1, height: 1 };
        if (!this._iblSource) {
            this._iblSource = RawTexture.CreateRTexture(
                new Uint8Array([255]),
                1,
                1,
                this._scene,
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
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblShadowsCdfx.fragment"), import("../../ShadersWGSL/iblShadowsCdfy.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/iblShadowsCdfx.fragment"), import("../../Shaders/iblShadowsCdfy.fragment")]);
                }
            },
        };
        const icdfOptions: IProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_R,
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblShadowsIcdfx.fragment"), import("../../ShadersWGSL/iblShadowsIcdfy.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/iblShadowsIcdfx.fragment"), import("../../Shaders/iblShadowsIcdfy.fragment")]);
                }
            },
        };
        this._cdfyPT = new ProceduralTexture("cdfyTexture", { width: size.width, height: size.height + 1 }, "iblShadowsCdfy", this._scene, cdfOptions, false, false);
        this._cdfyPT.autoClear = false;
        this._cdfyPT.setTexture("iblSource", this._iblSource as Texture);
        this._cdfyPT.setInt("iblHeight", size.height);
        if (this._iblSource.isCube) {
            this._cdfyPT.defines = "#define IBL_USE_CUBE_MAP\n";
        }
        this._cdfyPT.refreshRate = 0;
        this._icdfyPT = new ProceduralTexture("icdfyTexture", { width: size.width, height: size.height }, "iblShadowsIcdfy", this._scene, icdfOptions, false, false);
        this._icdfyPT.autoClear = false;
        this._icdfyPT.setTexture("cdfy", this._cdfyPT);
        this._icdfyPT.refreshRate = 0;
        this._cdfxPT = new ProceduralTexture("cdfxTexture", { width: size.width + 1, height: 1 }, "iblShadowsCdfx", this._scene, cdfOptions, false, false);
        this._cdfxPT.autoClear = false;
        this._cdfxPT.setTexture("cdfy", this._cdfyPT);
        this._cdfxPT.refreshRate = 0;
        this._icdfxPT = new ProceduralTexture("icdfxTexture", { width: size.width, height: 1 }, "iblShadowsIcdfx", this._scene, icdfOptions, false, false);
        this._icdfxPT.autoClear = false;
        this._icdfxPT.setTexture("cdfx", this._cdfxPT);
        this._icdfxPT.refreshRate = 0;
    }

    private _disposeTextures() {
        this._cdfyPT?.dispose();
        this._icdfyPT?.dispose();
        this._cdfxPT?.dispose();
        this._icdfxPT?.dispose();
        this._iblSource?.dispose();
    }

    private _createDebugPass() {
        if (this._debugPass) {
            this._debugPass.dispose();
        }
        const isWebGPU = this._engine.isWebGPU;
        const debugOptions: PostProcessOptions = {
            width: this._scene.getEngine().getRenderWidth(),
            height: this._scene.getEngine().getRenderHeight(),
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine: this._engine,
            textureType: Constants.TEXTURETYPE_UNSIGNED_INT,
            uniforms: ["sizeParams"],
            samplers: ["cdfy", "icdfy", "cdfx", "icdfx", "iblSource"],
            defines: this._iblSource?.isCube ? "#define IBL_USE_CUBE_MAP\n" : "",
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                if (useWebGPU) {
                    list.push(import("../../ShadersWGSL/iblShadowsImportanceSamplingDebug.fragment"));
                } else {
                    list.push(import("../../Shaders/iblShadowsImportanceSamplingDebug.fragment"));
                }
            },
        };
        this._debugPass = new PostProcess(this._debugPassName, "iblShadowsImportanceSamplingDebug", debugOptions);
        const debugEffect = this._debugPass.getEffect();
        if (debugEffect) {
            debugEffect.defines = this._iblSource?.isCube ? "#define IBL_USE_CUBE_MAP\n" : "";
        }
        if (this._iblSource?.isCube) {
            this._debugPass.updateEffect("#define IBL_USE_CUBE_MAP\n");
        }
        this._debugPass.onApplyObservable.add((effect) => {
            effect.setTexture("cdfy", this._cdfyPT);
            effect.setTexture("icdfy", this._icdfyPT);
            effect.setTexture("cdfx", this._cdfxPT);
            effect.setTexture("icdfx", this._icdfxPT);
            effect.setTexture("iblSource", this._iblSource);
            effect.setFloat4("sizeParams", this._debugSizeParams.x, this._debugSizeParams.y, this._debugSizeParams.z, this._debugSizeParams.w);
        });
    }

    /**
     * Checks if the importance sampling renderer is ready
     * @returns true if the importance sampling renderer is ready
     */
    public isReady() {
        return (
            this._iblSource &&
            this._iblSource.name !== "Placeholder IBL Source" &&
            this._iblSource.isReady() &&
            this._cdfyPT &&
            this._cdfyPT.isReady() &&
            this._icdfyPT &&
            this._icdfyPT.isReady() &&
            this._cdfxPT &&
            this._cdfxPT.isReady() &&
            this._icdfxPT &&
            this._icdfxPT.isReady()
        );
    }

    /**
     * Disposes the importance sampling renderer and associated resources
     */
    public dispose() {
        this._disposeTextures();
        if (this._debugPass) {
            this._debugPass.dispose();
        }
    }
}
