import { type Scene } from "core/scene";
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
import { type Nullable } from "core/types";
import { type IBabylonMaterialsNeuralTexture } from "./BABYLON_materials_neural_texture.types";
import { GetNeuralTextureShader, PackNeuralTextureWeights } from "./neuralTextureShaders";
import { type NeuralTextureTiming } from "./neuralTextureTiming";

/** @internal */
export interface INeuralTextureBaked {
    baseColor?: Texture;
    normal?: Texture;
    orm?: Texture;
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
    if (engine.isWebGPU ? !engine.getCaps().supportComputeShaders : !engine.supportsUniformBuffers) {
        return null;
    }
    const gl = engine.isWebGPU ? null : (engine.getRenderingCanvas()?.getContext("webgl2") as Nullable<WebGL2RenderingContext>);
    if (!engine.isWebGPU && !gl) {
        return null;
    }
    const [width, height] = extension.resolution;
    if (width > engine.getCaps().maxTextureSize || height > engine.getCaps().maxTextureSize) {
        throw new Error("Neural texture resolution exceeds the engine texture size limit");
    }
    const outputs: Array<[keyof INeuralTextureBaked, string, number]> = [];
    if (extension.replacedSlots.includes("baseColorTexture")) {
        outputs.push(["baseColor", "neuralBaseColor", 0]);
    }
    if (extension.replacedSlots.includes("normalTexture")) {
        outputs.push(["normal", "neuralNormal", 1]);
    }
    if (extension.replacedSlots.includes("occlusionTexture") || extension.replacedSlots.includes("metallicRoughnessTexture")) {
        outputs.push(["orm", "neuralORM", 2]);
    }
    const result: INeuralTextureBaked = {};
    if (!outputs.length) {
        return result;
    }
    const start = Date.now();
    let phaseStart = timing ? performance.now() : 0;
    const parameters = new UniformBuffer(engine);
    const renderTargets: RenderTargetWrapper[] = [];
    let renderer: Nullable<EffectRenderer> = null;
    let wrapper: Nullable<EffectWrapper> = null;
    let shaderName: Nullable<string> = null;
    let gpuQuery: Nullable<WebGLQuery> = null;
    try {
        checkCancelled();
        parameters.addUniform("neuralWeights", 4, 563);
        parameters.addUniform("neuralNetworkSize", 1);
        parameters.create();
        parameters.updateFloatArray("neuralWeights", PackNeuralTextureWeights(weights));
        parameters.updateFloat("neuralNetworkSize", 32);
        parameters.update();
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
                return new Texture(null, scene, { internalTexture: target.texture!, invertY: false, noMipmap: false });
            });
            texture._parentContainer = container;
            texture.name = `Neural ${slot} (baked)`;
            texture.gammaSpace = slot === "baseColor";
            texture.wrapU = texture.wrapV = Texture.WRAP_ADDRESSMODE;
            result[slot] = texture;
        }
        timing?.("bakeWeightsUploadAndTargetCreation", phaseStart);
        phaseStart = timing ? performance.now() : 0;
        if (engine.isWebGPU) {
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
            let declarations = `
struct NeuralParameters { weights: array<vec4f, 563>, neuralNetworkSize: f32, };
@group(0) @binding(0) var<uniform> neuralParameters: NeuralParameters;\n`;
            const bindings: ComputeBindingMapping = { neuralParameters: { group: 0, binding: 0 } };
            for (let i = 0; i < 4; i++) {
                declarations += `@group(0) @binding(${i * 2 + 2}) var neuralLatent${i}: texture_2d<f32>;\n`;
                bindings[`neuralLatent${i}`] = { group: 0, binding: i * 2 + 2 };
            }
            let stores = "";
            for (let i = 0; i < outputs.length; i++) {
                const [slot, value] = outputs[i];
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
            for (const [slot] of outputs) {
                compute.setStorageTexture(`output_${slot}`, result[slot]!);
            }
            const dispatchStart = timing ? performance.now() : 0;
            await compute.dispatchWhenReady(Math.ceil(width / 8), Math.ceil(height / 8), 1, 0);
            timing?.("bakeCompileAndDispatch", dispatchStart);
            checkCancelled();
            phaseStart = timing ? performance.now() : 0;
            for (const texture of Object.values(result)) {
                engine.generateMipmaps(texture.getInternalTexture()!);
            }
            timing?.("mipmapSubmission", phaseStart);
        } else {
            const decoder = GetNeuralTextureShader(extension, ShaderLanguage.GLSL, "gl_FragCoord.xy / neuralResolution");
            shaderName =
                "neuralTextureBake_" +
                [extension.outputs.baseColor, extension.outputs.normal, extension.outputs.occlusion, extension.outputs.roughness, extension.outputs.metallic]
                    .map((channels) => channels?.join("_") ?? "none")
                    .join("__");
            ShaderStore.ShadersStore[`${shaderName}VertexShader`] = "attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }";
            ShaderStore.ShadersStore[`${shaderName}PixelShader`] = `
precision highp float;
layout(std140) uniform NeuralParameters { vec4 neuralWeights[563]; float neuralNetworkSize; };
uniform vec2 neuralResolution;
uniform int neuralOutput;
${decoder.definitions}
void main() {
    ${decoder.main}
    gl_FragColor = neuralOutput == 0 ? neuralBaseColor : (neuralOutput == 1 ? neuralNormal : neuralORM);
}`;
            wrapper = new EffectWrapper({
                engine,
                name: shaderName,
                useShaderStore: true,
                vertexShader: shaderName,
                fragmentShader: shaderName,
                uniformBuffers: ["NeuralParameters"],
                uniformNames: ["neuralResolution", "neuralOutput"],
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
            const generateMipmap = gl!.generateMipmap;
            if (timing) {
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
                    parameters.bindToEffect(effect, "NeuralParameters");
                    parameters.bindUniformBuffer();
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
                    gl!.endQuery(0x88bf);
                }
                if (timing) {
                    gl!.generateMipmap = generateMipmap;
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
