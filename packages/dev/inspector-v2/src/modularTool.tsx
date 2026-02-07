import type { Theme as FluentTheme } from "@fluentui/react-components";
import type { ComponentType, FunctionComponent } from "react";
import type { TernaryDarkMode } from "usehooks-ts";

import type { IDisposable } from "core/index";
import type { IExtensionFeed } from "./extensibility/extensionFeed";
import type { IExtension, InstallFailedInfo } from "./extensibility/extensionManager";
import type { WeaklyTypedServiceDefinition } from "./modularity/serviceContainer";
import type { IRootComponentService, ShellServiceOptions } from "./services/shellService";
import type { IThemeService } from "./services/themeService";

import {
    Body1,
    Button,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    List,
    ListItem,
    makeStyles,
    Spinner,
    tokens,
} from "@fluentui/react-components";
import { ErrorCircleRegular } from "@fluentui/react-icons";
import { createElement, Suspense, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { Deferred } from "core/Misc/deferred";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { ToastProvider } from "shared-ui-components/fluent/primitives/toast";
import { Theme, useTheme } from "./components/theme";
import { ExtensionManagerContext } from "./contexts/extensionManagerContext";
import { ExtensionManager } from "./extensibility/extensionManager";
import { SetThemeMode } from "./hooks/themeHooks";
import { ServiceContainer } from "./modularity/serviceContainer";
import { MakeShellServiceDefinition, RootComponentServiceIdentity } from "./services/shellService";
import { ThemeSelectorServiceDefinition } from "./services/themeSelectorService";
import { ThemeServiceIdentity } from "./services/themeService";

const useStyles = makeStyles({
    app: {
        colorScheme: "light dark",
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: tokens.colorTransparentBackground,
    },
    spinner: {
        flexGrow: 1,
        animationDuration: "1s",
        animationName: {
            from: { opacity: 0 },
            to: { opacity: 1 },
        },
    },
    extensionErrorTitleDiv: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    extensionErrorIcon: {
        color: tokens.colorPaletteRedForeground1,
    },
});

export type ModularToolOptions = {
    /**
     * The container element where the tool will be rendered.
     */
    containerElement: HTMLElement;

    /**
     * The service definitions to be registered with the tool.
     */
    serviceDefinitions: readonly WeaklyTypedServiceDefinition[];

    /**
     * The theme mode to use. If not specified, the default is "system", which uses the system/browser preference, and the last used mode is persisted.
     */
    themeMode?: TernaryDarkMode;

    /**
     * Whether to show the theme selector in the toolbar. Default is true.
     */
    showThemeSelector?: boolean;

    /**
     * The extension feeds that provide optional extensions the user can install.
     */
    extensionFeeds?: readonly IExtensionFeed[];
} & ShellServiceOptions;

/**
 * Creates a modular tool with a base set of common tool services, including the toolbar/side pane basic UI layout.
 * @param options The options for the tool.
 * @returns A token that can be used to dispose of the tool.
 */
export function MakeModularTool(options: ModularToolOptions): IDisposable {
    const { containerElement, serviceDefinitions, themeMode, showThemeSelector = true, extensionFeeds = [] } = options;
    if (themeMode) {
        SetThemeMode(themeMode);
    }

    let theme: FluentTheme;
    const themeChangedObservable = new Observable<void>();

    const modularToolRootComponent: FunctionComponent = () => {
        const classes = useStyles();
        const [extensionManagerContext, setExtensionManagerContext] = useState<ExtensionManagerContext>();
        const [requiredExtensions, setRequiredExtensions] = useState<string[]>();
        const [requiredExtensionsDeferred, setRequiredExtensionsDeferred] = useState<Deferred<boolean>>();
        const [extensionInstallError, setExtensionInstallError] = useState<InstallFailedInfo>();

        const [rootComponent, setRootComponent] = useState<ComponentType>();

        theme = useTheme();

        useEffect(() => {
            themeChangedObservable.notifyObservers();
        }, [theme]);

        // This is the main async initialization.
        useEffect(() => {
            const initializeExtensionManagerAsync = async () => {
                const serviceContainer = new ServiceContainer("ModularToolContainer");

                // Register the shell service (top level toolbar/side pane UI layout).
                await serviceContainer.addServiceAsync(MakeShellServiceDefinition(options));

                // Register a service that simply consumes the IRootComponentService and sets the root component as state so it can be rendered.
                await serviceContainer.addServiceAsync<[], [IRootComponentService]>({
                    friendlyName: "Root Component Bootstrapper",
                    consumes: [RootComponentServiceIdentity],
                    factory: (rootComponentService) => {
                        // Use function syntax for the state setter since the root component may be a function component.
                        setRootComponent(() => rootComponentService.rootComponent);
                        return {
                            dispose: () => setRootComponent(undefined),
                        };
                    },
                });

                // Register a service that exposes the raw theme to other services outside the React tree.
                // React components can access the raw theme via the useTheme hook, or theme tokens via Fluent's tokens object.
                await serviceContainer.addServiceAsync<[IThemeService], []>({
                    friendlyName: "Theme Service",
                    produces: [ThemeServiceIdentity],
                    factory: () => {
                        return {
                            get theme() {
                                return theme;
                            },
                            onChanged: themeChangedObservable,
                        };
                    },
                });

                // Register the extension list service (for browsing/installing extensions) if extension feeds are provided.
                if (extensionFeeds.length > 0) {
                    const { ExtensionListServiceDefinition } = await import("./services/extensionsListService");
                    await serviceContainer.addServiceAsync(ExtensionListServiceDefinition);
                }

                // Register the theme selector service (for selecting the theme) if theming is configured.
                if (showThemeSelector) {
                    await serviceContainer.addServiceAsync(ThemeSelectorServiceDefinition);
                }

                // Register all external services (that make up a unique tool).
                await serviceContainer.addServicesAsync(...serviceDefinitions);

                // Create the extension manager, passing along the registry for runtime changes to the registered services.
                const extensionManager = await ExtensionManager.CreateAsync(serviceContainer, extensionFeeds, setExtensionInstallError);

                // Check query params for required extensions. This lets users share links with sets of extensions.
                const queryParams = new URLSearchParams(window.location.search);
                const requiredExtensions = queryParams.getAll("babylon.requiredExtension");
                const uninstalledExtensions: IExtension[] = [];
                for (const requiredExtension of requiredExtensions) {
                    // These could possibly be parallelized to speed things up, but it's more complex so let's wait and see if we need it.
                    // eslint-disable-next-line no-await-in-loop
                    const query = await extensionManager.queryExtensionsAsync(requiredExtension);
                    // eslint-disable-next-line no-await-in-loop
                    const extensions = await query.getExtensionsAsync(0, query.totalCount);
                    for (const extension of extensions) {
                        if (!extension.isInstalled) {
                            uninstalledExtensions.push(extension);
                        }
                    }
                }

                // Check if any required extensions are uninstalled or disabled. If so, show a dialog to the user.
                if (uninstalledExtensions.length > 0) {
                    setRequiredExtensions(uninstalledExtensions.map((extension) => extension.metadata.name));
                    const deferred = new Deferred<boolean>();
                    setRequiredExtensionsDeferred(deferred);
                    if (await deferred.promise) {
                        for (const extension of uninstalledExtensions) {
                            // This could possibly be parallelized to speed things up, but it's more complex so let's wait and see if we need it.
                            // eslint-disable-next-line no-await-in-loop
                            await extension.installAsync();
                        }
                    }
                }

                // Set the contexts.
                setExtensionManagerContext({ extensionManager });

                return () => {
                    extensionManager.dispose();
                    serviceContainer.dispose();
                    serviceContainer.dispose();
                };
            };

            const disposePromise = initializeExtensionManagerAsync();

            return () => {
                disposePromise
                    // eslint-disable-next-line github/no-then
                    .then((dispose) => dispose())
                    // eslint-disable-next-line github/no-then
                    .catch((error) => {
                        Logger.Error(`Failed to dispose of the modular tool: ${error}`);
                    });
            };
        }, []);

        const onAcceptRequiredExtensions = useCallback(() => {
            setRequiredExtensions(undefined);
            requiredExtensionsDeferred?.resolve(true);
        }, [setRequiredExtensions, requiredExtensionsDeferred]);

        const onRejectRequiredExtensions = useCallback(() => {
            setRequiredExtensions(undefined);
            requiredExtensionsDeferred?.resolve(false);
        }, [setRequiredExtensions, requiredExtensionsDeferred]);

        const onAcknowledgedExtensionInstallError = useCallback(() => {
            setExtensionInstallError(undefined);
        }, [setExtensionInstallError]);

        // Show a spinner until a main view has been set.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const Content: ComponentType = rootComponent ?? (() => <Spinner className={classes.spinner} />);

        return (
            <ExtensionManagerContext.Provider value={extensionManagerContext}>
                <Theme className={classes.app}>
                    <ToastProvider>
                        <Dialog open={!!requiredExtensions} modalType="alert">
                            <DialogSurface>
                                <DialogBody>
                                    <DialogTitle>Required Extensions</DialogTitle>
                                    <DialogContent>
                                        Opening this URL requires the following extensions to be installed and enabled:
                                        <ul>{requiredExtensions?.map((name) => <li key={name}>{name}</li>)}</ul>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button appearance="primary" onClick={onAcceptRequiredExtensions}>
                                            Install & Enable
                                        </Button>
                                        <Button appearance="secondary" onClick={onRejectRequiredExtensions}>
                                            No Thanks
                                        </Button>
                                    </DialogActions>
                                </DialogBody>
                            </DialogSurface>
                        </Dialog>
                        <Dialog open={!!extensionInstallError} modalType="alert">
                            <DialogSurface>
                                <DialogBody>
                                    <DialogTitle>
                                        <div className={classes.extensionErrorTitleDiv}>
                                            Extension Install Error
                                            <ErrorCircleRegular className={classes.extensionErrorIcon} />
                                        </div>
                                    </DialogTitle>
                                    <DialogContent>
                                        <List>
                                            <ListItem>
                                                <Body1>{`Extension "${extensionInstallError?.extension.name}" failed to install and was removed.`}</Body1>
                                            </ListItem>
                                            <ListItem>
                                                <Body1>{`${extensionInstallError?.error}`}</Body1>
                                            </ListItem>
                                        </List>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button appearance="primary" onClick={onAcknowledgedExtensionInstallError}>
                                            Close
                                        </Button>
                                    </DialogActions>
                                </DialogBody>
                            </DialogSurface>
                        </Dialog>
                        <Suspense fallback={<Spinner className={classes.spinner} />}>
                            <Content />
                        </Suspense>
                    </ToastProvider>
                </Theme>
            </ExtensionManagerContext.Provider>
        );
    };

    // Set the container element to be a flex container so that the tool can be displayed properly.
    const originalContainerElementDisplay = containerElement.style.display;
    containerElement.style.display = "flex";

    // Create and render the react root component.
    const reactRoot = createRoot(containerElement);
    reactRoot.render(createElement(modularToolRootComponent));

    let disposed = false;
    return {
        dispose: () => {
            // Unmount and restore the original container element display.
            if (!disposed) {
                disposed = true;
                themeChangedObservable.clear();
                reactRoot.unmount();
                containerElement.style.display = originalContainerElementDisplay;
            }
        },
    };
}
