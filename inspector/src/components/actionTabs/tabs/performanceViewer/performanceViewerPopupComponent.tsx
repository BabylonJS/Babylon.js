import * as React from "react";
import { useState } from "react";

import { Scene } from "babylonjs/scene";
import { Observable } from "babylonjs/Misc/observable";

import { PerformanceViewerSidebarComponent } from "./performanceViewerSidebarComponent";
import { PerformanceViewerCollector } from "babylonjs/Misc/PerformanceViewer/performanceViewerCollector";
import { PerformancePlayheadButtonComponent } from "./performancePlayheadButtonComponent";
import { CanvasGraphComponent } from "../../../graph/canvasGraphComponent";
import { IPerfLayoutSize, IVisibleRangeChangedObservableProps } from "../../../graph/graphSupportingTypes";

interface IPerformanceViewerPopupComponentProps {
    scene: Scene;
    layoutObservable: Observable<IPerfLayoutSize>;
    returnToLiveObservable: Observable<void>;
    performanceCollector: PerformanceViewerCollector;
    initialGraphSize?: {width: number, height: number};
}

export const PerformanceViewerPopupComponent: React.FC<IPerformanceViewerPopupComponentProps> = (props: IPerformanceViewerPopupComponentProps) => {
    const { scene, layoutObservable, returnToLiveObservable, performanceCollector, initialGraphSize } = props;
    const [ onVisibleRangeChangedObservable ] = useState(new Observable<IVisibleRangeChangedObservableProps>());

    return (
        <div id="performance-viewer">
            <PerformancePlayheadButtonComponent returnToPlayhead={returnToLiveObservable} />
            <PerformanceViewerSidebarComponent collector={performanceCollector} onVisibleRangeChangedObservable={onVisibleRangeChangedObservable}/>
            <CanvasGraphComponent
                id="performance-viewer-graph"
                returnToPlayheadObservable={returnToLiveObservable}
                layoutObservable={layoutObservable}
                scene={scene}
                collector={performanceCollector}
                onVisibleRangeChangedObservable={onVisibleRangeChangedObservable}
                initialGraphSize={initialGraphSize}
            />
        </div>
    );
};
