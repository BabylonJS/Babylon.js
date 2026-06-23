/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./MSFT_audio_emitter.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./MSFT_audio_emitter.types";
export * from "./MSFT_audio_emitter.pure";

import "core/Audio/audioSceneComponent";

import { RegisterMSFT_audio_emitter } from "./MSFT_audio_emitter.pure";
RegisterMSFT_audio_emitter();
