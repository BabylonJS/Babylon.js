import { Constants } from "../Engines/constants";
import type { AbstractEngine } from "../Engines/abstractEngine";

import type { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import type { TextureSize } from "../Materials/Textures/textureCreationOptions";
import { CustomProceduralTexture } from "../Materials/Textures/Procedurals/customProceduralTexture";
import type { ICustomProceduralTextureCreationOptions } from "../Materials/Textures/Procedurals/customProceduralTexture";
// import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer";
// import { Logger } from "../Misc/logger";
import "../Shaders/importanceSamplingDebug.fragment";
import { PostProcess } from "../PostProcesses/postProcess";
import { Vector4 } from "../Maths/math.vector";

const cdfyFragment = `
    precision highp sampler2D;
    #define PI 3.1415927
    varying vec2 vUV;

    uniform sampler2D iblSource;
    uniform float iblLod;

    float fetchPanoramic(ivec2 Coords, float envmapHeight) {
        return sin(PI * (float(Coords.y) + 0.5) / envmapHeight) * dot(texelFetch(iblSource, Coords, int(iblLod)).rgb, vec3(0.3, 0.6, 0.1));
    }
    
    void main(void) {

        // ***** Display all slices as a grid *******
        ivec2 size = textureSize(iblSource, 0);
        ivec2 currentPixel = ivec2(max(vUV * vec2(size.x, size.y + 1) - vec2(0.5), vec2(0.0)));
        
        float cdfy = 0.0;
        for (int y = 1; y <= currentPixel.y; y++) {
            cdfy += fetchPanoramic(ivec2(currentPixel.x, y - 1), float(size.y));
        }
        gl_FragColor = vec4(cdfy, 0.0, 0.0, 1.0);
    }
`;

const icdfyFragment = `
    precision highp sampler2D;
    #define PI 3.1415927
    varying vec2 vUV;

    uniform sampler2D cdfy;
    
    float fetchCDF(int y, int invocationId) {
        return texelFetch(cdfy, ivec2(invocationId, y), 0).x;
    }

    float bisect(int size, float target, int invocationId)
    {
        int a = 0, b = size - 1;
        while (b - a > 1) {
            int c = a + b >> 1;
            if (fetchCDF(c, invocationId) < target)
                a = c;
            else
                b = c;
        }
        return mix(float(a), float(b), (target - fetchCDF(a, invocationId)) / (fetchCDF(b, invocationId) - fetchCDF(a,invocationId))) / float(size - 1);
    }
    
    void main(void) {

        ivec2 cdfSize = textureSize(cdfy, 0);
        int cdfHeight = cdfSize.y;
        ivec2 currentPixel = ivec2(max(vUV * vec2(cdfSize.x, cdfSize.y - 1) - vec2(0.5), vec2(0.0)));

        if (currentPixel.y == 0)
        {
            gl_FragColor = vec4(0.0);
        }
        else if (currentPixel.y == cdfHeight - 2) {
            gl_FragColor = vec4(1.0);
        } else {
            float target = fetchCDF(cdfHeight - 1, currentPixel.x) * float(currentPixel.y) / float(cdfHeight - 2);
            gl_FragColor = vec4(vec3(bisect(cdfHeight, target, currentPixel.x)), 1.0);
        }
    }
`;

const cdfxFragment = `
    precision highp sampler2D;
    #define PI 3.1415927
    varying vec2 vUV;

    uniform sampler2D cdfy;
    void main(void) {

        ivec2 cdfyRes = textureSize(cdfy, 0);
        ivec2 currentPixel = ivec2(max(vUV * vec2(cdfyRes.x + 1, 1) - vec2(0.5), vec2(0.0)));

        float cdfx = 0.0;
        for (int x = 1; x <= currentPixel.x; x++) {
            cdfx += texelFetch(cdfy, ivec2(x - 1, cdfyRes.y - 1), 0).x;
        }
        gl_FragColor = vec4(vec3(cdfx), 1.0);
    }
`;

const icdfxFragment = `
    precision highp sampler2D;
    #define PI 3.1415927
    varying vec2 vUV;

    uniform sampler2D cdfx;
    
    float fetchCDF(int x) {
        return texelFetch(cdfx, ivec2(x, 0), 0).x;
    }

    float bisect(int size, float target)
    {
        int a = 0, b = size - 1;
        while (b - a > 1) {
            int c = a + b >> 1;
            if (fetchCDF(c) < target)
                a = c;
            else
                b = c;
        }
        return mix(float(a), float(b), (target - fetchCDF(a)) / (fetchCDF(b) - fetchCDF(a))) / float(size - 1);
    }
    
    void main(void) {

        ivec2 cdfSize = textureSize(cdfx, 0);
        int cdfWidth = cdfSize.x;
        int icdfWidth = cdfWidth - 1;
        ivec2 currentPixel = ivec2(max(vUV * vec2(icdfWidth, 1) - vec2(0.5), vec2(0.0)));

        if (currentPixel.x == 0)
        {
            gl_FragColor = vec4(0.0);
        }
        else if (currentPixel.x == icdfWidth - 1) {
            gl_FragColor = vec4(1.0);
        } else {
            float target = fetchCDF(cdfWidth - 1) * float(currentPixel.x) / float(icdfWidth - 1);
            gl_FragColor = vec4(vec3(bisect(cdfWidth, target)), 1.0);
        }
    }
`;

/**
 * Build cdf maps for IBL importance sampling during IBL shadow computation.
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsImportanceSamplingRenderer {
    private _scene: Scene;
    private _engine: AbstractEngine;

    private _cdfyPT: CustomProceduralTexture;
    private _icdfyPT: CustomProceduralTexture;
    private _cdfxPT: CustomProceduralTexture;
    private _icdfxPT: CustomProceduralTexture;
    private _iblSource: Texture;
    public get iblSource(): Texture {
        return this._iblSource;
    }
    public set iblSource(source: Texture) {
        this._iblSource = source;
        this._resizeTextures();
    }
    public getIcdfyTexture(): CustomProceduralTexture {
        return this._icdfyPT;
    }
    public getIcdfxTexture(): CustomProceduralTexture {
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
            this._debugPass = new PostProcess(
                "Importance Sample Debug",
                "importanceSamplingDebug",
                ["sizeParams"], // attributes
                ["cdfy", "icdfy", "cdfx", "icdfx", "iblSource"], // textures
                1.0, // options
                this._scene.activeCamera, // camera
                Texture.BILINEAR_SAMPLINGMODE, // sampling
                this._engine // engine
            );
            this._debugPass.onApply = (effect) => {
                effect.setTexture("cdfy", this._cdfyPT);
                effect.setTexture("icdfy", this._icdfyPT);
                effect.setTexture("cdfx", this._cdfxPT);
                effect.setTexture("icdfx", this._icdfxPT);
                effect.setTexture("iblSource", this._iblSource);
                effect.setFloat4("sizeParams", this._debugSizeParams.x, this._debugSizeParams.y, this._debugSizeParams.z, this._debugSizeParams.w);
            };
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

    private _resizeTextures() {
        if (!this._iblSource || !this._cdfyPT) {
            this._createTextures();
        }
        const size = this._iblSource!.getSize();
        this._cdfyPT.resize({ width: size.width, height: size.height + 1 }, false);
        this._icdfyPT.resize({ width: size.width, height: size.height }, false);
        this._cdfxPT.resize({ width: size.width + 1, height: 1 }, false);
        this._icdfxPT.resize({ width: size.width, height: 1 }, false);
        this._cdfyPT.setTexture("iblSource", this._iblSource);
        this._icdfyPT.setTexture("cdfy", this._cdfyPT);
        this._cdfxPT.setTexture("cdfy", this._cdfyPT);
        this._icdfxPT.setTexture("cdfx", this._cdfxPT);
    }

    private _createTextures() {
        const size: TextureSize = this._iblSource ? this._iblSource.getSize() : { width: 1, height: 1 };

        const cdfOptions: ICustomProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_R,
            type: Constants.TEXTURETYPE_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            skipJson: true,
        };
        const icdfOptions: ICustomProceduralTextureCreationOptions = {
            generateDepthBuffer: false,
            generateMipMaps: false,
            format: Constants.TEXTUREFORMAT_R,
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            skipJson: true,
        };
        this._cdfyPT = new CustomProceduralTexture(
            "cdfyTexture",
            { fragmentSource: cdfyFragment } as any,
            { width: size.width, height: size.height + 1 },
            this._scene,
            cdfOptions,
            false,
            true
        );
        this._cdfyPT.setTexture("iblSource", this._iblSource);
        this._icdfyPT = new CustomProceduralTexture(
            "icdfyTexture",
            { fragmentSource: icdfyFragment } as any,
            { width: size.width, height: size.height },
            this._scene,
            icdfOptions,
            false,
            true
        );
        this._icdfyPT.setTexture("cdfy", this._cdfyPT);
        this._cdfxPT = new CustomProceduralTexture(
            "cdfxTexture",
            { fragmentSource: cdfxFragment } as any,
            { width: size.width + 1, height: 1 },
            this._scene,
            cdfOptions,
            false,
            true
        );
        this._cdfxPT.setTexture("cdfy", this._cdfyPT);
        this._icdfxPT = new CustomProceduralTexture(
            "icdfxTexture",
            { fragmentSource: icdfxFragment } as any,
            { width: size.width, height: 1 },
            this._scene,
            icdfOptions,
            false,
            true
        );
        this._icdfxPT.setTexture("cdfx", this._cdfxPT);
    }

    private _disposeTextures() {
        this._cdfyPT.dispose();
        this._icdfyPT.dispose();
        this._cdfxPT.dispose();
        this._icdfxPT.dispose();
    }

    /**
     * Checks if the importance sampling renderer is ready
     * @returns true if the importance sampling renderer is ready
     */
    public isReady() {
        return true;
    }

    /**
     * Disposes the importance sampling renderer and associated resources
     */
    public dispose() {
        this._disposeTextures();
    }
}
