import { Observable } from "babylonjs/Misc/observable";
import { Scene } from "babylonjs/scene";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { ButtonLineComponent } from "../../../../sharedUiComponents/lines/buttonLineComponent";
import { FileButtonLineComponent } from "../../../../sharedUiComponents/lines/fileButtonLineComponent";
import { CanvasGraphComponent } from "../../../graph/canvasGraphComponent";
import { IPerfLayoutSize } from "../../../graph/graphSupportingTypes";
import { PopupComponent } from "../../../popupComponent";
import { PerformanceViewerSidebarComponent } from "./performanceViewerSidebarComponent";
import { PerformanceViewerCollector } from "babylonjs/Misc/PerformanceViewer/performanceViewerCollector";
import { PerfCollectionStrategy } from "babylonjs/Misc/PerformanceViewer/performanceViewerCollectionStrategies";
import { Tools } from "babylonjs/Misc/tools";

require('./scss/performanceViewer.scss');

interface IPerformanceViewerComponentProps {
    scene: Scene;
}

// aribitrary window size
const initialWindowSize = { width: 1024, height: 512 };

// Note this should be false when committed until the feature is fully working.
const isEnabled = false;

// list of strategies to add to perf graph automatically.
const defaultStrategies = [PerfCollectionStrategy.GpuFrameTimeStrategy(), PerfCollectionStrategy.FpsStrategy()];

enum RecordingState {
    NotRecording = "Begin Recording",
    Recording = "Stop Recording",
}

export const PerformanceViewerComponent: React.FC<IPerformanceViewerComponentProps> = (props: IPerformanceViewerComponentProps) => {
    const { scene } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [recordingState, setRecordingState] = useState(RecordingState.NotRecording);
    const [ performanceCollector, setPerformanceCollector ] = useState<PerformanceViewerCollector | undefined>();
    const [layoutObservable] = useState(new Observable<IPerfLayoutSize>());
    const popupRef = useRef<PopupComponent | null>(null);

    // do cleanup when the window is closed
    const onClosePerformanceViewer = (window: Window | null) => {
        if (window) {
            window.close();
        }
        setIsOpen(false);
        setIsLoaded(false);
    }

    const onPerformanceButtonClick = () => {
        setIsLoaded(false);
        setIsOpen(true);
    }

    const onLoadClick = (file: File) => {
        Tools.ReadFile(file, (data: string) => {
            // reopen window and load data!
            setIsOpen(false);
            setIsLoaded(true);
            setIsOpen(true);
            const isValid = performanceCollector?.loadFromFileData(data);
            if (!isValid) {
                // if our data isnt valid we close the window.
                setIsOpen(false);
                setIsLoaded(false);
            }
        });
    }

    const onExportClick = () => {
        performanceCollector?.exportDataToCsv();
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

    const onToggleRecording = () => {
        if (recordingState === RecordingState.Recording) {
            setRecordingState(RecordingState.NotRecording);
        } else {
            setRecordingState(RecordingState.Recording);
        }    
    }

    useEffect(() => {
        const perfCollector = new PerformanceViewerCollector(scene, defaultStrategies);
        setPerformanceCollector(perfCollector);
    }, []);

    useEffect(() => {
        if (isOpen && !isLoaded) {
            setRecordingState(RecordingState.Recording);
        } else {
            setRecordingState(RecordingState.NotRecording);
        }
    }, [isOpen]);

    useEffect(() => {
        if (recordingState === RecordingState.Recording) {
            if (performanceCollector?.hasLoadedData) {
                performanceCollector?.clear();
                performanceCollector?.addCollectionStrategies(...defaultStrategies);
            }
            performanceCollector?.start();
        } else {
            performanceCollector?.stop();
        }

        return () => {
            performanceCollector?.stop();
        }
    }, [recordingState])

    return (
        <>
            {
                isEnabled &&
                <>
                    <ButtonLineComponent label="Open Realtime Perf Viewer" onClick={onPerformanceButtonClick} />
                    <FileButtonLineComponent accept="csv" label="Load Perf Viewer using CSV" onClick={onLoadClick} />
                    <ButtonLineComponent label="Export Perf to CSV" onClick={onExportClick} />
                    {!isOpen && <ButtonLineComponent label={recordingState} onClick={onToggleRecording} />}
                </>
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