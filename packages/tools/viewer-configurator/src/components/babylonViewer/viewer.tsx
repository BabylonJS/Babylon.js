import "./viewer.scss";
import type { FunctionComponent } from "react";
import type { ViewerElement } from "viewer";
import { useEffect, useState } from "react";

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
            "babylon-viewer": HTML3DElementAttributes;
        }
    }
}

export const Viewer: FunctionComponent<{ onViewerCreated: (viewerElement: ViewerElement) => void }> = (props) => {
    const [viewerLoaded, setViewerLoaded] = useState(false);

    useEffect(() => {
        import("viewer").then(() => {
            setViewerLoaded(true);
        });
    }, []);

    return viewerLoaded ? <babylon-viewer class="viewerElement" ref={props.onViewerCreated}></babylon-viewer> : <div className="loadingDiv">Loading...</div>;
};
