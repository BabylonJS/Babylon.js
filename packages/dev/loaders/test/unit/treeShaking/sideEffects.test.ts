import { describe, expect, it } from "vitest";

import { registeredGLTFExtensions } from "loaders/glTF/2.0/glTFLoaderExtensionRegistry";
import { GetMappingForKey } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { registerBuiltInGLTFExtensions } from "loaders/glTF/2.0/Extensions/dynamic";
import { type GLTFLoader } from "loaders/glTF/2.0/glTFLoader.pure";
import { blockFactory } from "core/FlowGraph/Blocks/flowGraphBlockFactory";
import { getMappingForFullOperationName } from "loaders/glTF/2.0/Extensions/KHR_interactivity/declarationMapper";

/**
 * Tree-shaking guard for the loaders package.
 *
 * Validates the two halves of the side-effect split introduced by the
 * pure-architecture migration:
 *  - Back-compat: importing the side-effect wrapper still auto-registers the
 *    glTF extension (legacy full-package side-effect import).
 *  - Purity: importing the `.pure` implementation performs no registration, so
 *    unused extensions can be tree-shaken; the registration only happens when
 *    the explicit `Register*` opt-in is called.
 */
describe("loaders tree-shaking side effects", () => {
    it("registers glTF animation mappings only when explicitly requested", async () => {
        const translation = GetMappingForKey("/nodes/{}/translation");
        const visibility = GetMappingForKey("/nodes/{}/extensions/KHR_node_visibility/visible");
        expect(translation?.interpolation).toBeUndefined();
        expect(visibility?.interpolation).toBeUndefined();

        const pure = await import("loaders/glTF/2.0/glTFLoaderAnimation.pure");
        const animationPointerDataPure = await import("loaders/glTF/2.0/Extensions/KHR_animation_pointer.data.pure");
        expect(translation?.interpolation).toBeUndefined();
        expect(visibility?.interpolation).toBeUndefined();

        pure.RegisterGLTFLoaderAnimation();
        animationPointerDataPure._RegisterKHRAnimationPointerData();
        expect(translation?.interpolation).toHaveLength(1);
        expect(visibility?.interpolation).toHaveLength(1);
    });

    it("does not register the extension when importing the pure module (opt-in only)", async () => {
        expect(registeredGLTFExtensions.has("KHR_materials_unlit")).toBe(false);

        const pure = await import("loaders/glTF/2.0/Extensions/KHR_materials_unlit.pure");
        expect(registeredGLTFExtensions.has("KHR_materials_unlit")).toBe(false);

        pure.RegisterKHR_materials_unlit();
        expect(registeredGLTFExtensions.has("KHR_materials_unlit")).toBe(true);
    });

    it("auto-registers the extension when importing the side-effect wrapper (back-compat)", async () => {
        expect(registeredGLTFExtensions.has("KHR_draco_mesh_compression")).toBe(false);

        await import("loaders/glTF/2.0/Extensions/KHR_draco_mesh_compression");
        expect(registeredGLTFExtensions.has("KHR_draco_mesh_compression")).toBe(true);
    });

    it("keeps the lazy factory registered after creating a built-in extension", async () => {
        registerBuiltInGLTFExtensions();
        const registration = registeredGLTFExtensions.get("ExtrasAsMetadata");
        if (!registration) {
            throw new Error("Expected the dynamically registered ExtrasAsMetadata factory");
        }

        await registration.factory({} as GLTFLoader);

        expect(registeredGLTFExtensions.get("ExtrasAsMetadata")?.factory).toBe(registration.factory);
    });

    it("applies runtime setup without replacing lazy extension factories", async () => {
        registerBuiltInGLTFExtensions();
        const loader = {
            isExtensionUsed: () => true,
            gltf: { asset: { version: "2.0" }, extensionsUsed: [] },
            babylonScene: null,
            parent: { extensionOptions: {}, targetFps: 60 },
        } as GLTFLoader;

        for (const name of ["KHR_animation_pointer", "KHR_interactivity", "KHR_node_visibility", "KHR_node_hoverability", "KHR_node_selectability"]) {
            const registration = registeredGLTFExtensions.get(name);
            if (!registration) {
                throw new Error(`Expected the dynamically registered ${name} factory`);
            }

            await registration.factory(loader);

            expect(registeredGLTFExtensions.get(name)?.factory).toBe(registration.factory);
        }

        const provider = await blockFactory("KHR_interactivity/FlowGraphGLTFDataProvider")();
        expect(provider.name).toBe("FlowGraphGLTFDataProvider");

        expect(getMappingForFullOperationName("event/onHoverIn:KHR_node_hoverability")?.blocks).toContain("KHR_interactivity/FlowGraphGLTFDataProvider");
        expect(getMappingForFullOperationName("event/onHoverOut:KHR_node_hoverability")?.blocks).toContain("KHR_interactivity/FlowGraphGLTFDataProvider");
        expect(getMappingForFullOperationName("event/onSelect:KHR_node_selectability")?.blocks).toContain("KHR_interactivity/FlowGraphGLTFDataProvider");

        expect(GetMappingForKey("/nodes/{}/extensions/KHR_node_visibility/visible")).toBeDefined();
        expect(GetMappingForKey("/nodes/{}/extensions/KHR_node_hoverability/hoverable")).toBeDefined();
        expect(GetMappingForKey("/nodes/{}/extensions/KHR_node_selectability/selectable")).toBeDefined();
    });
});
