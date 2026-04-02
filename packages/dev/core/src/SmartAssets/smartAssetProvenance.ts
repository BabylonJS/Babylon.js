/**
 * Records which scene objects were created when a smart asset key was loaded.
 * Provenance is generated at load time by snapshotting object names from the
 * asset container and is used for override target resolution and Inspector
 * visualization.
 */
export interface ISmartAssetProvenance {
    /** The smart asset key this provenance belongs to. */
    readonly key: string;

    /** Names of meshes loaded by this key. */
    readonly meshNames: readonly string[];

    /** Names of materials loaded by this key. */
    readonly materialNames: readonly string[];

    /** Names of textures loaded by this key. */
    readonly textureNames: readonly string[];

    /** Names of animation groups loaded by this key. */
    readonly animationGroupNames: readonly string[];

    /** Names of lights loaded by this key. */
    readonly lightNames: readonly string[];

    /** Names of cameras loaded by this key. */
    readonly cameraNames: readonly string[];
}
