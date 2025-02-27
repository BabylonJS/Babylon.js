// import { HTML3DElement, ViewerDetails } from "viewer";
import { useState, useEffect, useMemo } from "react";
import * as ReactDOM from "react-dom";
import type { ViewerDetails } from "viewer/viewer";
import type { HTML3DElement } from "viewer/viewerElement";

interface HTML3DElementAttributes extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
    class?: string;
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
