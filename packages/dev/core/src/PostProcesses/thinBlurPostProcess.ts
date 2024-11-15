// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions, Vector2, Effect } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { ShaderLanguage } from "../Materials/shaderLanguage";
import { Engine } from "../Engines/engine";

/**
 * Post process used to apply a blur effect
 */
export class ThinBlurPostProcess extends EffectWrapper {
    /**
     * The vertex shader url
     */
    public static readonly VertexUrl = "kernelBlur";

    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "kernelBlur";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["delta", "direction"];

    /**
     * The list of samplers used by the effect
     */
    public static readonly Samplers = ["circleOfConfusionSampler"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/kernelBlur.fragment"), import("../ShadersWGSL/kernelBlur.vertex")]));
        } else {
            list.push(Promise.all([import("../Shaders/kernelBlur.fragment"), import("../Shaders/kernelBlur.vertex")]));
        }
    }

    protected _kernel: number;
    protected _idealKernel: number;
    protected _packedFloat: boolean = false;
    private _staticDefines: string = "";

    /**
     * Constructs a new blur post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param direction Direction in which to apply the blur
     * @param kernel Kernel size of the blur
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, direction?: Vector2, kernel?: number, options?: EffectWrapperCreationOptions) {
        const blockCompilationFinal = !!options?.blockCompilation;
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinBlurPostProcess.FragmentUrl,
            uniforms: ThinBlurPostProcess.Uniforms,
            samplers: ThinBlurPostProcess.Samplers,
            vertexUrl: ThinBlurPostProcess.VertexUrl,
            blockCompilation: true,
        });

        this.options.blockCompilation = blockCompilationFinal;

        if (direction !== undefined) {
            this.direction = direction;
        }
        if (kernel !== undefined) {
            this.kernel = kernel;
        }
    }

    /**
     * Width of the texture to apply the blur on
     */
    public textureWidth: number = 0;

    /**
     * Height of the texture to apply the blur on
     */
    public textureHeight: number = 0;

    /** The direction in which to blur the image. */
    public direction: Vector2;

    /**
     * Sets the length in pixels of the blur sample region
     */
    public set kernel(v: number) {
        if (this._idealKernel === v) {
            return;
        }

        v = Math.max(v, 1);
        this._idealKernel = v;
        this._kernel = this._nearestBestKernel(v);
        if (!this.options.blockCompilation) {
            this._updateParameters();
        }
    }

    /**
     * Gets the length in pixels of the blur sample region
     */
    public get kernel(): number {
        return this._idealKernel;
    }

    /**
     * Sets whether or not the blur needs to unpack/repack floats
     */
    public set packedFloat(v: boolean) {
        if (this._packedFloat === v) {
            return;
        }
        this._packedFloat = v;
        if (!this.options.blockCompilation) {
            this._updateParameters();
        }
    }

    /**
     * Gets whether or not the blur is unpacking/repacking floats
     */
    public get packedFloat(): boolean {
        return this._packedFloat;
    }

    public override bind() {
        super.bind();
        this._drawWrapper.effect!.setFloat2("delta", (1 / this.textureWidth) * this.direction.x, (1 / this.textureHeight) * this.direction.y);
    }

    /** @internal */
    public _updateParameters(onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void): void {
        // Generate sampling offsets and weights
        const N = this._kernel;
        const centerIndex = (N - 1) / 2;

        // Generate Gaussian sampling weights over kernel
        let offsets = [];
        let weights = [];
        let totalWeight = 0;
        for (let i = 0; i < N; i++) {
            const u = i / (N - 1);
            const w = this._gaussianWeight(u * 2.0 - 1);
            offsets[i] = i - centerIndex;
            weights[i] = w;
            totalWeight += w;
        }

        // Normalize weights
        for (let i = 0; i < weights.length; i++) {
            weights[i] /= totalWeight;
        }

        // Optimize: combine samples to take advantage of hardware linear sampling
        // Walk from left to center, combining pairs (symmetrically)
        const linearSamplingWeights = [];
        const linearSamplingOffsets = [];

        const linearSamplingMap = [];

        for (let i = 0; i <= centerIndex; i += 2) {
            const j = Math.min(i + 1, Math.floor(centerIndex));

            const singleCenterSample = i === j;

            if (singleCenterSample) {
                linearSamplingMap.push({ o: offsets[i], w: weights[i] });
            } else {
                const sharedCell = j === centerIndex;

                const weightLinear = weights[i] + weights[j] * (sharedCell ? 0.5 : 1);
                const offsetLinear = offsets[i] + 1 / (1 + weights[i] / weights[j]);

                if (offsetLinear === 0) {
                    linearSamplingMap.push({ o: offsets[i], w: weights[i] });
                    linearSamplingMap.push({ o: offsets[i + 1], w: weights[i + 1] });
                } else {
                    linearSamplingMap.push({ o: offsetLinear, w: weightLinear });
                    linearSamplingMap.push({ o: -offsetLinear, w: weightLinear });
                }
            }
        }

        for (let i = 0; i < linearSamplingMap.length; i++) {
            linearSamplingOffsets[i] = linearSamplingMap[i].o;
            linearSamplingWeights[i] = linearSamplingMap[i].w;
        }

        // Replace with optimized
        offsets = linearSamplingOffsets;
        weights = linearSamplingWeights;

        // Generate shaders
        const maxVaryingRows = this.options.engine.getCaps().maxVaryingVectors - (this.options.shaderLanguage === ShaderLanguage.WGSL ? 1 : 0); // Because of the additional builtins
        const freeVaryingVec2 = Math.max(maxVaryingRows, 0) - 1; // Because of sampleCenter

        let varyingCount = Math.min(offsets.length, freeVaryingVec2);

        let defines = "";
        defines += this._staticDefines;

        // The DOF fragment should ignore the center pixel when looping as it is handled manually in the fragment shader.
        if (this._staticDefines.indexOf("DOF") != -1) {
            defines += `#define CENTER_WEIGHT ${this._glslFloat(weights[varyingCount - 1])}\n`;
            varyingCount--;
        }

        for (let i = 0; i < varyingCount; i++) {
            defines += `#define KERNEL_OFFSET${i} ${this._glslFloat(offsets[i])}\n`;
            defines += `#define KERNEL_WEIGHT${i} ${this._glslFloat(weights[i])}\n`;
        }

        let depCount = 0;
        for (let i = freeVaryingVec2; i < offsets.length; i++) {
            defines += `#define KERNEL_DEP_OFFSET${depCount} ${this._glslFloat(offsets[i])}\n`;
            defines += `#define KERNEL_DEP_WEIGHT${depCount} ${this._glslFloat(weights[i])}\n`;
            depCount++;
        }

        if (this.packedFloat) {
            defines += `#define PACKEDFLOAT 1`;
        }

        this.options.blockCompilation = false;

        this.updateEffect(
            defines,
            null,
            null,
            {
                varyingCount: varyingCount,
                depCount: depCount,
            },
            onCompiled,
            onError
        );
    }

    /**
     * Best kernels are odd numbers that when divided by 2, their integer part is even, so 5, 9 or 13.
     * Other odd kernels optimize correctly but require proportionally more samples, even kernels are
     * possible but will produce minor visual artifacts. Since each new kernel requires a new shader we
     * want to minimize kernel changes, having gaps between physical kernels is helpful in that regard.
     * The gaps between physical kernels are compensated for in the weighting of the samples
     * @param idealKernel Ideal blur kernel.
     * @returns Nearest best kernel.
     */
    protected _nearestBestKernel(idealKernel: number): number {
        const v = Math.round(idealKernel);
        for (const k of [v, v - 1, v + 1, v - 2, v + 2]) {
            if (k % 2 !== 0 && Math.floor(k / 2) % 2 === 0 && k > 0) {
                return Math.max(k, 3);
            }
        }
        return Math.max(v, 3);
    }

    /**
     * Calculates the value of a Gaussian distribution with sigma 3 at a given point.
     * @param x The point on the Gaussian distribution to sample.
     * @returns the value of the Gaussian function at x.
     */
    protected _gaussianWeight(x: number): number {
        //reference: Engines/ImageProcessingBlur.cpp #dcc760
        // We are evaluating the Gaussian (normal) distribution over a kernel parameter space of [-1,1],
        // so we truncate at three standard deviations by setting stddev (sigma) to 1/3.
        // The choice of 3-sigma truncation is common but arbitrary, and means that the signal is
        // truncated at around 1.3% of peak strength.

        //the distribution is scaled to account for the difference between the actual kernel size and the requested kernel size
        const sigma = 1 / 3;
        const denominator = Math.sqrt(2.0 * Math.PI) * sigma;
        const exponent = -((x * x) / (2.0 * sigma * sigma));
        const weight = (1.0 / denominator) * Math.exp(exponent);
        return weight;
    }

    /**
     * Generates a string that can be used as a floating point number in GLSL.
     * @param x Value to print.
     * @param decimalFigures Number of decimal places to print the number to (excluding trailing 0s).
     * @returns GLSL float string.
     */
    protected _glslFloat(x: number, decimalFigures = 8) {
        return x.toFixed(decimalFigures).replace(/0+$/, "");
    }
}
