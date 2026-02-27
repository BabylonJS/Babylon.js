import * as React from "react";
import { useState } from "react";

import type { Scene } from "core/scene";
import type { Vector2 } from "core/Maths/math.vector";
import { Observable } from "core/Misc/observable";

import { PerformanceViewerSidebarComponent } from "./performanceViewerSidebarComponent";
import type { PerformanceViewerCollector } from "core/Misc/PerformanceViewer/performanceViewerCollector";
import { PerformancePlayheadButtonComponent } from "./performancePlayheadButtonComponent";
import { CanvasGraphComponent } from "../../../graph/canvasGraphComponent";
import type { IPerfLayoutSize, IVisibleRangeChangedObservableProps } from "../../../graph/graphSupportingTypes";

interface IPerformanceViewerPopupComponentProps {
    scene: Scene;
    layoutObservable: Observable<IPerfLayoutSize>;
    returnToLiveObservable: Observable<void>;
    performanceCollector: PerformanceViewerCollector;
    initialGraphSize?: Vector2;
}

export const PerformanceViewerPopupComponent: React.FC<IPerformanceViewerPopupComponentProps> = (props: IPerformanceViewerPopupComponentProps) => {
    const { scene, layoutObservable, returnToLiveObservable, performanceCollector, initialGraphSize } = props;
    const [onVisibleRangeChangedObservable] = useState(new Observable<IVisibleRangeChangedObservableProps>());

    return (
        <div id="performance-viewer">
            <PerformancePlayheadButtonComponent returnToPlayhead={returnToLiveObservable} />
            <PerformanceViewerSidebarComponent collector={performanceCollector} onVisibleRangeChangedObservable={onVisibleRangeChangedObservable} />
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
