/* eslint-disable require-atomic-updates */
// Keep only type-only imports at module scope so nothing with side-effects runs in the worker at load time
import type { Nullable } from "core/types";
import type { RawLottieAnimation } from "./parsing/rawTypes";
import type { AnimationController } from "./rendering/animationController";
import type { Message, AnimationSizeMessage, AnimationUrlMessagePayload, StartAnimationMessagePayload, ContainerResizeMessagePayload, WorkerLoadedMessage } from "./messageTypes";

let RawAnimation: Nullable<RawLottieAnimation> = null;
let Controller: Nullable<AnimationController> = null;

// Pre-warmed module exports - stored during pre-warm phase for faster access
let GetRawAnimationDataAsync: any = null;
let AnimationControllerClass: any = null;
let AnimationControllerPromise: any = null;

onmessage = async function (evt) {
    const message = evt.data as Message;
    if (message === undefined) {
        return;
    }

    switch (message.type) {
        case "preWarm": {
            let success = true;
            let errorString = undefined;
            try {
                // Load modules and store their exports
                const parserModule = await import("./parsing/parser");
                const controllerModule = await import("./rendering/animationController");

                // Store the actual exports we'll need
                GetRawAnimationDataAsync = parserModule.GetRawAnimationDataAsync;
                AnimationControllerClass = controllerModule.AnimationController;
            } catch (error: unknown) {
                success = false;
                errorString = error instanceof Error ? error.message : String(error);
            }

            const sizeMessage: WorkerLoadedMessage = {
                type: "workerLoaded",
                payload: {
                    success: success,
                    error: errorString,
                },
            };

            postMessage(sizeMessage);
            break;
        }
        case "animationUrl": {
            const payload = message.payload as AnimationUrlMessagePayload;

            // If the Controller was not pre-warmed, start loading it now
            if (AnimationControllerClass === null) {
                AnimationControllerPromise = import("./rendering/animationController");
            }

            // Use pre-warmed parser if available, otherwise load it
            if (GetRawAnimationDataAsync === null) {
                const parserModule = await import("./parsing/parser");
                // We are ok having a race condition here, as both should resolve to the same function
                GetRawAnimationDataAsync = parserModule.GetRawAnimationDataAsync;
            }

            RawAnimation = await GetRawAnimationDataAsync(payload.url);
            if (RawAnimation === null) {
                return;
            }

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
            // If we have started loading the Controller, finish loading it
            if (AnimationControllerPromise !== null) {
                const controllerModule = await AnimationControllerPromise;
                AnimationControllerClass = controllerModule.AnimationController;
            }

            // If we did not attempt to load the Controller earlier, load it now
            if (AnimationControllerClass === null) {
                const controllerModule = await import("./rendering/animationController");
                AnimationControllerClass = controllerModule.AnimationController;
            }

            const payload = message.payload as StartAnimationMessagePayload;
            if (RawAnimation === null && payload.animationData) {
                RawAnimation = payload.animationData;
            }

            if (RawAnimation === null) {
                return;
            }

            const controller = new AnimationControllerClass(
                payload.canvas,
                RawAnimation,
                payload.scaleFactor,
                payload.variables ?? new Map<string, string>(),
                payload.configuration ?? {},
                payload.mainThreadDevicePixelRatio
            );

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
        case "dispose": {
            if (Controller) {
                Controller.dispose();
                Controller = null;
            }

            if (RawAnimation) {
                RawAnimation = null;
            }

            GetRawAnimationDataAsync = null;
            AnimationControllerClass = null;
            AnimationControllerPromise = null;
            break;
        }
        default:
            return;
    }
};
