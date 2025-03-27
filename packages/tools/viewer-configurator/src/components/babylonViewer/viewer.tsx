import type { ViewerOptions } from "viewer/viewer";
import type { ViewerElement } from "viewer/viewerElement";
import "./viewer.scss";
import { useCallback, useEffect, useRef, type FunctionComponent } from "react";
import { ConfigureCustomViewerElement } from "viewer/viewerElement";
import "viewer";

interface HTML3DElementAttributes extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
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
            "configured-babylon-viewer": HTML3DElementAttributes;
        }
    }
}

export const Viewer: FunctionComponent<{ onViewerCreated: (element: ViewerElement) => void; onOptionsLoaded: (options: ViewerOptions) => void }> = (props) => {
    useEffect(() => {
        (async () => {
            let options: ViewerOptions = {};
            if (window.location.hash) {
                const id = window.location.hash.substring(1).replace("#", "/");
                const response = await fetch(`https://snippet.babylonjs.com/${id}`);
                options = JSON.parse((await response.json()).jsonPayload);
            }

            // const options = {
            //     environmentLighting: "https://assets.babylonjs.com/environments/studio.env",
            //     cameraAutoOrbit: {
            //         enabled: false,
            //         speed: 0.5,
            //         delay: 1500,
            //     },
            // };
            ConfigureCustomViewerElement("configured-babylon-viewer", options);

            props.onOptionsLoaded(options);
        })();
    }, []);

    return <configured-babylon-viewer class="viewerElement" ref={props.onViewerCreated}></configured-babylon-viewer>;
};
