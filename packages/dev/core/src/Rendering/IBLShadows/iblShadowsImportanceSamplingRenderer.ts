import { Constants } from "../../Engines/constants";
import type { AbstractEngine } from "../../Engines/abstractEngine";

import type { Scene } from "../../scene";
import { Texture } from "../../Materials/Textures/texture";
import type { TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { ProceduralTexture } from "../../Materials/Textures/Procedurals/proceduralTexture";
import type { IProceduralTextureCreationOptions } from "../../Materials/Textures/Procedurals/proceduralTexture";
// import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer";
// import { Logger } from "../Misc/logger";
import "../../Shaders/importanceSamplingDebug.fragment";
import "../../Shaders/iblShadowsCdfx.fragment";
import "../../Shaders/iblShadowsIcdfx.fragment";
import "../../Shaders/iblShadowsCdfy.fragment";
import "../../Shaders/iblShadowsIcdfy.fragment";
import { PostProcess } from "../../PostProcesses/postProcess";
import { Vector4 } from "../../Maths/math.vector";
import { RawTexture } from "../../Materials/Textures/rawTexture";

/**
 * Build cdf maps for IBL importance sampling during IBL shadow computation.
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsImportanceSamplingRenderer {
    private _scene: Scene;
    private _engine: AbstractEngine;

    private _cdfyPT: ProceduralTexture;
    private _icdfyPT: ProceduralTexture;
    private _cdfxPT: ProceduralTexture;
    private _icdfxPT: ProceduralTexture;
    private _iblSource: Texture;
    public get iblSource(): Texture {
        return this._iblSource;
    }
    public set iblSource(source: Texture) {
        if (this._iblSource === source) {
            return;
        }
        this._disposeTextures();
        this._iblSource = source;
        this._createTextures();

        if (this._debugPass) {
            this._createDebugPass();
        }
    }
    public getIcdfyTexture(): ProceduralTexture {
        return this._icdfyPT;
    }
    public getIcdfxTexture(): ProceduralTexture {
        return this._icdfxPT;
    }

    private _debugPass: PostProcess;
    private _debugEnabled: boolean = false;
    private _debugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);
    public setDebugDisplayParams(x: number, y: number, widthScale: number, heightScale: number) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }
    public get debugEnabled(): boolean {
        return this._debugEnabled;
    }

    public set debugEnabled(enabled: boolean) {
        if (this._debugEnabled === enabled) {
            return;
        }
        this._debugEnabled = enabled;
        if (enabled) {
            this._createDebugPass();
        } else {
            if (this._debugPass) {
                this._debugPass.dispose();
            }
        }
    }

    /**
     * Instanciates the importance sampling renderer
     * @param scene Scene to attach to
     * @returns The importance sampling renderer
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._createTextures();
    }

    private _createTextures() {
        const size: TextureSize = this._iblSource ? this._iblSource.getSize() : { width: 1, height: 1 };
        if (!this._iblSource) {
            this._iblSource = RawTexture.CreateRGBTexture(
                new Uint8Array([255, 0, 0]),
                1,
                1,
                this._scene,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            this._iblSource.isBlocking = true;
        }

        if (this._iblSource!.isCube) {
            size.width *= 4;
            size.height *= 2;
        }

        // Create CDF maps (Cumulative Distribution Function) to assist in importance sampling
        const cdfOptions: IProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        };
        const icdfOptions: IProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        };
        this._cdfyPT = new ProceduralTexture("cdfyTexture", { width: size.width, height: size.height + 1 }, "iblShadowsCdfy", this._scene, cdfOptions, false, false);
        this._cdfyPT.autoClear = false;
        this._cdfyPT.setTexture("iblSource", this._iblSource);
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
        this._cdfyPT.dispose();
        this._icdfyPT.dispose();
        this._cdfxPT.dispose();
        this._icdfxPT.dispose();
    }

    private _createDebugPass() {
        if (this._debugPass) {
            this._debugPass.dispose();
        }
        this._debugPass = new PostProcess(
            "Importance Sample Debug",
            "importanceSamplingDebug",
            ["sizeParams"], // attributes
            ["cdfy", "icdfy", "cdfx", "icdfx", "iblSource"], // textures
            1.0, // options
            this._scene.activeCamera, // camera
            Texture.BILINEAR_SAMPLINGMODE, // sampling
            this._engine,
            true,
            this._iblSource?.isCube ? "#define IBL_USE_CUBE_MAP\n" : ""
        );
        this._debugPass.onApply = (effect) => {
            effect.setTexture("cdfy", this._cdfyPT);
            effect.setTexture("icdfy", this._icdfyPT);
            effect.setTexture("cdfx", this._cdfxPT);
            effect.setTexture("icdfx", this._icdfxPT);
            effect.setTexture("iblSource", this._iblSource);
            effect.setFloat4("sizeParams", this._debugSizeParams.x, this._debugSizeParams.y, this._debugSizeParams.z, this._debugSizeParams.w);
            if (this._iblSource!.isCube) {
                effect.defines = "#define IBL_USE_CUBE_MAP\n";
            }
        };
    }

    /**
     * Checks if the importance sampling renderer is ready
     * @returns true if the importance sampling renderer is ready
     */
    public isReady() {
        return this._iblSource && this._iblSource.isReady() && this._cdfyPT.isReady() && this._icdfyPT.isReady() && this._cdfxPT.isReady() && this._icdfxPT.isReady();
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
