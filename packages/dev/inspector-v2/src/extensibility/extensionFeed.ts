import type { WeaklyTypedServiceDefinition } from "../modularity/serviceCatalog";

export type ExtensionMetadata = {
    /**
     * The name of the extension.
     */
    readonly name: string;

    /**
     * The version of the extension.
     */
    readonly version: string;

    /**
     * The description of the extension.
     */
    readonly description: string;

    /**
     * The keywords of the extension.
     */
    readonly keywords: readonly string[];

    /**
     * The author of the extension.
     */
    readonly author: string;

    /**
     * The license of the extension.
     */
    readonly license: string;

    /**
     * The dependencies that must exist at runtime for the extension to function.
     */
    readonly peerDependencies?: Readonly<Record<string, string>>;
};

type ServiceDefinitions = readonly WeaklyTypedServiceDefinition[];

export type ExtensionModule = {
    /**
     * The default export of the module (e.g. export default).
     */
    default: {
        /**
         * The services that are included with the extension.
         */
        serviceDefinitions?: ServiceDefinitions;
    };
};

/**
 * Represents a query to fetch subset ranges of extension metadata from a feed.
 */
export interface IExtensionMetadataQuery {
    /**
     * The total number of extensions that satisfy the query.
     */
    readonly totalCount: number;

    /**
     * Fetches a range of extension metadata from the feed.
     * @param index The index of the first extension to fetch.
     * @param count The number of extensions to fetch.
     * @returns A promise that resolves to the extension metadata.
     */
    getExtensionMetadataAsync(index: number, count: number): Promise<ExtensionMetadata[]>;
}

/**
 * Represents a feed/source of extensions.
 */
export interface IExtensionFeed {
    /**
     * The name of the feed.
     */
    readonly name: string;

    /**
     * Creates an extension metadata query given a filter.
     * @param filter The filter to apply to the query.
     * @returns A promise that resolves to the extension metadata query.
     */
    queryExtensionsAsync(filter?: string): Promise<IExtensionMetadataQuery>;

    /**
     * Fetches the metadata for a specific extension.
     * @param name The name of the extension.
     * @param version The version of the extension.
     * @returns A promise that resolves to the extension metadata.
     */
    getExtensionMetadataAsync(name: string, version?: string): Promise<ExtensionMetadata | undefined>; // needed to install dependencies

    /**
     * Saves the extension to the client for future and offline access.
     */
    saveExtensionToClientAsync(name: string, version: string): Promise<void>;

    /**
     * Gets the extension module for the specified extension.
     * @param name The name of the extension.
     * @param version The version of the extension.
     * @returns A promise that resolves to the extension module.
     */
    getExtensionModuleAsync(name: string, version: string): Promise<ExtensionModule | undefined>;

    /**
     * Removes the extension from the client.
     * @param name The name of the extension.
     * @param version The version of the extension.
     */
    removeExtensionFromClient(name: string, version: string): Promise<void>;
}
