// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable } from "core/index";
import type { ServiceContainer } from "../modularity/serviceContainer";
import type { IExtensionFeed, ExtensionMetadata, ExtensionModule } from "./extensionFeed";

import { Logger } from "core/Misc/logger";

/**
 * Represents a loaded extension.
 */
export interface IExtension {
    /**
     * The metadata for the extension.
     */
    readonly metadata: ExtensionMetadata;

    /**
     * Whether the extension is currently being installed, uninstalled, enabled, or disabled.
     */
    readonly isStateChanging: boolean;

    /**
     * Whether the extension is enabled.
     */
    readonly isInstalled: boolean;

    /**
     * Installs the extension.
     */
    installAsync(): Promise<void>;

    /**
     * Uninstalls the extension.
     */
    uninstallAsync(): Promise<void>;

    /**
     * Adds a handler that is called when the state of the extension changes.
     * @param handler The handler to add.
     * @returns A disposable that removes the handler when disposed.
     */
    addStateChangedHandler(handler: () => void): IDisposable;
}

/**
 * Provides information about an extension installation failure.
 */
export type InstallFailedInfo = {
    /**
     * The metadata of the extension that failed to install.
     */
    extension: ExtensionMetadata;

    /**
     * The error that occurred during the installation.
     */
    error: unknown;
};

type InstalledExtension = {
    metadata: ExtensionMetadata;
    feed: IExtensionFeed;
    isStateChanging: boolean;
    extensionModule?: ExtensionModule;
    registrationToken?: IDisposable;
};

const InstalledExtensionsKey = "Babylon/Extensions/InstalledExtensions";

const ExtensionInstalledKeyPrefix = "Babylon/Extensions/IsExtensionInstalled";
function GetExtensionInstalledKey(name: string): string {
    return `${ExtensionInstalledKeyPrefix}/${name}`;
}

/**
 * Represents a query for loaded extensions.
 */
export interface IExtensionQuery {
    /**
     * The total number of extensions that satisfy the query.
     */
    readonly totalCount: number;

    /**
     * Fetches a range of extensions from the query.
     * @param index The index of the first extension to fetch.
     * @param count The number of extensions to fetch.
     * @returns A promise that resolves to the extensions.
     */
    getExtensionsAsync(index: number, count: number): Promise<IExtension[]>;
}

function GetExtensionIdentity(feed: string, name: string) {
    return `${feed}|${name}`;
}

/**
 * Manages the installation, uninstallation, enabling, and disabling of extensions.
 */
export class ExtensionManager implements IDisposable {
    private readonly _installedExtensions = new Map<string, InstalledExtension>();

    private readonly _stateChangedHandlers = new Map<string, Set<() => void>>();

    private constructor(
        private readonly _serviceContainer: ServiceContainer,
        private readonly _feeds: readonly IExtensionFeed[],
        private readonly _onInstallFailed: (info: InstallFailedInfo) => void
    ) {}

    /**
     * Creates a new instance of the ExtensionManager.
     * This will automatically rehydrate previously installed and enabled extensions.
     * @param serviceContainer The service container to use.
     * @param feeds The extension feeds to include.
     * @param onInstallFailed A callback that is called when an extension installation fails.
     * @returns A promise that resolves to the new instance of the ExtensionManager.
     */
    public static async CreateAsync(
        serviceContainer: ServiceContainer,
        feeds: readonly IExtensionFeed[],
        onInstallFailed: (info: InstallFailedInfo) => void
    ): Promise<ExtensionManager> {
        const extensionManager = new ExtensionManager(serviceContainer, feeds, onInstallFailed);

        // Rehydrate installed extensions.
        const installedExtensionNames = JSON.parse(localStorage.getItem(InstalledExtensionsKey) ?? "[]") as string[];
        for (const installedExtensionName of installedExtensionNames) {
            const installedExtensionRaw = localStorage.getItem(GetExtensionInstalledKey(installedExtensionName));
            if (installedExtensionRaw) {
                const installedExtensionData = JSON.parse(installedExtensionRaw) as {
                    feed: string;
                    metadata: ExtensionMetadata;
                };

                const feed = feeds.find((feed) => feed.name === installedExtensionData.feed);
                if (feed) {
                    const installedExtension = extensionManager._createInstalledExtension(installedExtensionData.metadata, feed);
                    extensionManager._installedExtensions.set(installedExtension.metadata.name, installedExtension);
                }
            }
        }

        // Load installed and enabled extensions.
        const enablePromises: Promise<void>[] = [];
        for (const extension of extensionManager._installedExtensions.values()) {
            enablePromises.push(
                (async () => {
                    try {
                        await extensionManager._enableAsync(extension.metadata, false, false);
                    } catch {
                        // If enabling the extension fails, uninstall it. The extension install fail callback will still be called,
                        // so the owner of the ExtensionManager instance can decide what to do with the error.
                        await extensionManager._uninstallAsync(extension.metadata, false);
                    }
                })()
            );
        }

        await Promise.all(enablePromises);

        return extensionManager;
    }

    /**
     * Gets the names of the feeds that are included in the extension manager.
     * @returns The names of the feeds.
     */
    public get feedNames() {
        return this._feeds.map((feed) => feed.name);
    }

    /**
     * Queries the extension manager for extensions.
     * @param filter The filter to apply to the query.
     * @param feeds The feeds to include in the query.
     * @param installedOnly Whether to only include installed extensions.
     * @returns A promise that resolves to the extension query.
     */
    public async queryExtensionsAsync(filter = "", feeds: string[] = this.feedNames, installedOnly = false): Promise<IExtensionQuery> {
        if (installedOnly) {
            const installedExtensions = Array.from(this._installedExtensions.values()).filter((installedExtension) => feeds.includes(installedExtension.feed.name));
            return {
                totalCount: installedExtensions.length,
                getExtensionsAsync: async (index, count) => {
                    return installedExtensions.slice(index, index + count).map((installedExtension) => this._createExtension(installedExtension.metadata, installedExtension.feed));
                },
            };
        }

        const queries = await Promise.all(
            this._feeds.filter((feed) => feeds.includes(feed.name)).map(async (feed) => Object.assign(await feed.queryExtensionsAsync(filter), { feed }))
        );
        const totalCount = queries.reduce((sum, query) => sum + query.totalCount, 0);

        return {
            totalCount,
            getExtensionsAsync: async (index, count) => {
                const extensions = new Array<IExtension>();
                let remaining = count;

                for (const query of queries) {
                    if (remaining <= 0) {
                        break;
                    }

                    if (index >= query.totalCount) {
                        index -= query.totalCount;
                        continue;
                    }

                    // This is intentionally sequential as we are querying for results until the count of results is met.
                    // eslint-disable-next-line no-await-in-loop
                    const metadataSlice = await query.getExtensionMetadataAsync(index, remaining);
                    extensions.push(...metadataSlice.map((metadata) => this._createExtension(metadata, query.feed)));
                    remaining -= metadataSlice.length;
                    index = 0;
                }

                return extensions;
            },
        };
    }

    /**
     * Disposes the extension manager.
     */
    public dispose() {
        for (const installedExtension of this._installedExtensions.values()) {
            // eslint-disable-next-line github/no-then
            this._disableAsync(installedExtension.metadata, false).catch((error) => {
                Logger.Warn(`Failed to disable extension ${installedExtension.metadata.name}: ${error}`);
            });
        }

        this._stateChangedHandlers.clear();
    }

    private async _installAsync(metadata: ExtensionMetadata, feed: IExtensionFeed, isNestedStateChange: boolean): Promise<InstalledExtension> {
        let installedExtension = this._installedExtensions.get(metadata.name);

        if (!installedExtension) {
            installedExtension = this._createInstalledExtension(metadata, feed);
            installedExtension.isStateChanging = true;
            this._installedExtensions.set(metadata.name, installedExtension);

            try {
                // Enable the extension.
                await this._enableAsync(metadata, true, true);
            } catch (error) {
                this._installedExtensions.delete(metadata.name);
                throw error;
            } finally {
                !isNestedStateChange && (installedExtension.isStateChanging = false);
            }

            // Mark the extension as being installed.
            localStorage.setItem(
                GetExtensionInstalledKey(GetExtensionIdentity(feed.name, metadata.name)),
                JSON.stringify({
                    feed: feed.name,
                    metadata,
                })
            );
            localStorage.setItem(
                InstalledExtensionsKey,
                JSON.stringify(Array.from(this._installedExtensions.values()).map((extension) => GetExtensionIdentity(extension.feed.name, extension.metadata.name)))
            );
        }

        return installedExtension;
    }

    private async _uninstallAsync(metadata: ExtensionMetadata, isNestedStateChange: boolean): Promise<void> {
        const installedExtension = this._installedExtensions.get(metadata.name);
        if (installedExtension && (isNestedStateChange || !installedExtension.isStateChanging)) {
            try {
                !isNestedStateChange && (installedExtension.isStateChanging = true);

                // Disable the extension.
                await this._disableAsync(metadata, true);

                // Remove the extension from in memory.
                this._installedExtensions.delete(metadata.name);

                // Mark the extension as being uninstalled.
                localStorage.removeItem(GetExtensionInstalledKey(GetExtensionIdentity(installedExtension.feed.name, metadata.name)));
                localStorage.setItem(InstalledExtensionsKey, JSON.stringify(Array.from(this._installedExtensions.keys())));
            } finally {
                !isNestedStateChange && (installedExtension.isStateChanging = false);
            }
        }
    }

    private async _enableAsync(metadata: ExtensionMetadata, isInitialInstall: boolean, isNestedStateChange: boolean): Promise<void> {
        const installedExtension = this._installedExtensions.get(metadata.name);
        if (installedExtension && (isNestedStateChange || !installedExtension.isStateChanging)) {
            try {
                !isNestedStateChange && (installedExtension.isStateChanging = true);

                // If we haven't done so already, load the extension module.
                if (!installedExtension.extensionModule) {
                    installedExtension.extensionModule = await installedExtension.feed.getExtensionModuleAsync(metadata.name);
                }

                if (!installedExtension.extensionModule) {
                    throw new Error(`Unable to load extension module for "${metadata.name}" from feed "${installedExtension.feed.name}".`);
                }

                // Register the ServiceDefinitions.
                let servicesRegistrationToken: Nullable<IDisposable> = null;
                if (installedExtension.extensionModule.default.serviceDefinitions) {
                    servicesRegistrationToken = await this._serviceContainer.addServicesAsync(...installedExtension.extensionModule.default.serviceDefinitions);
                }

                // Create a registration token to for dispose.
                installedExtension.registrationToken = {
                    dispose: () => {
                        servicesRegistrationToken?.dispose();
                    },
                };
            } catch (error: unknown) {
                this._onInstallFailed({
                    extension: metadata,
                    error,
                });
                throw error;
            } finally {
                !isNestedStateChange && (installedExtension.isStateChanging = false);
            }
        }
    }

    private async _disableAsync(metadata: ExtensionMetadata, isNestedStateChange: boolean): Promise<void> {
        const installedExtension = this._installedExtensions.get(metadata.name);
        if (installedExtension && (isNestedStateChange || !installedExtension.isStateChanging)) {
            try {
                !isNestedStateChange && (installedExtension.isStateChanging = true);

                // Unregister the service registrations.
                installedExtension.registrationToken?.dispose();
            } finally {
                !isNestedStateChange && (installedExtension.isStateChanging = false);
            }
        }
    }

    private _addStateChangedHandler(metadata: ExtensionMetadata, handler: () => void): IDisposable {
        let stateChangedHandlers = this._stateChangedHandlers.get(metadata.name);
        if (!stateChangedHandlers) {
            this._stateChangedHandlers.set(metadata.name, (stateChangedHandlers = new Set()));
        }

        stateChangedHandlers.add(handler);

        return {
            dispose: () => {
                stateChangedHandlers.delete(handler);
                if (stateChangedHandlers.size === 0) {
                    this._stateChangedHandlers.delete(metadata.name);
                }
            },
        };
    }

    private _createExtension(metadata: ExtensionMetadata, feed: IExtensionFeed): IExtension {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const extensionManager = this;
        return {
            metadata,
            get isStateChanging() {
                return extensionManager._installedExtensions.get(metadata.name)?.isStateChanging ?? false;
            },
            get isInstalled() {
                return extensionManager._installedExtensions.has(metadata.name);
            },
            installAsync: async () => {
                await extensionManager._installAsync(metadata, feed, false);
            },
            uninstallAsync: async () => await extensionManager._uninstallAsync(metadata, false),
            addStateChangedHandler: (handler: () => void) => extensionManager._addStateChangedHandler(metadata, handler),
        };
    }

    private _createInstalledExtension(metadata: ExtensionMetadata, feed: IExtensionFeed): InstalledExtension {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const extensionManager = this;
        let isStateChanging = false;
        return {
            metadata,
            feed,
            get isStateChanging() {
                return isStateChanging;
            },
            set isStateChanging(value) {
                if (value !== isStateChanging) {
                    isStateChanging = value;
                    extensionManager._stateChangedHandlers.get(this.metadata.name)?.forEach((handler) => handler());
                }
            },
        };
    }
}
