import type { WeaklyTypedServiceDefinition } from "../modularity/serviceContainer";

export type ExtensionMetadata = {
    /**
     * The name of the extension.
     */
    readonly name: string;

    /**
     * The description of the extension.
     */
    readonly description: string;

    /**
     * The keywords of the extension.
     */
    readonly keywords: readonly string[];
};

export type ExtensionModule = {
    /**
     * The default export of the module (e.g. export default).
     */
    default: {
        /**
         * The services that are included with the extension.
         */
        serviceDefinitions?: readonly WeaklyTypedServiceDefinition[];
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
    getExtensionMetadataAsync(index: number, count: number): Promise<readonly ExtensionMetadata[]>;
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
     * Gets the extension module for the specified extension.
     * @param name The name of the extension.
     * @returns A promise that resolves to the extension module.
     */
    getExtensionModuleAsync(name: string): Promise<ExtensionModule | undefined>;
}
