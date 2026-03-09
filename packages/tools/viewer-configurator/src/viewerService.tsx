import type { IDisposable } from "core/index";
import type { ViewerElement, ViewerOptions } from "viewer/index";

import type { IService, ServiceDefinition } from "inspector/modularity/serviceDefinition";
import type { IShellService } from "inspector/services/shellService";

import { ShellServiceIdentity } from "inspector/services/shellService";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { makeStyles } from "@fluentui/react-components";
import { useEffect, type FunctionComponent } from "react";
import { ConfigureCustomViewerElement } from "viewer/viewerElement";
import "viewer";

import { LoadModel } from "./modelLoader";

const useStyles = makeStyles({
    viewerElement: {
        width: "100%",
        height: "100%",
        backgroundImage: "repeating-conic-gradient(#d2d2d2 0% 25%, white 25% 50%)",
        backgroundSize: "20px 20px",
        backgroundPosition: "50%",
    },
});

interface IHTML3DElementAttributes extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
    class?: string;
    engine?: "WebGL" | "WebGPU";
    source?: string;
    environment?: string;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        interface IntrinsicElements {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "configured-babylon-viewer": IHTML3DElementAttributes;
        }
    }
}

export const ViewerServiceIdentity = Symbol("ViewerService");

export interface IViewerService extends IService<typeof ViewerServiceIdentity> {
    readonly viewerElement: ViewerElement | undefined;
    readonly viewerOptions: ViewerOptions | undefined;
    readonly onStateChanged: Observable<void>;
}

export const ViewerServiceDefinition: ServiceDefinition<[IViewerService], [IShellService]> = {
    friendlyName: "Viewer Service",
    produces: [ViewerServiceIdentity],
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const onStateChanged = new Observable<void>();
        let viewerElement: ViewerElement | undefined;
        let viewerOptions: ViewerOptions | undefined;
        let dragOverHandler: ((event: DragEvent) => void) | undefined;
        let dropHandler: ((event: DragEvent) => void) | undefined;

        const setViewerElement = (element: ViewerElement) => {
            viewerElement = element;

            // Set up drag-and-drop model loading.
            dragOverHandler = (event: DragEvent) => event.preventDefault();
            dropHandler = async (event: DragEvent) => {
                const files = event.dataTransfer?.files;
                if (files) {
                    event.preventDefault();
                    await LoadModel(element, files);
                }
            };
            element.addEventListener("dragover", dragOverHandler);
            element.addEventListener("drop", dropHandler);

            onStateChanged.notifyObservers();
        };

        const setViewerOptions = (options: ViewerOptions) => {
            viewerOptions = options;
            onStateChanged.notifyObservers();
        };

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const ViewerContent: FunctionComponent = () => {
            const classes = useStyles();

            useEffect(() => {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                (async () => {
                    let options: ViewerOptions = {};
                    if (window.location.hash) {
                        try {
                            const id = window.location.hash.substring(1).replace("#", "/");
                            const response = await fetch(`https://snippet.babylonjs.com/${id}`);
                            options = JSON.parse((await response.json()).jsonPayload);
                        } catch (error: unknown) {
                            Logger.Error(`Failed to load snippet from URL: ${error}`);
                        }
                    }

                    ConfigureCustomViewerElement("configured-babylon-viewer", options);
                    setViewerOptions(options);
                })();
            }, []);

            // Allow engine selection through query param for testing.
            const engineQueryParam: string | null | undefined = new URLSearchParams(window.location.search).get("engine");
            const engine = engineQueryParam?.toLowerCase() === "webgl" ? "WebGL" : engineQueryParam?.toLowerCase() === "webgpu" ? "WebGPU" : undefined;

            if (engineQueryParam && !engine) {
                Logger.Warn(`Invalid engine specified in query param: ${engineQueryParam}. 'webgl' or 'webgpu' expected.`);
            }

            return (
                <configured-babylon-viewer
                    className={classes.viewerElement}
                    ref={(element: ViewerElement | null) => {
                        if (element) {
                            element.addEventListener("viewerready", () => {
                                if (element.viewerDetails) {
                                    element.viewerDetails.viewer.showDebugLogs = true;
                                }
                                setViewerElement(element);
                            });
                        }
                    }}
                    engine={engine}
                ></configured-babylon-viewer>
            );
        };

        const contentRegistration = shellService.addCentralContent({
            key: "Viewer",
            component: ViewerContent,
        });

        return {
            get viewerElement() {
                return viewerElement;
            },
            get viewerOptions() {
                return viewerOptions;
            },
            onStateChanged,
            dispose: () => {
                if (viewerElement && dragOverHandler && dropHandler) {
                    viewerElement.removeEventListener("dragover", dragOverHandler);
                    viewerElement.removeEventListener("drop", dropHandler);
                }
                onStateChanged.clear();
                contentRegistration.dispose();
            },
        } satisfies IViewerService & IDisposable;
    },
};

