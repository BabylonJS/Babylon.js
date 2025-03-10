import "./viewer.scss";
import type { FunctionComponent } from "react";
import type { ViewerElement } from "viewer/viewerElement";
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
            "babylon-viewer": HTML3DElementAttributes;
        }
    }
}

export const Viewer: FunctionComponent<{ onViewerCreated: (viewerElement: ViewerElement) => void }> = (props) => {
    return <babylon-viewer class="viewerElement" ref={props.onViewerCreated}></babylon-viewer>;
};
