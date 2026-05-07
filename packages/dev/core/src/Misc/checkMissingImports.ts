import { SerializationHelper } from "./decorators.serialization.pure";
import { Scene } from "../scene.pure";
import { Texture } from "../Materials/Textures/texture.pure";
import { Mesh } from "../Meshes/mesh.pure";
import { Node } from "../node.pure";

/**
 * Tests a function stub to see if it throws (indicating a missing side-effect import).
 * Returns the missing module name if the stub throws, or null if it's been registered.
 */
function _testStub(fn: (...args: any[]) => any, ...args: any[]): string | null {
    try {
        fn(...args);
        return null;
    } catch (e) {
        if (typeof e === "string" && e.includes("needs to be imported before")) {
            // Extract the module name from the error message
            return e.split(" needs to be imported")[0];
        }
        return null;
    }
}

/**
 * Diagnostic utility that checks all known side-effect stubs and reports which ones
 * have NOT been registered. Call this at application startup (after all your imports)
 * to discover ALL missing imports at once, instead of hitting them one at a time at runtime.
 *
 * This function is in a standalone module — it adds zero overhead to your bundle unless
 * you explicitly import it. Intended for development use only.
 *
 * @returns An array of module names that need to be imported. Empty if everything is registered.
 *
 * @example
 * ```typescript
 * import { CheckMissingImports } from "@babylonjs/core/Misc/checkMissingImports";
 *
 * const missing = CheckMissingImports();
 * // Console output: "[Babylon.js] The following side-effect modules have not been imported: ..."
 * ```
 */
export function CheckMissingImports(): string[] {
    const missing: string[] = [];

    // SerializationHelper parser stubs
    let name: string | null;
    name = _testStub(SerializationHelper._ImageProcessingConfigurationParser, {});
    if (name) missing.push(name);
    name = _testStub(SerializationHelper._FresnelParametersParser, {});
    if (name) missing.push(name);
    name = _testStub(SerializationHelper._ColorCurvesParser, {});
    if (name) missing.push(name);
    name = _testStub(SerializationHelper._TextureParser, {}, null, "");
    if (name) missing.push(name);

    // Scene factory stubs
    name = _testStub(Scene.DefaultMaterialFactory, null);
    if (name) missing.push(name);
    name = _testStub(Scene.CollisionCoordinatorFactory);
    if (name) missing.push(name);

    // Scene picking stubs (Ray)
    name = _testStub(Scene.prototype.createPickingRay, 0, 0, null, null);
    if (name) missing.push(name);

    // Texture factory stubs
    name = _testStub(Texture._CubeTextureParser, {}, null, "");
    if (name) missing.push(name);
    name = _testStub(Texture._CreateMirror, "", 0, null, false);
    if (name) missing.push(name);
    name = _testStub(Texture._CreateRenderTargetTexture, "", 0, null, false);
    if (name) missing.push(name);
    name = _testStub(Texture._CreateVideoTexture, "", "", null);
    if (name) missing.push(name);

    // Mesh factory stubs
    name = _testStub(Mesh._instancedMeshFactory, "", null);
    if (name) missing.push(name);
    name = _testStub(Mesh._PhysicsImpostorParser, null, null, {});
    if (name) missing.push(name);
    name = _testStub(Mesh._GroundMeshParser, {}, null);
    if (name) missing.push(name);
    name = _testStub(Mesh._GoldbergMeshParser, {}, null);
    if (name) missing.push(name);
    name = _testStub(Mesh._LinesMeshParser, {}, null);
    if (name) missing.push(name);
    name = _testStub(Mesh._GreasedLineMeshParser, {}, null);
    if (name) missing.push(name);
    name = _testStub(Mesh._GreasedLineRibbonMeshParser, {}, null);
    if (name) missing.push(name);
    name = _testStub(Mesh._TrailMeshParser, {}, null);
    if (name) missing.push(name);
    name = _testStub(Mesh._GaussianSplattingMeshParser, {}, null);
    if (name) missing.push(name);
    name = _testStub(Mesh._GaussianSplattingPartProxyMeshParser, {}, null);
    if (name) missing.push(name);
    name = _testStub(Mesh._GaussianSplattingCompoundMeshParser, {}, null);
    if (name) missing.push(name);

    // Node stubs
    name = _testStub(Node._AnimationRangeFactory, "", 0, 0);
    if (name) missing.push(name);

    if (missing.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
            `[Babylon.js] The following side-effect modules have not been imported:\n` +
                missing.map((n) => `  - ${n}`).join("\n") +
                `\nNote: These are only required if your application uses the corresponding features.` +
                `\nIf you do use them, import the modules or their parent packages to avoid runtime errors.` +
                `\nSee: https://doc.babylonjs.com/setup/treeshaking`
        );
    }
    return missing;
}
