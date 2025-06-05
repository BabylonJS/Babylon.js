// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";

import type { ComponentType, FunctionComponent } from "react";
import type { IExtensionFeed } from "./extensibility/extensionFeed";
import type { IExtension } from "./extensibility/extensionManager";
import type { WeaklyTypedServiceDefinition } from "./modularity/serviceContainer";
import type { IRootComponentService, ShellServiceOptions } from "./services/shellService";

import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, FluentProvider, makeStyles, Spinner } from "@fluentui/react-components";
import { createElement, Suspense, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useTernaryDarkMode } from "usehooks-ts";

import { Logger } from "core/Misc";
import { Deferred } from "core/Misc/deferred";

import { ExtensionManagerContext } from "./contexts/extensionManagerContext";
import { ExtensionManager } from "./extensibility/extensionManager";
import { ServiceContainer } from "./modularity/serviceContainer";
import { ExtensionListServiceDefinition } from "./services/extensionsListService";
import { MakeShellServiceDefinition, RootComponentServiceIdentity } from "./services/shellService";
import { ThemeSelectorServiceDefinition } from "./services/themeSelectorService";
//import { DarkTheme, LightTheme } from "./themes/babylonTheme";
import { webDarkTheme as DarkTheme, webLightTheme as LightTheme } from "@fluentui/react-components";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    app: {
        colorScheme: "light dark",
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
    },
    spinner: {
        flexGrow: 1,
        animationDuration: "1s",
        animationName: {
            from: { opacity: 0 },
            to: { opacity: 1 },
        },
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
     * Whether the tool should allow user selection of the theme (e.g. dark/light/system).
     */
    isThemeable?: boolean;

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
    const { containerElement, serviceDefinitions, isThemeable = true, extensionFeeds = [] } = options;

    const modularToolRootComponent: FunctionComponent = () => {
        const classes = useStyles();
        const [extensionManagerContext, setExtensionManagerContext] = useState<ExtensionManagerContext>();
        const { isDarkMode } = useTernaryDarkMode();
        const [requiredExtensions, setRequiredExtensions] = useState<string[]>();
        const [requiredExtensionsDeferred, setRequiredExtensionsDeferred] = useState<Deferred<boolean>>();

        const [rootComponent, setRootComponent] = useState<ComponentType>();

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

                // Register the extension list service (for browsing/installing extensions) if extension feeds are provided.
                if (extensionFeeds.length > 0) {
                    await serviceContainer.addServiceAsync(ExtensionListServiceDefinition);
                }

                // Register the theme selector service (for selecting the theme) if theming is configured.
                if (isThemeable) {
                    await serviceContainer.addServiceAsync(ThemeSelectorServiceDefinition);
                }

                // Register all external services (that make up a unique tool).
                await serviceContainer.addServicesAsync(...serviceDefinitions);

                // Create the extension manager, passing along the registry for runtime changes to the registered services.
                const extensionManager = await ExtensionManager.CreateAsync(serviceContainer, extensionFeeds);

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

        // Show a spinner until a main view has been set.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const Content: ComponentType = rootComponent ?? (() => <Spinner className={classes.spinner} />);

        return (
            <ExtensionManagerContext.Provider value={extensionManagerContext}>
                <FluentProvider className={classes.app} theme={isDarkMode ? DarkTheme : LightTheme}>
                    <>
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
                        <Suspense fallback={<Spinner className={classes.spinner} />}>
                            <Content />
                        </Suspense>
                    </>
                </FluentProvider>
            </ExtensionManagerContext.Provider>
        );
    };

    // Set the container element to be a flex container so that the tool can be displayed properly.
    const originalContainerElementDisplay = containerElement.style.display;
    containerElement.style.display = "flex";

    // Create and render the react root component.
    const reactRoot = createRoot(containerElement);
    reactRoot.render(createElement(modularToolRootComponent));

    return {
        dispose: () => {
            // Unmount and restore the original container element display.
            reactRoot.unmount();
            containerElement.style.display = originalContainerElementDisplay;
        },
    };
}
