/* eslint-disable @typescript-eslint/naming-convention */

import type { TransformNode } from "core/Meshes/transformNode";
import type { IAnimation, ICamera, IGLTF, IKHRLightsPunctual_Light, IMaterial, IMesh, INode } from "../glTFLoaderInterfaces";
import type { Vector3 } from "core/Maths/math.vector";
import { Matrix, Quaternion, Vector2 } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
import type { Color3 } from "core/Maths/math.color";
import { Color4 } from "core/Maths/math.color";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Light } from "core/Lights/light";
import type { Nullable } from "core/types";
import { SpotLight } from "core/Lights/spotLight";
import type { IEXTLightsImageBased_LightImageBased } from "babylonjs-gltf2interface";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IInterpolationPropertyInfo, IObjectAccessor } from "core/FlowGraph/typeDefinitions";
import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import type { AnimationGroup } from "core/Animations/animationGroup";
import type { Mesh } from "core/Meshes/mesh";

export interface IGLTFObjectModelTree {
    cameras: IGLTFObjectModelTreeCamerasObject;
    nodes: IGLTFObjectModelTreeNodesObject;
    materials: IGLTFObjectModelTreeMaterialsObject;
    extensions: IGLTFObjectModelTreeExtensionsObject;
    animations: {
        length: IObjectAccessor<IAnimation[], AnimationGroup[], number>;
        __array__: {};
    };
    meshes: {
        length: IObjectAccessor<IMesh[], (Mesh | undefined)[], number>;
        __array__: {};
    };
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
        extensions: {
            EXT_lights_ies?: {
                multiplier: IObjectAccessor<INode, Light, number>;
                color: IObjectAccessor<INode, Light, Color3>;
            };
        };
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
    EXT_lights_ies: {
        lights: {
            length: IObjectAccessor<IKHRLightsPunctual_Light[], Light[], number>;
        };
    };
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
    __array__: {},
};

const meshesTree = {
    length: {
        type: "number",
        get: (meshes: IMesh[]) => meshes.length,
        getTarget: (meshes: IMesh[]) => meshes.map((mesh) => mesh.primitives[0]._instanceData?.babylonSourceMesh),
        getPropertyName: [() => "length"],
    },
    __array__: {},
};

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
            get: (material, index?, payload?) => _GetMaterial(material, index, payload).emissiveColor,
            set: (value: Color3, material, index?, payload?) => _GetMaterial(material, index, payload).emissiveColor.copyFrom(value),
            getTarget: (material, index?, payload?) => _GetMaterial(material, index, payload),
            getPropertyName: [() => "emissiveColor"],
        },
        emissiveTexture: {
            extensions: {
                KHR_texture_transform: _GenerateTextureMap("emissiveTexture"),
            },
        },
        normalTexture: {
            scale: {
                type: "number",
                get: (material, index?, payload?) => _GetTexture(material, payload, "bumpTexture")?.level,
                set: (value: number, material, index?, payload?) => {
                    const texture = _GetTexture(material, payload, "bumpTexture");
                    if (texture) {
                        texture.level = value;
                    }
                },
                getTarget: (material, index?, payload?) => _GetMaterial(material, index, payload),
                getPropertyName: [() => "level"],
            },
            extensions: {
                KHR_texture_transform: _GenerateTextureMap("bumpTexture"),
            },
        },
        occlusionTexture: {
            strength: {
                type: "number",
                get: (material, index?, payload?) => _GetMaterial(material, index, payload).ambientTextureStrength,
                set: (value: number, material, index?, payload?) => {
                    const mat = _GetMaterial(material, index, payload);
                    if (mat) {
                        mat.ambientTextureStrength = value;
                    }
                },
                getTarget: (material, index?, payload?) => _GetMaterial(material, index, payload),
                getPropertyName: [() => "ambientTextureStrength"],
            },
            extensions: {
                KHR_texture_transform: _GenerateTextureMap("ambientTexture"),
            },
        },
        pbrMetallicRoughness: {
            baseColorFactor: {
                type: "Color4",
                get: (material, index?, payload?) => {
                    const mat = _GetMaterial(material, index, payload);
                    return Color4.FromColor3(mat.albedoColor, mat.alpha);
                },
                set: (value: Color4, material, index?, payload?) => {
                    const mat = _GetMaterial(material, index, payload);
                    mat.albedoColor.set(value.r, value.g, value.b);
                    mat.alpha = value.a;
                },
                getTarget: (material, index?, payload?) => _GetMaterial(material, index, payload),
                // This is correct on the animation level, but incorrect as a single property of a type Color4
                getPropertyName: [() => "albedoColor", () => "alpha"],
            },
            baseColorTexture: {
                extensions: {
                    KHR_texture_transform: _GenerateTextureMap("albedoTexture"),
                },
            },
            metallicFactor: {
                type: "number",
                get: (material, index?, payload?) => _GetMaterial(material, index, payload).metallic,
                set: (value, material, index?, payload?) => {
                    const mat = _GetMaterial(material, index, payload);
                    if (mat) {
                        mat.metallic = value;
                    }
                },
                getTarget: (material, index?, payload?) => _GetMaterial(material, index, payload),
                getPropertyName: [() => "metallic"],
            },
            roughnessFactor: {
                type: "number",
                get: (material, index?, payload?) => _GetMaterial(material, index, payload).roughness,
                set: (value, material, index?, payload?) => {
                    const mat = _GetMaterial(material, index, payload);
                    if (mat) {
                        mat.roughness = value;
                    }
                },
                getTarget: (material, index?, payload?) => _GetMaterial(material, index, payload),
                getPropertyName: [() => "roughness"],
            },
            metallicRoughnessTexture: {
                extensions: {
                    KHR_texture_transform: _GenerateTextureMap("metallicTexture"),
                },
            },
        },
        extensions: {
            KHR_materials_anisotropy: {
                anisotropyStrength: {
                    type: "number",
                    get: (material, index?, payload?) => _GetMaterial(material, index, payload).anisotropy.intensity,
                    set: (value: number, material, index?, payload?) => {
                        _GetMaterial(material, index, payload).anisotropy.intensity = value;
                    },
                    getTarget: (material, index?, payload?) => _GetMaterial(material, index, payload),
                    getPropertyName: [() => "anisotropy.intensity"],
                },
                anisotropyRotation: {
                    type: "number",
                    get: (material, index?, payload?) => _GetMaterial(material, index, payload).anisotropy.angle,
                    set: (value: number, material, index?, payload?) => {
                        _GetMaterial(material, index, payload).anisotropy.angle = value;
                    },
                    getTarget: (material, index?, payload?) => _GetMaterial(material, index, payload),
                    getPropertyName: [() => "anisotropy.angle"],
                },
                anisotropyTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("anisotropy", "texture"),
                    },
                },
            },
            KHR_materials_clearcoat: {
                clearcoatFactor: {
                    type: "number",
                    get: (material, index?, payload?) => _GetMaterial(material, index, payload).clearCoat.intensity,
                    set: (value, material, index?, payload?) => {
                        _GetMaterial(material, index, payload).clearCoat.intensity = value;
                    },
                    getTarget: (material, index?, payload?) => _GetMaterial(material, index, payload),
                    getPropertyName: [() => "clearCoat.intensity"],
                },
                clearcoatRoughnessFactor: {
                    type: "number",
                    get: (material, index?, payload?) => _GetMaterial(material, index, payload).clearCoat.roughness,
                    set: (value, material, index?, payload?) => {
                        _GetMaterial(material, index, payload).clearCoat.roughness = value;
                    },
                    getTarget: (material, index?, payload?) => _GetMaterial(material, index, payload),
                    getPropertyName: [() => "clearCoat.roughness"],
                },
                clearcoatTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("clearCoat", "texture"),
                    },
                },
                clearcoatNormalTexture: {
                    scale: {
                        type: "number",
                        get: (material, index, payload) => _GetMaterial(material, index, payload).clearCoat.bumpTexture?.level,
                        getTarget: _GetMaterial,
                        set: (value, material, index, payload) => (_GetMaterial(material, index, payload).clearCoat.bumpTexture!.level = value),
                    },
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("clearCoat", "bumpTexture"),
                    },
                },
                clearcoatRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("clearCoat", "textureRoughness"),
                    },
                },
            },
            KHR_materials_dispersion: {
                dispersion: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).subSurface.dispersion,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).subSurface.dispersion = value),
                },
            },
            KHR_materials_emissive_strength: {
                emissiveStrength: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).emissiveIntensity,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).emissiveIntensity = value),
                },
            },
            KHR_materials_ior: {
                ior: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).indexOfRefraction,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).indexOfRefraction = value),
                },
            },
            KHR_materials_iridescence: {
                iridescenceFactor: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).iridescence.intensity,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).iridescence.intensity = value),
                },
                iridescenceIor: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).iridescence.indexOfRefraction,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).iridescence.indexOfRefraction = value),
                },
                iridescenceTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("iridescence", "texture"),
                    },
                },
                iridescenceThicknessMaximum: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).iridescence.maximumThickness,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).iridescence.maximumThickness = value),
                },
                iridescenceThicknessMinimum: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).iridescence.minimumThickness,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).iridescence.minimumThickness = value),
                },
                iridescenceThicknessTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("iridescence", "thicknessTexture"),
                    },
                },
            },
            KHR_materials_sheen: {
                sheenColorFactor: {
                    type: "Color3",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).sheen.color,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => _GetMaterial(material, index, payload).sheen.color.copyFrom(value),
                },
                sheenColorTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("sheen", "texture"),
                    },
                },
                sheenRoughnessFactor: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).sheen.intensity,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).sheen.intensity = value),
                },
                sheenRoughnessTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("sheen", "thicknessTexture"),
                    },
                },
            },
            KHR_materials_specular: {
                specularFactor: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).metallicF0Factor,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).metallicF0Factor = value),
                    getPropertyName: [() => "metallicF0Factor"],
                },
                specularColorFactor: {
                    type: "Color3",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).metallicReflectanceColor,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => _GetMaterial(material, index, payload).metallicReflectanceColor.copyFrom(value),
                    getPropertyName: [() => "metallicReflectanceColor"],
                },
                specularTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("metallicReflectanceTexture"),
                    },
                },
                specularColorTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("reflectanceTexture"),
                    },
                },
            },
            KHR_materials_transmission: {
                transmissionFactor: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).subSurface.refractionIntensity,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).subSurface.refractionIntensity = value),
                    getPropertyName: [() => "subSurface.refractionIntensity"],
                },
                transmissionTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("subSurface", "refractionIntensityTexture"),
                    },
                },
            },
            KHR_materials_diffuse_transmission: {
                diffuseTransmissionFactor: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).subSurface.translucencyIntensity,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).subSurface.translucencyIntensity = value),
                },
                diffuseTransmissionTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("subSurface", "translucencyIntensityTexture"),
                    },
                },
                diffuseTransmissionColorFactor: {
                    type: "Color3",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).subSurface.translucencyColor,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => value && _GetMaterial(material, index, payload).subSurface.translucencyColor?.copyFrom(value),
                },
                diffuseTransmissionColorTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("subSurface", "translucencyColorTexture"),
                    },
                },
            },
            KHR_materials_volume: {
                attenuationColor: {
                    type: "Color3",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).subSurface.tintColor,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => _GetMaterial(material, index, payload).subSurface.tintColor.copyFrom(value),
                },
                attenuationDistance: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).subSurface.tintColorAtDistance,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).subSurface.tintColorAtDistance = value),
                },
                thicknessFactor: {
                    type: "number",
                    get: (material, index, payload) => _GetMaterial(material, index, payload).subSurface.maximumThickness,
                    getTarget: _GetMaterial,
                    set: (value, material, index, payload) => (_GetMaterial(material, index, payload).subSurface.maximumThickness = value),
                },
                thicknessTexture: {
                    extensions: {
                        KHR_texture_transform: _GenerateTextureMap("subSurface", "thicknessTexture"),
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

function _GetTexture(material: IMaterial, payload: any, textureType: keyof PBRMaterial, textureInObject?: string) {
    const babylonMaterial = _GetMaterial(material, payload);
    return textureInObject ? babylonMaterial[textureType][textureInObject] : babylonMaterial[textureType];
}
function _GetMaterial(material: IMaterial, _index?: number, payload?: any) {
    return material._data?.[payload?.fillMode ?? Constants.MATERIAL_TriangleFillMode]?.babylonMaterial as PBRMaterial;
}
function _GenerateTextureMap(textureType: keyof PBRMaterial, textureInObject?: string): ITextureDefinition {
    return {
        offset: {
            componentsCount: 2,
            // assuming two independent values for u and v, and NOT a Vector2
            type: "Vector2",
            get: (material, _index?, payload?) => {
                const texture = _GetTexture(material, payload, textureType, textureInObject);
                return new Vector2(texture?.uOffset, texture?.vOffset);
            },
            getTarget: _GetMaterial,
            set: (value, material, _index?, payload?) => {
                const texture = _GetTexture(material, payload, textureType, textureInObject);
                (texture.uOffset = value.x), (texture.vOffset = value.y);
            },
            getPropertyName: [
                () => `${textureType}${textureInObject ? "." + textureInObject : ""}.uOffset`,
                () => `${textureType}${textureInObject ? "." + textureInObject : ""}.vOffset`,
            ],
        },
        rotation: {
            type: "number",
            get: (material, _index?, payload?) => _GetTexture(material, payload, textureType, textureInObject)?.wAng,
            getTarget: _GetMaterial,
            set: (value, material, _index?, payload?) => (_GetTexture(material, payload, textureType, textureInObject).wAng = value),
            getPropertyName: [() => `${textureType}${textureInObject ? "." + textureInObject : ""}.wAng`],
        },
        scale: {
            componentsCount: 2,
            type: "Vector2",
            get: (material, _index?, payload?) => {
                const texture = _GetTexture(material, payload, textureType, textureInObject);
                return new Vector2(texture?.uScale, texture?.vScale);
            },
            getTarget: _GetMaterial,
            set: (value, material, index?, payload?) => {
                const texture = _GetTexture(material, payload, textureType, textureInObject);
                (texture.uScale = value.x), (texture.vScale = value.y);
            },
            getPropertyName: [
                () => `${textureType}${textureInObject ? "." + textureInObject : ""}.uScale`,
                () => `${textureType}${textureInObject ? "." + textureInObject : ""}.vScale`,
            ],
        },
    };
}

const objectModelMapping: IGLTFObjectModelTree = {
    cameras: camerasTree,
    nodes: nodesTree,
    materials: materialsTree,
    extensions: extensionsTree,
    animations: animationsTree,
    meshes: meshesTree,
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
