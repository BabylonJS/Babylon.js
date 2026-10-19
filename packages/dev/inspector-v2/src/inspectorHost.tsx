import { useEffect, useRef } from "react";

import { AsyncLock } from "core/Misc/asyncLock";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { type WeaklyTypedServiceDefinition, type ServiceContainer } from "shared-ui-components/modularTool/modularity/serviceContainer";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { MakeModularTool, type ModularToolOptions } from "shared-ui-components/modularTool/modularTool";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { type InspectorOptions, type InspectorToken } from "./inspector.common";

type DisposeAction = () => void | Promise<void>;

type InspectorProductConfiguration = {
    serviceDefinitions: readonly WeaklyTypedServiceDefinition[];
    parentContainer?: ServiceContainer;
    extensionFeeds?: ModularToolOptions["extensionFeeds"];
    dispose?: DisposeAction;
};

type InspectorHostConfiguration = {
    renderingCanvas: HTMLCanvasElement | null;
    resize: () => void;
    startAutoResize?: () => DisposeAction;
    initialize: (options: Readonly<Partial<InspectorOptions>>) => InspectorProductConfiguration;
    registerTargetDisposed?: (disposeInspector: () => void) => DisposeAction;
};

const InspectorTokens = new WeakMap<object, InspectorToken>();
const InspectorLock = new AsyncLock();

/**
 * Hosts a product-specific Inspector configuration using the shared Inspector lifecycle and layout.
 * @param target The object associated with this Inspector instance.
 * @param options Inspector hosting and modular tool options.
 * @param configuration Product-specific services and engine lifecycle behavior.
 * @returns A token that can be disposed to hide Inspector.
 */
export function _ShowInspector(target: object, options: Partial<InspectorOptions>, configuration: InspectorHostConfiguration): InspectorToken {
    void InspectorTokens.get(target)?.dispose();

    let disposeAsync = async () => {
        if (InspectorTokens.get(target) === inspectorToken) {
            InspectorTokens.delete(target);
        }
    };
    let isDisposed = false;
    const onDisposed = new Observable<void>();
    const inspectorToken = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        async dispose(): Promise<void> {
            await InspectorLock.lockAsync(async () => {
                if (isDisposed) {
                    return;
                }

                await disposeAsync();
                isDisposed = true;
                onDisposed.notifyObservers();
                onDisposed.clear();
            });
        },
        get isDisposed() {
            return isDisposed;
        },
        get onDisposed() {
            return onDisposed;
        },
    } as const satisfies InspectorToken;

    InspectorTokens.set(target, inspectorToken);

    options = {
        autoResizeEngine: true,
        layoutMode: "overlay",
        ...options,
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    InspectorLock.lockAsync(() => {
        const { renderingCanvas } = configuration;
        let parentElement = options.containerElement ?? null;

        if (!parentElement) {
            parentElement = renderingCanvas;
            while (parentElement) {
                const rootNode = parentElement.getRootNode();
                if (rootNode instanceof ShadowRoot) {
                    parentElement = rootNode.host.parentElement;
                } else {
                    break;
                }
            }

            if (renderingCanvas && parentElement === renderingCanvas) {
                parentElement = renderingCanvas.parentElement;
            }

            parentElement ??= document.body;
        }

        if (!parentElement) {
            Logger.Warn("Unable to find a parent element to host Inspector.");
            return;
        }

        const disposeActions: DisposeAction[] = [];
        let disposed = false;
        disposeAsync = async () => {
            if (disposed) {
                return;
            }
            disposed = true;

            for (const disposeAction of disposeActions.reverse()) {
                const result = disposeAction();
                if (result) {
                    // eslint-disable-next-line no-await-in-loop
                    await result;
                }
            }
        };

        disposeActions.push(() => {
            if (options.autoResizeEngine) {
                configuration.resize();
            }
        });

        const productConfiguration = configuration.initialize(options);
        if (productConfiguration.dispose) {
            disposeActions.push(productConfiguration.dispose);
        }

        const serviceDefinitions: WeaklyTypedServiceDefinition[] = [];
        const containerElement = document.createElement("div");
        containerElement.id = "babylon-inspector-container";
        containerElement.style.position = "absolute";
        containerElement.style.inset = "0";
        containerElement.style.display = "flex";
        containerElement.style.pointerEvents = "none";

        if (options.layoutMode === "inline") {
            const canvasContainerDisplay = parentElement.style.display;
            const canvasContainerChildren = [...parentElement.childNodes];
            parentElement.replaceChildren();

            disposeActions.push(() => {
                parentElement.replaceChildren(...canvasContainerChildren);
            });

            const canvasInjectorServiceDefinition: ServiceDefinition<[], [IShellService]> = {
                friendlyName: "Canvas Injector",
                consumes: [ShellServiceIdentity],
                factory: (shellService) => {
                    const registration = shellService.addCentralContent({
                        key: "Canvas Injector",
                        component: () => {
                            const canvasContainerRef = useRef<HTMLDivElement>(null);
                            useEffect(() => {
                                canvasContainerRef.current?.replaceChildren(...canvasContainerChildren);
                            }, []);

                            return <div ref={canvasContainerRef} style={{ display: canvasContainerDisplay, position: "absolute", inset: "0" }} />;
                        },
                    });

                    return {
                        dispose: () => registration.dispose(),
                    };
                },
            };

            serviceDefinitions.push(canvasInjectorServiceDefinition);
        }

        parentElement.appendChild(containerElement);
        disposeActions.push(() => {
            parentElement.removeChild(containerElement);
        });

        if (options.autoResizeEngine && configuration.startAutoResize) {
            disposeActions.push(configuration.startAutoResize());
        }

        const modularTool = MakeModularTool({
            namespace: "Inspector",
            containerElement,
            parentContainer: productConfiguration.parentContainer,
            serviceDefinitions: [...serviceDefinitions, ...productConfiguration.serviceDefinitions, ...(options.serviceDefinitions ?? [])],
            themeMode: options.themeMode,
            showThemeSelector: options.showThemeSelector,
            extensionFeeds: productConfiguration.extensionFeeds,
            toolbarMode: "compact",
            sidePaneRemapper: options.sidePaneRemapper,
            leftPaneDefaultCollapsed: options.leftPaneDefaultCollapsed,
            rightPaneDefaultCollapsed: options.rightPaneDefaultCollapsed,
            disableTeachingMoments: options.disableTeachingMoments,
        });
        disposeActions.push(async () => await modularTool.dispose());

        if (configuration.registerTargetDisposed) {
            disposeActions.push(
                configuration.registerTargetDisposed(() => {
                    void inspectorToken.dispose();
                })
            );
        }

        disposeActions.push(() => {
            if (InspectorTokens.get(target) === inspectorToken) {
                InspectorTokens.delete(target);
            }
        });
    });

    return inspectorToken;
}
