import type { ViewerOptions } from "viewer/viewer";
import type { ViewerElement } from "viewer/viewerElement";
import "./viewer.scss";
import { useEffect, type FunctionComponent } from "react";
import { Logger } from "core/Misc/logger";
import { ConfigureCustomViewerElement } from "viewer/viewerElement";
import "viewer";

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

export const Viewer: FunctionComponent<{ onViewerCreated: (element: ViewerElement) => void; onOptionsLoaded: (options: ViewerOptions) => void }> = (props) => {
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

            props.onOptionsLoaded(options);
        })();
    }, []);

    // Allow engine selection through query param for testing. Later we may add an option in the UI for engine selection.
    const engineQueryParam: string | null | undefined = new URLSearchParams(window.location.search).get("engine");
    const engine = engineQueryParam?.toLowerCase() === "webgl" ? "WebGL" : engineQueryParam?.toLowerCase() === "webgpu" ? "WebGPU" : undefined;

    if (engineQueryParam && !engine) {
        Logger.Warn(`Invalid engine specified in query param: ${engineQueryParam}. 'webgl' or 'webgpu' expected.`);
    }

    return (
        <configured-babylon-viewer
            class="viewerElement"
            ref={(element: ViewerElement | null) => {
                if (element) {
                    element.addEventListener("viewerready", () => {
                        if (element.viewerDetails) {
                            element.viewerDetails.viewer.showDebugLogs = true;
                        }
                    });
                    props.onViewerCreated(element);
                }
            }}
            engine={engine}
        ></configured-babylon-viewer>
    );
};
