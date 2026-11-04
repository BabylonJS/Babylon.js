import { type Nullable } from "core/types";
import { type AbstractMesh } from "core/Meshes/abstractMesh.pure";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh.pure";
import { RegisterThinInstanceMesh } from "core/Meshes/thinInstanceMesh.pure";
import { type GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";

import { MeshPrimitiveMode } from "babylonjs-gltf2interface";
import { type IMeshPrimitive, type INode, type IMesh, type IBufferView } from "../glTFLoaderInterfaces";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader.pure";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { ConvertSpzToSplatAsync, DefaultSpzLibraryUrl, GetSpzModule, ParseSpz } from "../../../SPLAT/spz";
import { Mode, type IParsedSplat } from "../../../SPLAT/splatDefs";

const NAME = "KHR_gaussian_splatting_compression_spz_2";
const LEGACY_NAME = "KHR_gaussian_splatting_compression_spz";
const PARENT_NAME = "KHR_gaussian_splatting";

interface ISpzCompressionExtension {
    bufferView: number;
}

/**
 * Whether a spherical harmonics coefficient changes sign when x and z are negated (a 180 degree rotation around Y).
 * Real SH of band l and order m are P_l^|m|(z) times cos(m phi) (m >= 0) or sin(|m| phi) (m < 0); negating x and z
 * multiplies them by (-1)^l when m >= 0 and by (-1)^(l+1) when m < 0.
 * @param coefficientIndex Index of the coefficient in storage order, excluding the DC term (0 is l=1, m=-1)
 * @returns true if the coefficient must be negated
 */
function ShCoefficientFlipsOnXZNegation(coefficientIndex: number): boolean {
    const l = Math.floor(Math.sqrt(coefficientIndex + 1));
    const m = coefficientIndex + 1 - l * l - l;
    return m < 0 ? l % 2 === 0 : l % 2 === 1;
}

/**
 * Converts packed splat data from the SPZ coordinate system (RUB) to the glTF one (LUF), in place.
 * This rotates the data by 180 degrees around the Y axis: x and z are negated.
 * @param data Packed splats (32 bytes per splat: position, scale, color, quaternion wxyz)
 * @param sh Spherical harmonics textures (16 bytes per splat in each texture), if any
 * @param shDegree Spherical harmonics degree of `sh`
 * @internal
 */
export function _ConvertSpzRubToLuf(data: ArrayBuffer, sh: Nullable<Uint8Array[]> | undefined, shDegree: number): void {
    const splatCount = data.byteLength / 32;
    const floatView = new Float32Array(data);
    const byteView = new Uint8Array(data);

    for (let i = 0; i < splatCount; i++) {
        const floatBase = i * 8;
        const byteBase = i * 32;
        floatView[floatBase + 0] = -floatView[floatBase + 0];
        floatView[floatBase + 2] = -floatView[floatBase + 2];
        // Quaternion bytes are wxyz encoded as q * 127.5 + 127.5, so negating a component maps b to 255 - b.
        byteView[byteBase + 29] = 255 - byteView[byteBase + 29];
        byteView[byteBase + 31] = 255 - byteView[byteBase + 31];
    }

    if (!sh || shDegree <= 0) {
        return;
    }

    const coefficientCount = (shDegree + 1) * (shDegree + 1) - 1;
    for (let coef = 0; coef < coefficientCount; coef++) {
        if (!ShCoefficientFlipsOnXZNegation(coef)) {
            continue;
        }
        for (let channel = 0; channel < 3; channel++) {
            const flatIndex = coef * 3 + channel;
            const texture = sh[flatIndex >> 4];
            const byteIndexInTexture = flatIndex & 15;
            for (let i = 0; i < splatCount; i++) {
                const index = i * 16 + byteIndexInTexture;
                // Coefficients are encoded as c * 128 + 128, so negating maps b to 256 - b (clamped to a byte).
                texture[index] = Math.min(255, 256 - texture[index]);
            }
        }
    }
}

async function DecompressGzipAsync(bytes: Uint8Array): Promise<ArrayBuffer> {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).arrayBuffer();
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/pull/2531)
 * Loads a KHR_gaussian_splatting primitive whose splat data is stored as an SPZ file, as a {@link GaussianSplattingMesh}.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_gaussian_splatting_compression_spz implements IGLTFLoaderExtension {
    /**
     * Defines a number that determines the order the extensions are applied.
     * Must run before KHR_gaussian_splatting, which would otherwise try to read the (possibly missing) accessors.
     */
    public order = 150;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLTFLoader;

    /**
     * @internal
     * @param loader The glTF loader
     * @param name The extension name this instance handles
     */
    constructor(
        loader: GLTFLoader,
        public readonly name: string = NAME
    ) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(name);
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
        const spzExtension: ISpzCompressionExtension | undefined = primitive.extensions?.[PARENT_NAME]?.extensions?.[this.name];
        if (!spzExtension) {
            return null;
        }

        const extensionContext = `${context}/extensions/${PARENT_NAME}/extensions/${this.name}`;
        return this._loadSpzPrimitiveAsync(context, extensionContext, name, primitive, spzExtension, assign);
    }

    private async _loadSpzPrimitiveAsync(
        context: string,
        extensionContext: string,
        name: string,
        primitive: IMeshPrimitive,
        spzExtension: ISpzCompressionExtension,
        assign: (babylonMesh: AbstractMesh) => void
    ): Promise<AbstractMesh> {
        if (primitive.mode != undefined && primitive.mode !== MeshPrimitiveMode.POINTS) {
            throw new Error(`${extensionContext}: Gaussian splatting primitives must use POINTS mode`);
        }

        const loader = this._loader;
        const bufferView = ArrayItem.Get(`${extensionContext}/bufferView`, loader.gltf.bufferViews, spzExtension.bufferView) as IBufferView;

        // The mesh must be assigned synchronously, before the first await (see KHR_gaussian_splatting).
        const scene = loader.babylonScene;
        // The mesh relies on thin instances for its splat index buffer, which pure imports don't register.
        RegisterThinInstanceMesh();
        const gaussianSplattingMesh = scene._executeWithBlockedEntityCollection(!!loader._assetContainer, () => new GaussianSplattingMesh(name, null, scene));
        gaussianSplattingMesh._parentContainer = loader._assetContainer;

        GLTFLoader.AddPointerMetadata(gaussianSplattingMesh, context);
        loader.parent.onMeshLoadedObservable.notifyObservers(gaussianSplattingMesh);

        // Report the generated material so it ends up in the asset container alongside the mesh.
        const material = gaussianSplattingMesh.material;
        if (material) {
            material._parentContainer = loader._assetContainer;
            loader.parent.onMaterialLoadedObservable.notifyObservers(material);
        }
        assign(gaussianSplattingMesh);

        const bytes = await loader.loadBufferViewAsync(`/bufferViews/${bufferView.index}`, bufferView);
        const spzBytes = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);

        const options = loader.parent.extensionOptions[this.name as typeof NAME] as { spzLibraryUrl?: string } | undefined;
        const spzLibraryUrl = options && "spzLibraryUrl" in options ? options.spzLibraryUrl : typeof WebAssembly === "object" ? DefaultSpzLibraryUrl : undefined;

        let parsed: IParsedSplat;
        if (spzLibraryUrl) {
            const spz = await GetSpzModule(spzLibraryUrl);
            const cloud = spz.loadSpzFromBuffer(spzBytes, { to: spz.CoordinateSystem.LUF });
            parsed = await ConvertSpzToSplatAsync(cloud, scene);
        } else {
            const isGZipped = spzBytes[0] === 0x1f && spzBytes[1] === 0x8b;
            if (!isGZipped) {
                throw new Error(`${extensionContext}: SPZ V4+ payloads (NGSP format) require the WASM SPZ library. Provide a valid 'spzLibraryUrl' extension option.`);
            }
            parsed = await ParseSpz(await DecompressGzipAsync(spzBytes), scene, {});
            if (parsed.mode === Mode.Reject) {
                throw new Error(`${extensionContext}: Invalid SPZ data`);
            }
            _ConvertSpzRubToLuf(parsed.data, parsed.sh, parsed.shDegree ?? 0);
        }

        if (parsed.trainedWithAntialiasing) {
            const gaussianSplattingMaterial = material as GaussianSplattingMaterial;
            gaussianSplattingMaterial.kernelSize = 0.1;
            gaussianSplattingMaterial.compensation = true;
        }

        if (parsed.safeOrbitCameraRadiusMin !== undefined || parsed.safeOrbitCameraElevationMinMax !== undefined) {
            gaussianSplattingMesh.safeOrbitCameraLimits = {
                radiusMin: parsed.safeOrbitCameraRadiusMin,
                elevationMinMax: parsed.safeOrbitCameraElevationMinMax,
            };
        }

        await gaussianSplattingMesh.updateDataAsync(parsed.data, parsed.sh, undefined, parsed.shDegree);
        this._reportGeneratedTextures(gaussianSplattingMesh);

        return gaussianSplattingMesh;
    }

    /**
     * The splat textures are created during the asynchronous upload, outside of any blocked entity collection scope,
     * so they land in the scene. Move them into the asset container (if any) and report them to the loader.
     * @param mesh The Gaussian splatting mesh whose data was just uploaded
     */
    private _reportGeneratedTextures(mesh: GaussianSplattingMesh): void {
        const loader = this._loader;
        const container = loader._assetContainer;
        const scene = loader.babylonScene;
        const textures = [
            mesh.covariancesATexture,
            mesh.covariancesBTexture,
            mesh.centersTexture,
            mesh.colorsTexture,
            mesh.rotationsATexture,
            mesh.rotationsBTexture,
            mesh.rotationScaleTexture,
            ...(mesh.shTextures ?? []),
        ];
        for (const texture of textures) {
            if (!texture) {
                continue;
            }
            if (container) {
                scene.removeTexture(texture);
                texture._parentContainer = container;
            }
            loader.parent.onTextureLoadedObservable.notifyObservers(texture);
        }
    }
}

let _Registered = false;
/**
 * Registers the KHR_gaussian_splatting_compression_spz_2 glTF loader extension (and its earlier draft name).
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_gaussian_splatting_compression_spz(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    unregisterGLTFExtension(NAME);
    unregisterGLTFExtension(LEGACY_NAME);

    registerGLTFExtension(NAME, true, (loader) => new KHR_gaussian_splatting_compression_spz(loader, NAME));
    registerGLTFExtension(LEGACY_NAME, true, (loader) => new KHR_gaussian_splatting_compression_spz(loader, LEGACY_NAME));
}
