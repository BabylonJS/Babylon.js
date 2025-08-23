import type { Nullable } from "core/types";

import type { AnimationConfiguration } from "./animationConfiguration";
import { DefaultConfiguration } from "./animationConfiguration";
import { AnimationController } from "./rendering/animationController";
import { GetRawAnimationDataAsync } from "./parsing/parser";
import type { RawLottieAnimation } from "./parsing/rawTypes";
import type { StartAnimationMessagePayload, AnimationSizeMessage, AnimationUrlMessagePayload, Message, ContainerResizeMessagePayload } from "./messageTypes";

let RawAnimation: Nullable<RawLottieAnimation> = null;
let Controller: Nullable<AnimationController> = null;

onmessage = async function (evt) {
    const message = evt.data as Message;
    if (message === undefined) {
        return;
    }

    switch (message.type) {
        case "animationUrl": {
            const payload = message.payload as AnimationUrlMessagePayload;
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
            if (RawAnimation === null) {
                return;
            }

            const payload = message.payload as StartAnimationMessagePayload;

            const canvas = payload.canvas;
            const scaleFactor = payload.scaleFactor;
            const variables = payload.variables ?? new Map<string, string>();
            const originalConfig = payload.configuration ?? {};
            const finalConfig: AnimationConfiguration = {
                ...DefaultConfiguration,
                ...originalConfig,
            };

            Controller = new AnimationController(canvas, RawAnimation, scaleFactor, variables, finalConfig);
            Controller.playAnimation();
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
