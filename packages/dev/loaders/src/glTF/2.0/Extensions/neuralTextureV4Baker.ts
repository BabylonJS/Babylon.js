import { type Scene } from "core/scene";
import { type AbstractEngine } from "core/Engines/abstractEngine.pure";
import { type AssetContainer } from "core/assetContainer";
import { Constants } from "core/Engines/constants";
import { ShaderStore } from "core/Engines/shaderStore";
import { type RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { EffectRenderer, EffectWrapper } from "core/Materials/effectRenderer.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Texture } from "core/Materials/Textures/texture.pure";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type Nullable } from "core/types";
import { type IBabylonMaterialsNeuralTexture } from "./BABYLON_materials_neural_texture.types";
import { GetWebGL2Context, NeuralBakedTexture, type INeuralTextureBaked } from "./neuralTextureBaker";
import { GetNeuralV4ConstantGroup, GetNeuralV4MipSize, HalfToFloat, type INeuralV4Layout, type INeuralV4WeightTexture } from "./neuralTextureV4";
import { GetNeuralV4BakeShader } from "./neuralTextureV4Shaders";
import { type NeuralTextureTiming } from "./neuralTextureTiming";

/** The mip levels of the load-time bake of a babylon-ntc-v4 payload. */
export type NeuralTextureBakeMips = "generate" | "neural";

type BakedGroup = keyof INeuralTextureBaked;

/** Baked texture, decoder variable, output selector, and the slots that need it. */
const BakedGroups: Array<[BakedGroup, string, number, string[]]> = [
    ["baseColor", "neuralBaseColor", 0, ["baseColorTexture"]],
    ["normal", "neuralNormal", 1, ["normalTexture"]],
    ["orm", "neuralORM", 2, ["occlusionTexture", "metallicRoughnessTexture"]],
    ["emissive", "neuralEmissive", 3, ["emissiveTexture"]],
    ["diffuse", "neuralDiffuse", 4, ["KHR_materials_pbrSpecularGlossiness.diffuseTexture"]],
    ["specGloss", "neuralSpecGloss", 5, ["KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture"]],
];

// RGB of these is sRGB-encoded, as in the original images; alpha stays linear.
const GammaGroups: BakedGroup[] = ["baseColor", "emissive", "diffuse", "specGloss"];

// A tile is one draw call: it keeps the GPU time of each submission far below the driver watchdog on big textures.
const TileSize = 512;

let ShaderIndex = 0;

/**
 * Creates the RGBA16F (or RGBA32F without half-float support) data texture of the network.
 * @param scene the scene
 * @param weights the packed weights
 * @param container the asset container that owns the texture
 * @returns the texture
 * @internal
 */
export function CreateNeuralV4WeightsTexture(scene: Scene, weights: INeuralV4WeightTexture, container: Nullable<AssetContainer> = null): RawTexture {
    const half = scene.getEngine().getCaps().textureHalfFloat !== false;
    const data = half ? weights.data : Float32Array.from(weights.data, HalfToFloat);
    const texture = scene._executeWithBlockedEntityCollection(
        !!container,
        () =>
            new RawTexture(
                data,
                weights.width,
                weights.height,
                Constants.TEXTUREFORMAT_RGBA,
                scene,
                false,
                false,
                Texture.NEAREST_SAMPLINGMODE,
                half ? Constants.TEXTURETYPE_HALF_FLOAT : Constants.TEXTURETYPE_FLOAT
            )
    );
    texture._parentContainer = container;
    texture.name = "Neural weights";
    texture.wrapU = texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    return texture;
}

function HashString(text: string): string {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    }
    return (hash >>> 0).toString(16);
}

/**
 * Decodes a babylon-ntc-v4 payload at load time: one fragment pass per baked group (and mip) into RGBA8 render targets.
 * No latent readback or CPU network evaluation is used.
 * @param scene the scene
 * @param extension the resolved payload
 * @param layout the validated layout of the payload
 * @param latents the latent atlas textures in shader order (the images of grid 0, then those of grid 1), sampled by texel fetch
 * @param weights the network data texture
 * @param mips how the mip chain is produced
 * @param container the asset container that owns the textures
 * @param isCancelled whether the load was cancelled
 * @param timing optional phase timing
 * @returns the baked textures, or null when the engine cannot bake
 * @internal
 */
export async function BakeNeuralV4Async(
    scene: Scene,
    extension: IBabylonMaterialsNeuralTexture,
    layout: INeuralV4Layout,
    latents: BaseTexture[],
    weights: BaseTexture,
    mips: NeuralTextureBakeMips,
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
    // Plain uniforms only: this also works where WebGL uniform buffers are disabled (macOS Chrome).
    if (!engine.isWebGPU && engine.version < 2) {
        return null;
    }
    const wgsl = engine.isWebGPU;
    const gl = wgsl ? null : GetWebGL2Context(engine);
    const { width, height, mipCount } = layout;
    if (width > engine.getCaps().maxTextureSize || height > engine.getCaps().maxTextureSize) {
        throw new Error("Neural texture resolution exceeds the engine texture size limit");
    }
    const outputs = extension.outputs;
    const result: INeuralTextureBaked = {};
    const groups = BakedGroups.filter(([, , , slots]) => slots.some((slot) => (extension.replacedSlots as string[]).includes(slot)));
    const start = Date.now();
    let phaseStart = timing ? performance.now() : 0;
    const renderTargets: Array<{ group: BakedGroup; variable: string; index: number; target: RenderTargetWrapper }> = [];
    let renderer: Nullable<EffectRenderer> = null;
    let wrapper: Nullable<EffectWrapper> = null;
    let shaderName: Nullable<string> = null;
    const store = wgsl ? ShaderStore.ShadersStoreWGSL : ShaderStore.ShadersStore;
    try {
        const network: typeof groups = [];
        for (const entry of groups) {
            const [group] = entry;
            const constant = GetNeuralV4ConstantGroup(layout, outputs, group);
            let texture: Texture;
            if (constant) {
                texture = scene._executeWithBlockedEntityCollection(!!container, () =>
                    RawTexture.CreateRGBATexture(constant, 1, 1, scene, false, false, Texture.NEAREST_SAMPLINGMODE)
                );
            } else {
                network.push(entry);
                texture = scene._executeWithBlockedEntityCollection(!!container, () => {
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
                    renderTargets.push({ group, variable: entry[1], index: entry[2], target });
                    return new NeuralBakedTexture(target.texture!, scene);
                });
            }
            texture._parentContainer = container;
            texture.name = `Neural ${group} (baked)`;
            texture.gammaSpace = GammaGroups.includes(group);
            texture.wrapU = texture.wrapV = Texture.WRAP_ADDRESSMODE;
            result[group] = texture;
        }
        if (network.length) {
            const language = wgsl ? ShaderLanguage.WGSL : ShaderLanguage.GLSL;
            const source = GetNeuralV4BakeShader(
                layout,
                outputs,
                language,
                network.map(([, variable, index]) => [variable, index])
            );
            shaderName = `neuralV4Bake_${HashString(source)}_${ShaderIndex++}`;
            store[`${shaderName}VertexShader`] = wgsl
                ? "attribute position: vec2f;\n@vertex\nfn main(input: VertexInputs) -> FragmentInputs { vertexOutputs.position = vec4f(vertexInputs.position, 0.0, 1.0); }"
                : "attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }";
            store[`${shaderName}PixelShader`] = source;
            const samplerNames = latents.map((_, i) => `neuralLatent${i}`);
            samplerNames.push("neuralWeightTex");
            wrapper = new EffectWrapper({
                engine,
                name: shaderName,
                useShaderStore: true,
                vertexShader: shaderName,
                fragmentShader: shaderName,
                uniformNames: ["neuralParams", "neuralBake"],
                samplerNames,
                shaderLanguage: language,
            });
            timing?.("bakeWeightsUploadAndTargetCreation", phaseStart);
            phaseStart = timing ? performance.now() : 0;
            await WaitForFragmentShaderAsync(wrapper, checkCancelled);
            timing?.("bakeEffectCompile", phaseStart);
            renderer = new EffectRenderer(engine);
            const effect = wrapper.effect;
            let mip = 0;
            let group = 0;
            wrapper.onApplyObservable.add(() => {
                effect.setFloat4("neuralParams", 0, 0, -1, 0);
                effect.setFloat4("neuralBake", mip, group, 0, 0);
                latents.forEach((latent, i) => effect.setTexture(`neuralLatent${i}`, latent));
                effect.setTexture("neuralWeightTex", weights);
            });
            const flush = () => {
                if (gl) {
                    gl.flush();
                } else {
                    (engine as unknown as { flushFramebuffer(): void }).flushFramebuffer();
                }
            };
            const drawTile = (target: RenderTargetWrapper, level: number, x: number, y: number, w: number, h: number, mw: number, mh: number) => {
                const alphaMode = engine.getAlphaMode();
                const colorWrite = engine.getColorWrite();
                const viewport = engine.currentViewport;
                const scissor = w !== mw || h !== mh;
                let saved = false;
                let bound = false;
                try {
                    engine.setAlphaMode(Constants.ALPHA_DISABLE);
                    engine.setColorWrite(true);
                    renderer!.saveStates();
                    saved = true;
                    engine.bindFramebuffer(target, 0, mw, mh, true, level);
                    bound = true;
                    if (scissor) {
                        engine.enableScissor(x, y, w, h);
                    }
                    renderer!.applyEffectWrapper(wrapper!);
                    renderer!.draw();
                } finally {
                    if (scissor) {
                        engine.disableScissor();
                    }
                    if (bound) {
                        engine.unBindFramebuffer(target, true);
                    }
                    if (saved) {
                        renderer!.restoreStates();
                    }
                    engine.setAlphaMode(alphaMode);
                    engine.setColorWrite(colorWrite);
                    if (viewport) {
                        engine.setViewport(viewport);
                    }
                }
                flush();
            };
            const dispatchStart = timing ? performance.now() : 0;
            const lastMip = mips === "neural" ? mipCount - 1 : 0;
            // Tiles of big textures use the scissor: the application's own scissor is restored afterwards.
            const restoreScissor = SaveScissor(engine, gl);
            try {
                for (const entry of renderTargets) {
                    group = entry.index;
                    for (mip = 0; mip <= lastMip; mip++) {
                        const [mw, mh] = GetNeuralV4MipSize(layout, mip);
                        for (let y = 0; y < mh; y += TileSize) {
                            for (let x = 0; x < mw; x += TileSize) {
                                checkCancelled();
                                drawTile(entry.target, mip, x, y, Math.min(TileSize, mw - x), Math.min(TileSize, mh - y), mw, mh);
                                if (mw > TileSize || mh > TileSize) {
                                    // eslint-disable-next-line no-await-in-loop
                                    await new Promise<void>((resolve) => setTimeout(resolve, 0));
                                }
                            }
                        }
                    }
                    if (mips === "generate" && mipCount > 1) {
                        engine.generateMipmaps(entry.target.texture!);
                    }
                }
            } finally {
                restoreScissor();
            }
            timing?.("bakeDispatch", dispatchStart);
            // WebGL texture.readPixels wraps a synchronous read: use a nonblocking GL fence instead.
            // WebGPU's four-byte staging readback is genuinely async.
            phaseStart = timing ? performance.now() : 0;
            if (gl) {
                await WaitForWebGLBakeAsync(gl, checkCancelled);
            } else {
                flush();
                const fence = result[renderTargets[renderTargets.length - 1].group]!.readPixels(0, 0, null, true, false, 0, 0, 1, 1);
                if (!fence) {
                    throw new Error("Cannot await neural texture baking");
                }
                await fence;
            }
            timing?.("bakeGPUCompletionFence", phaseStart);
        }
        checkCancelled();
        for (const texture of Object.values(result)) {
            texture.metadata = { neuralTexture: { mode: wgsl ? "webgpu-fragment" : "webgl-fragment", mips, bakeMilliseconds: Date.now() - start } };
        }
        return result;
    } catch (error) {
        for (const texture of Object.values(result)) {
            texture.dispose();
        }
        throw error;
    } finally {
        for (const { target } of renderTargets) {
            target.dispose(true);
        }
        wrapper?.dispose();
        renderer?.dispose();
        if (shaderName) {
            delete store[`${shaderName}VertexShader`];
            delete store[`${shaderName}PixelShader`];
        }
    }
}

/**
 * Captures the scissor state of the engine.
 * @param engine the engine
 * @param gl its WebGL 2 context, or null on WebGPU
 * @returns a function that restores the captured scissor
 */
function SaveScissor(engine: AbstractEngine, gl: Nullable<WebGL2RenderingContext>): () => void {
    let box: Nullable<ArrayLike<number>> = null;
    if (gl) {
        box = gl.isEnabled(gl.SCISSOR_TEST) ? (gl.getParameter(gl.SCISSOR_BOX) as Int32Array) : null;
    } else {
        const cached = (engine as unknown as { _scissorCached?: { x: number; y: number; z: number; w: number } })._scissorCached;
        box = cached && (cached.z || cached.w) ? [cached.x, cached.y, cached.z, cached.w] : null;
    }
    return () => (box ? engine.enableScissor(box[0], box[1], box[2], box[3]) : engine.disableScissor());
}

async function WaitForWebGLBakeAsync(gl: WebGL2RenderingContext, checkCancelled: () => void): Promise<void> {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) {
        throw new Error("Cannot create neural texture bake fence");
    }
    gl.flush();
    const deadline = Date.now() + 60000;
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
    const deadline = Date.now() + 60000;
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
