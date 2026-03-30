import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IInspectableCommandRegistry } from "./inspectableCommandRegistry";
import type { ISceneContext } from "../sceneContext";

import { CreateScreenshotUsingRenderTargetAsync } from "core/Misc/screenshotTools";
import { FrameGraphUtils } from "core/FrameGraph/frameGraphUtils";
import { InspectableCommandRegistryIdentity } from "./inspectableCommandRegistry";
import { SceneContextIdentity } from "../sceneContext";

/**
 * Service that registers a CLI command for capturing a screenshot of the scene.
 * Returns the image as a base64 data URL, suitable for consumption by AI agents.
 */
export const ScreenshotCommandServiceDefinition: ServiceDefinition<[], [IInspectableCommandRegistry, ISceneContext]> = {
    friendlyName: "Screenshot Command Service",
    consumes: [InspectableCommandRegistryIdentity, SceneContextIdentity],
    factory: (commandRegistry, sceneContext) => {
        const registration = commandRegistry.addCommand({
            id: "take-screenshot",
            description: "Capture a screenshot of the scene. Returns base64-encoded PNG data.",
            args: [
                {
                    name: "cameraUniqueId",
                    description: "The uniqueId of the camera to use. Defaults to the active camera.",
                    required: false,
                },
                {
                    name: "width",
                    description: "Screenshot width in pixels. When set, uses custom size mode.",
                    required: false,
                },
                {
                    name: "height",
                    description: "Screenshot height in pixels. When set, uses custom size mode.",
                    required: false,
                },
                {
                    name: "precision",
                    description: "Resolution multiplier (e.g. 2 for double resolution). Defaults to 1.",
                    required: false,
                },
            ],
            executeAsync: async (args) => {
                const scene = sceneContext.currentScene;
                if (!scene) {
                    throw new Error("No active scene.");
                }

                const engine = scene.getEngine();

                // Resolve camera: explicit uniqueId, or active/frame-graph camera.
                let camera;
                if (args.cameraUniqueId) {
                    const cameraId = parseInt(args.cameraUniqueId, 10);
                    if (isNaN(cameraId)) {
                        throw new Error("cameraUniqueId must be a number.");
                    }
                    camera = scene.cameras.find((c) => c.uniqueId === cameraId);
                    if (!camera) {
                        throw new Error(`No camera found with uniqueId ${cameraId}.`);
                    }
                } else {
                    camera = scene.frameGraph ? FrameGraphUtils.FindMainCamera(scene.frameGraph) : scene.activeCamera;
                }

                if (!camera) {
                    throw new Error("No camera available for screenshot.");
                }

                const precision = args.precision ? parseFloat(args.precision) : 1;
                const width = args.width ? parseInt(args.width, 10) : undefined;
                const height = args.height ? parseInt(args.height, 10) : undefined;

                const screenshotSize = width !== undefined && height !== undefined ? { width, height, precision } : { precision };

                // Omit fileName to get data URL back without triggering a download.
                const dataUrl = await CreateScreenshotUsingRenderTargetAsync(engine, camera, screenshotSize, "image/png");

                // Strip the data URI prefix to return raw base64, which is what AI agent APIs expect.
                const commaIndex = dataUrl.indexOf(",");
                return commaIndex !== -1 ? dataUrl.substring(commaIndex + 1) : dataUrl;
            },
        });

        return {
            dispose: () => {
                registration.dispose();
            },
        };
    },
};
