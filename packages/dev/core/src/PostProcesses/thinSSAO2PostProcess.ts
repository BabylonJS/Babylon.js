import type { Nullable, Scene, EffectWrapperCreationOptions } from "core/index";
import { Constants } from "core/Engines/constants";
import { EffectWrapper } from "core/Materials/effectRenderer";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { Camera } from "core/Cameras/camera";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { RandomRange } from "core/Maths/math.scalar.functions";
import { Texture } from "core/Materials/Textures/texture";

/**
 * @internal
 */
export class ThinSSAO2PostProcess extends EffectWrapper {
    private static readonly ORTHO_DEPTH_PROJECTION = [1, 0, 0, 0, 1, 0, 0, 0, 1];

    private static readonly PERSPECTIVE_DEPTH_PROJECTION = [0, 0, 0, 0, 0, 0, 1, 1, 1];

    public static readonly FragmentUrl = "ssao2";

    public static readonly Uniforms = [
        "sampleSphere",
        "samplesFactor",
        "randTextureTiles",
        "totalStrength",
        "radius",
        "base",
        "range",
        "projection",
        "near",
        "texelSize",
        "xViewport",
        "yViewport",
        "viewport",
        "maxZ",
        "minZAspect",
        "depthProjection",
    ];

    public static readonly Samplers = ["randomSampler", "depthSampler", "normalSampler"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/ssao2.fragment"));
        } else {
            list.push(import("../Shaders/ssao2.fragment"));
        }
    }

    public camera: Nullable<Camera> = null;

    private _textureWidth = 0;

    public get textureWidth() {
        return this._textureWidth;
    }

    public set textureWidth(width: number) {
        if (this._textureWidth === width) {
            return;
        }
        this._textureWidth = width;
    }

    private _textureHeight = 0;

    public get textureHeight() {
        return this._textureHeight;
    }

    public set textureHeight(height: number) {
        if (this._textureHeight === height) {
            return;
        }
        this._textureHeight = height;
    }

    private _samples: number = 8;

    public set samples(n: number) {
        this._samples = n;
        this.updateEffect();
        this._sampleSphere = this._generateHemisphere();
    }
    public get samples(): number {
        return this._samples;
    }

    public totalStrength: number = 1.0;

    public radius: number = 2.0;

    public maxZ: number = 100.0;

    public minZAspect: number = 0.2;

    public base: number = 0;

    private _epsilon: number = 0.02;

    public set epsilon(n: number) {
        this._epsilon = n;
        this.updateEffect();
    }
    public get epsilon(): number {
        return this._epsilon;
    }

    public override updateEffect() {
        super.updateEffect(this._getDefinesForSSAO());
    }

    private _scene: Scene;
    private _randomTexture: Texture;
    private _sampleSphere: number[];

    constructor(name: string, scene: Scene, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: scene.getEngine(),
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinSSAO2PostProcess.FragmentUrl,
            uniforms: ThinSSAO2PostProcess.Uniforms,
            samplers: ThinSSAO2PostProcess.Samplers,
            defines: `#define SSAO\n#define SAMPLES 8\n#define EPSILON 0.0001`,
            shaderLanguage: scene.getEngine().isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        });

        this._scene = scene;

        this._createRandomTexture();

        this.updateEffect();
        this._sampleSphere = this._generateHemisphere();
    }

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        const camera = this.camera;
        if (!camera) {
            return;
        }

        const projectionMatrix = camera.getProjectionMatrix();

        effect.setArray3("sampleSphere", this._sampleSphere);
        effect.setFloat("randTextureTiles", 32.0);
        effect.setFloat("samplesFactor", 1 / this.samples);
        effect.setFloat("totalStrength", this.totalStrength);
        effect.setFloat2("texelSize", 1 / this.textureWidth, 1 / this.textureHeight);
        effect.setFloat("radius", this.radius);
        effect.setFloat("maxZ", this.maxZ);
        effect.setFloat("minZAspect", this.minZAspect);
        effect.setFloat("base", this.base);
        effect.setFloat("near", camera.minZ);
        if (camera.mode === Camera.PERSPECTIVE_CAMERA) {
            effect.setMatrix3x3("depthProjection", ThinSSAO2PostProcess.PERSPECTIVE_DEPTH_PROJECTION);
            const viewportSize = Math.tan(camera.fov / 2);
            if (camera.fovMode === Camera.FOVMODE_VERTICAL_FIXED) {
                effect.setFloat("xViewport", viewportSize * this._scene.getEngine().getAspectRatio(camera, true));
                effect.setFloat("yViewport", viewportSize);
            } else {
                effect.setFloat("xViewport", viewportSize);
                effect.setFloat("yViewport", viewportSize / this._scene.getEngine().getAspectRatio(camera, true));
            }
        } else {
            const halfWidth = this._scene.getEngine().getRenderWidth() / 2.0;
            const halfHeight = this._scene.getEngine().getRenderHeight() / 2.0;
            const orthoLeft = camera.orthoLeft ?? -halfWidth;
            const orthoRight = camera.orthoRight ?? halfWidth;
            const orthoBottom = camera.orthoBottom ?? -halfHeight;
            const orthoTop = camera.orthoTop ?? halfHeight;
            effect.setMatrix3x3("depthProjection", ThinSSAO2PostProcess.ORTHO_DEPTH_PROJECTION);
            effect.setFloat4("viewport", orthoLeft, orthoRight, orthoBottom, orthoTop);
        }
        effect.setMatrix("projection", projectionMatrix);

        effect.setTexture("randomSampler", this._randomTexture);
    }

    public override dispose() {
        this._randomTexture.dispose();

        super.dispose();
    }

    private _createRandomTexture(): void {
        const size = 128;

        const data = new Uint8Array(size * size * 4);
        const randVector = Vector2.Zero();
        for (let index = 0; index < data.length; ) {
            randVector.set(RandomRange(0, 1), RandomRange(0, 1)).normalize().scaleInPlace(255);
            data[index++] = Math.floor(randVector.x);
            data[index++] = Math.floor(randVector.y);
            data[index++] = 0;
            data[index++] = 255;
        }

        const texture = RawTexture.CreateRGBATexture(data, size, size, this._scene, false, false, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
        texture.name = "SSAORandomTexture";
        texture.wrapU = Texture.WRAP_ADDRESSMODE;
        texture.wrapV = Texture.WRAP_ADDRESSMODE;
        this._randomTexture = texture;
    }

    private _bits = new Uint32Array(1);

    //Van der Corput radical inverse
    private _radicalInverseVdC(i: number) {
        this._bits[0] = i;
        this._bits[0] = ((this._bits[0] << 16) | (this._bits[0] >> 16)) >>> 0;
        this._bits[0] = ((this._bits[0] & 0x55555555) << 1) | (((this._bits[0] & 0xaaaaaaaa) >>> 1) >>> 0);
        this._bits[0] = ((this._bits[0] & 0x33333333) << 2) | (((this._bits[0] & 0xcccccccc) >>> 2) >>> 0);
        this._bits[0] = ((this._bits[0] & 0x0f0f0f0f) << 4) | (((this._bits[0] & 0xf0f0f0f0) >>> 4) >>> 0);
        this._bits[0] = ((this._bits[0] & 0x00ff00ff) << 8) | (((this._bits[0] & 0xff00ff00) >>> 8) >>> 0);
        return this._bits[0] * 2.3283064365386963e-10; // / 0x100000000 or / 4294967296
    }

    private _hammersley(i: number, n: number) {
        return [i / n, this._radicalInverseVdC(i)];
    }

    private _hemisphereSampleUniform(u: number, v: number): Vector3 {
        const phi = v * 2.0 * Math.PI;
        // rejecting samples that are close to tangent plane to avoid z-fighting artifacts
        const cosTheta = 1.0 - u * 0.85;
        const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
        return new Vector3(Math.cos(phi) * sinTheta, Math.sin(phi) * sinTheta, cosTheta);
    }

    private _generateHemisphere(): number[] {
        const numSamples = this.samples;
        const result = [];
        let vector;

        let i = 0;
        while (i < numSamples) {
            if (numSamples < 16) {
                vector = this._hemisphereSampleUniform(Math.random(), Math.random());
            } else {
                const rand = this._hammersley(i, numSamples);
                vector = this._hemisphereSampleUniform(rand[0], rand[1]);
            }

            result.push(vector.x, vector.y, vector.z);
            i++;
        }

        return result;
    }

    private _getDefinesForSSAO() {
        const epsilon = this._epsilon ?? 0.02;
        const samples = this._samples ?? 8;

        let defines = `#define SSAO\n#define SAMPLES ${samples}\n#define EPSILON ${epsilon.toFixed(4)}`;

        if (this.camera?.mode === Camera.ORTHOGRAPHIC_CAMERA) {
            defines += `\n#define ORTHOGRAPHIC_CAMERA`;
        }

        return defines;
    }
}
