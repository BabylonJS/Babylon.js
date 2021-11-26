import * as React from "react";

import { Scene } from "babylonjs/scene";
import { Observable } from "babylonjs/Misc/observable";

import { PerformanceViewerSidebarComponent } from "./performanceViewerSidebarComponent";
import { PerformanceViewerCollector } from "babylonjs/Misc/PerformanceViewer/performanceViewerCollector";
import { PerformancePlayheadButtonComponent } from "./performancePlayheadButtonComponent";
import { CanvasGraphComponent } from "../../../graph/canvasGraphComponent";
import { IPerfLayoutSize } from "../../../graph/graphSupportingTypes";

interface IPerformanceViewerPopupComponentProps {
    scene: Scene;
    layoutObservable: Observable<IPerfLayoutSize>;
    returnToLiveObservable: Observable<void>;
    performanceCollector: PerformanceViewerCollector;
}

export const PerformanceViewerPopupComponent: React.FC<IPerformanceViewerPopupComponentProps> = (props: IPerformanceViewerPopupComponentProps) => {
    const { scene, layoutObservable, returnToLiveObservable, performanceCollector } = props;

    return (
        <div id="performance-viewer">
            <PerformancePlayheadButtonComponent returnToPlayhead={returnToLiveObservable} />
            <PerformanceViewerSidebarComponent collector={performanceCollector} />
            <CanvasGraphComponent
                id="performance-viewer-graph"
                returnToPlayheadObservable={returnToLiveObservable}
                layoutObservable={layoutObservable}
                scene={scene}
                collector={performanceCollector}
            />
        </div>
    );
};
