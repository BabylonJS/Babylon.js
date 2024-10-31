/* eslint-disable @typescript-eslint/naming-convention */

import type { TransformNode } from "core/Meshes/transformNode";
import type { AnimationPropertyInfo } from "../glTFLoaderAnimation";
import type { ICamera, IKHRLightsPunctual_Light, IMaterial, INode } from "../glTFLoaderInterfaces";
import type { Vector3 } from "core/Maths/math.vector";
import { Matrix, Quaternion } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
import type { Color3 } from "core/Maths/math.color";
import { Color4 } from "core/Maths/math.color";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Light } from "core/Lights/light";
import type { Nullable } from "core/types";
import type { SpotLight } from "core/Lights/spotLight";
import type { IEXTLightsImageBased_LightImageBased } from "babylonjs-gltf2interface";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";

export interface IGLTFObjectModelTree {
    cameras: IGLTFObjectModelTreeCamerasObject;
    nodes: IGLTFObjectModelTreeNodesObject;
    materials: IGLTFObjectModelTreeMaterialsObject;
    extensions: IGLTFObjectModelTreeExtensionsObject;
    animations: {};
    meshes: {};
}

export interface IGLTFObjectModelTreeNodesObject<GLTFTargetType = INode, BabylonTargetType = TransformNode> {
    length: IGLTFObjectModelTreeMember<GLTFTargetType[], BabylonTargetType[], number>;
    __array__: {
        __target__: boolean;
        translation: IGLTFObjectModelTreeMember<GLTFTargetType, BabylonTargetType, Vector3>;
        rotation: IGLTFObjectModelTreeMember<GLTFTargetType, BabylonTargetType, Quaternion>;
        scale: IGLTFObjectModelTreeMember<GLTFTargetType, BabylonTargetType, Vector3>;
        matrix: IGLTFObjectModelTreeMember<GLTFTargetType, BabylonTargetType, Matrix>;
        globalMatrix: IGLTFObjectModelTreeMember<GLTFTargetType, BabylonTargetType, Matrix>;
        weights: {
            length: IGLTFObjectModelTreeMember<GLTFTargetType, BabylonTargetType, number>;
            __array__: { __target__: boolean } & IGLTFObjectModelTreeMember<GLTFTargetType, BabylonTargetType, number>;
        } & IGLTFObjectModelTreeMember<GLTFTargetType, BabylonTargetType, number[]>;
    };
}

export interface IGLTFObjectModelTreeCamerasObject {
    __array__: {
        __target__: boolean;
        orthographic: {
            xmag: IGLTFObjectModelTreeMember<ICamera, ICamera, Nullable<number>>;
            ymag: IGLTFObjectModelTreeMember<ICamera, ICamera, Nullable<number>>;
            zfar: IGLTFObjectModelTreeMember<ICamera, ICamera, number>;
            znear: IGLTFObjectModelTreeMember<ICamera, ICamera, number>;
        };
        perspective: {
            yfov: IGLTFObjectModelTreeMember<ICamera, ICamera, number>;
            zfar: IGLTFObjectModelTreeMember<ICamera, ICamera, number>;
            znear: IGLTFObjectModelTreeMember<ICamera, ICamera, number>;
            aspectRatio: IGLTFObjectModelTreeMember<ICamera, ICamera, Nullable<number>>;
        };
    };
}

export interface IGLTFObjectModelTreeMaterialsObject {
    __array__: {
        __target__: boolean;
        pbrMetallicRoughness: {
            baseColorFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, Color4>;
            metallicFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, Nullable<number>>;
            roughnessFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, Nullable<number>>;
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
        emissiveFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, Color3>;
        normalTexture: {
            scale: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
            extensions: {
                KHR_texture_transform: ITextureDefinition;
            };
        };
        occlusionTexture: {
            strength: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
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
                anisotropyStrength: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                anisotropyRotation: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                anisotropyTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_clearcoat: {
                clearcoatFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                clearcoatRoughnessFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                clearcoatTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
                clearcoatNormalTexture: {
                    scale: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
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
                dispersion: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
            };
            KHR_materials_emissive_strength: {
                emissiveStrength: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
            };
            KHR_materials_ior: {
                ior: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
            };
            KHR_materials_iridescence: {
                iridescenceFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                iridescenceIor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                iridescenceThicknessMinimum: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                iridescenceThicknessMaximum: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
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
                sheenColorFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, Color3>;
                sheenRoughnessFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
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
                specularFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                specularColorFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, Color3>;
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
                transmissionFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                transmissionTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_diffuse_transmission: {
                diffuseTransmissionFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                diffuseTransmissionTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
                diffuseTransmissionColorFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, Nullable<Color3>>;
                diffuseTransmissionColorTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            KHR_materials_volume: {
                thicknessFactor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                attenuationColor: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, Color3>;
                attenuationDistance: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                thicknessTexture: {
                    extensions: {
                        KHR_texture_transform: ITextureDefinition;
                    };
                };
            };
            EXT_lights_ies?: {
                multiplier: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
                color: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, Color3>;
            };
        };
    };
}

interface ITextureDefinition {
    offset: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
    rotation: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
    scale: IGLTFObjectModelTreeMember<IMaterial, PBRMaterial, number>;
}

export interface IGLTFObjectModelTreeMeshesObject {}

export interface IGLTFObjectModelTreeExtensionsObject {
    KHR_lights_punctual: {
        lights: {
            length: IGLTFObjectModelTreeMember<IKHRLightsPunctual_Light[], Light[], number>;
            __array__: {
                __target__: boolean;
                color: IGLTFObjectModelTreeMember<IKHRLightsPunctual_Light, Light, Color3>;
                intensity: IGLTFObjectModelTreeMember<IKHRLightsPunctual_Light, Light, number>;
                range: IGLTFObjectModelTreeMember<IKHRLightsPunctual_Light, Light, number>;
                spot: {
                    innerConeAngle: IGLTFObjectModelTreeMember<IKHRLightsPunctual_Light, Light, number>;
                    outerConeAngle: IGLTFObjectModelTreeMember<IKHRLightsPunctual_Light, Light, number>;
                };
            };
        };
    };
    // EXT_lights_ies: {
    //     lights: {
    //         length: IGLTFObjectModelTreeMember<IKHRLightsPunctual_Light[], Light[], number>;
    //     };
    // };
    EXT_lights_image_based: {
        lights: {
            __array__: {
                __target__: boolean;
                intensity: IGLTFObjectModelTreeMember<IEXTLightsImageBased_LightImageBased, BaseTexture, number>;
                rotation: IGLTFObjectModelTreeMember<IEXTLightsImageBased_LightImageBased, BaseTexture, Quaternion>;
            };
            length: IGLTFObjectModelTreeMember<IEXTLightsImageBased_LightImageBased[], BaseTexture[], number>;
        };
    };
}

/**
 * @internal
 */
export interface IGLTFObjectModelTreeMember<GLTFTargetType = any, BabylonTargetType = any, BabylonValueType = any> {
    /**
     * The number of components that are changed in the property when setting this value.
     * This will usually be 1. But, for example, Babylon has both orthoLeft and orthoRight (two components) properties that are changed when setting xmag (single value in glTF).
     * Defaults to 1 if not provided!
     */
    componentsCount?: number;
    /**
     * The (babylon) type of the property.
     */
    type: string[];
    /**
     * Get the value of the property.
     */
    get: Array<(target: GLTFTargetType, index?: number, payload?: any) => BabylonValueType | undefined>;
    /**
     * Get the target of the property.
     */
    getTarget: Array<(target: GLTFTargetType, index?: number, payload?: any) => BabylonTargetType | undefined>;
    /**
     * is the property readonly?
     */
    isReadOnly?: boolean[];
    /**
     * @deprecated Use get instead
     */
    getPropertyName?: Array<(target: GLTFTargetType) => string>;
    /**
     * Set a new value to the property.
     * @param newValue the new value to set
     * @param target the target object
     * @param index the index of the target object in the array (optional)
     */
    set?: Array<(newValue: BabylonValueType, target: GLTFTargetType, index?: number, payload?: any) => void>;
    /**
     * Interpolation/animation information for the property.
     * This is an array that can be used to animate the value over time.
     */
    interpolation?: AnimationPropertyInfo[];
}

const nodesTree: IGLTFObjectModelTreeNodesObject = {
    length: {
        type: ["number"],
        get: [(nodes: INode[]) => nodes.length],
        getTarget: [(nodes: INode[]) => nodes.map((node) => node._babylonTransformNode!)],
        getPropertyName: [(_nodes: INode[]) => "length"],
    },
    __array__: {
        __target__: true,
        translation: {
            type: ["Vector3"],
            get: [(node: INode) => node._babylonTransformNode?.position],
            set: [(value: Vector3, node: INode) => node._babylonTransformNode?.position.copyFrom(value)],
            getTarget: [(node: INode) => node._babylonTransformNode],
            getPropertyName: [(_node: INode) => "position"],
        },
        rotation: {
            type: ["Quaternion"],
            get: [(node: INode) => node._babylonTransformNode?.rotationQuaternion!],
            set: [(value: Quaternion, node: INode) => node._babylonTransformNode?.rotationQuaternion?.copyFrom(value)],
            getTarget: [(node: INode) => node._babylonTransformNode],
            getPropertyName: [(_node: INode) => "rotationQuaternion"],
        },
        scale: {
            type: ["Vector3"],
            get: [(node: INode) => node._babylonTransformNode?.scaling],
            set: [(value: Vector3, node: INode) => node._babylonTransformNode?.scaling.copyFrom(value)],
            getTarget: [(node: INode) => node._babylonTransformNode],
            getPropertyName: [(_node: INode) => "scaling"],
        },
        weights: {
            length: {
                type: ["number"],
                get: [(node: INode) => node._numMorphTargets],
                getTarget: [(node: INode) => node._babylonTransformNode],
                getPropertyName: [(_node: INode) => "influence"],
            },
            __array__: {
                __target__: true,
                type: ["number"],
                get: [(node: INode, index?: number) => (index !== undefined ? node._primitiveBabylonMeshes?.[0].morphTargetManager?.getTarget(index).influence : undefined)],
                // set: [(value: number, node: INode, index?: number) => node._babylonTransformNode?.getMorphTargetManager()?.getTarget(index)?.setInfluence(value)],
                getTarget: [(node: INode) => node._babylonTransformNode],
                getPropertyName: [(_node: INode) => "influence"],
            },
            type: ["number[]"],
            get: [(node: INode, index?: number) => [0]], // TODO: get the weights correctly
            // set: [(value: number, node: INode, index?: number) => node._babylonTransformNode?.getMorphTargetManager()?.getTarget(index)?.setInfluence(value)],
            getTarget: [(node: INode) => node._babylonTransformNode],
            getPropertyName: [(_node: INode) => "influence"],
        },
        // readonly!
        matrix: {
            type: ["Matrix"],
            get: [(node: INode) => node._babylonTransformNode?.getPoseMatrix()],
            getTarget: [(node: INode) => node._babylonTransformNode],
            getPropertyName: [(_node: INode) => "_poseMatrix"],
            isReadOnly: [true],
        },
        globalMatrix: {
            type: ["Matrix"],
            get: [(node: INode) => node._babylonTransformNode?.getWorldMatrix()],
            getTarget: [(node: INode) => node._babylonTransformNode],
            getPropertyName: [(_node: INode) => "_worldMatrix"],
            isReadOnly: [true],
        },
    },
};

// const animationsTree = {
//     length: {
//         get: (animations: IAnimation[]) => {
//             return animations.length;
//         },
//         getObject(animations: IAnimation[]) {
//             return animations;
//         },
//         getPropertyName(_animations: IAnimation[]) {
//             return "length";
//         },
//     },
//     __array__: {},
// };

const camerasTree: IGLTFObjectModelTreeCamerasObject = {
    __array__: {
        __target__: true,
        orthographic: {
            xmag: {
                componentsCount: 2,
                type: ["number", "number"],
                get: [(camera: ICamera) => camera._babylonCamera?.orthoLeft, (camera: ICamera) => camera._babylonCamera?.orthoRight],
                getTarget: [(camera: ICamera) => camera, (camera: ICamera) => camera],
                set: [
                    (value, camera) => (camera._babylonCamera ? (camera._babylonCamera.orthoLeft = value) : undefined),
                    (value, camera) => (camera._babylonCamera ? (camera._babylonCamera.orthoRight = value) : undefined),
                ],
            },
            ymag: {
                componentsCount: 2,
                type: ["number"],
                get: [(camera: ICamera) => camera._babylonCamera?.orthoBottom, (camera: ICamera) => camera._babylonCamera?.orthoTop],
                getTarget: [(camera: ICamera) => camera, (camera: ICamera) => camera],
                set: [
                    (value, camera) => (camera._babylonCamera ? (camera._babylonCamera.orthoBottom = value) : undefined),
                    (value, camera) => (camera._babylonCamera ? (camera._babylonCamera.orthoTop = value) : undefined),
                ],
            },
            zfar: {
                type: ["number"],
                get: [(camera: ICamera) => camera._babylonCamera?.maxZ],
                getTarget: [(camera: ICamera) => camera],
                set: [(value, camera) => (camera._babylonCamera ? (camera._babylonCamera.maxZ = value) : undefined)],
            },
            znear: {
                type: ["number"],
                get: [(camera: ICamera) => camera._babylonCamera?.minZ],
                getTarget: [(camera: ICamera) => camera],
                set: [(value, camera) => (camera._babylonCamera ? (camera._babylonCamera.minZ = value) : undefined)],
            },
        },
        perspective: {
            aspectRatio: {
                type: ["number"],
                get: [(camera: ICamera) => camera._babylonCamera?.getEngine().getAspectRatio(camera._babylonCamera)],
                getTarget: [(camera: ICamera) => camera],
                isReadOnly: [true], // might not be the case for glTF?
            },
            yfov: {
                type: ["number"],
                get: [(camera: ICamera) => camera._babylonCamera?.fov],
                getTarget: [(camera: ICamera) => camera],
                set: [(value, camera) => (camera._babylonCamera ? (camera._babylonCamera.fov = value) : undefined)],
            },
            zfar: {
                type: ["number"],
                get: [(camera: ICamera) => camera._babylonCamera?.maxZ],
                getTarget: [(camera: ICamera) => camera],
                set: [(value, camera) => (camera._babylonCamera ? (camera._babylonCamera.maxZ = value) : undefined)],
            },
            znear: {
                type: ["number"],
                get: [(camera: ICamera) => camera._babylonCamera?.minZ],
                getTarget: [(camera: ICamera) => camera],
                set: [(value, camera) => (camera._babylonCamera ? (camera._babylonCamera.minZ = value) : undefined)],
            },
        },
    },
};

const materialsTree: IGLTFObjectModelTreeMaterialsObject = {
    __array__: {
        __target__: true,
        emissiveFactor: {
            type: ["Color3"],
            get: [(material, index?, payload?) => getMaterial(material, index, payload).emissiveColor],
            getTarget: [getMaterial],
            set: [(value: Color3, material, index?, payload?) => getMaterial(material, index, payload).emissiveColor.copyFrom(value)],
        },
        emissiveTexture: {
            extensions: {
                KHR_texture_transform: generateTextureMap("emissiveTexture"),
            },
        },
        normalTexture: {
            scale: {
                type: ["number"],
                get: [(material, index?, payload?) => getTexture(material, payload, "bumpTexture")?.level],
                getTarget: [getMaterial],
                set: [(value, material, index?, payload?) => (getTexture(material, payload, "bumpTexture").level = value)],
            },
            extensions: {
                KHR_texture_transform: generateTextureMap("bumpTexture"),
            },
        },
        occlusionTexture: {
            strength: {
                type: ["number"],
                get: [(material, index?, payload?) => getMaterial(material, index, payload).ambientTextureStrength],
                getTarget: [getMaterial],
                set: [(value, material, index?, payload?) => (getMaterial(material, index, payload).ambientTextureStrength = value)],
            },
            extensions: {
                KHR_texture_transform: generateTextureMap("ambientTexture"),
            },
        },
        pbrMetallicRoughness: {
            baseColorFactor: {
                type: ["Color4"],
                // TODO - this should be color4! it is 3 + number
                get: [
                    (material, index?, payload?) => {
                        return Color4.FromColor3(getMaterial(material, index, payload).albedoColor, getMaterial(material, index, payload).alpha);
                    },
                ],
                getTarget: [getMaterial],
                set: [
                    (value, material, index?, payload?) => {
                        getMaterial(material, index, payload).albedoColor.copyFrom(value);
                        getMaterial(material, index, payload).alpha = value.a;
                    },
                ],
            },
            metallicFactor: {
                type: ["number"],
                get: [(material, index?, payload?) => getMaterial(material, index, payload).metallic],
                getTarget: [getMaterial],
                set: [(value, material, index?, payload?) => (getMaterial(material, index, payload).metallic = value)],
            },
            roughnessFactor: {
                type: ["number"],
                get: [(material, index?, payload?) => getMaterial(material, index, payload).roughness],
                getTarget: [getMaterial],
                set: [(value, material, index?, payload?) => (getMaterial(material, index, payload).roughness = value)],
            },
            baseColorTexture: {
                extensions: {
                    KHR_texture_transform: generateTextureMap("albedoTexture"),
                },
            },
            metallicRoughnessTexture: {
                extensions: {
                    KHR_texture_transform: generateTextureMap("metallicTexture"),
                },
            },
        },
        extensions: {
            KHR_materials_anisotropy: {
                anisotropyStrength: {
                    type: ["number"],
                    get: [(material, index?, payload?) => getMaterial(material, index, payload).anisotropy.intensity],
                    getTarget: [getMaterial],
                    set: [(value, material, index?, payload?) => (getMaterial(material, index, payload).anisotropy.intensity = value)],
                },
                anisotropyRotation: {
                    type: ["number"],
                    get: [(material, index?, payload?) => getMaterial(material, index, payload).anisotropy.angle],
                    getTarget: [getMaterial],
                    set: [(value, material, index?, payload?) => (getMaterial(material, index, payload).anisotropy.angle = value)],
                },
                anisotropyTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("anisotropy", "texture"),
                    },
                },
            },
            // EXT_lights_ies: {
            //     multiplier: {
            //         type: ["number"],
            //         get: [(material, index?, payload?) => getMaterial(material, index, payload).light?.intensity],
            //         getTarget: [getMaterial],
            //         set: [(value, material, index?, payload?) => (getMaterial(material, index, payload).light.intensity = value)],
            //     },
            //     color: {
            //         type: ["Color3"],
            //         get: [(material: IMaterial) => material.light?.color],
            //         getTarget: [(material: IMaterial) => material._babylonMaterial],
            //         set: [(value: Color3, material: IMaterial) => (material._babylonMaterial ? (material._babylonMaterial.light.color = value) : undefined)],
            //     },
            // },
            KHR_materials_clearcoat: {
                clearcoatFactor: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).clearCoat.intensity],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).clearCoat.intensity = value)],
                },
                clearcoatRoughnessFactor: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).clearCoat.roughness],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).clearCoat.roughness = value)],
                },
                clearcoatTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("clearCoat", "texture"),
                    },
                },
                clearcoatNormalTexture: {
                    scale: {
                        type: ["number"],
                        get: [(material, index, payload) => getMaterial(material, index, payload).clearCoat.bumpTexture?.level],
                        getTarget: [getMaterial],
                        set: [(value, material, index, payload) => (getMaterial(material, index, payload).clearCoat.bumpTexture!.level = value)],
                    },
                    extensions: {
                        KHR_texture_transform: generateTextureMap("clearCoat", "bumpTexture"),
                    },
                },
                clearcoatRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("clearCoat", "textureRoughness"),
                    },
                },
            },
            KHR_materials_dispersion: {
                dispersion: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).subSurface.dispersion],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).subSurface.dispersion = value)],
                },
            },
            KHR_materials_emissive_strength: {
                emissiveStrength: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).emissiveIntensity],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).emissiveIntensity = value)],
                },
            },
            KHR_materials_ior: {
                ior: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).indexOfRefraction],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).indexOfRefraction = value)],
                },
            },
            KHR_materials_iridescence: {
                iridescenceFactor: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).iridescence.intensity],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).iridescence.intensity = value)],
                },
                iridescenceIor: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).iridescence.indexOfRefraction],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).iridescence.indexOfRefraction = value)],
                },
                iridescenceTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("iridescence", "texture"),
                    },
                },
                iridescenceThicknessMaximum: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).iridescence.maximumThickness],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).iridescence.maximumThickness = value)],
                },
                iridescenceThicknessMinimum: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).iridescence.minimumThickness],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).iridescence.minimumThickness = value)],
                },
                iridescenceThicknessTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("iridescence", "thicknessTexture"),
                    },
                },
            },
            KHR_materials_sheen: {
                sheenColorFactor: {
                    type: ["Color3"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).sheen.color],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => getMaterial(material, index, payload).sheen.color.copyFrom(value)],
                },
                sheenColorTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("sheen", "texture"),
                    },
                },
                sheenRoughnessFactor: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).sheen.intensity],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).sheen.intensity = value)],
                },
                sheenRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("sheen", "thicknessTexture"),
                    },
                },
            },
            KHR_materials_specular: {
                specularFactor: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).metallicF0Factor],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).metallicF0Factor = value)],
                },
                specularColorFactor: {
                    type: ["Color3"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).metallicReflectanceColor],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => getMaterial(material, index, payload).metallicReflectanceColor.copyFrom(value)],
                },
                specularTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("metallicReflectanceTexture"),
                    },
                },
                specularColorTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("reflectanceTexture"),
                    },
                },
            },
            KHR_materials_transmission: {
                transmissionFactor: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).subSurface.refractionIntensity],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).subSurface.refractionIntensity = value)],
                },
                transmissionTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("subSurface", "refractionIntensityTexture"),
                    },
                },
            },
            KHR_materials_diffuse_transmission: {
                diffuseTransmissionFactor: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).subSurface.translucencyIntensity],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).subSurface.translucencyIntensity = value)],
                },
                diffuseTransmissionTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("subSurface", "translucencyIntensityTexture"),
                    },
                },
                diffuseTransmissionColorFactor: {
                    type: ["Color3"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).subSurface.translucencyColor],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => value && getMaterial(material, index, payload).subSurface.translucencyColor?.copyFrom(value)],
                },
                diffuseTransmissionColorTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("subSurface", "translucencyColorTexture"),
                    },
                },
            },
            KHR_materials_volume: {
                attenuationColor: {
                    type: ["Color3"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).subSurface.tintColor],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => getMaterial(material, index, payload).subSurface.tintColor.copyFrom(value)],
                },
                attenuationDistance: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).subSurface.tintColorAtDistance],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).subSurface.tintColorAtDistance = value)],
                },
                thicknessFactor: {
                    type: ["number"],
                    get: [(material, index, payload) => getMaterial(material, index, payload).subSurface.maximumThickness],
                    getTarget: [getMaterial],
                    set: [(value, material, index, payload) => (getMaterial(material, index, payload).subSurface.maximumThickness = value)],
                },
                thicknessTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("subSurface", "thicknessTexture"),
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
                type: ["number"],
                get: [(lights: IKHRLightsPunctual_Light[]) => lights.length],
                getTarget: [(lights: IKHRLightsPunctual_Light[]) => lights.map((light) => light._babylonLight!)],
                getPropertyName: [(_lights: IKHRLightsPunctual_Light[]) => "length"],
            },
            __array__: {
                __target__: true,
                color: {
                    type: ["Color3"],
                    get: [(light: IKHRLightsPunctual_Light) => light._babylonLight?.diffuse],
                    set: [(value: Color3, light: IKHRLightsPunctual_Light) => light._babylonLight?.diffuse.copyFrom(value)],
                    getTarget: [(light: IKHRLightsPunctual_Light) => light._babylonLight],
                    getPropertyName: [(_light: IKHRLightsPunctual_Light) => "diffuse"],
                },
                intensity: {
                    type: ["number"],
                    get: [(light: IKHRLightsPunctual_Light) => light._babylonLight?.intensity],
                    set: [(value: number, light: IKHRLightsPunctual_Light) => (light._babylonLight ? (light._babylonLight.intensity = value) : undefined)],
                    getTarget: [(light: IKHRLightsPunctual_Light) => light._babylonLight],
                    getPropertyName: [(_light: IKHRLightsPunctual_Light) => "intensity"],
                },
                range: {
                    type: ["number"],
                    get: [(light: IKHRLightsPunctual_Light) => light._babylonLight?.range],
                    set: [(value: number, light: IKHRLightsPunctual_Light) => (light._babylonLight ? (light._babylonLight.range = value) : undefined)],
                    getTarget: [(light: IKHRLightsPunctual_Light) => light._babylonLight],
                    getPropertyName: [(_light: IKHRLightsPunctual_Light) => "range"],
                },
                spot: {
                    innerConeAngle: {
                        type: ["number"],
                        get: [(light: IKHRLightsPunctual_Light) => (light._babylonLight as SpotLight)?.innerAngle],
                        set: [(value: number, light: IKHRLightsPunctual_Light) => (light._babylonLight ? ((light._babylonLight as SpotLight).innerAngle = value) : undefined)],
                        getTarget: [(light: IKHRLightsPunctual_Light) => light._babylonLight],
                        getPropertyName: [(_light: IKHRLightsPunctual_Light) => "innerConeAngle"],
                    },
                    outerConeAngle: {
                        type: ["number"],
                        get: [(light: IKHRLightsPunctual_Light) => (light._babylonLight as SpotLight)?.angle],
                        set: [(value: number, light: IKHRLightsPunctual_Light) => (light._babylonLight ? ((light._babylonLight as SpotLight).angle = value) : undefined)],
                        getTarget: [(light: IKHRLightsPunctual_Light) => light._babylonLight],
                        getPropertyName: [(_light: IKHRLightsPunctual_Light) => "outerConeAngle"],
                    },
                },
            },
        },
    },
    // EXT_lights_ies: {
    //     lights: {
    //         length: {
    //             type: ["number"],
    //             get: [(lights: IKHRLightsPunctual_Light[]) => lights.length],
    //             getTarget: [(lights: IKHRLightsPunctual_Light[]) => lights.map((light) => light._babylonLight!)],
    //             getPropertyName: [(_lights: IKHRLightsPunctual_Light[]) => "length"],
    //         },
    //     },
    // },
    EXT_lights_image_based: {
        lights: {
            length: {
                type: ["number"],
                get: [(lights) => lights.length],
                getTarget: [(lights) => lights.map((light) => light._babylonTexture!)],
                getPropertyName: [(_lights) => "length"],
            },
            __array__: {
                __target__: true,
                intensity: {
                    type: ["number"],
                    get: [(light) => light._babylonTexture?.level],
                    set: [
                        (value, light) => {
                            if (light._babylonTexture) light._babylonTexture.level = value;
                        },
                    ],
                    getTarget: [(light) => light._babylonTexture],
                },
                rotation: {
                    type: ["Quaternion"],
                    get: [(light) => light._babylonTexture && Quaternion.FromRotationMatrix(light._babylonTexture?.getReflectionTextureMatrix())],
                    set: [
                        (value, light) => {
                            if (!light._babylonTexture) return;
                            // Invert the rotation so that positive rotation is counter-clockwise.
                            if (!light._babylonTexture.getScene()?.useRightHandedSystem) {
                                value = Quaternion.Inverse(value);
                            }

                            Matrix.FromQuaternionToRef(value, light._babylonTexture.getReflectionTextureMatrix());
                        },
                    ],
                    getTarget: [(light) => light._babylonTexture],
                },
            },
        },
    },
};

function getTexture(material: IMaterial, payload: any, textureType: keyof PBRMaterial, textureInObject?: string) {
    const babylonMaterial = getMaterial(material, payload);
    return textureInObject ? babylonMaterial[textureType][textureInObject] : babylonMaterial[textureType];
}
function getMaterial(material: IMaterial, _index?: number, payload?: any) {
    return material._data?.[payload?.fillMode ?? Constants.MATERIAL_TriangleFillMode]?.babylonMaterial as PBRMaterial;
}
function generateTextureMap(textureType: keyof PBRMaterial, textureInObject?: string): ITextureDefinition {
    return {
        offset: {
            componentsCount: 2,
            // assuming two independent values for u and v, and NOT a Vector2
            type: ["number", "number"],
            get: [
                (material, _index?, payload?) => getTexture(material, payload, textureType, textureInObject)?.uOffset,
                (material, _index?, payload?) => getTexture(material, payload, textureType, textureInObject)?.vOffset,
            ],
            getTarget: [getMaterial, getMaterial],
            set: [
                (value, material, _index?, payload?) => (getTexture(material, payload, textureType, textureInObject).uOffset = value),
                (value, material, _index?, payload?) => (getTexture(material, payload, textureType, textureInObject).vOffset = value),
            ],
        },
        rotation: {
            type: ["number"],
            get: [(material, _index?, payload?) => getTexture(material, payload, textureType, textureInObject)?.wAng],
            getTarget: [getMaterial],
            set: [(value, material, _index?, payload?) => (getTexture(material, payload, textureType, textureInObject).wAng = value)],
        },
        scale: {
            componentsCount: 2,
            type: ["number", "number"],
            get: [
                (material, _index?, payload?) => getTexture(material, payload, textureType, textureInObject)?.uScale,
                (material, _index?, payload?) => getTexture(material, payload, textureType, textureInObject)?.vScale,
            ],
            getTarget: [getMaterial, getMaterial],
            set: [
                (value, material, index?, payload?) => (getTexture(material, payload, textureType, textureInObject).uScale = value),
                (value, material, index?, payload?) => (getTexture(material, payload, textureType, textureInObject).vScale = value),
            ],
        },
    };
}

export const objectModelMapping: IGLTFObjectModelTree = {
    cameras: camerasTree,
    nodes: nodesTree,
    materials: materialsTree,
    extensions: extensionsTree,
    animations: {},
    meshes: {},
};
