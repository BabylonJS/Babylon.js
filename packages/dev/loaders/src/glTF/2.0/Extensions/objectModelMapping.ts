/* eslint-disable @typescript-eslint/naming-convention */

import type { TransformNode } from "core/Meshes/transformNode";
import type { ICamera, IKHRLightsPunctual_Light, IMaterial, INode } from "../glTFLoaderInterfaces";
import type { Vector3 } from "core/Maths/math.vector";
import { Matrix, Quaternion, Vector2 } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
import type { Color3 } from "core/Maths/math.color";
import { Color4 } from "core/Maths/math.color";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Light } from "core/Lights/light";
import type { Nullable } from "core/types";
import type { SpotLight } from "core/Lights/spotLight";
import type { IEXTLightsImageBased_LightImageBased } from "babylonjs-gltf2interface";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IObjectAccessor } from "core/FlowGraph/typeDefinitions";

export interface IGLTFObjectModelTree {
    cameras: IGLTFObjectModelTreeCamerasObject;
    nodes: IGLTFObjectModelTreeNodesObject;
    materials: IGLTFObjectModelTreeMaterialsObject;
    extensions: IGLTFObjectModelTreeExtensionsObject;
    animations: {};
    meshes: {};
}

export interface IGLTFObjectModelTreeNodesObject<GLTFTargetType = INode, BabylonTargetType = TransformNode> {
    length: IObjectAccessor<GLTFTargetType[], BabylonTargetType[], number>;
    __array__: {
        __target__: boolean;
        translation: IObjectAccessor<GLTFTargetType, BabylonTargetType, Vector3>;
        rotation: IObjectAccessor<GLTFTargetType, BabylonTargetType, Quaternion>;
        scale: IObjectAccessor<GLTFTargetType, BabylonTargetType, Vector3>;
        matrix: IObjectAccessor<GLTFTargetType, BabylonTargetType, Matrix>;
        globalMatrix: IObjectAccessor<GLTFTargetType, BabylonTargetType, Matrix>;
        weights: {
            length: IObjectAccessor<GLTFTargetType, BabylonTargetType, number>;
            __array__: { __target__: boolean } & IObjectAccessor<GLTFTargetType, BabylonTargetType, number>;
        } & IObjectAccessor<GLTFTargetType, BabylonTargetType, number[]>;
    };
}

export interface IGLTFObjectModelTreeCamerasObject {
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

export interface IGLTFObjectModelTreeMaterialsObject {
    __array__: {
        __target__: boolean;
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
            EXT_lights_ies?: {
                multiplier: IObjectAccessor<IMaterial, PBRMaterial, number>;
                color: IObjectAccessor<IMaterial, PBRMaterial, Color3>;
            };
        };
    };
}

interface ITextureDefinition {
    offset: IObjectAccessor<IMaterial, PBRMaterial, Vector2>;
    rotation: IObjectAccessor<IMaterial, PBRMaterial, number>;
    scale: IObjectAccessor<IMaterial, PBRMaterial, Vector2>;
}

export interface IGLTFObjectModelTreeMeshesObject {}

export interface IGLTFObjectModelTreeExtensionsObject {
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
    // EXT_lights_ies: {
    //     lights: {
    //         length: IObjectAccessor<IKHRLightsPunctual_Light[], Light[], number>;
    //     };
    // };
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
            length: {
                type: "number",
                get: (node: INode) => node._numMorphTargets,
                getTarget: (node: INode) => node._babylonTransformNode,
                getPropertyName: [() => "influence"],
            },
            __array__: {
                __target__: true,
                type: "number",
                get: (node: INode, index?: number) => (index !== undefined ? node._primitiveBabylonMeshes?.[0].morphTargetManager?.getTarget(index).influence : undefined),
                // set: (value: number, node: INode, index?: number) => node._babylonTransformNode?.getMorphTargetManager()?.getTarget(index)?.setInfluence(value),
                getTarget: (node: INode) => node._babylonTransformNode,
                getPropertyName: [() => "influence"],
            },
            type: "number[]",
            get: (node: INode, index?: number) => [0], // TODO: get the weights correctly
            // set: (value: number, node: INode, index?: number) => node._babylonTransformNode?.getMorphTargetManager()?.getTarget(index)?.setInfluence(value),
            getTarget: (node: INode) => node._babylonTransformNode,
            getPropertyName: [() => "influence"],
        },
        // readonly!
        matrix: {
            type: "Matrix",
            get: (node: INode) => node._babylonTransformNode?.getWorldMatrix(),
            getTarget: (node: INode) => node._babylonTransformNode,
            getPropertyName: [() => "worldMatrix"],
        },
        globalMatrix: {
            type: "Matrix",
            get: (node: INode) => node._babylonTransformNode?.getWorldMatrix(),
            getTarget: (node: INode) => node._babylonTransformNode,
            getPropertyName: [() => "_worldMatrix"],
            isReadOnly: true,
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
    __array__: {
        __target__: true,
        emissiveFactor: {
            type: "Color3",
            get: (material, index?, payload?) => getMaterial(material, index, payload).emissiveColor,
            set: (value: Color3, material, index?, payload?) => getMaterial(material, index, payload).emissiveColor.copyFrom(value),
            getTarget: (material, index?, payload?) => getMaterial(material, index, payload),
            getPropertyName: [() => "emissiveColor"],
        },
        emissiveTexture: {
            extensions: {
                KHR_texture_transform: generateTextureMap("emissiveTexture"),
            },
        },
        normalTexture: {
            scale: {
                type: "number",
                get: (material, index?, payload?) => getTexture(material, payload, "bumpTexture")?.level,
                set: (value: number, material, index?, payload?) => {
                    const texture = getTexture(material, payload, "bumpTexture");
                    if (texture) {
                        texture.level = value;
                    }
                },
                getTarget: (material, index?, payload?) => getMaterial(material, index, payload),
                getPropertyName: [() => "level"],
            },
            extensions: {
                KHR_texture_transform: generateTextureMap("bumpTexture"),
            },
        },
        occlusionTexture: {
            strength: {
                type: "number",
                get: (material, index?, payload?) => getMaterial(material, index, payload).ambientTextureStrength,
                set: (value: number, material, index?, payload?) => {
                    const mat = getMaterial(material, index, payload);
                    if (mat) {
                        mat.ambientTextureStrength = value;
                    }
                },
                getTarget: (material, index?, payload?) => getMaterial(material, index, payload),
                getPropertyName: [() => "ambientTextureStrength"],
            },
            extensions: {
                KHR_texture_transform: generateTextureMap("ambientTexture"),
            },
        },
        pbrMetallicRoughness: {
            baseColorFactor: {
                type: "Color4",
                get: (material, index?, payload?) => {
                    const mat = getMaterial(material, index, payload);
                    return Color4.FromColor3(mat.albedoColor, mat.alpha);
                },
                set: (value: Color4, material, index?, payload?) => {
                    const mat = getMaterial(material, index, payload);
                    mat.albedoColor.set(value.r, value.g, value.b);
                    mat.alpha = value.a;
                },
                getTarget: (material, index?, payload?) => getMaterial(material, index, payload),
                // This is correct on the animation level, but incorrect as a single property of a type Color4
                getPropertyName: [() => "albedoColor", () => "alpha"],
            },
            baseColorTexture: {
                extensions: {
                    KHR_texture_transform: generateTextureMap("albedoTexture"),
                },
            },
            metallicFactor: {
                type: "number",
                get: (material, index?, payload?) => getMaterial(material, index, payload).metallic,
                set: (value, material, index?, payload?) => {
                    const mat = getMaterial(material, index, payload);
                    if (mat) {
                        mat.metallic = value;
                    }
                },
                getTarget: (material, index?, payload?) => getMaterial(material, index, payload),
                getPropertyName: [() => "metallic"],
            },
            roughnessFactor: {
                type: "number",
                get: (material, index?, payload?) => getMaterial(material, index, payload).roughness,
                set: (value, material, index?, payload?) => {
                    const mat = getMaterial(material, index, payload);
                    if (mat) {
                        mat.roughness = value;
                    }
                },
                getTarget: (material, index?, payload?) => getMaterial(material, index, payload),
                getPropertyName: [() => "roughness"],
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
                    type: "number",
                    get: (material, index?, payload?) => getMaterial(material, index, payload).anisotropy.intensity,
                    set: (value: number, material, index?, payload?) => {
                        getMaterial(material, index, payload).anisotropy.intensity = value;
                    },
                    getTarget: (material, index?, payload?) => getMaterial(material, index, payload),
                    getPropertyName: [() => "anisotropy.intensity"],
                },
                anisotropyRotation: {
                    type: "number",
                    get: (material, index?, payload?) => getMaterial(material, index, payload).anisotropy.angle,
                    set: (value: number, material, index?, payload?) => {
                        getMaterial(material, index, payload).anisotropy.angle = value;
                    },
                    getTarget: (material, index?, payload?) => getMaterial(material, index, payload),
                    getPropertyName: [() => "anisotropy.angle"],
                },
                anisotropyTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("anisotropy", "texture"),
                    },
                },
            },
            // EXT_lights_ies: {
            //     multiplier: {
            //         type: "number",
            //         get: (material, index?, payload?) => getMaterial(material, index, payload).light?.intensity],
            //         getTarget: getMaterial,
            //         set: (value, material, index?, payload?) => (getMaterial(material, index, payload).light.intensity = value),
            //     },
            //     color: {
            //         type: "Color3",
            //         get: (material: IMaterial) => material.light?.color],
            //         getTarget: (material: IMaterial) => material._babylonMaterial],
            //         set: (value: Color3, material: IMaterial) => (material._babylonMaterial ? (material._babylonMaterial.light.color = value) : undefined),
            //     },
            // },
            KHR_materials_clearcoat: {
                clearcoatFactor: {
                    type: "number",
                    get: (material, index?, payload?) => getMaterial(material, index, payload).clearCoat.intensity,
                    set: (value, material, index?, payload?) => {
                        getMaterial(material, index, payload).clearCoat.intensity = value;
                    },
                    getTarget: (material, index?, payload?) => getMaterial(material, index, payload),
                    getPropertyName: [() => "clearCoat.intensity"],
                },
                clearcoatRoughnessFactor: {
                    type: "number",
                    get: (material, index?, payload?) => getMaterial(material, index, payload).clearCoat.roughness,
                    set: (value, material, index?, payload?) => {
                        getMaterial(material, index, payload).clearCoat.roughness = value;
                    },
                    getTarget: (material, index?, payload?) => getMaterial(material, index, payload),
                    getPropertyName: [() => "clearCoat.roughness"],
                },
                clearcoatTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("clearCoat", "texture"),
                    },
                },
                clearcoatNormalTexture: {
                    scale: {
                        type: "number",
                        get: (material, index, payload) => getMaterial(material, index, payload).clearCoat.bumpTexture?.level,
                        getTarget: getMaterial,
                        set: (value, material, index, payload) => (getMaterial(material, index, payload).clearCoat.bumpTexture!.level = value),
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
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).subSurface.dispersion,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).subSurface.dispersion = value),
                },
            },
            KHR_materials_emissive_strength: {
                emissiveStrength: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).emissiveIntensity,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).emissiveIntensity = value),
                },
            },
            KHR_materials_ior: {
                ior: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).indexOfRefraction,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).indexOfRefraction = value),
                },
            },
            KHR_materials_iridescence: {
                iridescenceFactor: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).iridescence.intensity,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).iridescence.intensity = value),
                },
                iridescenceIor: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).iridescence.indexOfRefraction,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).iridescence.indexOfRefraction = value),
                },
                iridescenceTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("iridescence", "texture"),
                    },
                },
                iridescenceThicknessMaximum: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).iridescence.maximumThickness,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).iridescence.maximumThickness = value),
                },
                iridescenceThicknessMinimum: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).iridescence.minimumThickness,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).iridescence.minimumThickness = value),
                },
                iridescenceThicknessTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("iridescence", "thicknessTexture"),
                    },
                },
            },
            KHR_materials_sheen: {
                sheenColorFactor: {
                    type: "Color3",
                    get: (material, index, payload) => getMaterial(material, index, payload).sheen.color,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => getMaterial(material, index, payload).sheen.color.copyFrom(value),
                },
                sheenColorTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("sheen", "texture"),
                    },
                },
                sheenRoughnessFactor: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).sheen.intensity,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).sheen.intensity = value),
                },
                sheenRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("sheen", "thicknessTexture"),
                    },
                },
            },
            KHR_materials_specular: {
                specularFactor: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).metallicF0Factor,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).metallicF0Factor = value),
                    getPropertyName: [() => "metallicF0Factor"],
                },
                specularColorFactor: {
                    type: "Color3",
                    get: (material, index, payload) => getMaterial(material, index, payload).metallicReflectanceColor,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => getMaterial(material, index, payload).metallicReflectanceColor.copyFrom(value),
                    getPropertyName: [() => "metallicReflectanceColor"],
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
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).subSurface.refractionIntensity,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).subSurface.refractionIntensity = value),
                    getPropertyName: [() => "subSurface.refractionIntensity"],
                },
                transmissionTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("subSurface", "refractionIntensityTexture"),
                    },
                },
            },
            KHR_materials_diffuse_transmission: {
                diffuseTransmissionFactor: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).subSurface.translucencyIntensity,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).subSurface.translucencyIntensity = value),
                },
                diffuseTransmissionTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("subSurface", "translucencyIntensityTexture"),
                    },
                },
                diffuseTransmissionColorFactor: {
                    type: "Color3",
                    get: (material, index, payload) => getMaterial(material, index, payload).subSurface.translucencyColor,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => value && getMaterial(material, index, payload).subSurface.translucencyColor?.copyFrom(value),
                },
                diffuseTransmissionColorTexture: {
                    extensions: {
                        KHR_texture_transform: generateTextureMap("subSurface", "translucencyColorTexture"),
                    },
                },
            },
            KHR_materials_volume: {
                attenuationColor: {
                    type: "Color3",
                    get: (material, index, payload) => getMaterial(material, index, payload).subSurface.tintColor,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => getMaterial(material, index, payload).subSurface.tintColor.copyFrom(value),
                },
                attenuationDistance: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).subSurface.tintColorAtDistance,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).subSurface.tintColorAtDistance = value),
                },
                thicknessFactor: {
                    type: "number",
                    get: (material, index, payload) => getMaterial(material, index, payload).subSurface.maximumThickness,
                    getTarget: getMaterial,
                    set: (value, material, index, payload) => (getMaterial(material, index, payload).subSurface.maximumThickness = value),
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
    // EXT_lights_ies: {
    //     lights: {
    //         length: {
    //             type: "number",
    //             get: (lights: IKHRLightsPunctual_Light[]) => lights.length,
    //             getTarget: (lights: IKHRLightsPunctual_Light[]) => lights.map((light) => light._babylonLight!),
    //             getPropertyName: [(_lights: IKHRLightsPunctual_Light[]) => "length"],
    //         },
    //     },
    // },
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
                        if (light._babylonTexture) light._babylonTexture.level = value;
                    },

                    getTarget: (light) => light._babylonTexture,
                },
                rotation: {
                    type: "Quaternion",
                    get: (light) => light._babylonTexture && Quaternion.FromRotationMatrix(light._babylonTexture?.getReflectionTextureMatrix()),
                    set: (value, light) => {
                        if (!light._babylonTexture) return;
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
            type: "Vector2",
            get: (material, _index?, payload?) => {
                const texture = getTexture(material, payload, textureType, textureInObject);
                return new Vector2(texture?.uOffset, texture?.vOffset);
            },
            getTarget: getMaterial,
            set: (value, material, _index?, payload?) => {
                const texture = getTexture(material, payload, textureType, textureInObject);
                (texture.uOffset = value.x), (texture.vOffset = value.y);
            },
            getPropertyName: [() => `${textureType}.${textureInObject}.uOffset`, () => `${textureType}.${textureInObject}.vOffset`],
        },
        rotation: {
            type: "number",
            get: (material, _index?, payload?) => getTexture(material, payload, textureType, textureInObject)?.wAng,
            getTarget: getMaterial,
            set: (value, material, _index?, payload?) => (getTexture(material, payload, textureType, textureInObject).wAng = value),
            getPropertyName: [() => `${textureType}.${textureInObject}.wAng`],
        },
        scale: {
            componentsCount: 2,
            type: "Vector2",
            get: (material, _index?, payload?) => {
                const texture = getTexture(material, payload, textureType, textureInObject);
                return new Vector2(texture?.uScale, texture?.vScale);
            },
            getTarget: getMaterial,
            set: (value, material, index?, payload?) => {
                const texture = getTexture(material, payload, textureType, textureInObject);
                (texture.uScale = value.x), (texture.vScale = value.y);
            },
            getPropertyName: [() => `${textureType}.${textureInObject}.uScale`, () => `${textureType}.${textureInObject}.vScale`],
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
