import type { ExtensionMetadata, ExtensionMetadataQuery, ExtensionFeed, ExtensionModule } from "./extensionFeed";

const exploderExtensionMetadata = {
    name: "Asset Creation",
    author: "Babylon",
    description: "Adds new features to enable creating Babylon assets such as node materials, flow graphs, and more.",
    keywords: ["exploder", "sandbox"],
    version: "0.0.1",
    license: "MIT",
} as const;

const extensions: readonly ExtensionMetadata[] = [exploderExtensionMetadata];

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
        if (name === exploderExtensionMetadata.name && version === exploderExtensionMetadata.version) {
            return await import("../services/exploderService");
        }
        return undefined;
    }
}
