// Parses a Lottie document, installs the base fill renderer, then loads optional renderer chunks
// for the layer kinds present in that document.

import { type ThinEngine } from "core/Engines/thinEngine";

import { type ILottieFile } from "../animation/lottieRaw";
import { type ILayerRenderer } from "../rendering/vector/layerRenderer";
import { ParseAnimation, type ILottiePlayerOptions } from "../animation/parse";
import { CreateFillRenderer } from "../rendering/vector/fillRenderer";
import { BuildPlayer, type ILottiePlayer } from "./playerCore";

/**
 * Creates a player for a Lottie document. The fill renderer is always available; text and image
 * renderer chunks load only when those layer kinds are present.
 * @param engine The engine to render with, from `CreateVectorEngine`.
 * @param file The raw Lottie document.
 * @param options Player options. `variables` substitutes text-layer content at load time for
 * localization (whole-string key match); `backgroundColor` sets the per-frame clear color.
 * @returns The player handle once all required renderer chunks have loaded.
 */
export async function CreateLottiePlayerAsync(engine: ThinEngine, file: ILottieFile, options?: ILottiePlayerOptions): Promise<ILottiePlayer> {
    const anim = ParseAnimation(file, options?.variables);
    const renderers = new Map<number, ILayerRenderer>();
    let hasText = false;
    let hasImages = false;
    for (const layer of anim.layers) {
        hasText ||= layer.kind === 5 && !!layer.text?.text;
        hasImages ||= layer.kind === 2 && layer.image !== undefined;
    }

    renderers.set(4, CreateFillRenderer(engine));

    const [textModule, imageModule] = await Promise.all([
        hasText ? import("../rendering/vector/textRenderer") : Promise.resolve(null),
        hasImages ? import("../rendering/vector/imageRenderer") : Promise.resolve(null),
    ]);

    if (textModule) {
        renderers.set(
            5,
            textModule.CreateTextRenderer(
                engine,
                anim.layers.filter((l) => l.kind === 5)
            )
        );
    }
    if (imageModule) {
        renderers.set(2, imageModule.CreateImageRenderer(engine, anim.assets));
    }

    return BuildPlayer(engine, anim, renderers, options?.backgroundColor);
}
