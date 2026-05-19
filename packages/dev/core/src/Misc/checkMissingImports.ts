import { type ISideEffectStub } from "./devTools";
import { SerializationHelper } from "./decorators.serialization";
import { Scene } from "../scene.pure";
import { Texture } from "../Materials/Textures/texture.pure";
import { Mesh } from "../Meshes/mesh.pure";
import { Node } from "../node";

/**
 * Tests a function stub to see if it throws (indicating a missing side-effect import).
 * Returns the missing module name if the stub throws, or null if it's been registered.
 * @param fn - The function to test
 * @param args - Arguments to pass to the function
 * @returns The missing module name or null
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _testThrowStub(fn: (...args: any[]) => any, ...args: any[]): string | null {
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
 * Tests whether a function is a side-effect stub (tagged with __isSideEffectStub).
 * Returns a descriptive name if it's a stub, or null if it's a real implementation.
 * @param fn - The function to test
 * @param className - The class that owns the method
 * @param methodName - The method name
 * @returns A descriptive name if it's a stub, or null
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _testSideEffectStub(fn: unknown, className: string, methodName: string): string | null {
    if (!fn) {
        return null; // undefined/null — no stub to report
    }
    if ((fn as ISideEffectStub).__isSideEffectStub) {
        return `${className}.${methodName}`;
    }
    return null;
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

    // --- Throw-style stubs (throw _WarnImport pattern) ---

    // SerializationHelper parser stubs
    let name: string | null;
    name = _testThrowStub(SerializationHelper._ImageProcessingConfigurationParser, {});
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(SerializationHelper._FresnelParametersParser, {});
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(SerializationHelper._ColorCurvesParser, {});
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(SerializationHelper._TextureParser, {}, null, "");
    if (name) {
        missing.push(name);
    }

    // Scene factory stubs
    name = _testThrowStub(Scene.DefaultMaterialFactory, null);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Scene.CollisionCoordinatorFactory);
    if (name) {
        missing.push(name);
    }

    // Scene picking stubs (Ray)
    name = _testThrowStub(Scene.prototype.createPickingRay, 0, 0, null, null);
    if (name) {
        missing.push(name);
    }

    // Texture factory stubs
    name = _testThrowStub(Texture._CubeTextureParser, {}, null, "");
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Texture._CreateMirror, "", 0, null, false);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Texture._CreateRenderTargetTexture, "", 0, null, false);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Texture._CreateVideoTexture, "", "", null);
    if (name) {
        missing.push(name);
    }

    // Mesh factory stubs
    name = _testThrowStub(Mesh._instancedMeshFactory, "", null);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Mesh._PhysicsImpostorParser, null, null, {});
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Mesh._GroundMeshParser, {}, null);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Mesh._GoldbergMeshParser, {}, null);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Mesh._LinesMeshParser, {}, null);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Mesh._GreasedLineMeshParser, {}, null);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Mesh._GreasedLineRibbonMeshParser, {}, null);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Mesh._TrailMeshParser, {}, null);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Mesh._GaussianSplattingMeshParser, {}, null);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Mesh._GaussianSplattingPartProxyMeshParser, {}, null);
    if (name) {
        missing.push(name);
    }
    name = _testThrowStub(Mesh._GaussianSplattingCompoundMeshParser, {}, null);
    if (name) {
        missing.push(name);
    }

    // Node stubs
    name = _testThrowStub(Node._AnimationRangeFactory, "", 0, 0);
    if (name) {
        missing.push(name);
    }

    // --- _MissingSideEffect-style stubs (tagged with __isSideEffectStub) ---

    // Scene prototype stubs
    name = _testSideEffectStub(Scene.prototype.beginAnimation, "Scene", "beginAnimation");
    if (name) {
        missing.push(name);
    }
    name = _testSideEffectStub(Scene.prototype.stopAllAnimations, "Scene", "stopAllAnimations");
    if (name) {
        missing.push(name);
    }
    name = _testSideEffectStub(Scene.prototype.createDefaultEnvironment, "Scene", "createDefaultEnvironment");
    if (name) {
        missing.push(name);
    }
    name = _testSideEffectStub(Scene.prototype.enablePhysics, "Scene", "enablePhysics");
    if (name) {
        missing.push(name);
    }
    name = _testSideEffectStub(Scene.prototype.enableDepthRenderer, "Scene", "enableDepthRenderer");
    if (name) {
        missing.push(name);
    }
    name = _testSideEffectStub(Scene.prototype.enablePrePassRenderer, "Scene", "enablePrePassRenderer");
    if (name) {
        missing.push(name);
    }
    name = _testSideEffectStub(Scene.prototype.getBoundingBoxRenderer, "Scene", "getBoundingBoxRenderer");
    if (name) {
        missing.push(name);
    }
    name = _testSideEffectStub(Scene.prototype.getOutlineRenderer, "Scene", "getOutlineRenderer");
    if (name) {
        missing.push(name);
    }
    name = _testSideEffectStub(Scene.prototype.getSoundByName, "Scene", "getSoundByName");
    if (name) {
        missing.push(name);
    }

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
