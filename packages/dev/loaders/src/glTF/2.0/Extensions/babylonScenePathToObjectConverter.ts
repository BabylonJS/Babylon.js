/* eslint-disable @typescript-eslint/naming-convention */

import { type Scene } from "core/scene";
import { type TransformNode } from "core/Meshes/transformNode";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type Material } from "core/Materials/material";
import { type Vector3, Quaternion, type Matrix } from "core/Maths/math.vector";
import { type IObjectAccessor } from "core/FlowGraph/typeDefinitions";
import { type IObjectInfo, type IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";

/**
 * Root of the JSON-Pointer namespace under which Babylon-scene objects are
 * addressed by KHR_interactivity refs that did not originate from the source
 * glTF asset (e.g. refs emitted by engine-specific event blocks).
 *
 * Trailing `/` is intentional: it lets path-prefix dispatchers like
 * {@link CompositePathToObjectConverter} match cleanly.
 */
export const BABYLON_SCENE_OBJECT_MODEL_PREFIX = "/extensions/BABYLON_scene_objects/";

/**
 * Shape of the Babylon-scene object model tree consumed by
 * {@link BabylonScenePathToObjectConverter}. Mirrors `IGLTFObjectModelTree`
 * but is rooted at scene-asset arrays (`transformNodes`, `meshes`, …) and
 * keyed by Babylon `uniqueId`. Initially we only expose the property leaves
 * needed to validate the seam end-to-end; future leaves can be added without
 * any path-converter changes.
 */
export interface IBabylonSceneObjectModelTree {
    /**
     *
     */
    transformNodes: IBabylonObjectCollection<TransformNode>;
    /**
     *
     */
    meshes: IBabylonObjectCollection<AbstractMesh>;
    /**
     *
     */
    materials: IBabylonObjectCollection<Material>;
}

/**
 * Generic per-collection node in the tree. `length` exposes a `.length`
 * accessor (mirroring glTF). `__array__` is the per-instance leaf hit when a
 * uniqueId index appears in the path.
 */
export interface IBabylonObjectCollection<TBabylon> {
    /**
     *
     */
    length: IObjectAccessor<TBabylon[], TBabylon[], number>;
    /**
     *
     */
    __array__: IBabylonObjectLeaves<TBabylon>;
}

/** Per-instance accessors. Add new properties here as they are needed. */
export interface IBabylonObjectLeaves<TBabylon> {
    /** Marks this position as a `getTarget` boundary so the resolver can hand back the instance itself. */
    __target__?: boolean;
    /**
     *
     */
    name?: IObjectAccessor<TBabylon, TBabylon, string>;
    /**
     *
     */
    translation?: IObjectAccessor<TBabylon, TBabylon, Vector3>;
    /**
     *
     */
    rotation?: IObjectAccessor<TBabylon, TBabylon, Quaternion>;
    /**
     *
     */
    scale?: IObjectAccessor<TBabylon, TBabylon, Vector3>;
    /**
     *
     */
    matrix?: IObjectAccessor<TBabylon, TBabylon, Matrix>;
    /**
     *
     */
    globalMatrix?: IObjectAccessor<TBabylon, TBabylon, Matrix>;
    /**
     *
     */
    visible?: IObjectAccessor<TBabylon, TBabylon, boolean>;
}

/**
 * Type aliases used internally to keep the per-property accessor signatures
 * narrow without forcing every leaf to be re-typed at the use site.
 */
type AnyAccessor = IObjectAccessor<any, any, any>;

/**
 * Resolves JSON Pointer paths in the `/extensions/BABYLON_scene_objects/...`
 * namespace to Babylon scene objects.
 *
 * The path layout is `/{root}/{collection}/{uniqueId}/{property}` where
 * `{root}` is the literal `extensions/BABYLON_scene_objects` prefix and
 * `{uniqueId}` is the Babylon `uniqueId` (stable per session) of the target
 * instance. For example:
 *
 * - `/extensions/BABYLON_scene_objects/transformNodes/42/translation`
 * - `/extensions/BABYLON_scene_objects/meshes/17/visible`
 *
 * Composite path dispatchers (see {@link CompositePathToObjectConverter})
 * route paths starting with the prefix here; everything else continues to be
 * resolved by the standard glTF converter.
 */
export class BabylonScenePathToObjectConverter implements IPathToObjectConverter<IObjectAccessor> {
    public constructor(
        private _scene: Scene,
        private _tree: IBabylonSceneObjectModelTree
    ) {}

    /**
     * @param path the full JSON Pointer (must start with the Babylon prefix)
     * @returns an object-info container holding the resolved instance and accessor
     */
    public convert(path: string): IObjectInfo<IObjectAccessor> {
        if (!path.startsWith(BABYLON_SCENE_OBJECT_MODEL_PREFIX)) {
            throw new Error(`BabylonScenePathToObjectConverter: path "${path}" does not start with the expected prefix "${BABYLON_SCENE_OBJECT_MODEL_PREFIX}".`);
        }

        // Strip the namespace prefix and split. Ignore trailing empty segments
        // so refs of the form "/extensions/BABYLON_scene_objects/transformNodes/42/" parse cleanly.
        const tail = path.slice(BABYLON_SCENE_OBJECT_MODEL_PREFIX.length);
        const parts = tail.split("/").filter((p) => p.length > 0);
        if (parts.length === 0) {
            throw new Error(`BabylonScenePathToObjectConverter: path "${path}" is missing a collection name.`);
        }

        const collectionName = parts[0];
        const collection = (this._tree as unknown as Record<string, IBabylonObjectCollection<any> | undefined>)[collectionName];
        if (!collection) {
            throw new Error(`BabylonScenePathToObjectConverter: unknown collection "${collectionName}" in path "${path}".`);
        }

        // Handle `<collection>.length` (no instance lookup).
        if (parts.length === 2 && parts[1] === "length") {
            const arr = this._getCollectionArray(collectionName);
            return { object: arr, info: collection.length as AnyAccessor };
        }

        if (parts.length < 2) {
            throw new Error(`BabylonScenePathToObjectConverter: path "${path}" is missing an instance id.`);
        }

        const uniqueId = parseInt(parts[1], 10);
        if (!Number.isFinite(uniqueId) || uniqueId < 0) {
            throw new Error(`BabylonScenePathToObjectConverter: invalid uniqueId "${parts[1]}" in path "${path}".`);
        }

        const instance = this._lookupInstanceByUniqueId(collectionName, uniqueId);
        if (!instance) {
            throw new Error(`BabylonScenePathToObjectConverter: no ${collectionName} instance found with uniqueId ${uniqueId} (path "${path}").`);
        }

        // No property after the id → the ref itself is just a handle to the instance.
        // The accessor's `get` and `getTarget` both return the instance.
        if (parts.length === 2) {
            return {
                object: instance,
                info: this._buildIdentityAccessor(instance),
            };
        }

        // Walk the leaf descriptors for the requested property path. We keep this
        // very simple right now: only one segment after the id is supported, which
        // covers every property the initial leaves expose. Nested paths can be
        // added later by extending the walker.
        if (parts.length > 3) {
            throw new Error(`BabylonScenePathToObjectConverter: nested property paths are not yet supported (path "${path}").`);
        }
        const propertyName = parts[2];
        const leaf = (collection.__array__ as Record<string, IObjectAccessor<any, any, any> | boolean | undefined>)[propertyName];
        if (!leaf || typeof leaf === "boolean") {
            throw new Error(`BabylonScenePathToObjectConverter: property "${propertyName}" is not registered on ${collectionName} (path "${path}").`);
        }

        return {
            object: instance,
            info: leaf as AnyAccessor,
        };
    }

    private _getCollectionArray(collectionName: string): readonly any[] {
        switch (collectionName) {
            case "transformNodes":
                return this._scene.transformNodes;
            case "meshes":
                return this._scene.meshes;
            case "materials":
                return this._scene.materials;
            default:
                return [];
        }
    }

    private _lookupInstanceByUniqueId(collectionName: string, uniqueId: number): unknown | undefined {
        switch (collectionName) {
            case "transformNodes": {
                const direct = this._scene.transformNodes.find((n) => n.uniqueId === uniqueId);
                if (direct) {
                    return direct;
                }
                // Meshes are also transform nodes; allow the same path to resolve them.
                return this._scene.meshes.find((m) => m.uniqueId === uniqueId);
            }
            case "meshes":
                return this._scene.meshes.find((m) => m.uniqueId === uniqueId);
            case "materials":
                return this._scene.materials.find((m) => m.uniqueId === uniqueId);
            default:
                return undefined;
        }
    }

    private _buildIdentityAccessor(instance: unknown): AnyAccessor {
        return {
            type: "object",
            get: () => instance,
            getTarget: () => instance,
            isReadOnly: true,
        };
    }
}

/**
 * Builds the default Babylon-scene object-model tree.
 *
 * We deliberately start with a minimal set of properties: the goal of this
 * tree is to prove the seam (refs in the BABYLON namespace resolving through
 * the same `FlowGraphJsonPointerParserBlock` that the glTF refs use) without
 * committing to a complete property surface in this PR. Add new leaves here
 * as concrete event-source operations need them.
 * @returns a fresh Babylon-scene object-model tree with the default property surface.
 */
export function CreateDefaultBabylonSceneObjectModelTree(): IBabylonSceneObjectModelTree {
    return {
        transformNodes: {
            length: {
                type: "number",
                get: (arr: TransformNode[]) => arr.length,
                getTarget: (arr: TransformNode[]) => arr,
            },
            __array__: {
                __target__: true,
                name: {
                    type: "string",
                    get: (n: TransformNode) => n.name,
                    set: (v: string, n: TransformNode) => {
                        n.name = v;
                    },
                    getTarget: (n: TransformNode) => n,
                },
                translation: {
                    type: "Vector3",
                    get: (n: TransformNode) => n.position,
                    set: (v: Vector3, n: TransformNode) => n.position.copyFrom(v),
                    getTarget: (n: TransformNode) => n,
                },
                rotation: {
                    type: "Quaternion",
                    get: (n: TransformNode) => n.rotationQuaternion ?? Quaternion.RotationYawPitchRoll(n.rotation.y, n.rotation.x, n.rotation.z),
                    set: (v: Quaternion, n: TransformNode) => {
                        if (!n.rotationQuaternion) {
                            n.rotationQuaternion = v.clone();
                        } else {
                            n.rotationQuaternion.copyFrom(v);
                        }
                    },
                    getTarget: (n: TransformNode) => n,
                },
                scale: {
                    type: "Vector3",
                    get: (n: TransformNode) => n.scaling,
                    set: (v: Vector3, n: TransformNode) => n.scaling.copyFrom(v),
                    getTarget: (n: TransformNode) => n,
                },
                matrix: {
                    type: "Matrix",
                    get: (n: TransformNode) => n.computeWorldMatrix(false),
                    getTarget: (n: TransformNode) => n,
                    isReadOnly: true,
                },
                globalMatrix: {
                    type: "Matrix",
                    get: (n: TransformNode) => n.computeWorldMatrix(true),
                    getTarget: (n: TransformNode) => n,
                    isReadOnly: true,
                },
            },
        },
        meshes: {
            length: {
                type: "number",
                get: (arr: AbstractMesh[]) => arr.length,
                getTarget: (arr: AbstractMesh[]) => arr,
            },
            __array__: {
                __target__: true,
                name: {
                    type: "string",
                    get: (m: AbstractMesh) => m.name,
                    set: (v: string, m: AbstractMesh) => {
                        m.name = v;
                    },
                    getTarget: (m: AbstractMesh) => m,
                },
                visible: {
                    type: "boolean",
                    get: (m: AbstractMesh) => m.isVisible,
                    set: (v: boolean, m: AbstractMesh) => {
                        m.isVisible = v;
                    },
                    getTarget: (m: AbstractMesh) => m,
                },
            },
        },
        materials: {
            length: {
                type: "number",
                get: (arr: Material[]) => arr.length,
                getTarget: (arr: Material[]) => arr,
            },
            __array__: {
                __target__: true,
                name: {
                    type: "string",
                    get: (m: Material) => m.name,
                    set: (v: string, m: Material) => {
                        m.name = v;
                    },
                    getTarget: (m: Material) => m,
                },
            },
        },
    };
}
