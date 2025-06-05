import type { IExtensionFeed, ExtensionMetadata, IExtensionMetadataQuery, ExtensionModule } from "./extensionFeed";

// This file contains "built in" extensions. They are optional and installed/uninstalled by the user, but they are
// well-known at build time and the extension is "downloaded" by simply doing a dynamic import. This is different
// from future extension types that are built and published apart from the inspector, and are downloaded as an isolated script.

const CreationToolsExtensionMetadata = {
    name: "Asset Creation",
    description: "Adds new features to enable creating Babylon assets such as node materials, flow graphs, and more.",
    keywords: ["creation"],
} as const;

const Extensions: readonly ExtensionMetadata[] = [CreationToolsExtensionMetadata];

/**
 * @internal
 */
export class BuiltInsExtensionFeed implements IExtensionFeed {
    public readonly name = "Built-ins";

    public async queryExtensionsAsync(filter?: string): Promise<IExtensionMetadataQuery> {
        const filteredExtensions = filter ? Extensions.filter((extension) => extension.name.includes(filter)) : Extensions;
        return {
            totalCount: filteredExtensions.length,
            getExtensionMetadataAsync: async (index: number, count: number) => {
                return filteredExtensions.slice(index, index + count);
            },
        };
    }

    public async getExtensionModuleAsync(name: string): Promise<ExtensionModule | undefined> {
        if (name === CreationToolsExtensionMetadata.name) {
            return await import("../services/creationToolsService");
        }
        return undefined;
    }
}
