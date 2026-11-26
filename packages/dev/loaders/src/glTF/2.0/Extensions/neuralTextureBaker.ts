import { type Scene } from "core/scene";
import { type AbstractEngine } from "core/Engines/abstractEngine.pure";
import { type AssetContainer } from "core/assetContainer";
import { Constants } from "core/Engines/constants";
import { ShaderStore } from "core/Engines/shaderStore";
import { type RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { type ComputeBindingMapping } from "core/Engines/Extensions/engine.computeShader.pure";
import { ComputeShader } from "core/Compute/computeShader.pure";
import { EffectRenderer, EffectWrapper } from "core/Materials/effectRenderer.pure";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Texture } from "core/Materials/Textures/texture.pure";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { SerializationHelper } from "core/Misc/decorators.serialization";
import { RegisterEnginesWebGPUExtensionsEngineComputeShader } from "core/Engines/WebGPU/Extensions/engine.computeShader.pure";
import { type Nullable } from "core/types";
import { type IBabylonMaterialsNeuralTexture } from "./BABYLON_materials_neural_texture.types";
import { GetNeuralTexturePackedSize, GetNeuralTextureShader, PackNeuralTextureWeights } from "./neuralTextureShaders";
import { type NeuralTextureTiming } from "./neuralTextureTiming";

/** @internal */
export interface INeuralTextureBaked {
    baseColor?: Texture;
    normal?: Texture;
    orm?: Texture;
    emissive?: Texture;
    diffuse?: Texture;
    /** Specular RGB with glossiness in alpha. */
    specGloss?: Texture;
}

/** Baked texture, decoder variable, GLSL output selector, and the slots that need it. */
const BakedOutputs: Array<[keyof INeuralTextureBaked, string, number, string[]]> = [
    ["baseColor", "neuralBaseColor", 0, ["baseColorTexture"]],
    ["normal", "neuralNormal", 1, ["normalTexture"]],
    ["orm", "neuralORM", 2, ["occlusionTexture", "metallicRoughnessTexture"]],
    ["emissive", "neuralEmissive", 3, ["emissiveTexture"]],
    ["diffuse", "neuralDiffuse", 4, ["KHR_materials_pbrSpecularGlossiness.diffuseTexture"]],
    ["specGloss", "neuralSpecGloss", 5, ["KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture"]],
];

// RGB of these is sRGB-encoded, as in the original images; alpha stays linear.
const GammaOutputs = ["baseColor", "emissive", "diffuse", "specGloss"];

// WebGPU guarantees four storage textures per compute stage by default.
const MaxStorageTextures = 4;

/**
 * A texture over a baked render target. Unlike a plain Texture over an internal texture, which clones empty,
 * its clones share the baked GPU data, that is only freed once the last clone is disposed.
 * @internal
 */
export class NeuralBakedTexture extends Texture {
    constructor(internalTexture: InternalTexture, sceneOrEngine: Scene) {
        super(null, sceneOrEngine, { internalTexture, invertY: false, noMipmap: false });
    }

    public override clone(): Texture {
        return SerializationHelper.Clone(() => {
            const internalTexture = this._texture!;
            internalTexture.incrementReferences();
            return new NeuralBakedTexture(internalTexture, this.getScene()!);
        }, this);
    }
}

/**
 * Returns the engine's own WebGL 2 context. Querying the canvas again can return
 * null (for example when the context was created with different attributes).
 * @internal
 */
export function GetWebGL2Context(engine: AbstractEngine): Nullable<WebGL2RenderingContext> {
    const gl = (engine as unknown as { _gl?: WebGLRenderingContext | WebGL2RenderingContext })._gl;
    return gl && typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext ? gl : null;
}

/**
 * Whether BakeNeuralTextureAsync can bake a babylon-ntc-v1/v2 payload on the engine.
 * @param engine the engine
 * @param extension the resolved payload
 * @returns true when the GPU bake is available
 * @internal
 */
export function CanBakeNeuralTexture(engine: AbstractEngine, extension: IBabylonMaterialsNeuralTexture): boolean {
    if (engine.isWebGPU ? !engine.getCaps().supportComputeShaders : engine.version < 2) {
        return false;
    }
    return engine.isWebGPU || engine.supportsUniformBuffers || GetNeuralTexturePackedSize(extension.network.outputs) + 4 <= engine.getCaps().maxFragmentUniformVectors;
}

/**
 * Bakes base-level texels directly into RGBA8 GPU textures, then generates the
 * complete mip chain. No latent readback or CPU network evaluation is used.
 * @internal
 */
export async function BakeNeuralTextureAsync(
    scene: Scene,
    extension: IBabylonMaterialsNeuralTexture,
    latents: BaseTexture[],
    weights: Float32Array,
    container: Nullable<AssetContainer> = null,
    isCancelled: () => boolean = () => false,
    timing?: NeuralTextureTiming
): Promise<Nullable<INeuralTextureBaked>> {
    const checkCancelled = () => {
        if (isCancelled() || scene.isDisposed) {
            throw new Error("Neural texture baking cancelled");
        }
    };
    checkCancelled();
    const engine = scene.getEngine();
    // macOS Chrome disables WebGL uniform buffers: the fragment bake then uses a plain uniform array.
    const useUbo = engine.isWebGPU || engine.supportsUniformBuffers;
    if (!CanBakeNeuralTexture(engine, extension)) {
        return null;
    }
    const gl = engine.isWebGPU ? null : GetWebGL2Context(engine);
    const [width, height] = extension.resolution;
    if (width > engine.getCaps().maxTextureSize || height > engine.getCaps().maxTextureSize) {
        throw new Error("Neural texture resolution exceeds the engine texture size limit");
    }
    const outputs = BakedOutputs.filter(([, , , slots]) => slots.some((slot) => extension.replacedSlots.includes(slot as never))).map(
        ([slot, name, index]): [keyof INeuralTextureBaked, string, number] => [slot, name, index]
    );
    const packedSize = GetNeuralTexturePackedSize(extension.network.outputs);
    const result: INeuralTextureBaked = {};
    if (!outputs.length) {
        return result;
    }
    const start = Date.now();
    let phaseStart = timing ? performance.now() : 0;
    const packedWeights = PackNeuralTextureWeights(weights, extension.network.outputs);
    const parameters = new UniformBuffer(engine);
    const renderTargets: RenderTargetWrapper[] = [];
    let renderer: Nullable<EffectRenderer> = null;
    let wrapper: Nullable<EffectWrapper> = null;
    let shaderName: Nullable<string> = null;
    let gpuQuery: Nullable<WebGLQuery> = null;
    try {
        checkCancelled();
        if (useUbo) {
            parameters.addUniform("neuralWeights", 4, packedSize);
            parameters.addUniform("neuralNetworkSize", 1);
            parameters.create();
            parameters.updateFloatArray("neuralWeights", packedWeights);
            parameters.updateFloat("neuralNetworkSize", 32);
            parameters.update();
        }
        for (const [slot] of outputs) {
            const texture = scene._executeWithBlockedEntityCollection(!!container, () => {
                if (engine.isWebGPU) {
                    // RawTexture(null) allocates GPU storage and all mip levels without
                    // allocating or uploading a decoded CPU image.
                    return new RawTexture(
                        null,
                        width,
                        height,
                        Constants.TEXTUREFORMAT_RGBA,
                        scene,
                        true,
                        false,
                        Texture.TRILINEAR_SAMPLINGMODE,
                        Constants.TEXTURETYPE_UNSIGNED_BYTE,
                        Constants.TEXTURE_CREATIONFLAG_STORAGE
                    );
                }
                const target = engine.createRenderTargetTexture(
                    { width, height },
                    {
                        generateMipMaps: true,
                        generateDepthBuffer: false,
                        generateStencilBuffer: false,
                        samplingMode: Texture.TRILINEAR_SAMPLINGMODE,
                        type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                        format: Constants.TEXTUREFORMAT_RGBA,
                    }
                );
                renderTargets.push(target);
                return new NeuralBakedTexture(target.texture!, scene);
            });
            texture._parentContainer = container;
            texture.name = `Neural ${slot} (baked)`;
            texture.gammaSpace = GammaOutputs.includes(slot);
            texture.wrapU = texture.wrapV = Texture.WRAP_ADDRESSMODE;
            result[slot] = texture;
        }
        timing?.("bakeWeightsUploadAndTargetCreation", phaseStart);
        phaseStart = timing ? performance.now() : 0;
        if (engine.isWebGPU) {
            // ComputeShader creates its compute context on construction, so the engine extension must be registered first.
            RegisterEnginesWebGPUExtensionsEngineComputeShader();
            const decoder = GetNeuralTextureShader(
                extension,
                ShaderLanguage.WGSL,
                `(vec2f(globalId.xy) + vec2f(0.5)) / vec2f(${width}.0, ${height}.0)`,
                "neuralParameters.weights",
                "neuralParameters.neuralNetworkSize",
                // WebGPU compute compiles this quickly; straight-line code avoids
                // the runtime cost of dynamic local-array indexing during full bakes.
                true
            );
            const dispatchStart = timing ? performance.now() : 0;
            // Each pass re-evaluates the network, so only outputs beyond the storage texture limit cost extra passes.
            for (let first = 0; first < outputs.length; first += MaxStorageTextures) {
                const pass = outputs.slice(first, first + MaxStorageTextures);
                let declarations = `
struct NeuralParameters { weights: array<vec4f, ${packedSize}>, neuralNetworkSize: f32, };
@group(0) @binding(0) var<uniform> neuralParameters: NeuralParameters;\n`;
                const bindings: ComputeBindingMapping = { neuralParameters: { group: 0, binding: 0 } };
                for (let i = 0; i < 4; i++) {
                    declarations += `@group(0) @binding(${i * 2 + 2}) var neuralLatent${i}: texture_2d<f32>;\n`;
                    bindings[`neuralLatent${i}`] = { group: 0, binding: i * 2 + 2 };
                }
                let stores = "";
                for (let i = 0; i < pass.length; i++) {
                    const [slot, value] = pass[i];
                    declarations += `@group(0) @binding(${i + 9}) var output_${slot}: texture_storage_2d<rgba8unorm, write>;\n`;
                    bindings[`output_${slot}`] = { group: 0, binding: i + 9 };
                    stores += `textureStore(output_${slot}, vec2i(globalId.xy), ${value});\n`;
                }
                const compute = new ComputeShader(
                    "neuralTextureBake",
                    engine,
                    {
                        computeSource: `
${declarations}
${decoder.functions}
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3u) {
    if (globalId.x >= ${width}u || globalId.y >= ${height}u) { return; }
    ${decoder.main}
    ${stores}
}`,
                    },
                    { bindingsMapping: bindings }
                );
                if (timing) {
                    compute.onCompiled = () => timing("bakeEffectCompile", phaseStart);
                }
                compute.setUniformBuffer("neuralParameters", parameters);
                for (let i = 0; i < 4; i++) {
                    compute.setTexture(`neuralLatent${i}`, latents[i], false);
                }
                for (const [slot] of pass) {
                    compute.setStorageTexture(`output_${slot}`, result[slot]!);
                }
                // eslint-disable-next-line no-await-in-loop
                await compute.dispatchWhenReady(Math.ceil(width / 8), Math.ceil(height / 8), 1, 0);
                checkCancelled();
            }
            timing?.("bakeCompileAndDispatch", dispatchStart);
            checkCancelled();
            phaseStart = timing ? performance.now() : 0;
            for (const texture of Object.values(result)) {
                engine.generateMipmaps(texture.getInternalTexture()!);
            }
            timing?.("mipmapSubmission", phaseStart);
        } else {
            const decoder = GetNeuralTextureShader(extension, ShaderLanguage.GLSL, "gl_FragCoord.xy / neuralResolution");
            // Only the baked outputs are referenced: the other groups may not be declared by the decoder.
            let glslSelector = outputs[outputs.length - 1][1];
            for (let i = outputs.length - 2; i >= 0; i--) {
                glslSelector = `neuralOutput == ${outputs[i][2]} ? ${outputs[i][1]} : (${glslSelector})`;
            }
            shaderName =
                `neuralTextureBake_${extension.network.outputs}_` +
                [
                    extension.outputs.baseColor,
                    extension.outputs.normal,
                    extension.outputs.occlusion,
                    extension.outputs.roughness,
                    extension.outputs.metallic,
                    extension.outputs.emissive,
                    extension.outputs.diffuse,
                    extension.outputs.specular,
                    extension.outputs.glossiness,
                ]
                    .map((channels) => channels?.join("_") ?? "none")
                    .join("__") +
                `_o${outputs.map(([, , index]) => index).join("")}` +
                (useUbo ? "" : "_noubo");
            ShaderStore.ShadersStore[`${shaderName}VertexShader`] = "attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }";
            ShaderStore.ShadersStore[`${shaderName}PixelShader`] = `
precision highp float;
${useUbo ? `layout(std140) uniform NeuralParameters { vec4 neuralWeights[${packedSize}]; float neuralNetworkSize; };` : `uniform vec4 neuralWeights[${packedSize}];\nuniform float neuralNetworkSize;`}
uniform vec2 neuralResolution;
uniform int neuralOutput;
${decoder.definitions}
void main() {
    ${decoder.main}
    gl_FragColor = ${glslSelector};
}`;
            wrapper = new EffectWrapper({
                engine,
                name: shaderName,
                useShaderStore: true,
                vertexShader: shaderName,
                fragmentShader: shaderName,
                uniformBuffers: useUbo ? ["NeuralParameters"] : [],
                uniformNames: useUbo ? ["neuralResolution", "neuralOutput"] : ["neuralResolution", "neuralOutput", "neuralWeights", "neuralNetworkSize"],
                samplerNames: ["neuralLatent0", "neuralLatent1", "neuralLatent2", "neuralLatent3"],
            });
            await WaitForFragmentShaderAsync(wrapper, checkCancelled);
            timing?.("bakeEffectCompile", phaseStart);
            renderer = new EffectRenderer(engine);
            const effect = wrapper.effect;
            const alphaMode = engine.getAlphaMode();
            const colorWrite = engine.getColorWrite();
            const viewport = engine.currentViewport;
            const dispatchStart = timing ? performance.now() : 0;
            const generateMipmap = gl?.generateMipmap;
            if (timing && gl && generateMipmap) {
                gl!.generateMipmap = (target) => {
                    const start = performance.now();
                    generateMipmap.call(gl, target);
                    timing("mipmapSubmission", start);
                };
                if (gl!.getExtension("EXT_disjoint_timer_query_webgl2") && !gl!.getQuery(0x88bf, gl!.CURRENT_QUERY)) {
                    gpuQuery = gl!.createQuery();
                    if (gpuQuery) {
                        gl!.beginQuery(0x88bf, gpuQuery);
                    }
                }
            }
            try {
                engine.setAlphaMode(Constants.ALPHA_DISABLE);
                engine.setColorWrite(true);
                let outputIndex = 0;
                wrapper.onApplyObservable.add(() => {
                    if (useUbo) {
                        parameters.bindToEffect(effect, "NeuralParameters");
                        parameters.bindUniformBuffer();
                    } else {
                        effect.setArray4("neuralWeights", packedWeights as unknown as number[]);
                        effect.setFloat("neuralNetworkSize", 32);
                    }
                    effect.setFloat2("neuralResolution", width, height);
                    effect.setInt("neuralOutput", outputIndex);
                    for (let i = 0; i < 4; i++) {
                        effect.setTexture(`neuralLatent${i}`, latents[i]);
                    }
                });
                for (let i = 0; i < outputs.length; i++) {
                    checkCancelled();
                    outputIndex = outputs[i][2];
                    // EffectRenderer's framebuffer unbind generates the full mip chain.
                    const passStart = timing ? performance.now() : 0;
                    renderer.render(wrapper, renderTargets[i]);
                    timing?.("bakeDrawAndMipmapSubmission", passStart);
                }
            } finally {
                if (gpuQuery) {
                    gl?.endQuery(0x88bf);
                }
                if (timing && gl && generateMipmap) {
                    gl.generateMipmap = generateMipmap;
                }
                engine.setAlphaMode(alphaMode);
                engine.setColorWrite(colorWrite);
                if (viewport) {
                    engine.setViewport(viewport);
                }
            }
            timing?.("bakeDispatch", dispatchStart);
        }
        // WebGL texture.readPixels wraps a synchronous read: use a nonblocking GL
        // fence instead. WebGPU's four-byte staging readback is genuinely async.
        phaseStart = timing ? performance.now() : 0;
        if (gl) {
            await WaitForWebGLBakeAsync(gl, checkCancelled);
        } else {
            const fence = result[outputs[outputs.length - 1][0]]!.readPixels(0, 0, null, true, false, 0, 0, 1, 1);
            if (!fence) {
                throw new Error("Cannot await neural texture compute baking");
            }
            await fence;
        }
        timing?.("bakeGPUCompletionFence", phaseStart);
        if (gpuQuery && gl!.getQueryParameter(gpuQuery, gl!.QUERY_RESULT_AVAILABLE) && !gl!.getParameter(0x8fbb)) {
            timing?.("bakeGPUWithMipsTime", performance.now() - gl!.getQueryParameter(gpuQuery, gl!.QUERY_RESULT) / 1e6);
        }
        checkCancelled();
        for (const texture of Object.values(result)) {
            texture.metadata = { neuralTexture: { mode: engine.isWebGPU ? "webgpu-compute" : "webgl-fragment", bakeMilliseconds: Date.now() - start } };
        }
        return result;
    } catch (error) {
        for (const texture of Object.values(result)) {
            texture.dispose();
        }
        throw error;
    } finally {
        for (const target of renderTargets) {
            target.dispose(true);
        }
        wrapper?.dispose();
        renderer?.dispose();
        if (shaderName) {
            delete ShaderStore.ShadersStore[`${shaderName}VertexShader`];
            delete ShaderStore.ShadersStore[`${shaderName}PixelShader`];
        }
        parameters.dispose();
        if (gpuQuery) {
            gl!.deleteQuery(gpuQuery);
        }
    }
}

async function WaitForWebGLBakeAsync(gl: WebGL2RenderingContext, checkCancelled: () => void): Promise<void> {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) {
        throw new Error("Cannot create neural texture bake fence");
    }
    gl.flush();
    const deadline = Date.now() + 30000;
    try {
        for (;;) {
            checkCancelled();
            const status = gl.clientWaitSync(sync, 0, 0);
            if (status === gl.WAIT_FAILED || Date.now() > deadline) {
                throw new Error("Neural texture bake fence failed or timed out");
            }
            if (status !== gl.TIMEOUT_EXPIRED) {
                return;
            }
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
        }
    } finally {
        gl.deleteSync(sync);
    }
}

async function WaitForFragmentShaderAsync(wrapper: EffectWrapper, checkCancelled: () => void): Promise<void> {
    const deadline = Date.now() + 30000;
    while (!wrapper.isReady()) {
        checkCancelled();
        const error = wrapper.effect.getCompilationError();
        if (error || Date.now() > deadline) {
            throw new Error(error || "Neural texture bake shader compilation timed out");
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
}
