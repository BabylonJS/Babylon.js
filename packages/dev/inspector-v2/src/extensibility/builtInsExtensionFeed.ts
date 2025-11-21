import type { IExtensionFeed, ExtensionMetadata, IExtensionMetadataQuery, ExtensionModule } from "./extensionFeed";

export type BuiltInExtension = ExtensionMetadata & {
    /**
     * Gets the extension module, typically dynamically importing the extension.
     * @returns The extension module (e.g. a collection of ServiceDefinitions).
     */
    getExtensionModuleAsync(): Promise<ExtensionModule>;
};

/**
 * A simple extension feed implementation that provides a fixed set of "built in" extensions.
 * "Built in" in this context means extensions that are known at bundling time, and included
 * in the bundle. Each extension can be dynamically imported so they are split into separate
 * bundle chunks and downloaded only when first installed.
 */
export class BuiltInsExtensionFeed implements IExtensionFeed {
    private readonly _extensions: readonly BuiltInExtension[];

    public constructor(
        public readonly name: string,
        extensions: Iterable<BuiltInExtension>
    ) {
        this._extensions = Array.from(extensions);
    }

    public async queryExtensionsAsync(filter?: string): Promise<IExtensionMetadataQuery> {
        const filteredExtensions = filter ? this._extensions.filter((extension) => extension.name.includes(filter)) : this._extensions;
        return {
            totalCount: filteredExtensions.length,
            getExtensionMetadataAsync: async (index: number, count: number) => {
                return filteredExtensions.slice(index, index + count);
            },
        };
    }

    public async getExtensionModuleAsync(name: string): Promise<ExtensionModule | undefined> {
        const extension = this._extensions.find((ext) => ext.name === name);
        return extension ? await extension.getExtensionModuleAsync() : undefined;
    }
}
