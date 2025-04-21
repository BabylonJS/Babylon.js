import type { ExtensionMetadata, ExtensionMetadataQuery, ExtensionFeed, ExtensionModule } from "./extensionFeed";

const extensions: readonly ExtensionMetadata[] = [];

export class BuiltInsExtensionFeed implements ExtensionFeed {
    public readonly name = "Built-ins";

    public async queryExtensionsAsync(filter?: string): Promise<ExtensionMetadataQuery> {
        const filteredExtensions = filter ? extensions.filter((extension) => extension.name.includes(filter)) : extensions;
        return {
            totalCount: filteredExtensions.length,
            getExtensionMetadataAsync: async (index: number, count: number) => {
                return filteredExtensions.slice(index, index + count);
            },
        };
    }

    public async getExtensionMetadataAsync(name: string, version?: string): Promise<ExtensionMetadata | undefined> {
        return extensions.find((extension) => extension.name === name && (!version || extension.version === version));
    }

    public async saveExtensionToClientAsync(name: string, version: string): Promise<void> {
        // No-op
    }

    public async removeExtensionFromClient(name: string, version: string): Promise<void> {
        // No-op
    }

    public async getExtensionModuleAsync(name: string, version: string): Promise<ExtensionModule | undefined> {
        // if (name === "extension1" && version === "1.0.0") {
        //     return await import("../extensions/extension1");
        // } else if ...
        return undefined;
    }
}
