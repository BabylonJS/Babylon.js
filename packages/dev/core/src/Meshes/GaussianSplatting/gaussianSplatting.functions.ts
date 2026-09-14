import { type AbstractMesh } from "../abstractMesh.pure";

/**
 * True when `className` (from `AbstractMesh.getClassName()`) identifies a Gaussian Splatting mesh whose
 * `position.z` vertex attribute encodes a splat index rather than world-space Z: `"GaussianSplattingMesh"`
 * (also returned by `GaussianSplattingCompoundMesh`) or `"GaussianSplattingStream"`.
 *
 * This function is retained for backward compatibility. Internal code should prefer
 * {@link _IsGaussianSplattingMesh}, which also recognizes the inherited Gaussian Splatting capability.
 * @param className the mesh class name to test, e.g. from `AbstractMesh.getClassName()`
 * @returns true if the class name identifies a Gaussian Splatting mesh
 */
export function IsGaussianSplattingClassName(className: string): boolean {
    return className === "GaussianSplattingMesh" || className === "GaussianSplattingStream";
}

/**
 * Tests whether a mesh uses Gaussian Splatting rendering behavior.
 * @param mesh the mesh to test
 * @returns true if the mesh is a Gaussian Splatting mesh
 * @internal
 */
export function _IsGaussianSplattingMesh(mesh: AbstractMesh): boolean {
    return mesh._isGaussianSplatting || IsGaussianSplattingClassName(mesh.getClassName());
}
