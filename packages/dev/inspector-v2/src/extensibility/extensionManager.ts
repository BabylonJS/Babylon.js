// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable } from "core/index";
import type { IServiceRegistry } from "../modularity/serviceCatalog";
import type { IExtensionFeed, ExtensionMetadata, ExtensionModule } from "./extensionFeed";

import { Assert } from "../misc/assert";

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
     * Whether the extension is installed.
     */
    readonly isInstalled: boolean;

    /**
     * Whether the extension is enabled.
     */
    readonly isEnabled: boolean;

    /**
     * Installs the extension.
     */
    installAsync(): Promise<void>;

    /**
     * Uninstalls the extension.
     */
    uninstallAsync(): Promise<void>;

    /**
     * Enables the extension.
     */
    enableAsync(): Promise<void>;

    /**
     * Disables the extension.
     */
    disableAsync(): Promise<void>;

    // TODO: Handle updating.
    // readonly isUpdateAvailable: Promise<boolean>; // installed version is saved locally as part of the metadata (local storage), use this to determine if there is an upgrade. Or auto-upgrade in the background with a service worker?
    // update(): Promise<void>;

    /**
     * Adds a handler that is called when the state of the extension changes.
     * @param handler The handler to add.
     * @returns A disposable that removes the handler when disposed.
     */
    addStateChangedHandler(handler: () => void): IDisposable;
}

type InstalledExtension = {
    metadata: ExtensionMetadata;
    feed: IExtensionFeed;
    isStateChanging: boolean;
    isEnabled: boolean;
    dependents: Set<ExtensionMetadata>;
    extensionModule?: ExtensionModule;
    registrationToken?: IDisposable;
};

const InstalledExtensionsKey = "Babylon/Extensions/InstalledExtensions";

const ExtensionInstalledKeyPrefix = "Babylon/Extensions/IsExtensionInstalled";
function GetExtensionInstalledKey(name: string): string {
    return `${ExtensionInstalledKeyPrefix}/${name}`;
}

function GetExtensionEnabledKey(name: string): string {
    return `Babylon/Extensions/IsExtensionEnabled/${name}`;
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
        private readonly _serviceRegistry: IServiceRegistry,
        private readonly _sharedDependencies: Map<string, unknown>,
        private readonly _feeds: readonly IExtensionFeed[]
    ) {}

    /**
     * Creates a new instance of the ExtensionManager.
     * This will automatically rehydrate previously installed and enabled extensions.
     * @param serviceRegistry The service registry to use.
     * @param externalDependencies The external dependencies, which includes shared libraries as well as other extensions that produce services.
     * @param feeds The extension feeds to include.
     * @returns A promise that resolves to the new instance of the ExtensionManager.
     */
    public static async CreateAsync(serviceRegistry: IServiceRegistry, externalDependencies: Map<string, unknown> = new Map(), feeds: readonly IExtensionFeed[]) {
        const extensionManager = new ExtensionManager(serviceRegistry, externalDependencies, feeds);

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
                    if (installedExtension.metadata.peerDependencies) {
                        for (const dependency of Object.keys(installedExtension.metadata.peerDependencies)) {
                            const installedDependency = extensionManager._installedExtensions.get(dependency);
                            if (installedDependency) {
                                installedDependency.dependents.add(installedExtension.metadata);
                            }
                        }
                    }
                }
            }
        }

        // Load installed and enabled extensions.
        for (const extension of extensionManager._installedExtensions.values()) {
            if (localStorage.getItem(GetExtensionEnabledKey(GetExtensionIdentity(extension.feed.name, extension.metadata.name))) === String(true)) {
                await extensionManager._enableAsync(extension.metadata, false);
            }
        }

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
            this._disableAsync(installedExtension.metadata, false, false);
        }

        this._stateChangedHandlers.clear();
    }

    private async _installAsync(metadata: ExtensionMetadata, feed: IExtensionFeed, isNestedStateChange: boolean): Promise<InstalledExtension> {
        let installedExtension = this._installedExtensions.get(metadata.name);

        if (!installedExtension) {
            installedExtension = this._createInstalledExtension(metadata, feed);
            installedExtension.isStateChanging = true;

            try {
                this._installedExtensions.set(metadata.name, installedExtension);

                // Inspect dependencies for other extensions that need to be installed first.
                if (metadata.peerDependencies) {
                    for (const [name, version] of Object.entries(metadata.peerDependencies)) {
                        if (!this._installedExtensions.has(name)) {
                            // TODO: This just searches for the extension by name, which is fine if all extensions are built and deployed with the host app.
                            //       If we get to the point where extensions can be built and deployed independently, then the solution will probably be more
                            //       complex. We will probably need to resolve the entire dependency graph to find extension versions that are all compatible
                            //       (similar to how npm resolves a versioned dependency graph). The semver package may be able to help with this.
                            const matches = (await Promise.all(this._feeds.map((feed) => feed.getExtensionMetadataAsync(name)))).filter((extension) => !!extension);
                            if (matches.length > 1) {
                                throw new Error(`Ambiguous dependency: ${name}@${version}`);
                            }

                            const metadata = matches[0];
                            if (metadata) {
                                const dependency = await this._installAsync(metadata, feed, false);
                                dependency.dependents.add(metadata);
                            }
                        }
                    }
                }

                // Save the extension to the client.
                await feed.saveExtensionToClientAsync(metadata.name, metadata.version);

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

                // Enable the extension.
                await this._enableAsync(metadata, true);
            } catch (error) {
                this._installedExtensions.delete(metadata.name);
                throw error;
            } finally {
                !isNestedStateChange && (installedExtension.isStateChanging = false);
            }
        }

        return installedExtension;
    }

    private async _uninstallAsync(metadata: ExtensionMetadata, isNestedStateChange: boolean): Promise<void> {
        const installedExtension = this._installedExtensions.get(metadata.name);
        if (installedExtension && (isNestedStateChange || !installedExtension.isStateChanging)) {
            try {
                !isNestedStateChange && (installedExtension.isStateChanging = true);

                // Inspect dependents for other extensions that need to be uninstalled first.
                for (const dependent of installedExtension.dependents) {
                    await this._uninstallAsync(dependent, false);
                }

                // Disable the extension.
                await this._disableAsync(metadata, true, true);

                // Remove the extension from in memory.
                this._installedExtensions.delete(metadata.name);

                // Remove dependent from dependencies
                if (metadata.peerDependencies) {
                    for (const name of Object.keys(metadata.peerDependencies)) {
                        const dependency = this._installedExtensions.get(name);
                        if (dependency) {
                            dependency.dependents.delete(metadata);
                        }
                    }
                }

                // Mark the extension as being uninstalled.
                localStorage.removeItem(GetExtensionInstalledKey(GetExtensionIdentity(installedExtension.feed.name, metadata.name)));
                localStorage.setItem(InstalledExtensionsKey, JSON.stringify(Array.from(this._installedExtensions.keys())));

                // Remove the extension from the client.
                await installedExtension.feed.removeExtensionFromClient(metadata.name, metadata.version);
            } finally {
                !isNestedStateChange && (installedExtension.isStateChanging = false);
            }
        }
    }

    private async _enableAsync(metadata: ExtensionMetadata, isNestedStateChange: boolean): Promise<void> {
        const installedExtension = this._installedExtensions.get(metadata.name);
        if (installedExtension && !installedExtension.isEnabled && (isNestedStateChange || !installedExtension.isStateChanging)) {
            try {
                !isNestedStateChange && (installedExtension.isStateChanging = true);

                // Inspect dependencies for other extensions that need to be enabled first.
                if (metadata.peerDependencies) {
                    for (const name of Object.keys(metadata.peerDependencies)) {
                        const dependency = this._installedExtensions.get(name);
                        if (dependency) {
                            await this._enableAsync(dependency.metadata, false);
                        }
                    }
                }

                // If we haven't done so already, load the extension script from the cache, execute it (eval or <script>), get the resulting list of ServiceDefinitions.
                if (!installedExtension.extensionModule) {
                    installedExtension.extensionModule = await installedExtension.feed.getExtensionModuleAsync(metadata.name, metadata.version);
                }

                Assert(installedExtension.extensionModule);

                // Register the ServiceDefinitions.
                //const serviceRegistrationTokens: IDisposable[] = [];
                let servicesRegistrationToken: Nullable<IDisposable> = null;
                if (installedExtension.extensionModule.default.serviceDefinitions) {
                    servicesRegistrationToken = await this._serviceRegistry.registerServicesAsync(...installedExtension.extensionModule.default.serviceDefinitions);
                }

                // Store the shared dependencies.
                this._sharedDependencies.set(metadata.name, installedExtension.extensionModule);

                // Create a registration token to for dispose.
                installedExtension.registrationToken = {
                    dispose: () => {
                        this._sharedDependencies.delete(metadata.name);
                        servicesRegistrationToken?.dispose();
                    },
                };

                // Mark the extension as being enabled
                localStorage.setItem(GetExtensionEnabledKey(GetExtensionIdentity(installedExtension.feed.name, metadata.name)), true.toString());
                installedExtension.isEnabled = true;
            } finally {
                !isNestedStateChange && (installedExtension.isStateChanging = false);
            }
        }
    }

    private async _disableAsync(metadata: ExtensionMetadata, isNestedStateChange: boolean, permanent: boolean): Promise<void> {
        const installedExtension = this._installedExtensions.get(metadata.name);
        if (installedExtension?.isEnabled && (isNestedStateChange || !installedExtension.isStateChanging)) {
            try {
                !isNestedStateChange && (installedExtension.isStateChanging = true);

                // Inspect dependents for other extensions that need to be disabled first.
                for (const dependent of installedExtension.dependents) {
                    await this._disableAsync(dependent, false, permanent);
                }

                // Mark the extension as being disabled.
                installedExtension.isEnabled = false;
                if (permanent) {
                    localStorage.removeItem(GetExtensionEnabledKey(GetExtensionIdentity(installedExtension.feed.name, metadata.name)));
                }

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
            get isEnabled() {
                return extensionManager._installedExtensions.get(metadata.name)?.isEnabled ?? false;
            },
            installAsync: async () => {
                await extensionManager._installAsync(metadata, feed, false);
            },
            uninstallAsync: () => extensionManager._uninstallAsync(metadata, false),
            enableAsync: () => extensionManager._enableAsync(metadata, false),
            disableAsync: () => extensionManager._disableAsync(metadata, false, true),
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
            isEnabled: false,
            dependents: new Set<ExtensionMetadata>(),
        };
    }
}
