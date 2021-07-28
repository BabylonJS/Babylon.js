import { Observable } from "babylonjs";
import { Scene } from "babylonjs/scene";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { ButtonLineComponent } from "../../../../sharedUiComponents/lines/buttonLineComponent";
import { CanvasGraphComponent } from "../../../graph/canvasGraphComponent";
import { IPerfLayoutSize } from "../../../graph/graphSupportingTypes";
import { PopupComponent } from "../../../popupComponent";
import { PerformanceViewerSidebarComponent } from "./performanceViewerSidebarComponent";
import { PerformanceViewerCollector } from "babylonjs/Misc/PerformanceViewer/performanceViewerCollector";
import { PerfCollectionStrategy } from "babylonjs/Misc/PerformanceViewer/performanceViewerCollectionStrategies";

require('./scss/performanceViewer.scss');

interface IPerformanceViewerComponentProps {
    scene: Scene;
}

// aribitrary window size
const initialWindowSize = { width: 1024, height: 512 };

// Note this should be false when committed until the feature is fully working.
const isEnabled = false;

export const PerformanceViewerComponent: React.FC<IPerformanceViewerComponentProps> = (props: IPerformanceViewerComponentProps) => {
    const { scene } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [ performanceCollector, setPerformanceCollector ] = useState<PerformanceViewerCollector | undefined>();
    const [layoutObservable] = useState(new Observable<IPerfLayoutSize>());
    const popupRef = useRef<PopupComponent | null>(null);

    // do cleanup when the window is closed
    const onClosePerformanceViewer = (window: Window | null) => {
        if (window) {
            window.close();
        }
        setIsOpen(false);
    }

    const onPerformanceButtonClick = () => {
        setIsOpen(true);
    }

    const onResize = () => {
        if (!popupRef.current) {
            return;
        }
        const window = popupRef.current.getWindow();
        const width = window?.innerWidth ?? 0;
        const height = window?.innerHeight ?? 0;
        layoutObservable.notifyObservers({width, height});
    }

    useEffect(() => {
        let perfCollector: PerformanceViewerCollector | undefined;
        if (isOpen) {
            perfCollector = new PerformanceViewerCollector(scene, [PerfCollectionStrategy.GpuFrameTimeStrategy(), PerfCollectionStrategy.FpsStrategy()]);
            perfCollector.start();
            setPerformanceCollector(perfCollector);
        }

        return () => {
            perfCollector?.stop();
            setPerformanceCollector(undefined);
        }
    }, [isOpen]);

    return (
        <>
            {
                isEnabled &&
                <ButtonLineComponent label="Open Perf Viewer" onClick={onPerformanceButtonClick} />
            }
            {
                isOpen &&
                <PopupComponent
                    id="perf-viewer"
                    title="Performance Viewer"
                    size={initialWindowSize}
                    ref={popupRef}
                    onResize={onResize}
                    onClose={onClosePerformanceViewer}
                >
                    <div id="performance-viewer">
                        {performanceCollector && <>
                            <PerformanceViewerSidebarComponent collector={performanceCollector} />
                            <CanvasGraphComponent id="performance-viewer-graph" layoutObservable={layoutObservable} scene={scene} collector={performanceCollector} />
                        </>}
                    </div>
                </PopupComponent>
        }
        </>
    )
}