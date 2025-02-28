import type { FunctionComponent } from "react";
import type { ViewerElement } from "viewer/viewerElement";

import * as styles from "./App.module.scss";
import { useMemo, useState } from "react";
import { SplitContainer } from "shared-ui-components/split/splitContainer";
import { ControlledSize, SplitDirection } from "shared-ui-components/split/splitContext";
import { Splitter } from "shared-ui-components/split/splitter";
import { Viewer } from "./components/babylonViewer/viewer";
import { Configurator } from "./components/configurator/configurator";
import { useEventfulState } from "./hooks/observableHooks";

export const App: FunctionComponent = () => {
    const [viewerElement, setViewerElement] = useState<ViewerElement>();
    const viewerDetails = useEventfulState(() => viewerElement?.viewerDetails, viewerElement, "viewerready");
    const viewer = useMemo(() => viewerDetails?.viewer, [viewerDetails]);

    return (
        <SplitContainer className={styles["VerticalContainer"]} direction={SplitDirection.Vertical}>
            <div className={styles["HeaderContainer"]}>
                <img src="https://cdn.jsdelivr.net/gh/BabylonJS/Brand-Toolkit/babylonjs_identity/fullColor/babylonjs_identity_color_dark.svg" />
                <div>Viewer Configurator</div>
            </div>
            <Splitter size={8} minSize={50} initialSize={50} maxSize={100} controlledSide={ControlledSize.First} />
            <SplitContainer className={styles["HorizontalContainer"]} direction={SplitDirection.Horizontal}>
                <Viewer onViewerCreated={setViewerElement} />
                <Splitter size={8} minSize={250} initialSize={300} maxSize={500} controlledSide={ControlledSize.Second} />
                <div className={styles["ConfiguratorContainer"]}>
                    {viewerElement && viewerDetails && viewer && <Configurator viewerElement={viewerElement} viewerDetails={viewerDetails} viewer={viewer} />}
                </div>
            </SplitContainer>
        </SplitContainer>
    );
};
