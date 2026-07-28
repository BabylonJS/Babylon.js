// Minimal shapes-only player — for splashscreens and other vector-only Lottie animations. It
// constructs ONLY the fill renderer (shapes, solids, gradients, strokes, masks, morphs) and never
// references the text or image renderers, so a shapes-only entry point also excludes the texture /
// sampler path those renderers require.
//
// Contract: renders shape (ty 4) + solid (ty 1) layers. Text (ty 5) and image (ty 2) layers are
// ignored.

import { type ThinEngine } from "core/Engines/thinEngine";
import { type ILottieFile } from "../animation/lottieRaw";
import { type ILayerRenderer } from "../rendering/vector/layerRenderer";
import { ParseAnimation, type ILottiePlayerOptions } from "../animation/parse";
import { CreateFillRenderer } from "../rendering/vector/fillRenderer";
import { BuildPlayer, type ILottiePlayer } from "./playerCore";

/**
 * Creates a minimal, shapes-only player for a vector Lottie document (e.g. a splashscreen). Renders
 * shape + solid layers only; text and image layers are ignored. Drive it with the same
 * {@link RenderLottieFrame} / {@link IsPlayerReady} / {@link DisposeVectorPlayer} as the full player.
 * @param engine The engine to render with, from {@link CreateVectorEngine}.
 * @param file The raw Lottie document.
 * @param options Player options. `backgroundColor` sets the per-frame clear color; `variables` is
 * accepted for signature parity but has no effect here, because shapes-only playback ignores text
 * layers.
 * @returns The player handle.
 */
export function CreateShapePlayer(engine: ThinEngine, file: ILottieFile, options?: ILottiePlayerOptions): ILottiePlayer {
    const anim = ParseAnimation(file, options?.variables);
    const renderers = new Map<number, ILayerRenderer>();
    // Shape + solid layers (both reported as kind 4 by the parser). Always built — a shapes-only
    // animation always has them, and skipping feature detection keeps the minimal entry minimal.
    renderers.set(4, CreateFillRenderer(engine));
    return BuildPlayer(engine, anim, renderers, options?.backgroundColor);
}
