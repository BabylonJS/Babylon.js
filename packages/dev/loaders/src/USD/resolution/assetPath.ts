/**
 * Resolves an authored asset path against the identifier of the layer that referenced it.
 *
 * This is the single source of truth for asset-path resolution: both external layer references
 * (sublayers/references/payloads) and material texture references resolve through it, so a sibling
 * `.usd` layer and a sibling `.png` texture authored with the same relative path always resolve to the
 * same identifier. Absolute URLs and absolute paths pass through unchanged; under the dropped-file
 * scheme a flat drag-and-drop set is addressed by lower-cased basename; otherwise the path is joined
 * onto the referrer's directory and normalized (collapsing `.` and `..` segments).
 *
 * @param assetPath the authored, delimiter-free relative or absolute asset path
 * @param fromIdentifier the identifier of the layer that authored the reference
 * @returns the resolved identifier the prefetch/archive maps are keyed under
 */
export function ResolveAssetIdentifier(assetPath: string, fromIdentifier: string): string {
    if (/^[a-z][a-z0-9+.-]*:/i.test(assetPath)) {
        return assetPath;
    }

    // Dropped-file scheme: a flat drag-and-drop set is stored in Babylon's FilesInputStore keyed by
    // lower-cased basename, and Tools.LoadFile serves a "file:<key>" URL from it. Address siblings by
    // basename so a "drop the asset and all its files together" set resolves, mirroring how the glTF
    // loader resolves a .bin dropped alongside its .gltf.
    if (fromIdentifier.startsWith("file:")) {
        return `file:${(assetPath.split("/").pop() ?? assetPath).toLowerCase()}`;
    }

    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(fromIdentifier)) {
        return new URL(assetPath, fromIdentifier).href;
    }

    if (assetPath.startsWith("/")) {
        return assetPath;
    }

    const lastSlash = fromIdentifier.lastIndexOf("/");
    const baseDirectory = lastSlash >= 0 ? fromIdentifier.slice(0, lastSlash + 1) : "";

    const segments: string[] = [];
    for (const segment of `${baseDirectory}${assetPath}`.split("/")) {
        if (segment === "" || segment === ".") {
            continue;
        }
        if (segment === ".." && segments.length > 0 && segments[segments.length - 1] !== "..") {
            segments.pop();
            continue;
        }
        segments.push(segment);
    }

    const prefix = baseDirectory.startsWith("/") ? "/" : "";
    return `${prefix}${segments.join("/")}`;
}
