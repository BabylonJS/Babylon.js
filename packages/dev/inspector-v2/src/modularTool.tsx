// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";

import type { ComponentType, FunctionComponent } from "react";
import type { IExtensionFeed } from "./extensibility/extensionFeed";
import type { IExtension } from "./extensibility/extensionManager";
import type { WeaklyTypedServiceDefinition } from "./modularity/serviceCatalog";
import type { ShellServiceOptions } from "./services/shellService";
import type { IViewHost } from "./services/viewHost";

import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, FluentProvider, makeStyles, Spinner } from "@fluentui/react-components";
import { createElement, Suspense, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { Deferred } from "core/Misc/deferred";
import { useTernaryDarkMode } from "usehooks-ts";
import { ExtensionManagerContext } from "./contexts/extensionManagerContext";
import { ExtensionManager } from "./extensibility/extensionManager";
import { ServiceCatalog } from "./modularity/serviceCatalog";
import { ExtensionListServiceDefinition } from "./services/extensionsListService";
import { MakeShellServiceDefinition } from "./services/shellService";
import { ThemeSelectorServiceDefinition } from "./services/themeSelectorService";
import { ViewHostIdentity } from "./services/viewHost";
import { DarkTheme, LightTheme } from "./themes/babylonTheme";

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

// This custom hook is a helper that:
// 1. Adds a ViewHost service with a getter/setter for the main view component.
// 2. Provides the main view component as state (so as soon as the main view is set, the component can be rendered).
// eslint-disable-next-line @typescript-eslint/naming-convention
function useViewHostBootstrapper() {
    const [mainViewComponentType, setMainViewComponentType] = useState<ComponentType>();
    const boostrapViewHost = useCallback((serviceCatalog: ServiceCatalog) => {
        return serviceCatalog.registerService<[IViewHost], []>({
            friendlyName: "ViewHost",
            produces: [ViewHostIdentity],
            factory: () => {
                return {
                    get mainView() {
                        return mainViewComponentType;
                    },
                    // MainView is a FunctionComponent and can't be set directly as state since React will interpret it as a lazy value provider and invoke the function component.
                    set mainView(mainView: ComponentType | undefined) {
                        setMainViewComponentType(() => mainView);
                    },
                    dispose: () => setMainViewComponentType(undefined),
                };
            },
        });
    }, []);

    return [mainViewComponentType, boostrapViewHost] as const;
}

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

        const [mainView, bootstrapViewHost] = useViewHostBootstrapper();

        // This is the main async initialization.
        useEffect(() => {
            const initializeExtensionManagerAsync = async () => {
                const serviceCatalog = new ServiceCatalog();

                // Register a ViewHost service (where the main view can be displayed).
                await bootstrapViewHost(serviceCatalog);

                // Register built in services.
                {
                    await serviceCatalog.registerServicesAsync(MakeShellServiceDefinition(options));
                    if (extensionFeeds.length > 0) {
                        await serviceCatalog.registerServicesAsync(ExtensionListServiceDefinition);
                    }
                    if (isThemeable) {
                        await serviceCatalog.registerServicesAsync(ThemeSelectorServiceDefinition);
                    }
                }

                // Register configured services.
                await serviceCatalog.registerServicesAsync(...serviceDefinitions);

                // Dynamically load entire modules for shared dependencies since we can't know what parts a dynamic extension might use.
                // TODO: Try to replace this with import maps.
                // TODO: Re-enable this when we want to support dynamic extensions.
                const externalDependencies = new Map<string, unknown>([
                    // // eslint-disable-next-line import/no-internal-modules
                    // ["@babylonjs/inspector", await import("./index")],
                    // ["@babylonjs/core", await import("@dev/core")],
                    // ["@babylonjs/loaders", await import("@dev/loaders")],
                    // ["@babylonjs/materials", await import("@dev/materials")],
                    // // ["@babylonjs/viewer", await import("@tools/viewer")],
                    // ["@fluentui/react-components", await import("@fluentui/react-components")],
                    // ["@fluentui/react-icons", await import("@fluentui/react-icons")],
                    // ["react", await import("react")],
                    // ["react-dom", await import("react-dom")],
                    // ["react/jsx-runtime", await import("react/jsx-runtime")],
                ]);

                // Create the extension manager, passing along the registry for runtime changes to the registered services.
                const extensionManager = await ExtensionManager.CreateAsync(serviceCatalog, externalDependencies, extensionFeeds);

                // Check query params for required extensions. This lets users share links with sets of extensions.
                const queryParams = new URLSearchParams(window.location.search);
                const requiredExtensions = queryParams.getAll("babylon.requiredExtension");
                const uninstalledExtensions: IExtension[] = [];
                const disabledExtensions: IExtension[] = [];
                for (const requiredExtension of requiredExtensions) {
                    const query = await extensionManager.queryExtensionsAsync(requiredExtension);
                    const extensions = await query.getExtensionsAsync(0, query.totalCount);
                    for (const extension of extensions) {
                        if (!extension.isInstalled) {
                            uninstalledExtensions.push(extension);
                        }
                        if (!extension.isEnabled) {
                            disabledExtensions.push(extension);
                        }
                    }
                }

                // Check if any required extensions are uninstalled or disabled. If so, show a dialog to the user.
                if (uninstalledExtensions.length > 0 || disabledExtensions.length > 0) {
                    setRequiredExtensions(Array.from(new Set([...uninstalledExtensions, ...disabledExtensions])).map((extension) => extension.metadata.name));
                    const deferred = new Deferred<boolean>();
                    setRequiredExtensionsDeferred(deferred);
                    if (await deferred.promise) {
                        for (const extension of uninstalledExtensions) {
                            await extension.installAsync();
                            disabledExtensions.push(extension);
                        }

                        for (const extension of disabledExtensions) {
                            await extension.enableAsync();
                        }
                    }
                }

                const serviceContainer = await serviceCatalog.createContainerAsync("ModularToolContainer");

                // Set the contexts.
                setExtensionManagerContext({ extensionManager });

                return () => {
                    extensionManager.dispose();
                    serviceContainer.dispose();
                    serviceCatalog.dispose();
                };
            };

            const disposePromise = initializeExtensionManagerAsync();

            return () => {
                disposePromise.then((dispose) => dispose());
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

        // eslint-disable-next-line @typescript-eslint/naming-convention
        // Show a spinner until a main view has been set.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const ContentComponentType: ComponentType = mainView ?? (() => <Spinner className={classes.spinner} />);

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
                            <ContentComponentType />
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
