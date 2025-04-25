// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable } from "core/index";
import type { ComponentType, FunctionComponent } from "react";
import type { AspectContext } from "./contexts/aspectContext";
import type { ExtensionManagerContext } from "./contexts/extensionManagerContext";
import type { Extension } from "./extensibility/extensionManager";
import type { ExtensionFeed } from "./extensibility/extensionFeed";
import type { AspectRegistry, ServiceRegistry, WeaklyTypedAspectDefinition, WeaklyTypedServiceDefinition } from "./modularity/serviceCatalog";
import type { ShellServiceOptions } from "./services/shellService";

import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, FluentProvider, makeStyles, Spinner } from "@fluentui/react-components";
import { Deferred } from "core/Misc/deferred";
import { Observable } from "core/Misc/observable";
import { createRoot } from "react-dom/client";
import { createElement, Suspense, useCallback, useEffect, useState } from "react";
import { useTernaryDarkMode } from "usehooks-ts";
import { AppContext } from "./contexts/appContext";
import { ExtensionManager } from "./extensibility/extensionManager";
import { ObservableCollection } from "./misc/observableCollection";
import { ServiceCatalog } from "./modularity/serviceCatalog";
import { ViewHost } from "./services/viewHost";
import { darkTheme, lightTheme } from "./themes/babylonTheme";

import { MakeShellServiceDefinition } from "./services/shellService";
import { aspectSelectorServiceDefinition } from "./services/aspectSelectorService";
import { extensionListServiceDefinition } from "./services/extensionsListService";
import { themeSelectorServiceDefinition } from "./services/themeSelectorService";

// import { createDOMRenderer, RendererProvider } from "@griffel/react";
// import { createShadowDOMRenderer } from "@griffel/shadow-dom";

const aspectSettingsKey = "Settings/LastActiveAspect";

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

function useViewHostBootstrapper() {
    const [mainViewComponentType, setMainViewComponentType] = useState<ComponentType>();
    const boostrapViewHost = useCallback((serviceCatalog: ServiceCatalog) => {
        return serviceCatalog.registerService<[ViewHost], []>({
            friendlyName: "ViewHost",
            produces: [ViewHost],
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
    containerElement: HTMLElement;
    // containerElement: Element;
    defaultAspect: WeaklyTypedAspectDefinition;
    additionalAspects?: readonly WeaklyTypedAspectDefinition[];
    serviceDefinitions: readonly WeaklyTypedServiceDefinition[];
    isThemeable?: boolean;
    extensionFeeds?: readonly ExtensionFeed[];
} & ShellServiceOptions;

export function MakeModularTool(options: ModularToolOptions): IDisposable {
    const { containerElement, defaultAspect, additionalAspects = [], serviceDefinitions, isThemeable = true, extensionFeeds = [] } = options;
    // const containerElement = options.containerElement;
    // const containerElement = document.getElementById("viewerContainer")!;

    // const documentOrShadowRoot = containerElement.getRootNode() as Document | ShadowRoot;
    // const griffelRenderer = documentOrShadowRoot instanceof ShadowRoot ? createShadowDOMRenderer(documentOrShadowRoot) : createDOMRenderer(documentOrShadowRoot);

    const modularToolRootComponent: FunctionComponent = () => {
        const classes = useStyles();
        const [extensionManagerContext, setExtensionManagerContext] = useState<ExtensionManagerContext>();
        const [aspectContext, setAspectContext] = useState<AspectContext>();
        const { isDarkMode } = useTernaryDarkMode();
        const [requiredExtensions, setRequiredExtensions] = useState<string[]>();
        const [requiredExtensionsDeferred, setRequiredExtensionsDeferred] = useState<Deferred<boolean>>();

        const [mainView, bootstrapViewHost] = useViewHostBootstrapper();

        useEffect(() => {
            const initializeExtensionManager = async () => {
                const serviceCatalog = ServiceCatalog.CreateDynamic();

                let currentAspectDefinition: Nullable<WeaklyTypedAspectDefinition> = null;
                let currentContainer: Promise<Nullable<IDisposable>> = Promise.resolve(null);

                const aspectContext = {
                    get activeAspect() {
                        return currentAspectDefinition ?? null;
                    },
                    activeAspectChanged: new Observable(),
                    availableAspects: new ObservableCollection(),
                } satisfies AspectContext;

                let poppingState = false;

                const registry: AspectRegistry & ServiceRegistry = {
                    registerAspect(aspectDefinition) {
                        const availableAspectToken = aspectContext.availableAspects.add({
                            identity: aspectDefinition.identity,
                            friendlyName: aspectDefinition.friendlyName,
                            activate: () => {
                                if (currentAspectDefinition !== aspectDefinition) {
                                    currentContainer = currentContainer.then((oldContainer) => {
                                        oldContainer?.dispose();
                                        const newContainer = serviceCatalog.createContainer(aspectDefinition.identity);
                                        currentAspectDefinition = aspectDefinition;
                                        localStorage.setItem(aspectSettingsKey, aspectDefinition.identity.toString());
                                        if (aspectDefinition.identity.description) {
                                            if (!poppingState) {
                                                const queryParams = new URLSearchParams(window.location.search);
                                                queryParams.set("inspector.aspect", aspectDefinition.identity.description);
                                                window.history.pushState({}, "", `?${queryParams.toString()}`);
                                            }
                                        }
                                        aspectContext.activeAspectChanged.notifyObservers();
                                        return newContainer;
                                    });
                                }
                            },
                        });

                        const aspectRegistrationToken = serviceCatalog.registerAspect(aspectDefinition);
                        return {
                            dispose: () => {
                                if (currentAspectDefinition === aspectDefinition) {
                                    aspectContext.availableAspects.items[0].activate();
                                }
                                availableAspectToken.dispose();
                                aspectRegistrationToken.dispose();
                            },
                        };
                    },
                    registerServices(...serviceDefinitions) {
                        return serviceCatalog.registerServices(...serviceDefinitions);
                    },
                };

                setAspectContext(aspectContext);

                // Register a ViewHost service (where the main view can be displayed).
                await bootstrapViewHost(serviceCatalog);

                // Register configured aspects.
                registry.registerAspect(defaultAspect);
                additionalAspects.forEach((aspect) => registry.registerAspect(aspect));

                // Register configured services.
                await registry.registerServices(...serviceDefinitions);

                // Register built in services.
                {
                    await registry.registerServices(MakeShellServiceDefinition(options));
                    await registry.registerServices(aspectSelectorServiceDefinition);
                    if (extensionFeeds.length > 0) {
                        await registry.registerServices(extensionListServiceDefinition);
                    }
                    if (isThemeable) {
                        await registry.registerServices(themeSelectorServiceDefinition);
                    }
                }

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

                const extensionManager = await ExtensionManager.CreateAsync(registry, externalDependencies, extensionFeeds);

                const queryParams = new URLSearchParams(window.location.search);
                const requiredExtensions = queryParams.getAll("requiredExtension");
                const uninstalledExtensions: Extension[] = [];
                const disabledExtensions: Extension[] = [];
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

                if (uninstalledExtensions.length > 0 || disabledExtensions.length > 0) {
                    setRequiredExtensions(Array.from(new Set([...uninstalledExtensions, ...disabledExtensions])).map((extension) => extension.metadata.name));
                    const deferred = new Deferred<boolean>();
                    setRequiredExtensionsDeferred(deferred);
                    if (await deferred.promise) {
                        for (const extension of uninstalledExtensions) {
                            await extension.install();
                            disabledExtensions.push(extension);
                        }

                        for (const extension of disabledExtensions) {
                            await extension.enable();
                        }
                    }
                }

                setExtensionManagerContext({ extensionManager });

                let requestedAspect = queryParams.get("inspector.aspect");
                if (requestedAspect) {
                    requestedAspect = `Symbol(${requestedAspect})`;
                } else {
                    requestedAspect = localStorage.getItem(aspectSettingsKey);
                }
                (aspectContext.availableAspects.items.find((aspect) => aspect.identity.toString() === requestedAspect) ?? aspectContext.availableAspects.items[0]).activate();

                const onPopState = () => {
                    let requestedAspect = new URLSearchParams(window.location.search).get("inspector.aspect");
                    if (requestedAspect) {
                        requestedAspect = `Symbol(${requestedAspect})`;
                        poppingState = true;
                        aspectContext.availableAspects.items.find((aspect) => aspect.identity.toString() === requestedAspect)?.activate();
                        poppingState = false;
                    }
                };

                window.addEventListener("popstate", onPopState);

                return () => {
                    window.removeEventListener("popstate", onPopState);
                    extensionManager.dispose();
                    serviceCatalog.dispose();
                };
            };

            const disposePromise = initializeExtensionManager();

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
        const ContentComponentType: ComponentType = mainView ?? (() => <Spinner className={classes.spinner} />);

        return (
            <AppContext.Provider value={{ extensionManagerContext, aspectContext }}>
                {/* <RendererProvider renderer={griffelRenderer}> */}
                <FluentProvider className={classes.app} theme={isDarkMode ? darkTheme : lightTheme}>
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
                {/* </RendererProvider> */}
            </AppContext.Provider>
        );
    };

    const originalContainerElementDisplay = containerElement.style.display;
    containerElement.style.display = "flex";
    const reactRoot = createRoot(containerElement);
    reactRoot.render(createElement(modularToolRootComponent));

    return {
        dispose: () => {
            reactRoot.unmount();
            containerElement.style.display = originalContainerElementDisplay;
        },
    };
}
