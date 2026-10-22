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
import { type Vector3, Matrix, Quaternion, Vector2 } from "core/Maths/math.vector.pure";
import { Constants } from "core/Engines/constants";
import { Color3, Color4 } from "core/Maths/math.color.pure";
import { type PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { type OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { type Material } from "core/Materials/material";
import { type Light } from "core/Lights/light";
import { type Nullable } from "core/types";
import { SpotLight } from "core/Lights/spotLight.pure";
import { type IEXTLightsImageBased_LightImageBased } from "babylonjs-gltf2interface";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type Texture } from "core/Materials/Textures/texture";
import { type IInterpolationPropertyInfo, type IObjectAccessor } from "core/FlowGraph/typeDefinitions";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes.pure";
import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import { type AnimationGroup } from "core/Animations/animationGroup";
import { type Mesh } from "core/Meshes/mesh";
import { type Camera } from "core/Cameras/camera";
import { type IAnimatable } from "core/Animations/animatable.interface";
import { _GetAreaLightDimensions } from "./gltfAreaLightDimensions";

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
        length: IObjectAccessor<IAnimation[], AnimationGroup[], FlowGraphInteger>;
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
    length: IObjectAccessor<GLTFTargetType[], BabylonTargetType[], FlowGraphInteger>;
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
            length: IObjectAccessor<number[], any, FlowGraphInteger>;
            __array__: { __target__: boolean } & IObjectAccessor<any, any, string>;
        };
        weights: {
            /** When true, the path converter skips objectTree traversal for this property, keeping the parent target. */
            __passThroughTarget__?: boolean;
            length: IObjectAccessor<GLTFTargetType, BabylonTargetType | number[] | undefined, FlowGraphInteger>;
            // Scalar targets may be live MorphTargets or retained off-scene weight arrays.
            __array__: { __target__: boolean } & IObjectAccessor<GLTFTargetType, any, number>;
        } & IObjectAccessor<GLTFTargetType, BabylonTargetType | number[], number[]>;
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
 * Accessor inputs are glTF records; their runtime targets are Babylon cameras.
 */
export interface IGLTFObjectModelTreeCamerasObject {
    /** Number of cameras in the array. */
    length: IObjectAccessor<ICamera[], any, FlowGraphInteger>;
    __array__: {
        __target__: boolean;
        orthographic: {
            xmag: IObjectAccessor<ICamera, Camera, number>;
            ymag: IObjectAccessor<ICamera, Camera, number>;
            zfar: IObjectAccessor<ICamera, Camera, number>;
            znear: IObjectAccessor<ICamera, Camera, number>;
        };
        perspective: {
            yfov: IObjectAccessor<ICamera, Camera, number>;
            zfar: IObjectAccessor<ICamera, Camera, number>;
            znear: IObjectAccessor<ICamera, Camera, number>;
            aspectRatio: IObjectAccessor<ICamera, Camera, Nullable<number>>;
        };
    };
}

/**
 * Accessor tree describing the `/materials` section of the glTF Object Model.
 * Covers core PBR properties as well as the family of KHR_materials_* extensions.
 */
export interface IGLTFObjectModelTreeMaterialsObject {
    /** Number of materials in the array. */
    length: IObjectAccessor<IMaterial[], (Material | undefined)[], FlowGraphInteger>;
    __array__: {
        __target__: boolean;
        doubleSided: IObjectAccessor<IMaterial, Material, boolean>;
        alphaCutoff: IObjectAccessor<IMaterial, Material, number>;
        pbrMetallicRoughness: {
            baseColorFactor: IObjectAccessor<IMaterial, Material, Color4>;
            metallicFactor: IObjectAccessor<IMaterial, Material, Nullable<number>>;
            roughnessFactor: IObjectAccessor<IMaterial, Material, Nullable<number>>;
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
        emissiveFactor: IObjectAccessor<IMaterial, Material, Color3>;
        normalTexture: {
            scale: IObjectAccessor<IMaterial, Material, number>;
            extensions: {
                KHR_texture_transform: ITextureDefinition;
            };
        };
        occlusionTexture: {
            strength: IObjectAccessor<IMaterial, Material, number>;
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
                anisotropyStrength: IObjectAccessor<IMaterial, Material, number>;
                anisotropyRotation: IObjectAccessor<IMaterial, Material, number>;
                anisotropyTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_clearcoat: {
                clearcoatFactor: IObjectAccessor<IMaterial, Material, number>;
                clearcoatRoughnessFactor: IObjectAccessor<IMaterial, Material, number>;
                clearcoatTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
                clearcoatNormalTexture: {
                    scale: IObjectAccessor<IMaterial, Material, number>;
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
                dispersion: IObjectAccessor<IMaterial, Material, number>;
            };
            KHR_materials_emissive_strength: {
                emissiveStrength: IObjectAccessor<IMaterial, Material, number>;
            };
            KHR_materials_ior: {
                ior: IObjectAccessor<IMaterial, Material, number>;
            };
            KHR_materials_iridescence: {
                iridescenceFactor: IObjectAccessor<IMaterial, Material, number>;
                iridescenceIor: IObjectAccessor<IMaterial, Material, number>;
                iridescenceThicknessMinimum: IObjectAccessor<IMaterial, Material, number>;
                iridescenceThicknessMaximum: IObjectAccessor<IMaterial, Material, number>;
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
                sheenColorFactor: IObjectAccessor<IMaterial, Material, Color3>;
                sheenRoughnessFactor: IObjectAccessor<IMaterial, Material, number>;
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
                specularFactor: IObjectAccessor<IMaterial, Material, number>;
                specularColorFactor: IObjectAccessor<IMaterial, Material, Color3>;
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
                transmissionFactor: IObjectAccessor<IMaterial, Material, number>;
                transmissionTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_diffuse_transmission: {
                diffuseTransmissionFactor: IObjectAccessor<IMaterial, Material, number>;
                diffuseTransmissionTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
                diffuseTransmissionColorFactor: IObjectAccessor<IMaterial, Material, Nullable<Color3>>;
                diffuseTransmissionColorTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_volume: {
                thicknessFactor: IObjectAccessor<IMaterial, Material, number>;
                attenuationColor: IObjectAccessor<IMaterial, Material, Color3>;
                attenuationDistance: IObjectAccessor<IMaterial, Material, number>;
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
    offset: IObjectAccessor<IMaterial, Material, Vector2>;
    rotation: IObjectAccessor<IMaterial, Material, number>;
    scale: IObjectAccessor<IMaterial, Material, Vector2>;
}

/**
 * Accessor tree describing the `/meshes` section of the glTF Object Model.
 * Exposes per-mesh primitives (and their material refs) and the mesh-level
 * morph-target weights array.
 */
export interface IGLTFObjectModelTreeMeshesObject {
    /** Number of meshes in the array. */
    length: IObjectAccessor<IMesh[], (Mesh | undefined)[], FlowGraphInteger>;
    __array__: {
        __target__: boolean;
        primitives: {
            length: IObjectAccessor<IMeshPrimitive[], any, FlowGraphInteger>;
            __array__: {
                __target__: boolean;
                material: IObjectAccessor<any, any, string | undefined>;
            };
        };
        weights: {
            length: IObjectAccessor<number[], any, FlowGraphInteger>;
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
    length: IObjectAccessor<IScene[], any, FlowGraphInteger>;
    __array__: {
        __target__: boolean;
        nodes: {
            length: IObjectAccessor<number[], any, FlowGraphInteger>;
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
    length: IObjectAccessor<ISkin[], any, FlowGraphInteger>;
    __array__: {
        __target__: boolean;
        joints: {
            length: IObjectAccessor<number[], any, FlowGraphInteger>;
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
            length: IObjectAccessor<IKHRLightsPunctual_Light[], Light[], FlowGraphInteger>;
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
    /** Accessor tree for `/extensions/EXT_lights_area`. Size/aspect use a loader-local semantic animation target. */
    EXT_lights_area: {
        lights: {
            length: IObjectAccessor<IEXTLightsArea_Light[], Light[], FlowGraphInteger>;
            __array__: {
                __target__: boolean;
                color: IObjectAccessor<IEXTLightsArea_Light, Light, Color3>;
                intensity: IObjectAccessor<IEXTLightsArea_Light, Light, number>;
                size: IObjectAccessor<IEXTLightsArea_Light, IAnimatable, number>;
                rect: {
                    aspect: IObjectAccessor<IEXTLightsArea_Light, IAnimatable, number>;
                };
            };
        };
    };
    /** Accessor tree for `/extensions/EXT_lights_ies`. */
    EXT_lights_ies: {
        lights: {
            length: IObjectAccessor<IKHRLightsPunctual_Light[], Light[], FlowGraphInteger>;
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
            length: IObjectAccessor<IEXTLightsImageBased_LightImageBased[], BaseTexture[], FlowGraphInteger>;
        };
    };
}

/**
 * Builds an accessor for an array `length` pointer (e.g. `/nodes.length`, `/meshes/{}/primitives.length`).
 *
 * The KHR object model types these `length` values as `int`, so the accessor reports the count as a
 * {@link FlowGraphInteger} (type {@link FlowGraphTypes.Integer}). Keeping the representation an integer
 * at the source lets integer-typed consumers such as `FlowGraphIntToFloat` accept the precise
 * `RichTypeFlowGraphInteger` instead of a widened `RichTypeAny`.
 * @param getLength returns the raw count for the addressed array; may be `undefined` when the array is not addressable
 * @param getTarget returns the Babylon object(s) backing the array
 * @returns an object accessor whose value is the count as a {@link FlowGraphInteger}
 */
function _CreateLengthAccessor<GLTFTargetType, BabylonTargetType>(
    getLength: (target: GLTFTargetType) => number | undefined,
    getTarget: (target: GLTFTargetType) => BabylonTargetType
): IObjectAccessor<GLTFTargetType, BabylonTargetType, FlowGraphInteger> {
    return {
        type: FlowGraphTypes.Integer,
        isReadOnly: true,
        get: (target: GLTFTargetType) => {
            const length = getLength(target);
            return length === undefined ? undefined : FlowGraphInteger.FromValue(length);
        },
        getTarget,
        getPropertyName: [() => "length"],
    };
}

const nodesTree: IGLTFObjectModelTreeNodesObject = {
    length: _CreateLengthAccessor(
        (nodes: INode[]) => nodes.length,
        (nodes: INode[]) => nodes.map((node) => node._babylonTransformNode!)
    ),
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
            // Weights may come from mesh defaults rather than an authored node property.
            __passThroughTarget__: true,
            length: _CreateLengthAccessor(
                (node: INode) => {
                    const found = _findNodeMorphTargets(node);
                    return found ? found.mtm.numTargets : node?.mesh !== undefined ? (node._morphTargetWeights?.length ?? 0) : undefined;
                },
                (node: INode) => node?._babylonTransformNode ?? node?._morphTargetWeights
            ),
            __array__: {
                __target__: true,
                type: "number",
                get: (node: INode, index?: number) => {
                    const found = _findNodeMorphTargets(node);
                    if (found && index !== undefined && index >= 0 && index < found.mtm.numTargets) {
                        return _roundFloat32Artifact(found.mtm.getTarget(index).influence);
                    }
                    if (!found && index !== undefined) {
                        return node?._morphTargetWeights?.[index];
                    }
                    return undefined;
                },
                set: (value: any, node: INode, index?: number) => {
                    const numValue = typeof value === "number" ? value : typeof value?.value === "number" ? value.value : value;
                    const found = _findNodeMorphTargets(node);
                    const count = found?.mtm.numTargets ?? node?._morphTargetWeights?.length ?? 0;
                    if (index === undefined || index < 0 || index >= count) {
                        throw new Error("Morph target weight index is out of range.");
                    }
                    if (!found) {
                        node._morphTargetWeights![index] = numValue;
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
                    return node?._babylonTransformNode ?? node?._morphTargetWeights;
                },
                getPropertyName: [(node: INode, index?: number) => (_findNodeMorphTargets(node) ? "influence" : String(index))],
            },
            type: "number[]",
            get: (node: INode) => {
                const found = _findNodeMorphTargets(node);
                if (!found) {
                    return node?._morphTargetWeights?.slice() ?? [];
                }
                const weights: number[] = [];
                for (let i = 0; i < found.mtm.numTargets; i++) {
                    weights.push(_roundFloat32Artifact(found.mtm.getTarget(i).influence));
                }
                return weights;
            },
            getTarget: (node: INode) => node?._babylonTransformNode ?? node?._morphTargetWeights,
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
            get: (node: INode) => (node.camera !== undefined ? `/cameras/${node.camera}` : ""),
            getTarget: (node: INode) => node,
            isReadOnly: true,
        },
        mesh: {
            type: "string",
            get: (node: INode) => (node.mesh !== undefined ? `/meshes/${node.mesh}` : ""),
            getTarget: (node: INode) => node,
            isReadOnly: true,
        },
        skin: {
            type: "string",
            get: (node: INode) => (node.skin !== undefined ? `/skins/${node.skin}` : ""),
            getTarget: (node: INode) => node,
            isReadOnly: true,
        },
        parent: {
            type: "string",
            get: (node: INode) => (node.parent && node.parent.index !== undefined ? `/nodes/${node.parent.index}` : ""),
            getTarget: (node: INode) => node,
            isReadOnly: true,
        },
        children: {
            length: _CreateLengthAccessor(
                (children: number[]) => children?.length ?? 0,
                (children: number[]) => children ?? []
            ),
            __array__: {
                __target__: true,
                type: "string",
                // The wrapping converter passes the indexed child value (an
                // INode index); convert it to a JSON Pointer ref string.
                get: (childIndex: any) => (typeof childIndex === "number" ? `/nodes/${childIndex}` : ""),
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
    length: _CreateLengthAccessor(
        (animations: IAnimation[]) => animations.length,
        (animations: IAnimation[]) => animations.map((animation) => animation._babylonAnimationGroup!)
    ),
    __array__: {
        // Indexed access to the animation, surfaced as a JSON Pointer ref string so blocks like
        // ``animation/start`` can consume it directly. Uses the animation's own ``index`` property
        // (populated by the loader's ArrayItem.Assign step) so the ref is resolved without needing
        // a separate index payload from the path converter.
        __target__: true,
        type: "string",
        get: (animation: IAnimation) => (animation && typeof animation.index === "number" ? `/animations/${animation.index}` : ""),
        getTarget: (animation: IAnimation) => animation._babylonAnimationGroup,
        isReadOnly: true,
    },
};

const meshesTree: IGLTFObjectModelTreeMeshesObject = {
    length: _CreateLengthAccessor(
        (meshes: IMesh[]) => meshes.length,
        (meshes: IMesh[]) => meshes.map((mesh) => mesh.primitives[0]._instanceData?.babylonSourceMesh)
    ),
    __array__: {
        __target__: true,
        primitives: {
            length: _CreateLengthAccessor(
                (primitives: IMeshPrimitive[]) => primitives?.length ?? 0,
                (primitives: IMeshPrimitive[]) => primitives ?? []
            ),
            __array__: {
                __target__: true,
                material: {
                    type: "string",
                    // Read-only ref to the assigned material, JSON Pointer encoded.
                    get: (primitive: IMeshPrimitive) => (primitive.material !== undefined ? `/materials/${primitive.material}` : ""),
                    getTarget: (primitive: IMeshPrimitive) => primitive,
                    isReadOnly: true,
                },
            },
        },
        weights: {
            length: _CreateLengthAccessor(
                (weights: number[]) => weights?.length ?? 0,
                (weights: number[]) => weights ?? []
            ),
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
    length: _CreateLengthAccessor(
        (cameras: ICamera[]) => cameras.length,
        (cameras: ICamera[]) => cameras.map((camera) => camera._babylonCamera!)
    ),
    __array__: {
        __target__: true,
        orthographic: {
            xmag: {
                componentsCount: 2,
                type: "number",
                get: (camera) => camera._babylonCamera?.orthoRight ?? 0,
                set: (value, camera) => {
                    if (camera._babylonCamera) {
                        camera._babylonCamera.orthoLeft = -value;
                        camera._babylonCamera.orthoRight = value;
                    }
                },
                getTarget: (camera) => camera._babylonCamera,
                getPropertyName: [() => "orthoLeft", () => "orthoRight"],
            },
            ymag: {
                componentsCount: 2,
                type: "number",
                get: (camera) => camera._babylonCamera?.orthoTop ?? 0,
                set: (value, camera) => {
                    if (camera._babylonCamera) {
                        camera._babylonCamera.orthoBottom = -value;
                        camera._babylonCamera.orthoTop = value;
                    }
                },
                getTarget: (camera) => camera._babylonCamera,
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
                getTarget: (camera: ICamera) => camera._babylonCamera,
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
                getTarget: (camera: ICamera) => camera._babylonCamera,
                getPropertyName: [() => "minZ"],
            },
        },
        perspective: {
            aspectRatio: {
                type: "number",
                get: (camera: ICamera) => camera._babylonCamera?.getEngine().getAspectRatio(camera._babylonCamera),
                getTarget: (camera: ICamera) => camera._babylonCamera,
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
                getTarget: (camera: ICamera) => camera._babylonCamera,
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
                getTarget: (camera: ICamera) => camera._babylonCamera,
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
                getTarget: (camera: ICamera) => camera._babylonCamera,
                getPropertyName: [() => "minZ"],
            },
        },
    },
};

const materialsTree: IGLTFObjectModelTreeMaterialsObject = {
    length: _CreateLengthAccessor(
        (materials: IMaterial[]) => materials.length,
        (materials: IMaterial[]) => materials.map((material) => GetMaterial(material))
    ),
    __array__: {
        __target__: true,
        doubleSided: {
            type: "boolean",
            get: (material, index?, payload?) => !GetMaterial(material, index, payload)?.backFaceCulling,
            set: /*#__PURE__*/ _CreateMaterialSetter((value: boolean, mat) => {
                if (mat) {
                    mat.backFaceCulling = !value;
                }
            }),
            getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
            getPropertyName: [() => "backFaceCulling"],
        },
        alphaCutoff: {
            type: "number",
            get: (material, index?, payload?) => GetMaterial(material, index, payload)?.alphaCutOff,
            set: /*#__PURE__*/ _CreateMaterialSetter((value: number, mat) => {
                if (mat) {
                    mat.alphaCutOff = value;
                }
            }),
            getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
            getPropertyName: [() => "alphaCutOff"],
        },
        emissiveFactor: {
            type: "Color3",
            get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.emissionColor : mat.emissiveColor)),
            set: /*#__PURE__*/ _CreateMaterialSetter((value: Color3, mat) => (_IsOpenPBRMaterial(mat) ? mat.emissionColor : mat.emissiveColor).copyFrom(value)),
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
                set: /*#__PURE__*/ _CreateMaterialSetter((value: number, mat) => {
                    const texture = _GetMaterialTexture(mat, "bumpTexture");
                    if (texture) {
                        texture.level = value;
                    }
                }),
                getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                getPropertyName: [() => "bumpTexture.level"],
            },
            extensions: {
                KHR_texture_transform: GenerateTextureMap("bumpTexture"),
            },
        },
        occlusionTexture: {
            strength: {
                type: "number",
                get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? (_GetMaterialTexture(mat, "ambientTexture")?.level ?? 1) : mat.ambientTextureStrength)),
                set: /*#__PURE__*/ _CreateMaterialSetter((value: number, mat) => {
                    if (mat) {
                        if (_IsOpenPBRMaterial(mat)) {
                            const texture = _GetMaterialTexture(mat, "ambientTexture");
                            if (texture) {
                                texture.level = value;
                            }
                        } else {
                            mat.ambientTextureStrength = value;
                        }
                    }
                }),
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
                get: _CreateMaterialGetter((mat) =>
                    _IsOpenPBRMaterial(mat) ? Color4.FromColor3(mat.baseColor, mat.geometryOpacity) : Color4.FromColor3(mat.albedoColor, mat.alpha)
                ),
                set: /*#__PURE__*/ _CreateMaterialSetter((value: Color4, mat, source) => {
                    if (_IsOpenPBRMaterial(mat)) {
                        // Loading can share baseColor with transmissionColor; preserve independent attenuation.
                        mat.baseColor = new Color3(value.r, value.g, value.b);
                        mat.geometryOpacity = !source.alphaMode || source.alphaMode === "OPAQUE" ? 1 : value.a;
                        _UpdateTransmissionTint(mat);
                    } else {
                        mat.albedoColor.set(value.r, value.g, value.b);
                        mat.alpha = value.a;
                    }
                }),
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
                get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.baseMetalness : mat.metallic)),
                set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => {
                    if (mat) {
                        if (_IsOpenPBRMaterial(mat)) {
                            mat.baseMetalness = value ?? 1;
                        } else {
                            mat.metallic = value;
                        }
                    }
                }),
                getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                getPropertyName: [() => "metallic"],
            },
            roughnessFactor: {
                type: "number",
                get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.specularRoughness : mat.roughness)),
                set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => {
                    if (mat) {
                        if (_IsOpenPBRMaterial(mat)) {
                            mat.specularRoughness = value ?? 1;
                        } else {
                            mat.roughness = value;
                        }
                    }
                }),
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
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.specularRoughnessAnisotropy : mat.anisotropy.intensity)),
                    set: /*#__PURE__*/ _CreateMaterialSetter((value: number, mat) => {
                        if (mat) {
                            if (_IsOpenPBRMaterial(mat)) {
                                mat.specularRoughnessAnisotropy = value;
                            } else {
                                mat.anisotropy.intensity = value;
                            }
                        }
                    }),
                    getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                    getPropertyName: [() => "anisotropy.intensity"],
                },
                anisotropyRotation: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.geometryTangentAngle : mat.anisotropy.angle)),
                    set: /*#__PURE__*/ _CreateMaterialSetter((value: number, mat) => {
                        if (mat) {
                            if (_IsOpenPBRMaterial(mat)) {
                                mat.geometryTangentAngle = value;
                            } else {
                                mat.anisotropy.angle = value;
                            }
                        }
                    }),
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
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.coatWeight : mat.clearCoat.intensity)),
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => {
                        if (_IsOpenPBRMaterial(mat)) {
                            mat.coatWeight = value;
                        } else {
                            mat.clearCoat.intensity = value;
                        }
                    }),
                    getTarget: (material, index?, payload?) => GetMaterial(material, index, payload),
                    getPropertyName: [() => "clearCoat.intensity"],
                },
                clearcoatRoughnessFactor: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.coatRoughness : mat.clearCoat.roughness)),
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => {
                        if (_IsOpenPBRMaterial(mat)) {
                            mat.coatRoughness = value;
                        } else {
                            mat.clearCoat.roughness = value;
                        }
                    }),
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
                        get: (material, _index, payload) => GetTexture(material, payload, "clearCoat", "bumpTexture")?.level,
                        getTarget: GetMaterial,
                        set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => {
                            const texture = _GetMaterialTexture(mat, "clearCoat", "bumpTexture");
                            if (texture) {
                                texture.level = value;
                            }
                        }),
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
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.transmissionDispersionScale : mat.subSurface.dispersion)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) =>
                        _IsOpenPBRMaterial(mat) ? (mat.transmissionDispersionScale = value) : (mat.subSurface.dispersion = value)
                    ),
                },
            },
            KHR_materials_emissive_strength: {
                emissiveStrength: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.emissionLuminance : mat.emissiveIntensity)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => (_IsOpenPBRMaterial(mat) ? (mat.emissionLuminance = value) : (mat.emissiveIntensity = value))),
                },
            },
            KHR_materials_ior: {
                ior: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.specularIor : mat.indexOfRefraction)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => (_IsOpenPBRMaterial(mat) ? (mat.specularIor = value) : (mat.indexOfRefraction = value))),
                },
            },
            KHR_materials_iridescence: {
                iridescenceFactor: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.thinFilmWeight : mat.iridescence.intensity)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => (_IsOpenPBRMaterial(mat) ? (mat.thinFilmWeight = value) : (mat.iridescence.intensity = value))),
                },
                iridescenceIor: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.thinFilmIor : mat.iridescence.indexOfRefraction)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => (_IsOpenPBRMaterial(mat) ? (mat.thinFilmIor = value) : (mat.iridescence.indexOfRefraction = value))),
                },
                iridescenceTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("iridescence", "texture"),
                    },
                },
                iridescenceThicknessMaximum: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.thinFilmThickness * 1000 : mat.iridescence.maximumThickness)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) =>
                        _IsOpenPBRMaterial(mat) ? (mat.thinFilmThickness = value / 1000) : (mat.iridescence.maximumThickness = value)
                    ),
                },
                iridescenceThicknessMinimum: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.thinFilmThicknessMin * 1000 : mat.iridescence.minimumThickness)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) =>
                        _IsOpenPBRMaterial(mat) ? (mat.thinFilmThicknessMin = value / 1000) : (mat.iridescence.minimumThickness = value)
                    ),
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
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.fuzzColor : mat.sheen.color)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => (_IsOpenPBRMaterial(mat) ? mat.fuzzColor : mat.sheen.color).copyFrom(value)),
                },
                sheenColorTexture: {
                    extensions: {
                        KHR_texture_transform: GenerateTextureMap("sheen", "texture"),
                    },
                },
                sheenRoughnessFactor: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.fuzzRoughness : (mat.sheen.roughness ?? 0))),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => (_IsOpenPBRMaterial(mat) ? (mat.fuzzRoughness = value) : (mat.sheen.roughness = value))),
                    getPropertyName: [() => "sheen.roughness"],
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
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.specularWeight : mat.metallicF0Factor)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => (_IsOpenPBRMaterial(mat) ? (mat.specularWeight = value) : (mat.metallicF0Factor = value))),
                    getPropertyName: [() => "metallicF0Factor"],
                },
                specularColorFactor: {
                    type: "Color3",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.specularColor : mat.metallicReflectanceColor)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => (_IsOpenPBRMaterial(mat) ? mat.specularColor : mat.metallicReflectanceColor).copyFrom(value)),
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
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.transmissionWeight : mat.subSurface.refractionIntensity)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => {
                        if (_IsOpenPBRMaterial(mat)) {
                            mat.transmissionWeight = value;
                            _UpdateTransmissionTint(mat);
                        } else {
                            mat.subSurface.refractionIntensity = value;
                        }
                    }),
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
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.subsurfaceWeight : mat.subSurface.translucencyIntensity)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) =>
                        _IsOpenPBRMaterial(mat) ? (mat.subsurfaceWeight = value) : (mat.subSurface.translucencyIntensity = value)
                    ),
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
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.subsurfaceColor : mat.subSurface.translucencyColor)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter(
                        (value, mat) => value && (_IsOpenPBRMaterial(mat) ? mat.subsurfaceColor : mat.subSurface.translucencyColor)?.copyFrom(value)
                    ),
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
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.transmissionColor : mat.subSurface.tintColor)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => {
                        if (_IsOpenPBRMaterial(mat)) {
                            // Loading can share this Color3 with baseColor when transmission uses surface tint.
                            mat.transmissionColor = value.clone();
                        } else {
                            mat.subSurface.tintColor.copyFrom(value);
                        }
                    }),
                },
                attenuationDistance: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.transmissionDepth : mat.subSurface.tintColorAtDistance)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) => {
                        if (_IsOpenPBRMaterial(mat)) {
                            mat.transmissionDepth = value;
                            _UpdateTransmissionTint(mat);
                        } else {
                            mat.subSurface.tintColorAtDistance = value;
                        }
                    }),
                },
                thicknessFactor: {
                    type: "number",
                    get: _CreateMaterialGetter((mat) => (_IsOpenPBRMaterial(mat) ? mat.geometryThickness : mat.subSurface.maximumThickness)),
                    getTarget: GetMaterial,
                    set: /*#__PURE__*/ _CreateMaterialSetter((value, mat) =>
                        _IsOpenPBRMaterial(mat) ? (mat.geometryThickness = value) : (mat.subSurface.maximumThickness = value)
                    ),
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
            length: _CreateLengthAccessor(
                (lights: IKHRLightsPunctual_Light[]) => lights.length,
                (lights: IKHRLightsPunctual_Light[]) => lights.map((light) => light._babylonLight!)
            ),
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
                        get: (light: IKHRLightsPunctual_Light) => (light._babylonLight as SpotLight)?.innerAngle / 2,
                        set: (value: number, light: IKHRLightsPunctual_Light) => (light._babylonLight ? ((light._babylonLight as SpotLight).innerAngle = value * 2) : undefined),
                        getTarget: (light: IKHRLightsPunctual_Light) => light._babylonLight,
                        getPropertyName: [() => "innerAngle"],
                    },
                    outerConeAngle: {
                        type: "number",
                        get: (light: IKHRLightsPunctual_Light) => (light._babylonLight as SpotLight)?.angle / 2,
                        set: (value: number, light: IKHRLightsPunctual_Light) => (light._babylonLight ? ((light._babylonLight as SpotLight).angle = value * 2) : undefined),
                        getTarget: (light: IKHRLightsPunctual_Light) => light._babylonLight,
                        getPropertyName: [() => "angle"],
                    },
                },
            },
        },
    },
    EXT_lights_area: {
        lights: {
            length: _CreateLengthAccessor(
                (lights: IEXTLightsArea_Light[]) => lights.length,
                (lights: IEXTLightsArea_Light[]) => lights.map((light) => light._babylonLight!)
            ),
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
                    get: (light) => _GetAreaLightDimensions(light)?.size,
                    set: (value, light) => {
                        const target = _GetAreaLightDimensions(light);
                        if (target) {
                            target.size = value;
                        }
                    },
                    getTarget: _GetAreaLightDimensions,
                    getPropertyName: [() => "size"],
                },
                rect: {
                    aspect: {
                        type: "number",
                        get: (light) => _GetAreaLightDimensions(light)?.aspect,
                        set: (value, light) => {
                            const target = _GetAreaLightDimensions(light);
                            if (target) {
                                target.aspect = value;
                            }
                        },
                        getTarget: _GetAreaLightDimensions,
                        getPropertyName: [() => "aspect"],
                    },
                },
            },
        },
    },
    EXT_lights_ies: {
        lights: {
            length: _CreateLengthAccessor(
                (lights: IKHRLightsPunctual_Light[]) => lights.length,
                (lights: IKHRLightsPunctual_Light[]) => lights.map((light) => light._babylonLight!)
            ),
        },
    },
    EXT_lights_image_based: {
        lights: {
            length: _CreateLengthAccessor(
                (lights: IEXTLightsImageBased_LightImageBased[]) => lights.length,
                (lights: IEXTLightsImageBased_LightImageBased[]) => lights.map((light) => light._babylonTexture!)
            ),
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
    return _GetTextureTransform(_GetMaterialTexture(GetMaterial(material, undefined, payload), textureType, textureInObject));
}
function _GetTextureTransform(texture: Nullable<BaseTexture> | undefined): Texture | undefined {
    if (!texture) {
        return undefined;
    }
    if (_HasTextureTransform(texture)) {
        return texture;
    }
    throw new Error(`Unsupported glTF texture transform: ${texture.name}`);
}
function _HasTextureTransform(texture: BaseTexture): texture is Texture {
    return "uOffset" in texture && "vOffset" in texture && "uScale" in texture && "vScale" in texture && "wAng" in texture;
}
const MaterialTextureSources = new WeakMap<Material, Map<string, Nullable<BaseTexture> | undefined>>();

/**
 * Retains glTF texture bindings before OpenPBR finalization replaces material texture slots.
 * @param material The material whose source textures must remain addressable at runtime.
 * @returns Unique original textures, including on subsequent calls after finalization, or an empty array for other material implementations.
 * @internal
 */
export function _RetainGLTFMaterialTextureSources(material: Material): readonly BaseTexture[] {
    if (!_IsOpenPBRMaterial(material)) {
        return [];
    }
    const retained = MaterialTextureSources.get(material);
    if (retained) {
        return _GetUniqueMaterialTextureSources(retained);
    }
    const bindings: [keyof PBRMaterial, string?][] = [
        ["albedoTexture"],
        ["metallicTexture"],
        ["emissiveTexture"],
        ["bumpTexture"],
        ["ambientTexture"],
        ["metallicReflectanceTexture"],
        ["reflectanceTexture"],
        ["anisotropy", "texture"],
        ["clearCoat", "texture"],
        ["clearCoat", "textureRoughness"],
        ["clearCoat", "bumpTexture"],
        ["iridescence", "texture"],
        ["iridescence", "thicknessTexture"],
        ["sheen", "texture"],
        ["sheen", "textureRoughness"],
        ["subSurface", "refractionIntensityTexture"],
        ["subSurface", "translucencyIntensityTexture"],
        ["subSurface", "translucencyColorTexture"],
        ["subSurface", "thicknessTexture"],
    ];
    const sources = new Map<string, Nullable<BaseTexture> | undefined>();
    for (const [textureType, textureInObject] of bindings) {
        sources.set(_MaterialTextureKey(textureType, textureInObject), _GetMaterialTextureSlot(material, textureType, textureInObject));
    }
    MaterialTextureSources.set(material, sources);
    return _GetUniqueMaterialTextureSources(sources);
}
function _GetUniqueMaterialTextureSources(sources: ReadonlyMap<string, Nullable<BaseTexture> | undefined>): BaseTexture[] {
    const textures = new Set<BaseTexture>();
    for (const texture of sources.values()) {
        if (texture) {
            textures.add(texture);
        }
    }
    return Array.from(textures);
}
function _MaterialTextureKey(textureType: keyof PBRMaterial, textureInObject?: string): string {
    return textureInObject ? `${textureType}.${textureInObject}` : textureType;
}
function _GetMaterialTexture(material: PBRMaterial | OpenPBRMaterial | undefined, textureType: keyof PBRMaterial, textureInObject?: string): Nullable<BaseTexture> | undefined {
    if (!material) {
        return undefined;
    }
    const sources = MaterialTextureSources.get(material);
    const key = _MaterialTextureKey(textureType, textureInObject);
    return sources?.has(key) ? sources.get(key) : _GetMaterialTextureSlot(material, textureType, textureInObject);
}
function _GetMaterialTextureSlot(material: PBRMaterial | OpenPBRMaterial, textureType: keyof PBRMaterial, textureInObject?: string): Nullable<BaseTexture> {
    const openpbr = _IsOpenPBRMaterial(material);
    switch (textureType) {
        case "albedoTexture":
            return openpbr ? material.baseColorTexture : material.albedoTexture;
        case "metallicTexture":
            return openpbr ? material.baseMetalnessTexture : material.metallicTexture;
        case "emissiveTexture":
            return openpbr ? material.emissionColorTexture : material.emissiveTexture;
        case "bumpTexture":
            return openpbr ? material.geometryNormalTexture : material.bumpTexture;
        case "ambientTexture":
            return openpbr ? material.ambientOcclusionTexture : material.ambientTexture;
        case "metallicReflectanceTexture":
            return openpbr
                ? material._useSpecularWeightFromSpecularColorTexture
                    ? material.specularColorTexture
                    : material.specularWeightTexture
                : material.metallicReflectanceTexture;
        case "reflectanceTexture":
            return openpbr ? material.specularColorTexture : material.reflectanceTexture;
        case "anisotropy":
            return openpbr ? material.geometryTangentTexture : material.anisotropy.texture;
        case "clearCoat":
            switch (textureInObject) {
                case "texture":
                    return openpbr ? material.coatWeightTexture : material.clearCoat.texture;
                case "textureRoughness":
                    return openpbr ? material.coatRoughnessTexture : material.clearCoat.textureRoughness;
                case "bumpTexture":
                    return openpbr ? material.geometryCoatNormalTexture : material.clearCoat.bumpTexture;
            }
            break;
        case "iridescence":
            switch (textureInObject) {
                case "texture":
                    return openpbr ? material.thinFilmWeightTexture : material.iridescence.texture;
                case "thicknessTexture":
                    return openpbr ? material.thinFilmThicknessTexture : material.iridescence.thicknessTexture;
            }
            break;
        case "sheen":
            switch (textureInObject) {
                case "texture":
                    return openpbr ? material.fuzzColorTexture : material.sheen.texture;
                case "textureRoughness":
                    return openpbr ? material.fuzzRoughnessTexture : material.sheen.textureRoughness;
            }
            break;
        case "subSurface":
            switch (textureInObject) {
                case "refractionIntensityTexture":
                    return openpbr ? material.transmissionWeightTexture : material.subSurface.refractionIntensityTexture;
                case "translucencyIntensityTexture":
                    return openpbr ? material.subsurfaceWeightTexture : material.subSurface.translucencyIntensityTexture;
                case "translucencyColorTexture":
                    return openpbr ? material.subsurfaceColorTexture : material.subSurface.translucencyColorTexture;
                case "thicknessTexture":
                    return openpbr ? material.geometryThicknessTexture : material.subSurface.thicknessTexture;
            }
            break;
    }
    throw new Error(`Unsupported glTF material texture: ${textureType}${textureInObject ? "." + textureInObject : ""}`);
}
function _IsOpenPBRMaterial(material: Material): material is OpenPBRMaterial {
    return "baseColor" in material && "geometryOpacity" in material;
}
function _IsPBRMaterial(material: Material): material is PBRMaterial {
    return "albedoColor" in material && "clearCoat" in material && "subSurface" in material;
}
function _UpdateTransmissionTint(material: OpenPBRMaterial): void {
    if (material.transmissionWeight > 0 && (material.geometryThinWalled || material.transmissionDepth === 0)) {
        // Loading derives this tint from base color rather than glTF volume attenuation.
        material.transmissionColor = material.baseColor;
        material.transmissionColorTexture = material.baseColorTexture;
    }
}
function GetMaterial(material: IMaterial, _index?: number, payload?: any): PBRMaterial | OpenPBRMaterial | undefined {
    let target = material._data?.[payload?.fillMode ?? Constants.MATERIAL_TriangleFillMode]?.babylonMaterial;
    if (!target && payload?.fillMode === undefined) {
        for (const fillMode in material._data) {
            target = material._data[Number(fillMode)].babylonMaterial;
            break;
        }
    }
    if (!target || _IsOpenPBRMaterial(target) || _IsPBRMaterial(target)) {
        return target;
    }
    throw new Error(`Unsupported glTF material: ${target.getClassName()}`);
}
function _CreateMaterialGetter<T>(getValue: (target: PBRMaterial | OpenPBRMaterial) => T): IObjectAccessor<IMaterial, Material, T>["get"] {
    return (material, index, payload) => {
        const target = GetMaterial(material, index, payload);
        return target && getValue(target);
    };
}
function _CreateMaterialSetter<T>(
    setValue: (value: T, target: PBRMaterial | OpenPBRMaterial, source: IMaterial) => void
): NonNullable<IObjectAccessor<IMaterial, Material, T>["set"]> {
    return (value, material, index, payload) => {
        if (payload?.fillMode !== undefined) {
            const target = GetMaterial(material, index, payload);
            if (target) {
                setValue(value, target, material);
            }
            return;
        }
        for (const fillMode in material._data) {
            const target = GetMaterial(material, index, { fillMode: Number(fillMode) });
            if (target) {
                setValue(value, target, material);
            }
        }
    };
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
    let extensions = material.extensions;
    if (!extensions) {
        if (!createMissing) {
            return undefined;
        }
        extensions = {};
        material.extensions = extensions;
    }
    let cursor: any = extensions[gltfPath.extensionKey];
    if (!cursor) {
        if (!createMissing) {
            return undefined;
        }
        cursor = {};
        extensions[gltfPath.extensionKey] = cursor;
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
            set: /*#__PURE__*/ _CreateMaterialSetter((value, target, material) => {
                const texture = _GetTextureTransform(_GetMaterialTexture(target, textureType, textureInObject));
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
            }),
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
                    return -texture.wAng;
                }
                if (gltfPath) {
                    const xform = _gltfTextureTransform(material, gltfPath, false);
                    return xform?.rotation ?? 0;
                }
                return 0;
            },
            getTarget: GetMaterial,
            set: /*#__PURE__*/ _CreateMaterialSetter((value, target, material) => {
                const texture = _GetTextureTransform(_GetMaterialTexture(target, textureType, textureInObject));
                if (texture) {
                    texture.wAng = -value;
                }
                if (gltfPath) {
                    const xform = _gltfTextureTransform(material, gltfPath, true);
                    if (xform) {
                        xform.rotation = value;
                    }
                }
            }),
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
            set: /*#__PURE__*/ _CreateMaterialSetter((value, target, material) => {
                const texture = _GetTextureTransform(_GetMaterialTexture(target, textureType, textureInObject));
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
            }),
            getPropertyName: [
                () => `${textureType}${textureInObject ? "." + textureInObject : ""}.uScale`,
                () => `${textureType}${textureInObject ? "." + textureInObject : ""}.vScale`,
            ],
        },
    };
}

const scenesTree: IGLTFObjectModelTreeScenesObject = {
    length: _CreateLengthAccessor(
        (scenes: IScene[]) => scenes.length,
        (scenes: IScene[]) => scenes
    ),
    __array__: {
        __target__: true,
        nodes: {
            length: _CreateLengthAccessor(
                (nodes: number[]) => nodes?.length ?? 0,
                (nodes: number[]) => nodes ?? []
            ),
            __array__: {
                __target__: true,
                type: "string",
                // Indexed scene root: the underlying value is the INode index;
                // KHR_interactivity expects a ref-typed JSON Pointer string.
                get: (nodeIndex: any) => (typeof nodeIndex === "number" ? `/nodes/${nodeIndex}` : ""),
                getTarget: () => ({ __nodeIndex: true }),
                isReadOnly: true,
            },
        },
    },
};

const skinsTree: IGLTFObjectModelTreeSkinsObject = {
    length: _CreateLengthAccessor(
        (skins: ISkin[]) => skins.length,
        (skins: ISkin[]) => skins.map((skin) => skin._data?.babylonSkeleton)
    ),
    __array__: {
        __target__: true,
        joints: {
            length: _CreateLengthAccessor(
                (joints: number[]) => joints?.length ?? 0,
                (joints: number[]) => joints ?? []
            ),
            __array__: {
                __target__: true,
                type: "string",
                // Indexed skin joint: returns a ref to the joint node.
                get: (jointIndex: any) => (typeof jointIndex === "number" ? `/nodes/${jointIndex}` : ""),
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
                return typeof skeleton === "number" ? `/nodes/${skeleton}` : "";
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
 * Creates a detached copy so asset-local accessors cannot mutate other converters.
 * @param value mapping value to clone
 * @returns the cloned mapping value
 */
function _cloneObjectModelMapping<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((entry) => _cloneObjectModelMapping(entry)) as T;
    }
    if (value !== null && typeof value === "object") {
        const prototype = Object.getPrototypeOf(value);
        if (prototype !== Object.prototype && prototype !== null) {
            return value;
        }
        const clone: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value)) {
            clone[key] = _cloneObjectModelMapping(entry);
        }
        return clone as T;
    }
    return value;
}

/**
 * get a path-to-object converter for the given glTF tree
 * @param gltf the glTF tree to use
 * @param configure optional callback for adding asset-local accessors to this converter
 * @returns a path-to-object converter for the given glTF tree
 */
export function GetPathToObjectConverter(gltf: IGLTF, configure?: (mapping: object) => void) {
    // Off-scene nodes have no Babylon meshes, but their weights remain part of the object model.
    for (const node of gltf?.nodes ?? []) {
        if (node._babylonTransformNode || node.mesh === undefined || node._morphTargetWeights) {
            continue;
        }
        const mesh = gltf.meshes?.[node.mesh];
        if (mesh) {
            const count = mesh.primitives[0]?.targets?.length ?? 0;
            node._morphTargetWeights = Array.from({ length: count }, (_, index) => node.weights?.[index] ?? mesh.weights?.[index] ?? 0);
        }
    }
    if (!configure) {
        return new GLTFPathToObjectConverter(gltf, objectModelMapping);
    }
    const assetMapping = _cloneObjectModelMapping(objectModelMapping);
    configure(assetMapping);
    return new GLTFPathToObjectConverter(gltf, assetMapping);
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
 * @param mapping object-model mapping to update; defaults to the process-wide mapping used as the template for new converters
 */
export function AddObjectAccessorToKey<GLTFTargetType = any, BabylonTargetType = any, BabylonValueType = any>(
    key: string,
    accessor: IObjectAccessor<GLTFTargetType, BabylonTargetType, BabylonValueType>,
    mapping: object = objectModelMapping
): void {
    // replace every `{}` in key with __array__ to match the object model
    const keyParts = key.split("/").map((part) => part.replace(/{}/g, "__array__"));
    let current = mapping as any;
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
