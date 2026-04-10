import {
    type AbstractMesh,
    type Animation,
    type AnimationGroup,
    type BaseTexture,
    type Camera,
    type EffectLayer,
    type FrameGraph,
    type Geometry,
    type IDisposable,
    type IParticleSystem,
    type ISpriteManager,
    type Light,
    type Material,
    type MorphTargetManager,
    type MultiMaterial,
    type PostProcess,
    type PostProcessRenderPipeline,
    type Scene,
    type Skeleton,
    type Sound,
    type TransformNode,
} from "core/index";
import { UniqueIdGenerator } from "core/Misc/uniqueIdGenerator";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISceneContext, SceneContextIdentity } from "../sceneContext";
import { type IInspectableCommandRegistry, type InspectableCommandDescriptor, InspectableCommandRegistryIdentity } from "./inspectableCommandRegistry";

const UniqueIdArg = {
    name: "uniqueId",
    description: "The uniqueId of the entity to query. Omit to list all entities of this type.",
    required: false,
} as const;

const SyntheticUniqueIds = new WeakMap<object, number>();

function GetEntityId(entity: object): number {
    if ("uniqueId" in entity && typeof entity.uniqueId === "number") {
        return entity.uniqueId;
    }

    let id = SyntheticUniqueIds.get(entity);
    if (!id) {
        SyntheticUniqueIds.set(entity, (id = UniqueIdGenerator.UniqueId));
    }
    return id;
}

interface IEntitySummary {
    /** The unique id. */
    uniqueId: number;
    /** The entity name, if available. */
    name?: string;
    /** The class name from getClassName(), if available. */
    className?: string;
    /** The parent's uniqueId, if the entity is hierarchical. */
    parentId?: number;
}

interface IEntityCollection<T> {
    /** The command id. */
    id: string;
    /** The command description. */
    description: string;
    /** Accessor for the entity array from the scene. */
    getEntities: (scene: Scene) => T[] | undefined;
    /** Gets the uniqueId from an entity (uses synthetic ids for entities without a native uniqueId). */
    getUniqueId: (entity: T) => number;
    /** Builds a summary for listing. */
    getSummary: (entity: T) => IEntitySummary;
    /** Serializes a single entity to a plain object. If absent, querying by id returns the summary. */
    serialize?: (entity: T) => unknown;
}

function NodeSummary(entity: { uniqueId: number; name: string; getClassName(): string; parent?: { uniqueId: number } | null }): IEntitySummary {
    return {
        uniqueId: entity.uniqueId,
        name: entity.name,
        className: entity.getClassName(),
        parentId: entity.parent?.uniqueId,
    };
}

function NamedSummary(entity: { uniqueId: number; name: string; getClassName(): string }): IEntitySummary {
    return {
        uniqueId: entity.uniqueId,
        name: entity.name,
        className: entity.getClassName(),
    };
}

function MinimalSummary(entity: { uniqueId: number; name?: string }): IEntitySummary {
    return {
        uniqueId: entity.uniqueId,
        name: entity.name,
    };
}

function MakeQueryCommand<T>(collection: IEntityCollection<T>, sceneContext: ISceneContext): InspectableCommandDescriptor {
    return {
        id: collection.id,
        description: collection.description,
        args: [UniqueIdArg],
        executeAsync: async (args) => {
            const scene = sceneContext.currentScene;
            if (!scene) {
                throw new Error("No active scene.");
            }

            const entities = collection.getEntities(scene);
            if (!entities) {
                return JSON.stringify([], null, 2);
            }

            if (!args.uniqueId) {
                return JSON.stringify(
                    entities.map((e) => collection.getSummary(e)),
                    null,
                    2
                );
            }

            const id = parseInt(args.uniqueId, 10);
            if (isNaN(id)) {
                throw new Error("uniqueId must be a number.");
            }

            const entity = entities.find((e) => collection.getUniqueId(e) === id);
            if (!entity) {
                throw new Error(`No ${collection.id.replace("query-", "")} found with uniqueId ${id}.`);
            }

            return JSON.stringify(collection.serialize ? collection.serialize(entity) : collection.getSummary(entity), null, 2);
        },
    };
}

/**
 * Service that registers CLI commands for querying scene entities by uniqueId.
 * When uniqueId is omitted, returns a summary list of all entities of that type.
 */
export const EntityQueryServiceDefinition: ServiceDefinition<[], [IInspectableCommandRegistry, ISceneContext]> = {
    friendlyName: "Entity Query Service",
    consumes: [InspectableCommandRegistryIdentity, SceneContextIdentity],
    factory: (commandRegistry, sceneContext) => {
        const collections = [
            {
                id: "query-mesh",
                description: "List meshes, or query a specific mesh by uniqueId.",
                getEntities: (scene) => scene.meshes,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NodeSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<AbstractMesh>,
            {
                id: "query-light",
                description: "List lights, or query a specific light by uniqueId.",
                getEntities: (scene) => scene.lights,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NodeSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<Light>,
            {
                id: "query-camera",
                description: "List cameras, or query a specific camera by uniqueId.",
                getEntities: (scene) => scene.cameras,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NodeSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<Camera>,
            {
                id: "query-transformNode",
                description: "List transform nodes, or query a specific transform node by uniqueId.",
                getEntities: (scene) => scene.transformNodes,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NodeSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<TransformNode>,
            {
                id: "query-material",
                description: "List materials, or query a specific material by uniqueId.",
                getEntities: (scene) => scene.materials,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NamedSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<Material>,
            {
                id: "query-texture",
                description: "List textures, or query a specific texture by uniqueId.",
                getEntities: (scene) => scene.textures,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NamedSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<BaseTexture>,
            {
                id: "query-skeleton",
                description: "List skeletons, or query a specific skeleton by uniqueId.",
                getEntities: (scene) => scene.skeletons,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NamedSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<Skeleton>,
            {
                id: "query-geometry",
                description: "List geometries, or query a specific geometry by uniqueId.",
                getEntities: (scene) => scene.geometries,
                getUniqueId: (e) => e.uniqueId,
                getSummary: MinimalSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<Geometry>,
            {
                id: "query-animation",
                description: "List animations, or query a specific animation by uniqueId.",
                getEntities: (scene) => scene.animations,
                getUniqueId: (e) => e.uniqueId,
                getSummary: MinimalSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<Animation>,
            {
                id: "query-animationGroup",
                description: "List animation groups, or query a specific animation group by uniqueId.",
                getEntities: (scene) => scene.animationGroups,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NamedSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<AnimationGroup>,
            {
                id: "query-particleSystem",
                description: "List particle systems, or query a specific particle system by uniqueId.",
                getEntities: (scene) => scene.particleSystems,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NamedSummary,
                serialize: (e) => e.serialize(false),
            } satisfies IEntityCollection<IParticleSystem>,
            {
                id: "query-morphTargetManager",
                description: "List morph target managers, or query a specific morph target manager by uniqueId.",
                getEntities: (scene) => scene.morphTargetManagers,
                getUniqueId: (e) => e.uniqueId,
                getSummary: MinimalSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<MorphTargetManager>,
            {
                id: "query-multiMaterial",
                description: "List multi-materials, or query a specific multi-material by uniqueId.",
                getEntities: (scene) => scene.multiMaterials,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NamedSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<MultiMaterial>,
            {
                id: "query-postProcess",
                description: "List post-processes, or query a specific post-process by uniqueId.",
                getEntities: (scene) => scene.postProcesses,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NamedSummary,
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<PostProcess>,
            {
                id: "query-frameGraph",
                description: "List frame graphs, or query a specific frame graph by uniqueId.",
                getEntities: (scene) => scene.frameGraphs,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NamedSummary,
            } satisfies IEntityCollection<FrameGraph>,
            {
                id: "query-effectLayer",
                description: "List effect layers, or query a specific effect layer by uniqueId.",
                getEntities: (scene) => scene.effectLayers,
                getUniqueId: (e) => e.uniqueId,
                getSummary: NamedSummary,
                serialize: (e) => e.serialize?.(),
            } satisfies IEntityCollection<EffectLayer>,
            {
                id: "query-spriteManager",
                description: "List sprite managers, or query a specific sprite manager by uniqueId.",
                getEntities: (scene) => scene.spriteManagers,
                getUniqueId: (e) => e.uniqueId,
                getSummary: MinimalSummary,
                serialize: (e) => e.serialize(false),
            } satisfies IEntityCollection<ISpriteManager>,
            {
                id: "query-sound",
                description: "List sounds in the main sound track, or query a specific sound by uniqueId.",
                getEntities: (scene) => scene.mainSoundTrack?.soundCollection ?? [],
                getUniqueId: (e) => GetEntityId(e),
                getSummary: (e) => ({ uniqueId: GetEntityId(e), name: e.name, className: e.getClassName() }),
                serialize: (e) => e.serialize(),
            } satisfies IEntityCollection<Sound>,
            {
                id: "query-renderingPipeline",
                description: "List rendering pipelines, or query a specific rendering pipeline by uniqueId.",
                getEntities: (scene) => scene.postProcessRenderPipelineManager?.supportedPipelines ?? [],
                getUniqueId: (e) => e.uniqueId,
                getSummary: NamedSummary,
            } satisfies IEntityCollection<PostProcessRenderPipeline>,
        ];

        const registrations: IDisposable[] = collections.map((col) => commandRegistry.addCommand(MakeQueryCommand(col as IEntityCollection<unknown>, sceneContext)));

        return {
            dispose: () => {
                for (const reg of registrations) {
                    reg.dispose();
                }
            },
        };
    },
};
