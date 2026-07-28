// Full player: parses a Lottie document, builds the renderers its layers need (fill for
// shapes/solids, text for ty:5, image for ty:2), and assembles a player via the shared core.
//
// Consumers that only ever play vector artwork should import `CreateShapePlayer` instead; its
// module graph never reaches the text or image renderers, so they (and the texture path they pull
// in) tree-shake away.

import { type ThinEngine } from "core/Engines/thinEngine";

import { type ILottieFile } from "../animation/lottieRaw";
import { type ILayerRenderer } from "../rendering/vector/layerRenderer";
import { ParseAnimation, type ILottiePlayerOptions } from "../animation/parse";
import { CreateFillRenderer } from "../rendering/vector/fillRenderer";
import { CreateTextRenderer } from "../rendering/vector/textRenderer";
import { CreateImageRenderer } from "../rendering/vector/imageRenderer";
import { BuildPlayer, type ILottiePlayer } from "./playerCore";

/**
 * Creates a player for a Lottie document, building only the renderers the animation actually needs
 * (shape, text, image) as detected from its layers.
 * @param engine The engine to render with, from `CreateVectorEngine`.
 * @param file The raw Lottie document.
 * @param options Player options. `variables` substitutes text-layer content at load time for
 * localization (whole-string key match); `backgroundColor` sets the per-frame clear color.
 * @returns The player handle.
 */
export function CreateLottiePlayer(engine: ThinEngine, file: ILottieFile, options?: ILottiePlayerOptions): ILottiePlayer {
    const anim = ParseAnimation(file, options?.variables);
    const renderers = new Map<number, ILayerRenderer>();
    let hasShapes = false;
    let hasText = false;
    let hasImages = false;
    for (const layer of anim.layers) {
        hasShapes ||= layer.kind === 4 && layer.ops.length > 0;
        hasText ||= layer.kind === 5 && !!layer.text?.text;
        hasImages ||= layer.kind === 2 && layer.image !== undefined;
    }

    // Shape + solid layers (both reported as kind 4 by the parser).
    if (hasShapes) {
        renderers.set(4, CreateFillRenderer(engine));
    }
    if (hasText) {
        renderers.set(
            5,
            CreateTextRenderer(
                engine,
                anim.layers.filter((l) => l.kind === 5)
            )
        );
    }
    if (hasImages) {
        renderers.set(2, CreateImageRenderer(engine, anim.assets));
    }

    return BuildPlayer(engine, anim, renderers, options?.backgroundColor);
}
