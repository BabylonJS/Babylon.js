import type { PerformanceViewerCollector } from "core/Misc/PerformanceViewer/performanceViewerCollector";
import type { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";
import type { FunctionComponent } from "react";
import type { IPerfLayoutSize, IVisibleRangeChangedObservableProps } from "./graphSupportingTypes";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useState } from "react";

import { Observable as BabylonObservable } from "core/Misc/observable";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { CanvasGraph } from "./canvasGraph";
import { PerformanceSidebar } from "./performanceSidebar";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
    },
    returnButton: {
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 10,
    },
    sidebar: {
        flex: "0 0 auto",
        overflowY: "auto",
        overflowX: "hidden",
    },
    graph: {
        flex: "1 1 auto",
        position: "relative",
        backgroundColor: tokens.colorNeutralBackground1,
        overflow: "hidden",
    },
});

interface IPerformanceViewerPopupProps {
    scene: Scene;
    layoutObservable: Observable<IPerfLayoutSize>;
    returnToLiveObservable: Observable<void>;
    performanceCollector: PerformanceViewerCollector;
    initialGraphSize?: { width: number; height: number };
}

export const PerformanceViewerPopup: FunctionComponent<IPerformanceViewerPopupProps> = (props) => {
    const { scene, layoutObservable, returnToLiveObservable, performanceCollector, initialGraphSize } = props;
    const classes = useStyles();
    const [onVisibleRangeChangedObservable] = useState(() => new BabylonObservable<IVisibleRangeChangedObservableProps>());

    const onReturnToPlayheadClick = () => {
        returnToLiveObservable.notifyObservers();
    };

    return (
        <div className={classes.container}>
            <Button className={classes.returnButton} onClick={onReturnToPlayheadClick} label="Return" title="Return to Playhead" />
            <div className={classes.sidebar}>
                <PerformanceSidebar collector={performanceCollector} onVisibleRangeChangedObservable={onVisibleRangeChangedObservable} />
            </div>
            <div className={classes.graph}>
                <CanvasGraph
                    returnToPlayheadObservable={returnToLiveObservable}
                    layoutObservable={layoutObservable}
                    scene={scene}
                    collector={performanceCollector}
                    onVisibleRangeChangedObservable={onVisibleRangeChangedObservable}
                    initialGraphSize={initialGraphSize}
                />
            </div>
        </div>
    );
};
