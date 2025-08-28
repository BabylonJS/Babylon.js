// Keep only type-only imports at module scope so nothing with side-effects runs in the worker at load time
import type { Nullable } from "core/types";
import type { AnimationConfiguration } from "./animationConfiguration";
import type { RawLottieAnimation } from "./parsing/rawTypes";
import type { AnimationController } from "./rendering/animationController";
import type { Message, AnimationSizeMessage, AnimationUrlMessagePayload, StartAnimationMessagePayload, ContainerResizeMessagePayload } from "./messageTypes";

let RawAnimation: Nullable<RawLottieAnimation> = null;
let Controller: Nullable<AnimationController> = null;
let AnimationPromises: any = null;

onmessage = async function (evt) {
    const message = evt.data as Message;
    if (message === undefined) {
        return;
    }

    switch (message.type) {
        case "animationUrl": {
            const payload = message.payload as AnimationUrlMessagePayload;
            const { GetRawAnimationDataAsync } = await import("./parsing/parser");
            // Fire the promises to load the code so we can do it while we fetch the file and go back to the main thread
            AnimationPromises = Promise.all([import("./animationConfiguration"), import("./rendering/animationController")]);
            RawAnimation = await GetRawAnimationDataAsync(payload.url);

            // Send this information back to the main thread so it can size the canvas correctly
            const sizeMessage: AnimationSizeMessage = {
                type: "animationSize",
                payload: {
                    width: RawAnimation.w,
                    height: RawAnimation.h,
                },
            };

            postMessage(sizeMessage);
            break;
        }
        case "startAnimation": {
            if (AnimationPromises === null) {
                AnimationPromises = Promise.all([import("./animationConfiguration"), import("./rendering/animationController")]);
            }

            const [{ DefaultConfiguration }, { AnimationController }] = await AnimationPromises;

            const payload = message.payload as StartAnimationMessagePayload;
            const canvas = payload.canvas;
            const scaleFactor = payload.scaleFactor;
            const variables = payload.variables ?? new Map<string, string>();
            const originalConfig = payload.configuration ?? {};
            const finalConfig: AnimationConfiguration = {
                ...DefaultConfiguration,
                ...originalConfig,
            };

            if (RawAnimation === null && payload.animationData) {
                RawAnimation = payload.animationData;
            }

            if (RawAnimation === null) {
                return;
            }

            const controller = new AnimationController(canvas, RawAnimation, scaleFactor, variables, finalConfig);
            controller.playAnimation();
            Controller = controller;
            break;
        }
        case "containerResize": {
            if (Controller === null) {
                return;
            }

            const payload = message.payload as ContainerResizeMessagePayload;
            const scaleFactor = payload.scaleFactor;

            Controller.setScale(scaleFactor);
            break;
        }
        default:
            return;
    }
};
