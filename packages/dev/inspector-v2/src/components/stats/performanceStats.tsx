import type { FunctionComponent } from "react";

import type { PerformanceViewerCollector, Scene } from "core/index";

import { ArrowDownloadRegular, RecordRegular, StopRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";

import { Vector2 } from "core/Maths/math.vector";
import { Observable } from "core/Misc/observable";
import { PerfCollectionStrategy } from "core/Misc/PerformanceViewer/performanceViewerCollectionStrategies";
import "core/Misc/PerformanceViewer/performanceViewerSceneExtension";
import { PressureObserverWrapper } from "core/Misc/pressureObserverWrapper";
import { Tools } from "core/Misc/tools";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { ChildWindow } from "shared-ui-components/fluent/hoc/childWindow";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import type { PerfLayoutSize } from "../performanceViewer/graphSupportingTypes";
import { PerformanceViewer } from "../performanceViewer/performanceViewer";

function AddStrategies(perfCollector: PerformanceViewerCollector) {
    perfCollector.addCollectionStrategies(...DefaultStrategiesList);
    if (PressureObserverWrapper.IsAvailable) {
        // Do not enable for now as the Pressure API does not
        // report factors at the moment.
        // perfCollector.addCollectionStrategies({
        //     strategyCallback: PerfCollectionStrategy.ThermalStrategy(),
        //     category: IPerfMetadataCategory.FrameSteps,
        //     hidden: true,
        // });
        // perfCollector.addCollectionStrategies({
        //     strategyCallback: PerfCollectionStrategy.PowerSupplyStrategy(),
        //     category: IPerfMetadataCategory.FrameSteps,
        //     hidden: true,
        // });
        perfCollector.addCollectionStrategies({
            strategyCallback: PerfCollectionStrategy.PressureStrategy(),
            category: PerfMetadataCategory.FrameSteps,
            hidden: true,
        });
    }
}

const enum PerfMetadataCategory {
    Count = "Count",
    FrameSteps = "Frame Steps Duration",
}

// list of strategies to add to perf graph automatically.
const DefaultStrategiesList = [
    { strategyCallback: PerfCollectionStrategy.FpsStrategy() },
    { strategyCallback: PerfCollectionStrategy.TotalMeshesStrategy(), category: PerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.ActiveMeshesStrategy(), category: PerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.ActiveIndicesStrategy(), category: PerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.ActiveBonesStrategy(), category: PerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.ActiveParticlesStrategy(), category: PerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.DrawCallsStrategy(), category: PerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.TotalLightsStrategy(), category: PerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.TotalVerticesStrategy(), category: PerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.TotalMaterialsStrategy(), category: PerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.TotalTexturesStrategy(), category: PerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.AbsoluteFpsStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.MeshesSelectionStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.RenderTargetsStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.ParticlesStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.SpritesStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.AnimationsStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.PhysicsStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.RenderStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.FrameTotalStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.InterFrameStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.GpuFrameTimeStrategy(), category: PerfMetadataCategory.FrameSteps, hidden: true },
] as const;

// arbitrary window size
const InitialWindowSize = { width: 1024, height: 512 };
const InitialGraphSize = new Vector2(724, 512);

export const PerformanceStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoadedFromCsv, setIsLoadedFromCsv] = useState(false);
    const [performanceCollector, setPerformanceCollector] = useState<PerformanceViewerCollector | undefined>();
    const [layoutObservable] = useState(() => new Observable<PerfLayoutSize>());
    const [returnToLiveObservable] = useState(() => new Observable<void>());
    const childWindowRef = useRef<ChildWindow>(null);

    useEffect(() => {
        if (!isLoadedFromCsv) {
            if (performanceCollector) {
                setIsRecording(false);
                performanceCollector.stop();
                performanceCollector.clear(false);
                AddStrategies(performanceCollector);
            }
        }
    }, [isLoadedFromCsv, performanceCollector]);

    const onClosePerformanceViewer = useCallback(() => {
        setIsLoadedFromCsv(false);
        setIsOpen(false);
    }, []);

    const onResize = useCallback(
        (childWindow: Window) => {
            const width = childWindow?.innerWidth ?? 0;
            const height = childWindow?.innerHeight ?? 0;
            layoutObservable.notifyObservers({ width, height });
        },
        [layoutObservable]
    );

    const startPerformanceViewerPopup = useCallback(() => {
        if (performanceCollector && childWindowRef.current) {
            childWindowRef.current.open({
                defaultWidth: InitialWindowSize.width,
                defaultHeight: InitialWindowSize.height,
                title: "Realtime Performance Viewer",
            });
        }
    }, [performanceCollector]);

    const onPerformanceButtonClick = () => {
        setIsOpen(true);
        setIsRecording(true);
        performanceCollector?.start(true);
        startPerformanceViewerPopup();
    };

    const onLoadClick = (fileList: FileList) => {
        Tools.ReadFile(fileList[0], (data: string) => {
            // reopen window and load data!
            setIsOpen(false);
            setIsLoadedFromCsv(true);
            setIsRecording(false);
            performanceCollector?.stop();
            const isValid = performanceCollector?.loadFromFileData(data);
            if (!isValid) {
                // if our data isn't valid we close the window.
                setIsOpen(false);
                setIsRecording(true);
                performanceCollector?.start(true);
            } else {
                startPerformanceViewerPopup();
            }
        });
    };

    const onExportClick = () => {
        performanceCollector?.exportDataToCsv();
    };

    const onToggleRecording = () => {
        if (performanceCollector) {
            if (!performanceCollector.isStarted) {
                setIsRecording(true);
                performanceCollector.start(true);
            } else {
                setIsRecording(false);
                performanceCollector.stop();
            }
        }
    };

    useEffect(() => {
        const perfCollector = scene.getPerfCollector();
        AddStrategies(perfCollector);
        setPerformanceCollector(perfCollector);
    }, [scene]);

    // Handle child window resize
    useEffect(() => {
        const handleResize = () => {
            const win = window;
            if (win) {
                onResize(win);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [onResize]);

    return (
        <>
            {!isOpen && <ButtonLine label="Open Realtime Perf Viewer" onClick={onPerformanceButtonClick} />}
            {!isOpen && <FileUploadLine label="Load Perf Viewer using CSV" accept=".csv" onClick={onLoadClick} />}
            <ButtonLine label="Export Perf to CSV" icon={ArrowDownloadRegular} onClick={onExportClick} />
            {!isOpen && <ButtonLine label={isRecording ? "Stop Recording" : "Begin Recording"} icon={isRecording ? StopRegular : RecordRegular} onClick={onToggleRecording} />}
            <ChildWindow id="performance-viewer" imperativeRef={childWindowRef} onOpenChange={(open) => !open && onClosePerformanceViewer()}>
                {performanceCollector && (
                    <PerformanceViewer
                        scene={scene}
                        layoutObservable={layoutObservable}
                        returnToLiveObservable={returnToLiveObservable}
                        performanceCollector={performanceCollector}
                        initialGraphSize={InitialGraphSize}
                    />
                )}
            </ChildWindow>
        </>
    );
};
