import type { FunctionComponent } from "react";
import type { ViewerOptions } from "viewer/viewer";
import type { ViewerElement } from "viewer/viewerElement";

import "./App.scss";
import { useMemo, useState } from "react";
import { SplitContainer } from "shared-ui-components/split/splitContainer";
import { ControlledSize, SplitDirection } from "shared-ui-components/split/splitContext";
import { Splitter } from "shared-ui-components/split/splitter";
import { Viewer } from "./components/babylonViewer/viewer";
import { Configurator } from "./components/configurator/configurator";
import { useEventfulState } from "./hooks/observableHooks";

export const App: FunctionComponent = () => {
    const [viewerOptions, setViewerOptions] = useState<ViewerOptions>();
    const [viewerElement, setViewerElement] = useState<ViewerElement>();
    const viewerDetails = useEventfulState(() => viewerElement?.viewerDetails, viewerElement, "viewerready");
    const viewer = useMemo(() => viewerDetails?.viewer, [viewerDetails]);

    return (
        <>
            <SplitContainer className="appContainer" direction={SplitDirection.Horizontal}>
                <Viewer onViewerCreated={setViewerElement} onOptionsLoaded={setViewerOptions} />
                <Splitter size={8} minSize={300} initialSize={400} maxSize={600} controlledSide={ControlledSize.Second} />
                <div>
                    {viewerOptions && viewerElement && viewerDetails && viewer && (
                        <Configurator viewerOptions={viewerOptions} viewerElement={viewerElement} viewerDetails={viewerDetails} viewer={viewer} />
                    )}
                </div>
            </SplitContainer>
            <div className="blocker">Viewer Configurator needs a horizontal resolution of at least 900px</div>
        </>
    );
};
