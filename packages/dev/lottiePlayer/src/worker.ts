/* eslint-disable require-atomic-updates */
// Keep only type-only imports at module scope so nothing with side-effects runs in the worker at load time
import type { Nullable } from "core/types";
import type { AnimationConfiguration } from "./animationConfiguration";
import type { RawLottieAnimation } from "./parsing/rawTypes";
import type { AnimationController } from "./rendering/animationController";
import type { Message, AnimationSizeMessage, AnimationUrlMessagePayload, StartAnimationMessagePayload, ContainerResizeMessagePayload, WorkerLoadedMessage } from "./messageTypes";

let RawAnimation: Nullable<RawLottieAnimation> = null;
let Controller: Nullable<AnimationController> = null;

// Pre-warmed module exports - stored during pre-warm phase for faster access
let GetRawAnimationDataAsync: any = null;
let DefaultConfiguration: any = null;
let AnimationControllerClass: any = null;
let AnimationPromises: any = null;

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
                const [configModule, controllerModule] = await Promise.all([import("./animationConfiguration"), import("./rendering/animationController")]);

                // Store the actual exports we'll need
                GetRawAnimationDataAsync = parserModule.GetRawAnimationDataAsync;
                DefaultConfiguration = configModule.DefaultConfiguration;
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

            // If the Configuration and Controller were not pre-warmed, start loading them now
            if (DefaultConfiguration === null || AnimationControllerClass === null) {
                AnimationPromises = Promise.all([import("./animationConfiguration"), import("./rendering/animationController")]);
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
            // If we have started loading the Configuration and Controller, finish loading them
            if (AnimationPromises !== null) {
                const [configModule, controllerModule] = await AnimationPromises;
                DefaultConfiguration = configModule.DefaultConfiguration;
                AnimationControllerClass = controllerModule.AnimationController;
            }

            // If we did not attempt to load the Configuration and Controller earlier, load them now
            if (DefaultConfiguration === null || AnimationControllerClass === null) {
                const [configModule, controllerModule] = await Promise.all([import("./animationConfiguration"), import("./rendering/animationController")]);
                DefaultConfiguration = configModule.DefaultConfiguration;
                AnimationControllerClass = controllerModule.AnimationController;
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

            if (RawAnimation === null && payload.animationData) {
                RawAnimation = payload.animationData;
            }

            if (RawAnimation === null) {
                return;
            }

            const controller = new AnimationControllerClass(canvas, RawAnimation, scaleFactor, variables, finalConfig);
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
            DefaultConfiguration = null;
            AnimationControllerClass = null;
            AnimationPromises = null;
            break;
        }
        default:
            return;
    }
};
