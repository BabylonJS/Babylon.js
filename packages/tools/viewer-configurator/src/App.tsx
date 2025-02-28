import type { FunctionComponent } from "react";
import type { ViewerElement } from "viewer/viewerElement";

import * as styles from "./App.module.scss";
import { useState } from "react";
import { SplitContainer } from "shared-ui-components/split/splitContainer";
import { ControlledSize, SplitDirection } from "shared-ui-components/split/splitContext";
import { Splitter } from "shared-ui-components/split/splitter";
import { Viewer } from "./components/babylonViewer/viewer";
import { Configurator } from "./components/configurator/configurator";

export const App: FunctionComponent = () => {
    const [viewerElement, setViewerElement] = useState<ViewerElement>();

    return (
        <SplitContainer className={styles["VerticalContainer"]} direction={SplitDirection.Vertical}>
            <div className={styles["HeaderContainer"]}>
                <img src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                <div>BABYLON VIEWER CONFIGURATOR</div>
            </div>
            <Splitter size={8} minSize={50} initialSize={50} maxSize={100} controlledSide={ControlledSize.First} />
            <SplitContainer className={styles["HorizontalContainer"]} direction={SplitDirection.Horizontal}>
                <Viewer onViewerCreated={setViewerElement} />
                <Splitter size={8} minSize={250} initialSize={300} maxSize={500} controlledSide={ControlledSize.Second} />
                <div className={styles["ConfiguratorContainer"]}>
                    <Configurator viewerElement={viewerElement} />
                </div>
            </SplitContainer>
        </SplitContainer>
    );
};
