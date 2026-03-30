import type { IDisposable } from "core/index";
import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { IInspectableCommandRegistry, InspectableCommandDescriptor } from "./inspectableCommandRegistry";
import type { ISceneContext } from "../sceneContext";

import { InspectableCommandRegistryIdentity } from "./inspectableCommandRegistry";
import { SceneContextIdentity } from "../sceneContext";

const UniqueIdArg = {
    name: "uniqueId",
    description: "The uniqueId of the entity to query.",
    required: true,
} as const;

function ParseUniqueId(args: Record<string, string>): number {
    const id = parseInt(args.uniqueId, 10);
    if (isNaN(id)) {
        throw new Error("uniqueId must be a number.");
    }
    return id;
}

/**
 * Service that registers CLI commands for querying scene entities by uniqueId.
 */
export const EntityQueryServiceDefinition: ServiceDefinition<[], [IInspectableCommandRegistry, ISceneContext]> = {
    friendlyName: "Entity Query Service",
    consumes: [InspectableCommandRegistryIdentity, SceneContextIdentity],
    factory: (commandRegistry, sceneContext) => {
        function getScene() {
            const scene = sceneContext.currentScene;
            if (!scene) {
                throw new Error("No active scene.");
            }
            return scene;
        }

        const commands: InspectableCommandDescriptor[] = [
            {
                id: "query-mesh",
                description: "Query a mesh by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.meshes.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No mesh found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-light",
                description: "Query a light by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.lights.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No light found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-camera",
                description: "Query a camera by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.cameras.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No camera found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-material",
                description: "Query a material by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.materials.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No material found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-texture",
                description: "Query a texture by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.textures.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No texture found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-transformNode",
                description: "Query a transform node by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.transformNodes.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No transform node found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-geometry",
                description: "Query a geometry by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.geometries?.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No geometry found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-skeleton",
                description: "Query a skeleton by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.skeletons.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No skeleton found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-animation",
                description: "Query an animation by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.animations.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No animation found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-animationGroup",
                description: "Query an animation group by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.animationGroups.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No animation group found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-particleSystem",
                description: "Query a particle system by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.particleSystems.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No particle system found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(false), null, 2);
                },
            },
            {
                id: "query-morphTargetManager",
                description: "Query a morph target manager by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.morphTargetManagers.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No morph target manager found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-multiMaterial",
                description: "Query a multi-material by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.multiMaterials.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No multi-material found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
            {
                id: "query-postProcess",
                description: "Query a post-process by uniqueId and return its serialized data.",
                args: [UniqueIdArg],
                executeAsync: async (args) => {
                    const scene = getScene();
                    const id = ParseUniqueId(args);
                    const entity = scene.postProcesses.find((e) => e.uniqueId === id);
                    if (!entity) {
                        throw new Error(`No post-process found with uniqueId ${id}.`);
                    }
                    return JSON.stringify(entity.serialize(), null, 2);
                },
            },
        ];

        const registrations: IDisposable[] = commands.map((cmd) => commandRegistry.addCommand(cmd));

        return {
            dispose: () => {
                for (const reg of registrations) {
                    reg.dispose();
                }
            },
        };
    },
};
