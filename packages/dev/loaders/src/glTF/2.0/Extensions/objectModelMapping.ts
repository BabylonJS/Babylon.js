/* eslint-disable @typescript-eslint/naming-convention */

import { type TransformNode } from "core/Meshes/transformNode";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type MorphTargetManager } from "core/Morph/morphTargetManager";
import {
    type IAnimation,
    type ICamera,
    type IGLTF,
    type IKHRLightsPunctual_Light,
    type IEXTLightsArea_Light,
    type IMaterial,
    type IMesh,
    type IMeshPrimitive,
    type INode,
    type IScene,
    type ISkin,
} from "../glTFLoaderInterfaces";
import { type Vector3, Matrix, Quaternion, Vector2 } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
import { type Color3, Color4 } from "core/Maths/math.color";
import { type PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { type Light } from "core/Lights/light";
import { type Nullable } from "core/types";
import { SpotLight } from "core/Lights/spotLight";
import { type IEXTLightsImageBased_LightImageBased } from "babylonjs-gltf2interface";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type IInterpolationPropertyInfo, type IObjectAccessor } from "core/FlowGraph/typeDefinitions";
import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import { type AnimationGroup } from "core/Animations/animationGroup";
import { type Mesh } from "core/Meshes/mesh";
import { type RectAreaLight } from "core/Lights/rectAreaLight";

/**
 * Top-level shape of the glTF Object Model accessor tree. Each property
 * describes a navigable section of the JSON-Pointer namespace (e.g. `/nodes`,
 * `/materials`, `/scenes`) that KHR_interactivity, KHR_animation_pointer and
 * other extensions consume via {@link GetMappingForKey}.
 */
export interface IGLTFObjectModelTree {
    /** Read-only accessor for the active scene index (`/scene`). */
    scene: { __target__: boolean } & IObjectAccessor<number | undefined, any, number>;
    /** Accessor tree for `/cameras`. */
    cameras: IGLTFObjectModelTreeCamerasObject;
    /** Accessor tree for `/nodes`. */
    nodes: IGLTFObjectModelTreeNodesObject;
    /** Accessor tree for `/materials`. */
    materials: IGLTFObjectModelTreeMaterialsObject;
    /** Accessor tree for `/extensions` (root-level glTF extensions). */
    extensions: IGLTFObjectModelTreeExtensionsObject;
    /** Accessor tree for `/animations`. */
    animations: {
        length: IObjectAccessor<IAnimation[], AnimationGroup[], number>;
        __array__: {};
    };
    /** Accessor tree for `/meshes`. */
    meshes: IGLTFObjectModelTreeMeshesObject;
    /** Accessor tree for `/scenes`. */
    scenes: IGLTFObjectModelTreeScenesObject;
    /** Accessor tree for `/skins`. */
    skins: IGLTFObjectModelTreeSkinsObject;
}

/**
 * Accessor tree describing the `/nodes` section of the glTF Object Model.
 * Exposes per-node TRS, ref-typed parent/children/camera/mesh/skin links,
 * morph-target weights and node-extension properties.
 */
export interface IGLTFObjectModelTreeNodesObject<GLTFTargetType = INode, BabylonTargetType = TransformNode> {
    /** Number of nodes in the array. */
    length: IObjectAccessor<GLTFTargetType[], BabylonTargetType[], number>;
    __array__: {
        __target__: boolean;
        translation: IObjectAccessor<GLTFTargetType, BabylonTargetType, Vector3>;
        rotation: IObjectAccessor<GLTFTargetType, BabylonTargetType, Quaternion>;
        scale: IObjectAccessor<GLTFTargetType, BabylonTargetType, Vector3>;
        matrix: IObjectAccessor<GLTFTargetType, BabylonTargetType, Matrix>;
        globalMatrix: IObjectAccessor<GLTFTargetType, BabylonTargetType, Matrix>;
        camera: IObjectAccessor<GLTFTargetType, any, string | undefined>;
        mesh: IObjectAccessor<GLTFTargetType, any, string | undefined>;
        skin: IObjectAccessor<GLTFTargetType, any, string | undefined>;
        parent: IObjectAccessor<GLTFTargetType, any, string | undefined>;
        children: {
            length: IObjectAccessor<number[], any, number>;
            __array__: { __target__: boolean } & IObjectAccessor<any, any, string>;
        };
        weights: {
            /** When true, the path converter skips objectTree traversal for this property, keeping the parent target. */
            __passThroughTarget__?: boolean;
            length: IObjectAccessor<GLTFTargetType, BabylonTargetType, number>;
            // The per-element target alternates between TransformNode (when the index is
            // out of range or no morph host is reachable) and MorphTarget (when it is),
            // so we widen the BabylonTargetType to `any` here.
            __array__: { __target__: boolean } & IObjectAccessor<GLTFTargetType, any, number>;
        } & IObjectAccessor<GLTFTargetType, BabylonTargetType, number[]>;
        extensions: {
            EXT_lights_ies?: {
                multiplier: IObjectAccessor<INode, Light, number>;
                color: IObjectAccessor<INode, Light, Color3>;
            };
            KHR_node_visibility?: {
                visible: IObjectAccessor<INode, Mesh, boolean>;
            };
        };
    };
}

/**
 * Accessor tree describing the `/cameras` section of the glTF Object Model.
 * Exposes orthographic and perspective camera properties.
 */
export interface IGLTFObjectModelTreeCamerasObject {
    /** Number of cameras in the array. */
    length: IObjectAccessor<ICamera[], any, number>;
    __array__: {
        __target__: boolean;
        orthographic: {
            xmag: IObjectAccessor<ICamera, ICamera, Vector2>;
            ymag: IObjectAccessor<ICamera, ICamera, Vector2>;
            zfar: IObjectAccessor<ICamera, ICamera, number>;
            znear: IObjectAccessor<ICamera, ICamera, number>;
        };
        perspective: {
            yfov: IObjectAccessor<ICamera, ICamera, number>;
            zfar: IObjectAccessor<ICamera, ICamera, number>;
            znear: IObjectAccessor<ICamera, ICamera, number>;
            aspectRatio: IObjectAccessor<ICamera, ICamera, Nullable<number>>;
        };
    };
}

/**
 * Accessor tree describing the `/materials` section of the glTF Object Model.
 * Covers core PBR properties as well as the family of KHR_materials_* extensions.
 */
export interface IGLTFObjectModelTreeMaterialsObject {
    /** Number of materials in the array. */
    length: IObjectAccessor<IMaterial[], PBRMaterial[], number>;
    __array__: {
        __target__: boolean;
        doubleSided: IObjectAccessor<IMaterial, PBRMaterial, boolean>;
        alphaCutoff: IObjectAccessor<IMaterial, PBRMaterial, number>;
        pbrMetallicRoughness: {
            baseColorFactor: IObjectAccessor<IMaterial, PBRMaterial, Color4>;
            metallicFactor: IObjectAccessor<IMaterial, PBRMaterial, Nullable<number>>;
            roughnessFactor: IObjectAccessor<IMaterial, PBRMaterial, Nullable<number>>;
            baseColorTexture: {
                extensions: {
                    KHR_texture_transform: ITextureDefinition;
                };
            };
            metallicRoughnessTexture: {
                extensions: {
                    KHR_texture_transform: ITextureDefinition;
                };
            };
        };
        emissiveFactor: IObjectAccessor<IMaterial, PBRMaterial, Color3>;
        normalTexture: {
            scale: IObjectAccessor<IMaterial, PBRMaterial, number>;
            extensions: {
                KHR_texture_transform: ITextureDefinition;
            };
        };
        occlusionTexture: {
            strength: IObjectAccessor<IMaterial, PBRMaterial, number>;
            extensions: {
                KHR_texture_transform: ITextureDefinition;
            };
        };
        emissiveTexture: {
            extensions: {
                KHR_texture_transform: ITextureDefinition;
            };
        };
        extensions: {
            KHR_materials_anisotropy: {
                anisotropyStrength: IObjectAccessor<IMaterial, PBRMaterial, number>;
                anisotropyRotation: IObjectAccessor<IMaterial, PBRMaterial, number>;
                anisotropyTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_clearcoat: {
                clearcoatFactor: IObjectAccessor<IMaterial, PBRMaterial, number>;
                clearcoatRoughnessFactor: IObjectAccessor<IMaterial, PBRMaterial, number>;
                clearcoatTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
                clearcoatNormalTexture: {
                    scale: IObjectAccessor<IMaterial, PBRMaterial, number>;
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
                clearcoatRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_dispersion: {
                dispersion: IObjectAccessor<IMaterial, PBRMaterial, number>;
            };
            KHR_materials_emissive_strength: {
                emissiveStrength: IObjectAccessor<IMaterial, PBRMaterial, number>;
            };
            KHR_materials_ior: {
                ior: IObjectAccessor<IMaterial, PBRMaterial, number>;
            };
            KHR_materials_iridescence: {
                iridescenceFactor: IObjectAccessor<IMaterial, PBRMaterial, number>;
                iridescenceIor: IObjectAccessor<IMaterial, PBRMaterial, number>;
                iridescenceThicknessMinimum: IObjectAccessor<IMaterial, PBRMaterial, number>;
                iridescenceThicknessMaximum: IObjectAccessor<IMaterial, PBRMaterial, number>;
                iridescenceTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
                iridescenceThicknessTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_sheen: {
                sheenColorFactor: IObjectAccessor<IMaterial, PBRMaterial, Color3>;
                sheenRoughnessFactor: IObjectAccessor<IMaterial, PBRMaterial, number>;
                sheenColorTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
                sheenRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_specular: {
                specularFactor: IObjectAccessor<IMaterial, PBRMaterial, number>;
                specularColorFactor: IObjectAccessor<IMaterial, PBRMaterial, Color3>;
                specularTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
                specularColorTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_transmission: {
                transmissionFactor: IObjectAccessor<IMaterial, PBRMaterial, number>;
                transmissionTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_diffuse_transmission: {
                diffuseTransmissionFactor: IObjectAccessor<IMaterial, PBRMaterial, number>;
                diffuseTransmissionTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
                diffuseTransmissionColorFactor: IObjectAccessor<IMaterial, PBRMaterial, Nullable<Color3>>;
                diffuseTransmissionColorTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_volume: {
                thicknessFactor: IObjectAccessor<IMaterial, PBRMaterial, number>;
                attenuationColor: IObjectAccessor<IMaterial, PBRMaterial, Color3>;
                attenuationDistance: IObjectAccessor<IMaterial, PBRMaterial, number>;
                thicknessTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
        };
    };
}

interface ITextureDefinition {
    offset: IObjectAccessor<IMaterial, PBRMaterial, Vector2>;
    rotation: IObjectAccessor<IMaterial, PBRMaterial, number>;
    scale: IObjectAccessor<IMaterial, PBRMaterial, Vector2>;
}

/**
 * Accessor tree describing the `/meshes` section of the glTF Object Model.
 * Exposes per-mesh primitives (and their material refs) and the mesh-level
 * morph-target weights array.
 */
export interface IGLTFObjectModelTreeMeshesObject {
    /** Number of meshes in the array. */
    length: IObjectAccessor<IMesh[], (Mesh | undefined)[], number>;
    __array__: {
        __target__: boolean;
        primitives: {
            length: IObjectAccessor<IMeshPrimitive[], any, number>;
            __array__: {
                __target__: boolean;
                material: IObjectAccessor<any, any, string | undefined>;
            };
        };
        weights: {
            length: IObjectAccessor<number[], any, number>;
            __array__: { __target__: boolean } & IObjectAccessor<any, any, number>;
        };
    };
}

/**
 * Accessor tree describing the `/scenes` section of the glTF Object Model.
 * Per-scene root-node refs are exposed under `nodes/{i}`.
 */
export interface IGLTFObjectModelTreeScenesObject {
    /** Number of scenes in the array. */
    length: IObjectAccessor<IScene[], any, number>;
    __array__: {
        __target__: boolean;
        nodes: {
            length: IObjectAccessor<number[], any, number>;
            __array__: { __target__: boolean } & IObjectAccessor<any, any, string>;
        };
    };
}

/**
 * Accessor tree describing the `/skins` section of the glTF Object Model.
 * Joint and skeleton properties are exposed as JSON-Pointer refs.
 */
export interface IGLTFObjectModelTreeSkinsObject {
    /** Number of skins in the array. */
    length: IObjectAccessor<ISkin[], any, number>;
    __array__: {
        __target__: boolean;
        joints: {
            length: IObjectAccessor<number[], any, number>;
            __array__: { __target__: boolean } & IObjectAccessor<any, any, string>;
        };
        skeleton: IObjectAccessor<ISkin, any, string | undefined>;
    };
}

/**
 * Accessor tree describing root-level glTF extensions exposed through the
 * Object Model. Currently covers the punctual / area / IES / image-based
 * light extension families.
 */
export interface IGLTFObjectModelTreeExtensionsObject {
    /** Accessor tree for `/extensions/KHR_lights_punctual`. */
    KHR_lights_punctual: {
        lights: {
            length: IObjectAccessor<IKHRLightsPunctual_Light[], Light[], number>;
            __array__: {
                __target__: boolean;
                color: IObjectAccessor<IKHRLightsPunctual_Light, Light, Color3>;
                intensity: IObjectAccessor<IKHRLightsPunctual_Light, Light, number>;
                range: IObjectAccessor<IKHRLightsPunctual_Light, Light, number>;
                spot: {
                    innerConeAngle: IObjectAccessor<IKHRLightsPunctual_Light, Light, number>;
                    outerConeAngle: IObjectAccessor<IKHRLightsPunctual_Light, Light, number>;
                };
            };
        };
    };
    /** Accessor tree for `/extensions/EXT_lights_area`. */
    EXT_lights_area: {
        lights: {
            length: IObjectAccessor<IEXTLightsArea_Light[], Light[], number>;
            __array__: {
                __target__: boolean;
                color: IObjectAccessor<IEXTLightsArea_Light, Light, Color3>;
                intensity: IObjectAccessor<IEXTLightsArea_Light, Light, number>;
                size: IObjectAccessor<IEXTLightsArea_Light, Light, number>;
                rect: {
                    aspect: IObjectAccessor<IEXTLightsArea_Light, Light, number>;
                };
            };
        };
    };
    /** Accessor tree for `/extensions/EXT_lights_ies`. */
    EXT_lights_ies: {
        lights: {
            length: IObjectAccessor<IKHRLightsPunctual_Light[], Light[], number>;
        };
    };
    /** Accessor tree for `/extensions/EXT_lights_image_based`. */
    EXT_lights_image_based: {
        lights: {
            __array__: {
                __target__: boolean;
                intensity: IObjectAccessor<IEXTLightsImageBased_LightImageBased, BaseTexture, number>;
                rotation: IObjectAccessor<IEXTLightsImageBased_LightImageBased, BaseTexture, Quaternion>;
            };
            length: IObjectAccessor<IEXTLightsImageBased_LightImageBased[], BaseTexture[], number>;
        };
    };
}

const nodesTree: IGLTFObjectModelTreeNodesObject = {
    length: {
        type: "number",
        get: (nodes: INode[]) => nodes.length,
        getTarget: (nodes: INode[]) => nodes.map((node) => node._babylonTransformNode!),
        getPropertyName: [() => "length"],
    },
    __array__: {
        __target__: true,
        translation: {
            type: "Vector3",
            get: (node: INode) => node._babylonTransformNode?.position,
            set: (value: Vector3, node: INode) => node._babylonTransformNode?.position.copyFrom(value),
            getTarget: (node: INode) => node._babylonTransformNode,
            getPropertyName: [() => "position"],
        },
        rotation: {
            type: "Quaternion",
            get: (node: INode) => node._babylonTransformNode?.rotationQuaternion!,
            set: (value: Quaternion, node: INode) => node._babylonTransformNode?.rotationQuaternion?.copyFrom(value),
            getTarget: (node: INode) => node._babylonTransformNode,
            getPropertyName: [() => "rotationQuaternion"],
        },
        scale: {
            type: "Vector3",
            get: (node: INode) => node._babylonTransformNode?.scaling,
            set: (value: Vector3, node: INode) => node._babylonTransformNode?.scaling.copyFrom(value),
            getTarget: (node: INode) => node._babylonTransformNode,
            getPropertyName: [() => "scaling"],
        },
        weights: {
            // Skip glTF objectTree traversal — weights may be undefined on the glTF node
            // but accessible via the Babylon MorphTargetManager on the INode's meshes
            __passThroughTarget__: true,
            length: {
                type: "number",
                get: (node: INode) => {
                    // KHR_interactivity treats /nodes/<N>/weights.length as always-valid.
                    // Resolve via Babylon scene graph (direct or descendant) and fall back
                    // to 0 when nothing is reachable so the pointer/get reports isValid=true.
                    const found = _findNodeMorphTargets(node);
                    return found ? found.mtm.numTargets : 0;
                },
                getTarget: (node: INode) => node?._babylonTransformNode,
                getPropertyName: [() => "length"],
            },
            __array__: {
                __target__: true,
                type: "number",
                get: (node: INode, index?: number) => {
                    const found = _findNodeMorphTargets(node);
                    if (found && index !== undefined && index >= 0 && index < found.mtm.numTargets) {
                        return _roundFloat32Artifact(found.mtm.getTarget(index).influence);
                    }
                    // KHR_interactivity treats /nodes/<N>/weights/<i> as valid (returning the
                    // type's default of 0) when the node has its own mesh or has reachable
                    // morph targets, and as invalid only when no mesh is reachable at all.
                    if (node?.mesh !== undefined || found) {
                        return 0;
                    }
                    return undefined;
                },
                set: (value: any, node: INode, index?: number) => {
                    const numValue = typeof value === "number" ? value : typeof value?.value === "number" ? value.value : value;
                    const found = _findNodeMorphTargets(node);
                    if (!found || index === undefined || index < 0 || index >= found.mtm.numTargets) {
                        return;
                    }
                    // Fan out to every mesh that shares this morph target manager so
                    // multi-primitive meshes stay in sync.
                    for (const mesh of found.meshes) {
                        const target = mesh.morphTargetManager?.getTarget(index);
                        if (target) {
                            target.influence = numValue;
                        }
                    }
                },
                getTarget: (node: INode, index?: number) => {
                    const found = _findNodeMorphTargets(node);
                    if (found && index !== undefined && index >= 0 && index < found.mtm.numTargets) {
                        return found.mtm.getTarget(index);
                    }
                    return node?._babylonTransformNode;
                },
                getPropertyName: [() => "influence"],
            },
            type: "number[]",
            get: (node: INode) => {
                const found = _findNodeMorphTargets(node);
                if (!found) {
                    return [];
                }
                const weights: number[] = [];
                for (let i = 0; i < found.mtm.numTargets; i++) {
                    weights.push(_roundFloat32Artifact(found.mtm.getTarget(i).influence));
                }
                return weights;
            },
            getTarget: (node: INode) => node?._babylonTransformNode,
            getPropertyName: [() => "influence"],
        },
        // readonly!
        matrix: {
            type: "Matrix",
            get: (node: INode) => Matrix.Compose(node._babylonTransformNode?.scaling!, node._babylonTransformNode?.rotationQuaternion!, node._babylonTransformNode?.position!),
            getTarget: (node: INode) => node._babylonTransformNode,
            isReadOnly: true,
        },
        globalMatrix: {
            type: "Matrix",
            get: (node: INode) => {
                const matrix = Matrix.Identity();
                // RHS/LHS support
                let rootNode = node.parent;
                while (rootNode && rootNode.parent) {
                    rootNode = rootNode.parent;
                }
                const forceUpdate =
                    node._babylonTransformNode?.position._isDirty || node._babylonTransformNode?.rotationQuaternion?._isDirty || node._babylonTransformNode?.scaling._isDirty;
                if (rootNode) {
                    // take the parent root node's world matrix, invert it, and multiply it with the current node's world matrix
                    // This will provide the global matrix, ignoring the RHS->LHS conversion
                    const rootMatrix = rootNode._babylonTransformNode?.computeWorldMatrix(true).invert();
                    if (rootMatrix) {
                        node._babylonTransformNode?.computeWorldMatrix(forceUpdate)?.multiplyToRef(rootMatrix, matrix);
                    }
                } else if (node._babylonTransformNode) {
                    matrix.copyFrom(node._babylonTransformNode.computeWorldMatrix(forceUpdate));
                }
                return matrix;
            },
            getTarget: (node: INode) => node._babylonTransformNode,
            isReadOnly: true,
        },
        camera: {
            type: "string",
            // Per KHR_interactivity Object Model: read-only ref pointing to the
            // attached camera, encoded as a JSON Pointer string. Empty string
            // when no camera is attached (the spec's null-ref convention).
            get: (node: INode) => (node.camera !== undefined ? `/cameras/${node.camera}/` : ""),
            getTarget: (node: INode) => node,
            isReadOnly: true,
        },
        mesh: {
            type: "string",
            get: (node: INode) => (node.mesh !== undefined ? `/meshes/${node.mesh}/` : ""),
            getTarget: (node: INode) => node,
            isReadOnly: true,
        },
        skin: {
            type: "string",
            get: (node: INode) => (node.skin !== undefined ? `/skins/${node.skin}/` : ""),
            getTarget: (node: INode) => node,
            isReadOnly: true,
        },
        parent: {
            type: "string",
            get: (node: INode) => (node.parent && node.parent.index !== undefined ? `/nodes/${node.parent.index}/` : ""),
            getTarget: (node: INode) => node,
            isReadOnly: true,
        },
        children: {
            length: {
                type: "number",
                get: (children: number[]) => children?.length ?? 0,
                getTarget: (children: number[]) => children ?? [],
                getPropertyName: [() => "length"],
            },
            __array__: {
                __target__: true,
                type: "string",
                // The wrapping converter passes the indexed child value (an
                // INode index) as `childIndex`; convert it to a JSON Pointer
                // ref string so ref/eq comparisons work as authored.
                get: (childIndex: any) => (typeof childIndex === "number" ? `/nodes/${childIndex}/` : ""),
                getTarget: () => ({ __nodeIndex: true }),
                isReadOnly: true,
            },
        },
        extensions: {
            EXT_lights_ies: {
                multiplier: {
                    type: "number",
                    get: (node: INode) => {
                        return node._babylonTransformNode?.getChildren((child) => child instanceof SpotLight, true)[0]?.intensity;
                    },
                    getTarget: (node: INode) => node._babylonTransformNode?.getChildren((child) => child instanceof SpotLight, true)[0],
                    set: (value, node) => {
                        if (node._babylonTransformNode) {
                            const light = node._babylonTransformNode.getChildren((child) => child instanceof SpotLight, true)[0];
                            if (light) {
                                light.intensity = value;
                            }
                        }
                    },
                },
                color: {
                    type: "Color3",
                    get: (node: INode) => {
                        return node._babylonTransformNode?.getChildren((child) => child instanceof SpotLight, true)[0]?.diffuse;
                    },
                    getTarget: (node: INode) => node._babylonTransformNode?.getChildren((child) => child instanceof SpotLight, true)[0],
                    set: (value, node: INode) => {
                        if (node._babylonTransformNode) {
                            const light = node._babylonTransformNode.getChildren((child) => child instanceof SpotLight, true)[0];
                            if (light) {
                                light.diffuse = value;
                            }
                        }
                    },
                },
            },
            KHR_node_visibility: {
                visible: {
                    type: "boolean",
                    get: (node: INode) => {
                        return node._primitiveBabylonMeshes ? node._primitiveBabylonMeshes[0].isVisible : false;
                    },
                    getTarget: () => undefined, // TODO: what should this return?
                    set: (value: boolean, node: INode) => {
                        if (node._primitiveBabylonMeshes) {
                            node._primitiveBabylonMeshes.forEach((mesh) => (mesh.isVisible = value));
                        }
                    },
                },
            },
        },
    },
};

const animationsTree = {
    length: {
        type: "number",
        get: (animations: IAnimation[]) => animations.length,
        getTarget: (animations: IAnimation[]) => animations.map((animation) => animation._babylonAnimationGroup!),
        getPropertyName: [() => "length"],
    },
    __array__: {
        // Indexed access to the animation. KHR_interactivity Opaque-Reference
        // spec defines the trailing-slash form ``/animations/<i>/`` as a ref
        // to the animation itself; we surface that here as a JSON-Pointer ref
        // string so blocks like ``animation/start`` can consume it directly.
        // Use the animation's own ``index`` property (populated by the loader's
        // ArrayItem.Assign step) so the ref is resolved without needing a
        // separate index payload from the path converter.
        __target__: true,
        type: "string",
        get: (animation: IAnimation) => (animation && typeof animation.index === "number" ? `/animations/${animation.index}/` : ""),
        getTarget: (animation: IAnimation) => animation._babylonAnimationGroup,
        isReadOnly: true,
    },
};

const meshesTree: IGLTFObjectModelTreeMeshesObject = {
    length: {
        type: "number",
        get: (meshes: IMesh[]) => meshes.length,
        getTarget: (meshes: IMesh[]) => meshes.map((mesh) => mesh.primitives[0]._instanceData?.babylonSourceMesh),
        getPropertyName: [() => "length"],
    },
    __array__: {
        __target__: true,
        primitives: {
            length: {
                type: "number",
                get: (primitives: IMeshPrimitive[]) => primitives?.length ?? 0,
                getTarget: (primitives: IMeshPrimitive[]) => primitives ?? [],
                getPropertyName: [() => "length"],
            },
            __array__: {
                __target__: true,
                material: {
                    type: "string",
                    // Read-only ref to the assigned material, JSON Pointer encoded.
                    get: (primitive: IMeshPrimitive) => (primitive.material !== undefined ? `/materials/${primitive.material}/` : ""),
                    getTarget: (primitive: IMeshPrimitive) => primitive,
                    isReadOnly: true,
                },
            },
        },
        weights: {
            length: {
                type: "number",
                get: (weights: number[]) => weights?.length ?? 0,
                getTarget: (weights: number[]) => weights ?? [],
                getPropertyName: [() => "length"],
            },
            __array__: {
                __target__: true,
                type: "number",
                get: (weightValue: any) => weightValue,
                getTarget: () => ({ __weightValue: true }),
                isReadOnly: true,
            },
        },
    },
};

const camerasTree: IGLTFObjectModelTreeCamerasObject = {
    length: {
        type: "number",
        get: (cameras: ICamera[]) => cameras.length,
        getTarget: (cameras: ICamera[]) => cameras.map((camera) => camera._babylonCamera!),
        getPropertyName: [() => "length"],
    },
    __array__: {
        __target__: true,
        orthographic: {
            xmag: {
                componentsCount: 2,
                type: "Vector2",
                get: (camera) => new Vector2(camera._babylonCamera?.orthoLeft ?? 0, camera._babylonCamera?.orthoRight ?? 0),
                set: (value, camera) => {
                    if (camera._babylonCamera) {
                        camera._babylonCamera.orthoLeft = value.x;
                        camera._babylonCamera.orthoRight = value.y;
                    }
                },
                getTarget: (camera) => camera,
                getPropertyName: [() => "orthoLeft", () => "orthoRight"],
            },
            ymag: {
                componentsCount: 2,
                type: "Vector2",
                get: (camera: ICamera) => new Vector2(camera._babylonCamera?.orthoBottom ?? 0, camera._babylonCamera?.orthoTop ?? 0),
                set: (value: Vector2, camera: ICamera) => {
                    if (camera._babylonCamera) {
                        camera._babylonCamera.orthoBottom = value.x;
                        camera._babylonCamera.orthoTop = value.y;
                    }
                },
                getTarget: (camera) => camera,
                getPropertyName: [() => "orthoBottom", () => "orthoTop"],
            },
            zfar: {
                type: "number",
                get: (camera: ICamera) => camera._babylonCamera?.maxZ,
                set: (value: number, camera: ICamera) => {
                    if (camera._babylonCamera) {
                        camera._babylonCamera.maxZ = value;
                    }
                },
                getTarget: (camera: ICamera) => camera,
                getPropertyName: [() => "maxZ"],
            },
            znear: {
                type: "number",
                get: (camera: ICamera) => camera._babylonCamera?.minZ,
                set: (value: number, camera: ICamera) => {
                    if (camera._babylonCamera) {
                        camera._babylonCamera.minZ = value;
                    }
                },
                getTarget: (camera: ICamera) => camera,
                getPropertyName: [() => "minZ"],
            },
        },
        perspective: {
            aspectRatio: {
                type: "number",
                get: (camera: ICamera) => camera._babylonCamera?.getEngine().getAspectRatio(camera._babylonCamera),
                getTarget: (camera: ICamera) => camera,
                getPropertyName: [() => "aspectRatio"],
                isReadOnly: true, // might not be the case for glTF?
            },
            yfov: {
                type: "number",
                get: (camera: ICamera) => camera._babylonCamera?.fov,
                set: (value: number, camera: ICamera) => {
                    if (camera._babylonCamera) {
                        camera._babylonCamera.fov = value;
                    }
                },
                getTarget: (camera: ICamera) => camera,
                getPropertyName: [() => "fov"],
            },
            zfar: {
                type: "number",
                get: (camera: ICamera) => camera._babylonCamera?.maxZ,
                set: (value: number, camera: ICamera) => {
                    if (camera._babylonCamera) {
                        camera._babylonCamera.maxZ = value;
                    }
                },
                getTarget: (camera: ICamera) => camera,
                getPropertyName: [() => "maxZ"],
            },
            znear: {
                type: "number",
                get: (camera: ICamera) => camera._babylonCamera?.minZ,
                set: (value: number, camera: ICamera) => {
                    if (camera._babylonCamera) {
                        camera._babylonCamera.minZ = value;
                    }
                },
                getTarget: (camera: ICamera) => camera,
                getPropertyName: [() => "minZ"],
            },
        },
    },
};

const materialsTree: IGLTFObjectModelTreeMaterialsObject = {
    length: {
        type: "number",
        get: (materials: IMaterial[]) => materials.length,
        getTarget: (materials: IMaterial[]) => materials.map((material) => material._data?.[Constants.MATERIAL_TriangleFillMode]?.babylonMaterial as PBRMaterial),
        getPropertyName: [() => "length"],
    },
    __array__: {
        __target__: true,
        doubleSided: {
            type: "boolean",
            get: (material, index?, payload?) => !GetMaterial(material, index, payload)?.backFaceCulling,
            set: (value: boolean, material, index?, payload?) => {
                const mat = GetMaterial(material, index, payload);
                if (mat) {
                    mat.backFaceCulling = !value;
                }
            },
            getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
            getPropertyName: [() => "backFaceCulling"],
        },
        alphaCutoff: {
            type: "number",
            get: (material, index?, payload?) => GetMaterial(material, index, payload)?.alphaCutOff,
            set: (value: number, material, index?, payload?) => {
                const mat = GetMaterial(material, index, payload);
                if (mat) {
                    mat.alphaCutOff = value;
                }
            },
            getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
            getPropertyName: [() => "alphaCutOff"],
        },
        emissiveFactor: {
            type: "Color3",
            get: (material, index?, payload?) => GetMaterial(material, index, payload).emissiveColor,
            set: (value: Color3, material, index?, payload?) => GetMaterial(material, index, payload).emissiveColor.copyFrom(value),
            getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
            getPropertyName: [() => "emissiveColor"],
        },
        emissiveTexture: {
            extensions: {
                KHR_texture_transform: GenerateTextureMap("emissiveTexture"),
            },
        },
        normalTexture: {
            scale: {
                type: "number",
                get: (material, index?, payload?) => GetTexture(material, payload, "bumpTexture")?.level,
                set: (value: number, material, index?, payload?) => {
                    const texture = GetTexture(material, payload, "bumpTexture");
                    if (texture) {
                        texture.level = value;
                    }
                },
                getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                getPropertyName: [() => "level"],
            },
            extensions: {
                KHR_texture_transform: GenerateTextureMap("bumpTexture"),
            },
        },
        occlusionTexture: {
            strength: {
                type: "number",
                get: (material, index?, payload?) => GetMaterial(material, index, payload).ambientTextureStrength,
                set: (value: number, material, index?, payload?) => {
                    const mat = GetMaterial(material, index, payload);
                    if (mat) {
                        mat.ambientTextureStrength = value;
                    }
                },
                getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                getPropertyName: [() => "ambientTextureStrength"],
            },
            extensions: {
                KHR_texture_transform: GenerateTextureMap("ambientTexture"),
            },
        },
        pbrMetallicRoughness: {
            baseColorFactor: {
                type: "Color4",
                get: (material, index?, payload?) => {
                    const mat = GetMaterial(material, index, payload);
                    return Color4.FromColor3(mat.albedoColor, mat.alpha);
                },
                set: (value: Color4, material, index?, payload?) => {
                    const mat = GetMaterial(material, index, payload);
                    mat.albedoColor.set(value.r, value.g, value.b);
                    mat.alpha = value.a;
                },
                getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                // This is correct on the animation level, but incorrect as a single property of a type Color4
                getPropertyName: [() => "albedoColor", () => "alpha"],
            },
            baseColorTexture: {
                extensions: {
                    KHR_texture_transform: GenerateTextureMap("albedoTexture"),
                },
            },
            metallicFactor: {
                type: "number",
                get: (material, index?, payload?) => GetMaterial(material, index, payload).metallic,
                set: (value, material, index?, payload?) => {
                    const mat = GetMaterial(material, index, payload);
                    if (mat) {
                        mat.metallic = value;
                    }
                },
                getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                getPropertyName: [() => "metallic"],
            },
            roughnessFactor: {
                type: "number",
                get: (material, index?, payload?) => GetMaterial(material, index, payload).roughness,
                set: (value, material, index?, payload?) => {
                    const mat = GetMaterial(material, index, payload);
                    if (mat) {
                        mat.roughness = value;
                    }
                },
                getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                getPropertyName: [() => "roughness"],
            },
            metallicRoughnessTexture: {
                extensions: {
                    KHR_texture_transform: GenerateTextureMap("metallicTexture"),
                },
            },
        },
        extensions: {
            KHR_materials_anisotropy: {
                anisotropyStrength: {
                    type: "number",
                    get: (material, index?, payload?) => GetMaterial(material, index, payload).anisotropy.intensity,
                    set: (value: number, material, index?, payload?) => {
                        GetMaterial(material, index, payload).anisotropy.intensity = value;
                    },
                    getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                    getPropertyName: [() => "anisotropy.intensity"],
                },
                anisotropyRotation: {
                    type: "number",
                    get: (material, index?, payload?) => GetMaterial(material, index, payload)?.anisotropy?.angle,
                    set: (value: number, material, index?, payload?) => {
                        const mat = GetMaterial(material, index, payload);
                        if (mat) {
                            mat.anisotropy.angle = value;
                        }
                    },
                    getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                    getPropertyName: [() => "anisotropy.angle"],
                },
                anisotropyTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("anisotropy", "texture"),
                    },
                },
            },
            KHR_materials_clearcoat: {
                clearcoatFactor: {
                    type: "number",
                    get: (material, index?, payload?) => GetMaterial(material, index, payload).clearCoat.intensity,
                    set: (value, material, index?, payload?) => {
                        GetMaterial(material, index, payload).clearCoat.intensity = value;
                    },
                    getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                    getPropertyName: [() => "clearCoat.intensity"],
                },
                clearcoatRoughnessFactor: {
                    type: "number",
                    get: (material, index?, payload?) => GetMaterial(material, index, payload).clearCoat.roughness,
                    set: (value, material, index?, payload?) => {
                        GetMaterial(material, index, payload).clearCoat.roughness = value;
                    },
                    getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                    getPropertyName: [() => "clearCoat.roughness"],
                },
                clearcoatTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("clearCoat", "texture"),
                    },
                },
                clearcoatNormalTexture: {
                    scale: {
                        type: "number",
                        get: (material, index, payload) => GetMaterial(material, index, payload).clearCoat.bumpTexture?.level,
                        getTarget: GetMaterial,
                        set: (value, material, index, payload) => (GetMaterial(material, index, payload).clearCoat.bumpTexture!.level = value),
                    },
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("clearCoat", "bumpTexture"),
                    },
                },
                clearcoatRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("clearCoat", "textureRoughness"),
                    },
                },
            },
            KHR_materials_dispersion: {
                dispersion: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).subSurface.dispersion,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).subSurface.dispersion = value),
                },
            },
            KHR_materials_emissive_strength: {
                emissiveStrength: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).emissiveIntensity,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).emissiveIntensity = value),
                },
            },
            KHR_materials_ior: {
                ior: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).indexOfRefraction,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).indexOfRefraction = value),
                },
            },
            KHR_materials_iridescence: {
                iridescenceFactor: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).iridescence.intensity,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).iridescence.intensity = value),
                },
                iridescenceIor: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).iridescence.indexOfRefraction,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).iridescence.indexOfRefraction = value),
                },
                iridescenceTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("iridescence", "texture"),
                    },
                },
                iridescenceThicknessMaximum: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).iridescence.maximumThickness,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).iridescence.maximumThickness = value),
                },
                iridescenceThicknessMinimum: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).iridescence.minimumThickness,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).iridescence.minimumThickness = value),
                },
                iridescenceThicknessTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("iridescence", "thicknessTexture"),
                    },
                },
            },
            KHR_materials_sheen: {
                sheenColorFactor: {
                    type: "Color3",
                    get: (material, index, payload) => GetMaterial(material, index, payload).sheen.color,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => GetMaterial(material, index, payload).sheen.color.copyFrom(value),
                },
                sheenColorTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("sheen", "texture"),
                    },
                },
                sheenRoughnessFactor: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).sheen.intensity,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).sheen.intensity = value),
                },
                sheenRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("sheen", "textureRoughness"),
                    },
                },
            },
            KHR_materials_specular: {
                specularFactor: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).metallicF0Factor,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).metallicF0Factor = value),
                    getPropertyName: [() => "metallicF0Factor"],
                },
                specularColorFactor: {
                    type: "Color3",
                    get: (material, index, payload) => GetMaterial(material, index, payload).metallicReflectanceColor,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => GetMaterial(material, index, payload).metallicReflectanceColor.copyFrom(value),
                    getPropertyName: [() => "metallicReflectanceColor"],
                },
                specularTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("metallicReflectanceTexture"),
                    },
                },
                specularColorTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("reflectanceTexture"),
                    },
                },
            },
            KHR_materials_transmission: {
                transmissionFactor: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).subSurface.refractionIntensity,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).subSurface.refractionIntensity = value),
                    getPropertyName: [() => "subSurface.refractionIntensity"],
                },
                transmissionTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("subSurface", "refractionIntensityTexture", {
                            extensionKey: "KHR_materials_transmission",
                            texturePath: ["transmissionTexture"],
                        }),
                    },
                },
            },
            KHR_materials_diffuse_transmission: {
                diffuseTransmissionFactor: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).subSurface.translucencyIntensity,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).subSurface.translucencyIntensity = value),
                },
                diffuseTransmissionTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("subSurface", "translucencyIntensityTexture", {
                            extensionKey: "KHR_materials_diffuse_transmission",
                            texturePath: ["diffuseTransmissionTexture"],
                        }),
                    },
                },
                diffuseTransmissionColorFactor: {
                    type: "Color3",
                    get: (material, index, payload) => GetMaterial(material, index, payload).subSurface.translucencyColor,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => value && GetMaterial(material, index, payload).subSurface.translucencyColor?.copyFrom(value),
                },
                diffuseTransmissionColorTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("subSurface", "translucencyColorTexture", {
                            extensionKey: "KHR_materials_diffuse_transmission",
                            texturePath: ["diffuseTransmissionColorTexture"],
                        }),
                    },
                },
            },
            KHR_materials_volume: {
                attenuationColor: {
                    type: "Color3",
                    get: (material, index, payload) => GetMaterial(material, index, payload).subSurface.tintColor,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => GetMaterial(material, index, payload).subSurface.tintColor.copyFrom(value),
                },
                attenuationDistance: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).subSurface.tintColorAtDistance,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).subSurface.tintColorAtDistance = value),
                },
                thicknessFactor: {
                    type: "number",
                    get: (material, index, payload) => GetMaterial(material, index, payload).subSurface.maximumThickness,
                    getTarget: GetMaterial,
                    set: (value, material, index, payload) => (GetMaterial(material, index, payload).subSurface.maximumThickness = value),
                },
                thicknessTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("subSurface", "thicknessTexture", { extensionKey: "KHR_materials_volume", texturePath: ["thicknessTexture"] }),
                    },
                },
            },
        },
    },
};

const extensionsTree: IGLTFObjectModelTreeExtensionsObject = {
    KHR_lights_punctual: {
        lights: {
            length: {
                type: "number",
                get: (lights: IKHRLightsPunctual_Light[]) => lights.length,
                getTarget: (lights: IKHRLightsPunctual_Light[]) => lights.map((light) => light._babylonLight!),
                getPropertyName: [(_lights: IKHRLightsPunctual_Light[]) => "length"],
            },
            __array__: {
                __target__: true,
                color: {
                    type: "Color3",
                    get: (light: IKHRLightsPunctual_Light) => light._babylonLight?.diffuse,
                    set: (value: Color3, light: IKHRLightsPunctual_Light) => light._babylonLight?.diffuse.copyFrom(value),
                    getTarget: (light: IKHRLightsPunctual_Light) => light._babylonLight,
                    getPropertyName: [(_light: IKHRLightsPunctual_Light) => "diffuse"],
                },
                intensity: {
                    type: "number",
                    get: (light: IKHRLightsPunctual_Light) => light._babylonLight?.intensity,
                    set: (value: number, light: IKHRLightsPunctual_Light) => (light._babylonLight ? (light._babylonLight.intensity = value) : undefined),
                    getTarget: (light: IKHRLightsPunctual_Light) => light._babylonLight,
                    getPropertyName: [(_light: IKHRLightsPunctual_Light) => "intensity"],
                },
                range: {
                    type: "number",
                    get: (light: IKHRLightsPunctual_Light) => light._babylonLight?.range,
                    set: (value: number, light: IKHRLightsPunctual_Light) => (light._babylonLight ? (light._babylonLight.range = value) : undefined),
                    getTarget: (light: IKHRLightsPunctual_Light) => light._babylonLight,
                    getPropertyName: [(_light: IKHRLightsPunctual_Light) => "range"],
                },
                spot: {
                    innerConeAngle: {
                        type: "number",
                        get: (light: IKHRLightsPunctual_Light) => (light._babylonLight as SpotLight)?.innerAngle,
                        set: (value: number, light: IKHRLightsPunctual_Light) => (light._babylonLight ? ((light._babylonLight as SpotLight).innerAngle = value) : undefined),
                        getTarget: (light: IKHRLightsPunctual_Light) => light._babylonLight,
                        getPropertyName: [(_light: IKHRLightsPunctual_Light) => "innerConeAngle"],
                    },
                    outerConeAngle: {
                        type: "number",
                        get: (light: IKHRLightsPunctual_Light) => (light._babylonLight as SpotLight)?.angle,
                        set: (value: number, light: IKHRLightsPunctual_Light) => (light._babylonLight ? ((light._babylonLight as SpotLight).angle = value) : undefined),
                        getTarget: (light: IKHRLightsPunctual_Light) => light._babylonLight,
                        getPropertyName: [(_light: IKHRLightsPunctual_Light) => "outerConeAngle"],
                    },
                },
            },
        },
    },
    EXT_lights_area: {
        lights: {
            length: {
                type: "number",
                get: (lights: IEXTLightsArea_Light[]) => lights.length,
                getTarget: (lights: IEXTLightsArea_Light[]) => lights.map((light) => light._babylonLight!),
                getPropertyName: [(_lights: IEXTLightsArea_Light[]) => "length"],
            },
            __array__: {
                __target__: true,
                color: {
                    type: "Color3",
                    get: (light: IEXTLightsArea_Light) => light._babylonLight?.diffuse,
                    set: (value: Color3, light: IEXTLightsArea_Light) => light._babylonLight?.diffuse.copyFrom(value),
                    getTarget: (light: IEXTLightsArea_Light) => light._babylonLight,
                    getPropertyName: [(_light: IEXTLightsArea_Light) => "diffuse"],
                },
                intensity: {
                    type: "number",
                    get: (light: IEXTLightsArea_Light) => light._babylonLight?.intensity,
                    set: (value: number, light: IEXTLightsArea_Light) => (light._babylonLight ? (light._babylonLight.intensity = value) : undefined),
                    getTarget: (light: IEXTLightsArea_Light) => light._babylonLight,
                    getPropertyName: [(_light: IEXTLightsArea_Light) => "intensity"],
                },
                size: {
                    type: "number",
                    get: (light: IEXTLightsArea_Light) => (light._babylonLight as RectAreaLight)?.height,
                    set: (value: number, light: IEXTLightsArea_Light) => (light._babylonLight ? ((light._babylonLight as RectAreaLight).height = value) : undefined),
                    getTarget: (light: IEXTLightsArea_Light) => light._babylonLight,
                    getPropertyName: [(_light: IEXTLightsArea_Light) => "size"],
                },
                rect: {
                    aspect: {
                        type: "number",
                        get: (light: IEXTLightsArea_Light) => (light._babylonLight as RectAreaLight)?.width / (light._babylonLight as RectAreaLight)?.height,
                        set: (value: number, light: IEXTLightsArea_Light) =>
                            light._babylonLight ? ((light._babylonLight as RectAreaLight).width = value * (light._babylonLight as RectAreaLight).height) : undefined,
                        getTarget: (light: IEXTLightsArea_Light) => light._babylonLight,
                        getPropertyName: [(_light: IEXTLightsArea_Light) => "aspect"],
                    },
                },
            },
        },
    },
    EXT_lights_ies: {
        lights: {
            length: {
                type: "number",
                get: (lights: IKHRLightsPunctual_Light[]) => lights.length,
                getTarget: (lights: IKHRLightsPunctual_Light[]) => lights.map((light) => light._babylonLight!),
                getPropertyName: [(_lights: IKHRLightsPunctual_Light[]) => "length"],
            },
        },
    },
    EXT_lights_image_based: {
        lights: {
            length: {
                type: "number",
                get: (lights) => lights.length,
                getTarget: (lights) => lights.map((light) => light._babylonTexture!),
                getPropertyName: [(_lights) => "length"],
            },
            __array__: {
                __target__: true,
                intensity: {
                    type: "number",
                    get: (light) => light._babylonTexture?.level,
                    set: (value, light) => {
                        if (light._babylonTexture) {
                            light._babylonTexture.level = value;
                        }
                    },

                    getTarget: (light) => light._babylonTexture,
                },
                rotation: {
                    type: "Quaternion",
                    get: (light) => light._babylonTexture && Quaternion.FromRotationMatrix(light._babylonTexture?.getReflectionTextureMatrix()),
                    set: (value, light) => {
                        if (!light._babylonTexture) {
                            return;
                        }
                        // Invert the rotation so that positive rotation is counter-clockwise.
                        if (!light._babylonTexture.getScene()?.useRightHandedSystem) {
                            value = Quaternion.Inverse(value);
                        }

                        Matrix.FromQuaternionToRef(value, light._babylonTexture.getReflectionTextureMatrix());
                    },
                    getTarget: (light) => light._babylonTexture,
                },
            },
        },
    },
};

function GetTexture(material: IMaterial, payload: any, textureType: keyof PBRMaterial, textureInObject?: string) {
    const babylonMaterial = GetMaterial(material, payload);
    return textureInObject ? babylonMaterial[textureType][textureInObject] : babylonMaterial[textureType];
}
function GetMaterial(material: IMaterial, _index?: number, payload?: any) {
    return material._data?.[payload?.fillMode ?? Constants.MATERIAL_TriangleFillMode]?.babylonMaterial as PBRMaterial;
}
function _getNodeMorphTargetManager(node: INode): any {
    const tn = node?._babylonTransformNode;
    if (!tn) {
        return undefined;
    }
    // Single primitive: transform node IS the mesh with morphTargetManager
    if ((tn as any).morphTargetManager) {
        return (tn as any).morphTargetManager;
    }
    // Multiple primitives: check each primitive mesh and its source
    const primMeshes = node._primitiveBabylonMeshes;
    if (primMeshes) {
        for (const mesh of primMeshes) {
            if (mesh?.morphTargetManager) {
                return mesh.morphTargetManager;
            }
            // Check source mesh for instanced meshes
            if ((mesh as any)?.sourceMesh?.morphTargetManager) {
                return (mesh as any).sourceMesh.morphTargetManager;
            }
        }
    }
    return undefined;
}

/**
 * Result of a morph-target lookup: the active manager plus every Babylon mesh
 * that shares it, so writes (set) can fan out across all primitives.
 */
interface IMorphTargetLookup {
    mtm: MorphTargetManager;
    meshes: AbstractMesh[];
}

/**
 * KHR_interactivity test assets routinely use a glTF hierarchy where the
 * **parent** node has no `mesh` but a descendant does. The Khronos morph-weight
 * tests query `/nodes/<parent>/weights/*` and expect the result to come from
 * the morph targets of the first descendant mesh. To support this we walk the
 * Babylon-side scene graph below the queried INode looking for a Mesh that has
 * a morphTargetManager.
 *
 * For multi-primitive meshes (one INode → several Babylon meshes parented to a
 * wrapper TransformNode) we also collect the sibling primitives so a `set`
 * touches every mesh that shares the manager.
 * @param node the glTF node to start the lookup from
 * @returns the active morph target manager and every Babylon mesh that shares
 * it, or `undefined` when no morph target manager is reachable from the node.
 */
function _findNodeMorphTargets(node: INode): IMorphTargetLookup | undefined {
    const tn = node?._babylonTransformNode;
    if (!tn) {
        return undefined;
    }
    // Direct: this node's own mesh has a morph target manager.
    const directMtm: MorphTargetManager | undefined = _getNodeMorphTargetManager(node);
    if (directMtm && node._primitiveBabylonMeshes && node._primitiveBabylonMeshes.length > 0) {
        return { mtm: directMtm, meshes: node._primitiveBabylonMeshes as AbstractMesh[] };
    }
    // Fallback: search descendants in the Babylon scene graph for the first
    // mesh that has a morph target manager, then collect every sibling mesh
    // that shares it (covers the multi-primitive case).
    const descendants = tn.getDescendants(false);
    for (const desc of descendants) {
        const candidate = desc as AbstractMesh;
        const mtm: MorphTargetManager | undefined = (candidate as any).morphTargetManager ?? (candidate as any).sourceMesh?.morphTargetManager;
        if (!mtm) {
            continue;
        }
        const meshes: AbstractMesh[] = [];
        const parent = candidate.parent;
        if (parent) {
            for (const sib of parent.getChildMeshes(true)) {
                const sibMtm: MorphTargetManager | undefined = (sib as any).morphTargetManager ?? (sib as any).sourceMesh?.morphTargetManager;
                if (sibMtm === mtm) {
                    meshes.push(sib);
                }
            }
        }
        if (meshes.length === 0) {
            meshes.push(candidate);
        }
        return { mtm, meshes };
    }
    return undefined;
}

/**
 * Collapse float32-precision artifacts back to the closest "clean" double.
 *
 * glTF stores numbers as JSON, but tools usually serialize float32 morph weights
 * with their full double-precision text — `0.1` becomes `0.10000000149011612`.
 * KHR_interactivity tests then compare the read-back weight via strict `math/eq`
 * against literals like `0.1`, which fails because the two doubles aren't bitwise
 * equal. Rounding the value to 7 significant figures (the precision of a float32)
 * recovers the original "clean" double for any value that survived a float32
 * round-trip while leaving genuinely high-precision doubles essentially intact.
 * @param v the value to round
 * @returns the rounded value, or the input unchanged if it is not finite
 */
function _roundFloat32Artifact(v: number): number {
    if (!Number.isFinite(v)) {
        return v;
    }
    return parseFloat(v.toPrecision(7));
}
/**
 * Coordinate where a Babylon `Texture` lives on a PBRMaterial vs where its
 * KHR_texture_transform definition lives in the source glTF JSON. Used by
 * {@link GenerateTextureMap} to provide a glTF-side fallback when the loader
 * extension that owns the texture decided not to materialise it on the
 * Babylon material (e.g. KHR_materials_volume early-returns when there is no
 * `thicknessFactor`, leaving `subSurface.thicknessTexture` null even though
 * the glTF JSON has the texture+transform fully defined).
 *
 * The fallback gives KHR_interactivity `pointer/get` and `pointer/set` a
 * place to read/write the transform values so round-trip tests succeed even
 * when the texture is not yet active in the renderer. If/when the loader
 * later activates the texture, the seeded values can be picked up from the
 * glTF JSON.
 */
interface IGltfTextureTransformPath {
    /**
     * The path of nested keys under `material.extensions.<ext>` to reach the
     * texture-info object. For example `["thicknessTexture"]` for
     * `KHR_materials_volume.thicknessTexture`.
     */
    extensionKey: string;
    texturePath: string[];
}

/**
 * Read the KHR_texture_transform object stored in the source glTF JSON for a
 * texture-info that lives under one of the material's extensions, creating
 * empty parent objects on demand so callers can write through it. Returns
 * `undefined` when the input shape is incompatible.
 * @param material the source IMaterial owning the extension
 * @param gltfPath the path describing where the texture-info lives
 * @param createMissing when true, create missing parent objects so writes succeed
 * @returns the glTF-side KHR_texture_transform object, or undefined
 */
function _gltfTextureTransform(material: IMaterial, gltfPath: IGltfTextureTransformPath, createMissing: boolean): any | undefined {
    if (!material) {
        return undefined;
    }
    if (createMissing && !material.extensions) {
        (material as any).extensions = {};
    }
    let cursor: any = material.extensions?.[gltfPath.extensionKey];
    if (!cursor) {
        if (!createMissing) {
            return undefined;
        }
        cursor = {};
        (material as any).extensions[gltfPath.extensionKey] = cursor;
    }
    for (const key of gltfPath.texturePath) {
        let next = cursor[key];
        if (!next) {
            if (!createMissing) {
                return undefined;
            }
            next = {};
            cursor[key] = next;
        }
        cursor = next;
    }
    if (!cursor.extensions) {
        if (!createMissing) {
            return undefined;
        }
        cursor.extensions = {};
    }
    let xform = cursor.extensions.KHR_texture_transform;
    if (!xform) {
        if (!createMissing) {
            return undefined;
        }
        xform = {};
        cursor.extensions.KHR_texture_transform = xform;
    }
    return xform;
}

function GenerateTextureMap(textureType: keyof PBRMaterial, textureInObject?: string, gltfPath?: IGltfTextureTransformPath): ITextureDefinition {
    return {
        offset: {
            componentsCount: 2,
            // assuming two independent values for u and v, and NOT a Vector2
            type: "Vector2",
            get: (material, _index?, payload?) => {
                const texture = GetTexture(material, payload, textureType, textureInObject);
                if (texture) {
                    return new Vector2(texture.uOffset, texture.vOffset);
                }
                if (gltfPath) {
                    const xform = _gltfTextureTransform(material, gltfPath, false);
                    const o = xform?.offset;
                    return new Vector2(o?.[0] ?? 0, o?.[1] ?? 0);
                }
                return new Vector2(0, 0);
            },
            getTarget: GetMaterial,
            set: (value, material, _index?, payload?) => {
                const texture = GetTexture(material, payload, textureType, textureInObject);
                if (texture) {
                    texture.uOffset = value.x;
                    texture.vOffset = value.y;
                }
                if (gltfPath) {
                    const xform = _gltfTextureTransform(material, gltfPath, true);
                    if (xform) {
                        xform.offset = [value.x, value.y];
                    }
                }
            },
            getPropertyName: [
                () => `${textureType}${textureInObject ? "." + textureInObject : ""}.uOffset`,
                () => `${textureType}${textureInObject ? "." + textureInObject : ""}.vOffset`,
            ],
        },
        rotation: {
            type: "number",
            get: (material, _index?, payload?) => {
                const texture = GetTexture(material, payload, textureType, textureInObject);
                if (texture) {
                    return texture.wAng;
                }
                if (gltfPath) {
                    const xform = _gltfTextureTransform(material, gltfPath, false);
                    return xform?.rotation ?? 0;
                }
                return 0;
            },
            getTarget: GetMaterial,
            set: (value, material, _index?, payload?) => {
                const texture = GetTexture(material, payload, textureType, textureInObject);
                if (texture) {
                    texture.wAng = value;
                }
                if (gltfPath) {
                    const xform = _gltfTextureTransform(material, gltfPath, true);
                    if (xform) {
                        xform.rotation = value;
                    }
                }
            },
            getPropertyName: [() => `${textureType}${textureInObject ? "." + textureInObject : ""}.wAng`],
        },
        scale: {
            componentsCount: 2,
            type: "Vector2",
            get: (material, _index?, payload?) => {
                const texture = GetTexture(material, payload, textureType, textureInObject);
                if (texture) {
                    return new Vector2(texture.uScale, texture.vScale);
                }
                if (gltfPath) {
                    const xform = _gltfTextureTransform(material, gltfPath, false);
                    const s = xform?.scale;
                    return new Vector2(s?.[0] ?? 1, s?.[1] ?? 1);
                }
                return new Vector2(1, 1);
            },
            getTarget: GetMaterial,
            set: (value, material, index?, payload?) => {
                const texture = GetTexture(material, payload, textureType, textureInObject);
                if (texture) {
                    texture.uScale = value.x;
                    texture.vScale = value.y;
                }
                if (gltfPath) {
                    const xform = _gltfTextureTransform(material, gltfPath, true);
                    if (xform) {
                        xform.scale = [value.x, value.y];
                    }
                }
            },
            getPropertyName: [
                () => `${textureType}${textureInObject ? "." + textureInObject : ""}.uScale`,
                () => `${textureType}${textureInObject ? "." + textureInObject : ""}.vScale`,
            ],
        },
    };
}

const scenesTree: IGLTFObjectModelTreeScenesObject = {
    length: {
        type: "number",
        get: (scenes: IScene[]) => scenes.length,
        getTarget: (scenes: IScene[]) => scenes,
        getPropertyName: [() => "length"],
    },
    __array__: {
        __target__: true,
        nodes: {
            length: {
                type: "number",
                get: (nodes: number[]) => nodes?.length ?? 0,
                getTarget: (nodes: number[]) => nodes ?? [],
                getPropertyName: [() => "length"],
            },
            __array__: {
                __target__: true,
                type: "string",
                // Indexed scene root: the underlying value is the INode index;
                // KHR_interactivity expects a ref-typed JSON Pointer string.
                get: (nodeIndex: any) => (typeof nodeIndex === "number" ? `/nodes/${nodeIndex}/` : ""),
                getTarget: () => ({ __nodeIndex: true }),
                isReadOnly: true,
            },
        },
    },
};

const skinsTree: IGLTFObjectModelTreeSkinsObject = {
    length: {
        type: "number",
        get: (skins: ISkin[]) => skins.length,
        getTarget: (skins: ISkin[]) => skins.map((skin) => skin._data?.babylonSkeleton),
        getPropertyName: [() => "length"],
    },
    __array__: {
        __target__: true,
        joints: {
            length: {
                type: "number",
                get: (joints: number[]) => joints?.length ?? 0,
                getTarget: (joints: number[]) => joints ?? [],
                getPropertyName: [() => "length"],
            },
            __array__: {
                __target__: true,
                type: "string",
                // Indexed skin joint: returns a ref to the joint node.
                get: (jointIndex: any) => (typeof jointIndex === "number" ? `/nodes/${jointIndex}/` : ""),
                getTarget: () => ({ __nodeIndex: true }),
                isReadOnly: true,
            },
        },
        skeleton: {
            type: "string",
            // Skin's skeleton root: returns a ref to the root node, or empty
            // (null ref) when no skeleton root is declared.
            get: (skin: ISkin) => {
                const skeleton = (skin as any).skeleton;
                return typeof skeleton === "number" ? `/nodes/${skeleton}/` : "";
            },
            getTarget: (skin: ISkin) => skin,
            isReadOnly: true,
        },
    },
};

const objectModelMapping: IGLTFObjectModelTree = {
    scene: {
        __target__: true,
        type: "number",
        get: (sceneIndex: any) => sceneIndex ?? 0,
        getTarget: () => ({ __gltfRoot: true }),
        isReadOnly: true,
        getPropertyName: [() => "scene"],
    },
    cameras: camerasTree,
    nodes: nodesTree,
    materials: materialsTree,
    extensions: extensionsTree,
    animations: animationsTree,
    meshes: meshesTree,
    scenes: scenesTree,
    skins: skinsTree,
};

/**
 * get a path-to-object converter for the given glTF tree
 * @param gltf the glTF tree to use
 * @returns a path-to-object converter for the given glTF tree
 */
export function GetPathToObjectConverter(gltf: IGLTF) {
    return new GLTFPathToObjectConverter(gltf, objectModelMapping);
}

/**
 * This function will return the object accessor for the given key in the object model
 * If the key is not found, it will return undefined
 * @param key the key to get the mapping for, for example /materials/\{\}/emissiveFactor
 * @returns an object accessor for the given key, or undefined if the key is not found
 */
export function GetMappingForKey(key: string): IObjectAccessor | undefined {
    // replace every `{}` in key with __array__ to match the object model
    const keyParts = key.split("/").map((part) => part.replace(/{}/g, "__array__"));
    let current = objectModelMapping as any;
    for (const part of keyParts) {
        // make sure part is not empty
        if (!part) {
            continue;
        }
        current = current[part];
    }
    // validate that current is an object accessor
    if (current && current.type && current.get) {
        return current;
    }
    return undefined;
}

/**
 * Set interpolation for a specific key in the object model
 * @param key the key to set, for example /materials/\{\}/emissiveFactor
 * @param interpolation the interpolation elements array
 */
export function SetInterpolationForKey(key: string, interpolation?: IInterpolationPropertyInfo[]): void {
    // replace every `{}` in key with __array__ to match the object model
    const keyParts = key.split("/").map((part) => part.replace(/{}/g, "__array__"));
    let current = objectModelMapping as any;
    for (const part of keyParts) {
        // make sure part is not empty
        if (!part) {
            continue;
        }
        current = current[part];
    }
    // validate that the current object is an object accessor
    if (current && current.type && current.get) {
        (current as IObjectAccessor).interpolation = interpolation;
    }
}

/**
 * This will ad a new object accessor in the object model at the given key.
 * Note that this will NOT change the typescript types. To do that you will need to change the interface itself (extending it in the module that uses it)
 * @param key the key to add the object accessor at. For example /cameras/\{\}/perspective/aspectRatio
 * @param accessor the object accessor to add
 */
export function AddObjectAccessorToKey<GLTFTargetType = any, BabylonTargetType = any, BabylonValueType = any>(
    key: string,
    accessor: IObjectAccessor<GLTFTargetType, BabylonTargetType, BabylonValueType>
): void {
    // replace every `{}` in key with __array__ to match the object model
    const keyParts = key.split("/").map((part) => part.replace(/{}/g, "__array__"));
    let current = objectModelMapping as any;
    for (const part of keyParts) {
        // make sure part is not empty
        if (!part) {
            continue;
        }
        if (!current[part]) {
            if (part === "?") {
                current.__ignoreObjectTree__ = true;
                continue;
            }
            current[part] = {};
            // if the part is __array__ then add the __target__ property
            if (part === "__array__") {
                current[part].__target__ = true;
            }
        }
        current = current[part];
    }
    Object.assign(current, accessor);
}
