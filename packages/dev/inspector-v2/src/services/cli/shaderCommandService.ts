import { type ServiceDefinition } from "../../modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "../sceneContext";
import { type IInspectableCommandRegistry, InspectableCommandRegistryIdentity } from "./inspectableCommandRegistry";

/**
 * Service that registers a CLI command for retrieving compiled shader code from a material.
 */
export const ShaderCommandServiceDefinition: ServiceDefinition<[], [IInspectableCommandRegistry, ISceneContext]> = {
    friendlyName: "Shader Command Service",
    consumes: [InspectableCommandRegistryIdentity, SceneContextIdentity],
    factory: (commandRegistry, sceneContext) => {
        const registration = commandRegistry.addCommand({
            id: "get-shader-code",
            description: "Get the shader code for a material by uniqueId.",
            args: [
                {
                    name: "uniqueId",
                    description: "The uniqueId of the material.",
                    required: true,
                },
                {
                    name: "variant",
                    description: "Which shader variant to return: compiled (default), raw, or beforeMigration.",
                    required: false,
                },
            ],
            executeAsync: async (args) => {
                const scene = sceneContext.currentScene;
                if (!scene) {
                    throw new Error("No active scene.");
                }

                const id = parseInt(args.uniqueId, 10);
                if (isNaN(id)) {
                    throw new Error("uniqueId must be a number.");
                }

                const material = scene.materials.find((m) => m.uniqueId === id);
                if (!material) {
                    throw new Error(`No material found with uniqueId ${id}.`);
                }

                const effect = material.getEffect();
                if (!effect) {
                    throw new Error(`Material "${material.name}" has no effect. It may not have been rendered yet.`);
                }

                if (!effect.isReady()) {
                    throw new Error(`Material "${material.name}" effect is not ready. Wait for it to be rendered.`);
                }

                const variant = args.variant ?? "compiled";

                let vertexShader: string;
                let fragmentShader: string;

                switch (variant) {
                    case "compiled":
                        vertexShader = effect.vertexSourceCode;
                        fragmentShader = effect.fragmentSourceCode;
                        break;
                    case "raw":
                        vertexShader = effect.rawVertexSourceCode;
                        fragmentShader = effect.rawFragmentSourceCode;
                        break;
                    case "beforeMigration":
                        vertexShader = effect.vertexSourceCodeBeforeMigration;
                        fragmentShader = effect.fragmentSourceCodeBeforeMigration;
                        break;
                    default:
                        throw new Error(`Unknown variant "${variant}". Use: compiled, raw, or beforeMigration.`);
                }

                return JSON.stringify({ vertexShader, fragmentShader }, null, 2);
            },
        });

        return {
            dispose: () => {
                registration.dispose();
            },
        };
    },
};
