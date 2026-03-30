import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IInspectableCommandRegistry } from "./inspectableCommandRegistry";
import type { ISceneContext } from "../sceneContext";

import { InspectableCommandRegistryIdentity } from "./inspectableCommandRegistry";
import { SceneContextIdentity } from "../sceneContext";

/**
 * Service that registers a CLI command for querying mesh data by uniqueId.
 */
export const EntityQueryServiceDefinition: ServiceDefinition<[], [IInspectableCommandRegistry, ISceneContext]> = {
    friendlyName: "Entity Query Service",
    consumes: [InspectableCommandRegistryIdentity, SceneContextIdentity],
    factory: (commandRegistry, sceneContext) => {
        const registration = commandRegistry.addCommand({
            id: "query-mesh",
            description: "Query a mesh by uniqueId and return its serialized data.",
            args: [
                {
                    name: "uniqueId",
                    description: "The uniqueId of the mesh to query.",
                    required: true,
                },
            ],
            execute: async (args) => {
                const scene = sceneContext.currentScene;
                if (!scene) {
                    throw new Error("No active scene.");
                }

                const uniqueId = parseInt(args.uniqueId, 10);
                if (isNaN(uniqueId)) {
                    throw new Error("uniqueId must be a number.");
                }

                const mesh = scene.meshes.find((m) => m.uniqueId === uniqueId);
                if (!mesh) {
                    throw new Error(`No mesh found with uniqueId ${uniqueId}.`);
                }

                return JSON.stringify(mesh.serialize(), null, 2);
            },
        });

        return {
            dispose: () => {
                registration.dispose();
            },
        };
    },
};
