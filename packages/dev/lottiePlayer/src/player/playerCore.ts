// Player core owns engine creation, the per-frame render loop, readiness, disposal, and parent
// transform resolution without depending on any specific layer renderer.

import { ThinEngine } from "core/Engines/thinEngine";
import { type IColor4Like } from "core/Maths/math.like";
import { type IProp } from "../animation/lottieRaw";
import { type IParsedAnimation, type IParsedLayer, type ITransform } from "../animation/parse";
import { type ILayerRenderContext, type ILayerRenderer } from "../rendering/vector/layerRenderer";
import { SampleScalar, SampleMulti } from "../animation/sample";
import { BuildLottieMatrixInto, MultiplyMat2DInto, type Mat2D } from "../animation/matrix2D";
import { BeginVectorFrame, EndVectorFrame, type IVectorScissorRect } from "../rendering/vector/vectorFrame";

/**
 * Runtime handle for a Lottie player, passed to {@link RenderLottieFrame}, {@link IsPlayerReady},
 * and {@link DisposeVectorPlayer}. Its fields are internal engine + parse state; treat it as opaque.
 */
export interface ILottiePlayer {
    engine: ThinEngine;
    anim: IParsedAnimation;
    /** Active renderers keyed by Lottie layer kind. Only detected kinds are present. */
    renderers: Map<number, ILayerRenderer>;
    /** Stable renderer list used by the render loop without allocating Map iterators. */
    rendererList: ILayerRenderer[];
    /** Layer lookup by `ind`, for resolving parent transform chains. */
    byInd: Map<number, IParsedLayer>;
    /** Color the canvas is cleared to before each frame. */
    backgroundColor: IColor4Like;
    /** Per-frame memo of each layer's local world matrix (parent chain applied, pre-global). */
    worldCache: Map<number, Mat2D>;
    /** Render generation in which each cached world matrix was computed. */
    worldCacheGeneration: Map<number, number>;
    renderGeneration: number;
    // Per-frame ordered command list (renderer + token), rebuilt each frame in z-order.
    cmdRenderers: ILayerRenderer[];
    cmdTokens: number[];
    cmdMatteTokens: number[];
    // Transform scratch.
    a: number[];
    p: number[];
    s: number[];
    globalMatrix: Mat2D;
    worldMatrixScratch: Mat2D;
    frameContext: ILayerRenderContext;
    scissor: IVectorScissorRect;
}

/**
 * Creates a WebGL2 engine configured for the vector Lottie player: a multisampled,
 * stencil-backed default framebuffer with premultiplied transparent output. The
 * stencil-then-cover fill renderer requires the stencil buffer; `antialias` provides
 * multisampled edge coverage directly on the canvas.
 * @param canvas The canvas (or OffscreenCanvas, in the worker path) to render into.
 * @param supportDeviceLost When true, the engine handles WebGL context-lost recovery.
 * @returns The configured engine.
 */
export function CreateVectorEngine(canvas: HTMLCanvasElement | OffscreenCanvas, supportDeviceLost = true): ThinEngine {
    const engine = new ThinEngine(
        canvas,
        true, // Antialias — MSAA on the default framebuffer, used for vector edge coverage
        {
            alpha: true,
            premultipliedAlpha: true,
            antialias: true,
            stencil: true,
            depth: false,
            audioEngine: false,
            // Important to allow skip frame and tiled optimizations
            preserveDrawingBuffer: false,
            doNotHandleContextLost: !supportDeviceLost,
        },
        false
    );
    // Depth is never used; the stencil-then-cover passes drive the stencil state themselves.
    engine.depthCullingState.depthTest = false;
    engine.depthCullingState.depthMask = false;
    return engine;
}

/**
 * Assemble a {@link ILottiePlayer} from a parsed animation and a prepared renderers map.
 * @internal
 */
export function BuildPlayer(engine: ThinEngine, anim: IParsedAnimation, renderers: Map<number, ILayerRenderer>, backgroundColor?: IColor4Like): ILottiePlayer {
    const byInd = new Map<number, IParsedLayer>();
    const worldCache = new Map<number, Mat2D>();
    const worldCacheGeneration = new Map<number, number>();
    for (const layer of anim.layers) {
        byInd.set(layer.ind, layer);
        worldCache.set(layer.ind, [1, 0, 0, 1, 0, 0]);
        worldCacheGeneration.set(layer.ind, -1);
    }
    return {
        engine,
        anim,
        renderers,
        rendererList: Array.from(renderers.values()),
        byInd,
        // Defaults to the sprite renderer's DefaultConfiguration.backgroundColor so both
        // renderers composite the same way when no explicit color is supplied.
        backgroundColor: backgroundColor ?? { r: 0, g: 0, b: 0, a: 1 },
        worldCache,
        worldCacheGeneration,
        renderGeneration: 0,
        cmdRenderers: [],
        cmdTokens: [],
        cmdMatteTokens: [],
        a: [0, 0],
        p: [0, 0],
        s: [100, 100],
        globalMatrix: [1, 0, 0, 1, 0, 0],
        worldMatrixScratch: [1, 0, 0, 1, 0, 0],
        frameContext: { frame: 0, screenW: 0, screenH: 0 },
        scissor: { x: 0, y: 0, width: 0, height: 0 },
    };
}

function SamplePoint(prop: IProp | undefined, frame: number, dx: number, dy: number, out: number[]): void {
    out[0] = dx;
    out[1] = dy;
    SampleMulti(prop, frame, out);
}

function BuildTransformMatrixInto(t: ITransform, frame: number, a: number[], p: number[], s: number[], out: Mat2D): void {
    SamplePoint(t.a, frame, 0, 0, a);
    SamplePoint(t.p, frame, 0, 0, p);
    SamplePoint(t.s, frame, 100, 100, s);
    const r = SampleScalar(t.r, frame, 0);
    BuildLottieMatrixInto(a, p, s, r, out);
}

// Resolve a layer's local world matrix (parent chain applied, before the global projection).
// A child's transform is composed under its parent's: world = parentWorld x localTransform.
// Lottie parenting inherits only the transform, not opacity. Memoized per frame via `worldCache`.
function ResolveWorld(pl: ILottiePlayer, layer: IParsedLayer, frame: number, depth: number): Mat2D {
    const world = pl.worldCache.get(layer.ind)!;
    if (pl.worldCacheGeneration.get(layer.ind) === pl.renderGeneration) {
        return world;
    }
    BuildTransformMatrixInto(layer.transform, frame, pl.a, pl.p, pl.s, world);
    // Guard against cycles / runaway depth in malformed files.
    if (layer.parent !== undefined && depth < 32) {
        const parent = pl.byInd.get(layer.parent);
        if (parent) {
            MultiplyMat2DInto(ResolveWorld(pl, parent, frame, depth + 1), world, world);
        }
    }
    pl.worldCacheGeneration.set(layer.ind, pl.renderGeneration);
    return world;
}

/** True once every active renderer's GPU effects have compiled. Until then {@link RenderLottieFrame}
 *  is a no-op (effects compile asynchronously).
 * @param pl The player handle.
 * @returns True when every active renderer is ready to draw.
 */
export function IsPlayerReady(pl: ILottiePlayer): boolean {
    for (let i = 0; i < pl.rendererList.length; i++) {
        if (!pl.rendererList[i].isReady()) {
            return false;
        }
    }
    return true;
}

/**
 * Renders the animation at `frame` (comp frames) into the engine's canvas. No-op until all
 * renderers are ready.
 * @param pl The player handle.
 * @param frame The comp frame to render.
 */
export function RenderLottieFrame(pl: ILottiePlayer, frame: number): void {
    if (!IsPlayerReady(pl)) {
        return;
    }
    const { engine, anim, renderers, rendererList } = pl;
    const w = engine.getRenderWidth();
    const h = engine.getRenderHeight();
    const scale = Math.min(w / anim.width, h / anim.height);
    const ox = (w - anim.width * scale) * 0.5;
    const oy = (h - anim.height * scale) * 0.5;
    const global = pl.globalMatrix;
    global[0] = scale;
    global[1] = 0;
    global[2] = 0;
    global[3] = scale;
    global[4] = ox;
    global[5] = oy;
    const ctx = pl.frameContext;
    ctx.frame = frame;
    ctx.screenW = w;
    ctx.screenH = h;

    for (let i = 0; i < rendererList.length; i++) {
        rendererList[i].beginFrame(ctx);
    }
    pl.cmdRenderers.length = 0;
    pl.cmdTokens.length = 0;
    pl.cmdMatteTokens.length = 0;
    pl.renderGeneration++;

    // Lottie renders layers back-to-front: iterate in reverse array order.
    for (let li = anim.layers.length - 1; li >= 0; li--) {
        const layer = anim.layers[li];
        if (frame < layer.ip || frame >= layer.op) {
            continue;
        }
        if (layer.matteOnly) {
            continue;
        }
        const renderer = renderers.get(layer.kind);
        if (!renderer) {
            continue;
        }
        const layerAlpha = SampleScalar(layer.transform.o, frame, 100) / 100;
        if (layerAlpha <= 0.0001) {
            continue;
        }
        let matteToken = -1;
        // A falsy matte mode (absent, or an explicit 0 = "no matte") means the layer paints normally.
        if (layer.matteMode) {
            if (layer.matteMode !== 1 || layer.matteSource === undefined) {
                continue;
            }
            const matte = pl.byInd.get(layer.matteSource);
            if (!matte || frame < matte.ip || frame >= matte.op || renderers.get(matte.kind) !== renderer) {
                continue;
            }
            const matteAlpha = SampleScalar(matte.transform.o, frame, 100) / 100;
            if (matteAlpha <= 0.0001) {
                continue;
            }
            MultiplyMat2DInto(global, ResolveWorld(pl, matte, frame, 0), pl.worldMatrixScratch);
            matteToken = renderer.emitLayer(matte, pl.worldMatrixScratch, matteAlpha, ctx);
            if (matteToken < 0) {
                continue;
            }
        }
        MultiplyMat2DInto(global, ResolveWorld(pl, layer, frame, 0), pl.worldMatrixScratch);
        const token = renderer.emitLayer(layer, pl.worldMatrixScratch, layerAlpha, ctx);
        if (token < 0) {
            continue;
        }
        pl.cmdRenderers.push(renderer);
        pl.cmdTokens.push(token);
        pl.cmdMatteTokens.push(matteToken);
    }

    for (let i = 0; i < rendererList.length; i++) {
        rendererList[i].flush(ctx);
    }

    // Clip to the comp bounds: Lottie content beyond the composition rect is not shown.
    // Flip Y to WebGL's lower-left scissor origin.
    const sx = Math.max(0, Math.floor(ox));
    const syTop = Math.max(0, Math.floor(oy));
    const cw = Math.min(w - sx, Math.ceil(anim.width * scale));
    const chh = Math.min(h - syTop, Math.ceil(anim.height * scale));
    const scissor = pl.scissor;
    scissor.x = sx;
    scissor.y = h - (syTop + chh);
    scissor.width = cw;
    scissor.height = chh;

    BeginVectorFrame(engine, scissor, pl.backgroundColor);
    for (let i = 0; i < pl.cmdRenderers.length; i++) {
        const matteToken = pl.cmdMatteTokens[i];
        pl.cmdRenderers[i].recordLayer(pl.cmdTokens[i], matteToken >= 0 ? matteToken : undefined);
    }
    EndVectorFrame(engine);
}

/**
 * Disposes all renderers (and their GPU resources). The engine is owned by the caller.
 * @param pl The player handle to dispose.
 */
export function DisposeVectorPlayer(pl: ILottiePlayer): void {
    for (const r of pl.renderers.values()) {
        r.dispose();
    }
    pl.renderers.clear();
}
