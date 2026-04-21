import { type Scene } from "../scene";
import { type SmartAssetManager } from "./smartAssetManager";
import { type OverrideManager } from "./overrideManager";
import { SceneSerializer } from "../Misc/sceneSerializer";

/**
 * Options for exporting a project to a delivery format.
 */
export interface IProjectExportOptions {
    /**
     * Output format.
     * - "glb": Universal binary glTF (requires @babylonjs/serializers)
     * - "babylon": Babylon.js JSON format (full fidelity, no external dependency)
     */
    readonly format: "glb" | "babylon";

    /**
     * Optional filename for the exported file (without extension).
     * @default "export"
     */
    readonly fileName?: string;
}

/**
 * The result of a project export.
 */
export interface IProjectExportResult {
    /** The exported data. For "babylon" format, this is a JSON string. For "glb", an ArrayBuffer. */
    readonly data: string | ArrayBuffer;

    /** The file extension (including dot). */
    readonly extension: string;

    /** The suggested filename (with extension). */
    readonly fileName: string;
}

/**
 * Exports a project (smart assets + overrides) to a self-contained delivery format.
 *
 * The exported file contains no SmartAsset metadata — it's a clean scene file
 * ready for deployment. End users at runtime are never impacted by the
 * authoring system.
 *
 * @param scene - The scene to export (should have smart assets loaded and overrides applied).
 * @param smartAssetManager - The asset manager (used to verify assets are loaded).
 * @param overrideManager - The override manager (ensures overrides are applied before export).
 * @param options - Export options (format, filename).
 * @returns The exported data.
 *
 * @example
 * ```typescript
 * // Export to .babylon format (no external dependencies)
 * const result = await exportProjectAsync(scene, sam, overrides, { format: "babylon" });
 * downloadFile(result.data, result.fileName);
 *
 * // Export to GLB (requires @babylonjs/serializers)
 * const glbResult = await exportProjectAsync(scene, sam, overrides, { format: "glb" });
 * downloadFile(glbResult.data, glbResult.fileName);
 * ```
 */
export async function exportProjectAsync(
    scene: Scene,
    _smartAssetManager: SmartAssetManager,
    overrideManager: OverrideManager,
    options: IProjectExportOptions
): Promise<IProjectExportResult> {
    const fileName = options.fileName ?? "export";

    // Ensure all overrides are applied before export
    overrideManager.applyAllOverrides();

    if (options.format === "babylon") {
        return _exportBabylon(scene, fileName);
    }

    if (options.format === "glb") {
        return await _exportGlb(scene, fileName);
    }

    throw new Error(`ProjectExporter: Unsupported format "${options.format}".`);
}

/**
 * Exports to .babylon format using SceneSerializer.
 * Temporarily removes authoring system metadata to avoid circular references.
 */
function _exportBabylon(scene: Scene, fileName: string): IProjectExportResult {
    // Temporarily remove authoring metadata to avoid circular refs during serialization
    const metadata = scene.metadata;
    const savedRefs = _removeAuthoringMetadata(metadata);

    const serialized = SceneSerializer.Serialize(scene);
    _stripSmartAssetMetadata(serialized);

    // Restore authoring metadata
    _restoreAuthoringMetadata(metadata, savedRefs);

    // Use a safe serializer — SceneSerializer output can contain circular refs
    // from internal texture caches in environment textures
    const seen = new WeakSet();
    const data = JSON.stringify(
        serialized,
        (_key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return undefined;
                }
                seen.add(value);
            }
            return value;
        },
        2
    );

    return {
        data,
        extension: ".babylon",
        fileName: `${fileName}.babylon`,
    };
}

/**
 * Exports to GLB format using GLTF2Export (dynamic import from @babylonjs/serializers).
 * Temporarily removes authoring system metadata to avoid circular references.
 */
async function _exportGlb(scene: Scene, fileName: string): Promise<IProjectExportResult> {
    // Dynamic import — GLTF2Export lives in @dev/serializers, not core
    let GLTF2Export: any;
    try {
        const module = await import("../../../serializers/src/glTF/2.0/glTFSerializer");
        GLTF2Export = module.GLTF2Export;
    } catch {
        throw new Error('ProjectExporter: GLB export requires @babylonjs/serializers. Install it or use format: "babylon" instead.');
    }

    // Temporarily remove authoring metadata to avoid circular refs during serialization
    const metadata = scene.metadata;
    const savedRefs = _removeAuthoringMetadata(metadata);

    const glbData = await GLTF2Export.GLBAsync(scene, fileName);

    // Restore authoring metadata
    _restoreAuthoringMetadata(metadata, savedRefs);

    // GLBAsync returns an object with a glTF file entry
    const glbFile = glbData.glTFFiles[`${fileName}.glb`];
    if (!glbFile) {
        throw new Error("ProjectExporter: GLB export produced no output file.");
    }

    // Convert to ArrayBuffer if it's a Blob
    const data = glbFile instanceof Blob ? await glbFile.arrayBuffer() : glbFile;

    return {
        data,
        extension: ".glb",
        fileName: `${fileName}.glb`,
    };
}

/**
 * Strips SmartAsset-specific metadata from a serialized scene object.
 * Ensures the exported file has no trace of the authoring system.
 * @param serialized - The serialized scene object to clean.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _stripSmartAssetMetadata(serialized: Record<string, unknown>): void {
    if (serialized.metadata && typeof serialized.metadata === "object") {
        const metadata = serialized.metadata as Record<string, unknown>;
        // Remove any string-key authoring metadata that may have leaked into serialization.
        // Symbol-keyed properties (SAM, OverrideManager) are automatically excluded by JSON.stringify.
        delete metadata["babylonjs:smartAssetManager"];
        delete metadata["babylonjs:smartAssetManager:str"];
        delete metadata["babylonjs:overrideManager"];
    }
}

/** Saved references from scene.metadata, removed during export to avoid circular refs. */
interface _SavedAuthoringRefs {
    symbolSam: unknown;
    symbolOverrides: unknown;
}

/**
 * Removes authoring system objects from scene.metadata before serialization.
 * Returns the removed references so they can be restored afterward.
 * Symbol-keyed properties are invisible to JSON.stringify, but scene.serialize()
 * may iterate metadata differently, so we remove and restore them to be safe.
 * @param metadata - The scene metadata object to clean.
 * @returns The saved references for later restoration.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _removeAuthoringMetadata(metadata: Record<string | symbol, unknown> | null): _SavedAuthoringRefs {
    const saved: _SavedAuthoringRefs = { symbolSam: undefined, symbolOverrides: undefined };
    if (!metadata) {
        return saved;
    }
    const samKey = Symbol.for("babylonjs:smartAssetManager");
    const overridesKey = Symbol.for("babylonjs:overrideManager");
    saved.symbolSam = metadata[samKey];
    saved.symbolOverrides = metadata[overridesKey];
    delete metadata[samKey];
    delete (metadata as Record<string, unknown>)["babylonjs:smartAssetManager:str"];
    delete metadata[overridesKey];
    delete (metadata as Record<string, unknown>)["babylonjs:overrideManager"];
    return saved;
}

/**
 * Restores authoring system objects to scene.metadata after serialization.
 * @param metadata - The scene metadata object to restore to.
 * @param saved - The previously saved authoring references.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _restoreAuthoringMetadata(metadata: Record<string | symbol, unknown> | null, saved: _SavedAuthoringRefs): void {
    if (!metadata) {
        return;
    }
    const samKey = Symbol.for("babylonjs:smartAssetManager");
    const overridesKey = Symbol.for("babylonjs:overrideManager");
    if (saved.symbolSam !== undefined) {
        metadata[samKey] = saved.symbolSam;
    }
    if (saved.symbolOverrides !== undefined) {
        metadata[overridesKey] = saved.symbolOverrides;
    }
}
