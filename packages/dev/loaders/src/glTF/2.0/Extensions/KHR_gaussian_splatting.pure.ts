import { type Nullable } from "core/types";
import { type AbstractMesh } from "core/Meshes/abstractMesh.pure";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh.pure";
import { AllocateShBuffers } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase.pure";

import { MeshPrimitiveMode, type IKHRGaussianSplatting } from "babylonjs-gltf2interface";
import { type IMeshPrimitive, type INode, type IMesh, type IAccessor } from "../glTFLoaderInterfaces";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader.pure";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_gaussian_splatting";

// Zeroth-order spherical harmonics coefficient used to reconstruct a base color from the SH DC term.
const ShC0 = 0.28209479177387814;

// Attribute semantics defined by the KHR_gaussian_splatting ellipse kernel.
const RotationAttribute = "KHR_gaussian_splatting:ROTATION";
const ScaleAttribute = "KHR_gaussian_splatting:SCALE";
const OpacityAttribute = "KHR_gaussian_splatting:OPACITY";
const ShDegree0Attribute = "KHR_gaussian_splatting:SH_DEGREE_0_COEF_0";

// Number of spherical harmonics coefficients (VEC3) for each degree beyond the DC term.
const ShCoefficientCountPerDegree = [0, 3, 5, 7];

function Clamp255(value: number): number {
    return value <= 0 ? 0 : value >= 255 ? 255 : (value + 0.5) | 0;
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_gaussian_splatting/README.md)
 * Loads a mesh primitive tagged with KHR_gaussian_splatting as a {@link GaussianSplattingMesh}.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_gaussian_splatting implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose(): void {
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
    public _loadMeshPrimitiveAsync(
        context: string,
        name: string,
        node: INode,
        mesh: IMesh,
        primitive: IMeshPrimitive,
        assign: (babylonMesh: AbstractMesh) => void
    ): Nullable<Promise<AbstractMesh>> {
        return GLTFLoader.LoadExtensionAsync<IKHRGaussianSplatting, AbstractMesh>(context, primitive, this.name, async (extensionContext) => {
            if (primitive.mode != undefined && primitive.mode !== MeshPrimitiveMode.POINTS) {
                throw new Error(`${extensionContext}: Gaussian splatting primitives must use POINTS mode`);
            }

            const loader = this._loader;

            const loadAttribute = (attributeName: string): Nullable<Promise<Float32Array>> => {
                const accessorIndex = primitive.attributes[attributeName];
                if (accessorIndex == undefined) {
                    return null;
                }
                const accessor = ArrayItem.Get(`${context}/attributes/${attributeName}`, loader.gltf.accessors, accessorIndex) as IAccessor;
                return loader._loadFloatAccessorAsync(`/accessors/${accessor.index}`, accessor);
            };

            const positionsPromise = loadAttribute("POSITION");
            if (!positionsPromise) {
                throw new Error(`${extensionContext}: Gaussian splatting primitive is missing the POSITION attribute`);
            }

            // Determine which spherical harmonics degrees are present (all lower degrees must exist per spec).
            let shDegree = 0;
            const shAttributeNames: string[] = [];
            for (let degree = 1; degree <= 3; degree++) {
                if (primitive.attributes[`KHR_gaussian_splatting:SH_DEGREE_${degree}_COEF_0`] == undefined) {
                    break;
                }
                shDegree = degree;
                for (let coef = 0; coef < ShCoefficientCountPerDegree[degree]; coef++) {
                    shAttributeNames.push(`KHR_gaussian_splatting:SH_DEGREE_${degree}_COEF_${coef}`);
                }
            }

            // Create the Gaussian Splatting mesh and assign it to the node synchronously (before awaiting the
            // attribute data). The base loader wires the node's transform node from this assign call
            // synchronously, so it must happen before the first await. The splat data is uploaded afterwards.
            const scene = loader.babylonScene;
            scene._blockEntityCollection = !!loader._assetContainer;
            const gaussianSplattingMesh = new GaussianSplattingMesh(name, null, scene);
            gaussianSplattingMesh._parentContainer = loader._assetContainer;
            scene._blockEntityCollection = false;

            GLTFLoader.AddPointerMetadata(gaussianSplattingMesh, context);
            loader.parent.onMeshLoadedObservable.notifyObservers(gaussianSplattingMesh);
            assign(gaussianSplattingMesh);

            const engineCaps = scene.getEngine().getCaps();

            const [positions, rotations, scales, opacities, shDegree0, colors, ...shHigherDegrees] = await Promise.all([
                positionsPromise,
                loadAttribute(RotationAttribute),
                loadAttribute(ScaleAttribute),
                loadAttribute(OpacityAttribute),
                loadAttribute(ShDegree0Attribute),
                loadAttribute("COLOR_0"),
                ...shAttributeNames.map((attributeName): Nullable<Promise<Float32Array>> => loadAttribute(attributeName)),
            ]);

            const splatCount = positions.length / 3;
            const colorStride = colors ? colors.length / splatCount : 0;

            const rowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // 32 bytes: position(12) scale(12) color RGBA(4) quaternion wxyz(4)
            const buffer = new ArrayBuffer(rowOutputLength * splatCount);
            const floatView = new Float32Array(buffer);
            const byteView = new Uint8Array(buffer);

            // Build spherical harmonics texture buffers for degrees above 0.
            let shBuffers: Nullable<Uint8Array[]> = null;
            if (shDegree > 0) {
                const shVectorCount = (shDegree + 1) * (shDegree + 1) - 1;
                const shComponentCount = shVectorCount * 3;
                const textureCount = Math.ceil(shComponentCount / 16);
                const width = engineCaps.maxTextureSize;
                const height = Math.ceil(splatCount / width);
                shBuffers = AllocateShBuffers(textureCount, height * width * 4 * 4);
            }

            for (let i = 0; i < splatCount; i++) {
                const floatBase = i * 8;
                const byteBase = i * 32;
                const p = i * 3;

                // Position (float32 x3, bytes 0-11)
                floatView[floatBase + 0] = positions[p + 0];
                floatView[floatBase + 1] = positions[p + 1];
                floatView[floatBase + 2] = positions[p + 2];

                // Scale (float32 x3, bytes 12-23) — glTF stores linear scale directly.
                floatView[floatBase + 3] = scales ? scales[p + 0] : 1;
                floatView[floatBase + 4] = scales ? scales[p + 1] : 1;
                floatView[floatBase + 5] = scales ? scales[p + 2] : 1;

                // Color RGB (uint8 x3, bytes 24-26) — reconstructed from the SH DC term, or COLOR_0 as a fallback.
                if (shDegree0) {
                    byteView[byteBase + 24] = Clamp255((0.5 + ShC0 * shDegree0[p + 0]) * 255);
                    byteView[byteBase + 25] = Clamp255((0.5 + ShC0 * shDegree0[p + 1]) * 255);
                    byteView[byteBase + 26] = Clamp255((0.5 + ShC0 * shDegree0[p + 2]) * 255);
                } else if (colors) {
                    const c = i * colorStride;
                    byteView[byteBase + 24] = Clamp255(colors[c + 0] * 255);
                    byteView[byteBase + 25] = Clamp255(colors[c + 1] * 255);
                    byteView[byteBase + 26] = Clamp255(colors[c + 2] * 255);
                } else {
                    byteView[byteBase + 24] = 255;
                    byteView[byteBase + 25] = 255;
                    byteView[byteBase + 26] = 255;
                }

                // Alpha (uint8, byte 27) — opacity is a normalized linear value per spec.
                if (opacities) {
                    byteView[byteBase + 27] = Clamp255(opacities[i] * 255);
                } else if (colors && colorStride >= 4) {
                    byteView[byteBase + 27] = Clamp255(colors[i * colorStride + 3] * 255);
                } else {
                    byteView[byteBase + 27] = 255;
                }

                // Quaternion (uint8 x4, bytes 28-31) stored as wxyz encoded as q * 127.5 + 127.5. glTF stores xyzw.
                const r = i * 4;
                const qx = rotations ? rotations[r + 0] : 0;
                const qy = rotations ? rotations[r + 1] : 0;
                const qz = rotations ? rotations[r + 2] : 0;
                const qw = rotations ? rotations[r + 3] : 1;
                byteView[byteBase + 28] = Clamp255(qw * 127.5 + 127.5);
                byteView[byteBase + 29] = Clamp255(qx * 127.5 + 127.5);
                byteView[byteBase + 30] = Clamp255(qy * 127.5 + 127.5);
                byteView[byteBase + 31] = Clamp255(qz * 127.5 + 127.5);

                // Spherical harmonics (coefficient-major, channel-minor) encoded as coeff * 128 + 128.
                if (shBuffers) {
                    const offsetPerSplat = i * 16;
                    for (let coef = 0; coef < shHigherDegrees.length; coef++) {
                        const coefData = shHigherDegrees[coef];
                        if (!coefData) {
                            continue;
                        }
                        for (let channel = 0; channel < 3; channel++) {
                            const flatIndex = coef * 3 + channel;
                            const textureIndex = flatIndex >> 4; // Math.floor(flatIndex / 16)
                            const byteIndexInTexture = flatIndex & 15; // flatIndex % 16
                            shBuffers[textureIndex][offsetPerSplat + byteIndexInTexture] = Clamp255(coefData[p + channel] * 128 + 128);
                        }
                    }
                }
            }

            await gaussianSplattingMesh.updateDataAsync(buffer, shBuffers ?? undefined, undefined, shDegree || undefined);

            return gaussianSplattingMesh;
        });
    }
}

let _Registered = false;
/**
 * Registers the KHR_gaussian_splatting glTF loader extension.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_gaussian_splatting(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, true, (loader) => new KHR_gaussian_splatting(loader));
}
