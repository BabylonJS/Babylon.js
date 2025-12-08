import type { WeaklyTypedServiceDefinition } from "../modularity/serviceContainer";

export type PersonMetadata = {
    /**
     * The name of the person.
     */
    readonly name: string;

    /**
     * The email address of the person.
     */
    readonly email?: string;

    /**
     * The URL to the person's website.
     */
    readonly url?: string;

    /**
     * The Babylon forum username of the person.
     */
    readonly forumUserName?: string;
};

export type ExtensionMetadata = {
    /**
     * The name of the extension.
     */
    readonly name: string;

    /**
     * The version of the extension (as valid semver).
     */
    readonly version?: string;

    /**
     * The description of the extension.
     */
    readonly description: string;

    /**
     * The keywords of the extension.
     */
    readonly keywords?: readonly string[];

    /**
     * The URL to the extension homepage.
     */
    readonly homepage?: string;

    /**
     * Specify the place where your code lives. This is helpful for people who want to contribute.
     */
    readonly repository?: string;

    /**
     * The URL to your extension's issue tracker and / or the email address to which issues should be reported. These are helpful for people who encounter issues with your extension.
     */
    readonly bugs?: string;

    /**
     * A license for your package so that people know how they are permitted to use it, and any restrictions you're placing on it.
     */
    readonly license?: string;

    /**
     * The primary author of the extension.
     */
    readonly author?: string | PersonMetadata;

    /**
     * The contributors to the extension.
     */
    readonly contributors?: readonly (string | PersonMetadata)[];
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
