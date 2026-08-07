import { InteractivityAssetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/interactivityAssetPathToObjectConverter";
import { type IGLTF } from "loaders/glTF/2.0/glTFLoaderInterfaces";

/**
 * Coverage for the KHR_interactivity asset-capability and runtime-limit `pointer/get` accessors
 * (spec "Asset Capabilities" and "Implementation-Specific Runtime Limits"), resolved by
 * {@link InteractivityAssetPathToObjectConverter}.
 */
describe("KHR_interactivity asset-capability accessors", () => {
    // Extensions that are both listed in the asset's `extensionsUsed` and supported by the loader.
    const enabledExtensions = ["KHR_interactivity", "KHR_texture_transform"];
    const createConverter = (version = "2.0") =>
        new InteractivityAssetPathToObjectConverter({ asset: { version } } as unknown as IGLTF, (name) => enabledExtensions.indexOf(name) !== -1);

    const get = (converter: InteractivityAssetPathToObjectConverter, path: string) => {
        const accessor = converter.convert(path);
        expect(accessor.info.getTarget(accessor.object)).toBeTruthy();
        return accessor.info.get(accessor.object);
    };

    describe("asset version", () => {
        it("reports the version declared in the glTF JSON", () => {
            const converter = createConverter();
            expect(get(converter, "/extensions/KHR_interactivity/asset/majorVersion")).toBe(2);
            expect(get(converter, "/extensions/KHR_interactivity/asset/minorVersion")).toBe(0);
        });

        it("clamps to the maximum version supported by the implementation", () => {
            const converter = createConverter("2.7");
            expect(get(converter, "/extensions/KHR_interactivity/asset/majorVersion")).toBe(2);
            expect(get(converter, "/extensions/KHR_interactivity/asset/minorVersion")).toBe(0);
        });

        it("reports an older asset version as-is", () => {
            const converter = createConverter("1.4");
            expect(get(converter, "/extensions/KHR_interactivity/asset/majorVersion")).toBe(1);
            expect(get(converter, "/extensions/KHR_interactivity/asset/minorVersion")).toBe(4);
        });
    });

    describe("extension support", () => {
        it("reports true for a used and supported extension", () => {
            expect(get(createConverter(), "/extensions/KHR_interactivity/asset/extensions/KHR_interactivity/enabled")).toBe(true);
        });

        it("resolves successfully but reports false for an unknown extension", () => {
            expect(get(createConverter(), "/extensions/KHR_interactivity/asset/extensions/KHR_this_extension_does_not_exist/enabled")).toBe(false);
        });

        it("resolves successfully but reports false for an extension that is not enabled", () => {
            expect(get(createConverter(), "/extensions/KHR_interactivity/asset/extensions/KHR_materials_unlit/enabled")).toBe(false);
        });
    });

    describe("runtime limits", () => {
        it.each(["maxActiveAnimations", "maxActiveDelays", "maxActivePropertyInterpolations", "maxActiveVariableInterpolations"])("reports %s as at least 1", (limit) => {
            const value = get(createConverter(), `/extensions/KHR_interactivity/limits/${limit}`) as number;
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(1);
        });

        it("rejects an unknown limit", () => {
            expect(() => createConverter().convert("/extensions/KHR_interactivity/limits/maxSomethingElse")).toThrow();
        });
    });

    it("rejects an unknown asset capability", () => {
        expect(() => createConverter().convert("/extensions/KHR_interactivity/asset/generator")).toThrow();
    });

    it("marks every capability as read-only", () => {
        const converter = createConverter();
        expect(converter.convert("/extensions/KHR_interactivity/asset/majorVersion").info.isReadOnly).toBe(true);
        expect(converter.convert("/extensions/KHR_interactivity/limits/maxActiveDelays").info.isReadOnly).toBe(true);
    });
});
