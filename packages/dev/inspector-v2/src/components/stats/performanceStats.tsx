// eslint-disable-next-line import/no-internal-modules
import type { Scene } from "core/index";
import { useEffect, useState, type FunctionComponent } from "react";
import type { PerformanceViewerCollector } from "core/Misc/PerformanceViewer/performanceViewerCollector";
import { Observable } from "core/Misc/observable";
import { Inspector } from "../../inspector";
import { PerformanceViewerPopupComponent } from "./performanceViewerPopupComponent";
import { Tools } from "core/Misc/tools";
import { PerfCollectionStrategy } from "core/Misc/PerformanceViewer/performanceViewerCollectionStrategies";
import { PressureObserverWrapper } from "core/Misc/pressureObserverWrapper";
import type { IPerfLayoutSize } from "../../misc/graph/graphSupportingTypes";
import { PlaceholderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";

// arbitrary window size
const InitialWindowSize = { width: 1024, height: 512 };
const InitialGraphSize = { width: 724, height: 512 };

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum IPerfMetadataCategory {
    Count = "Count",
    FrameSteps = "Frame Steps Duration",
}

// list of strategies to add to perf graph automatically.
const DefaultStrategiesList = [
    { strategyCallback: PerfCollectionStrategy.FpsStrategy() },
    { strategyCallback: PerfCollectionStrategy.TotalMeshesStrategy(), category: IPerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.ActiveMeshesStrategy(), category: IPerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.ActiveIndicesStrategy(), category: IPerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.ActiveBonesStrategy(), category: IPerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.ActiveParticlesStrategy(), category: IPerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.DrawCallsStrategy(), category: IPerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.TotalLightsStrategy(), category: IPerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.TotalVerticesStrategy(), category: IPerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.TotalMaterialsStrategy(), category: IPerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.TotalTexturesStrategy(), category: IPerfMetadataCategory.Count, hidden: true },
    { strategyCallback: PerfCollectionStrategy.AbsoluteFpsStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.MeshesSelectionStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.RenderTargetsStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.ParticlesStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.SpritesStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.AnimationsStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.PhysicsStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.RenderStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.FrameTotalStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.InterFrameStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
    { strategyCallback: PerfCollectionStrategy.GpuFrameTimeStrategy(), category: IPerfMetadataCategory.FrameSteps, hidden: true },
];

export const PerformanceStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoadedFromCsv, setIsLoadedFromCsv] = useState(false);
    const [performanceCollector, setPerformanceCollector] = useState<PerformanceViewerCollector | undefined>();
    const [layoutObservable] = useState(new Observable<IPerfLayoutSize>());
    const [returnToLiveObservable] = useState(new Observable<void>());

    // do cleanup when the window is closed
    const onClosePerformanceViewer = (window: Window | null) => {
        if (window) {
            window.close();
        }
        setIsLoadedFromCsv(false);
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isLoadedFromCsv) {
            if (performanceCollector) {
                performanceCollector.stop();
                performanceCollector.clear(false);
                addStrategies(performanceCollector);
            }
        }
    }, [isLoadedFromCsv]);

    const startPerformanceViewerPopup = () => {
        if (performanceCollector) {
            Inspector._CreatePersistentPopup(
                {
                    props: {
                        id: "performance-viewer",
                        title: "Realtime Performance Viewer",
                        onClose: onClosePerformanceViewer,
                        onResize: onResize,
                        size: InitialWindowSize,
                    },
                    children: (
                        <PerformanceViewerPopupComponent
                            scene={scene}
                            layoutObservable={layoutObservable}
                            returnToLiveObservable={returnToLiveObservable}
                            performanceCollector={performanceCollector}
                            initialGraphSize={InitialGraphSize}
                        />
                    ),
                },
                document.body
            );
        }
    };

    const onPerformanceButtonClick = () => {
        setIsOpen(true);
        performanceCollector?.start(true);
        startPerformanceViewerPopup();
    };

    const onLoadClick = (file: File) => {
        Tools.ReadFile(file, (data: string) => {
            // reopen window and load data!
            setIsOpen(false);
            setIsLoadedFromCsv(true);
            performanceCollector?.stop();
            const isValid = performanceCollector?.loadFromFileData(data);
            if (!isValid) {
                // if our data isnt valid we close the window.
                setIsOpen(false);
                performanceCollector?.start(true);
            } else {
                startPerformanceViewerPopup();
            }
        });
    };

    const onExportClick = () => {
        performanceCollector?.exportDataToCsv();
    };

    const onResize = (window: Window) => {
        const width = window?.innerWidth ?? 0;
        const height = window?.innerHeight ?? 0;
        layoutObservable.notifyObservers({ width, height });
    };

    const onToggleRecording = () => {
        if (!performanceCollector?.isStarted) {
            performanceCollector?.start(true);
        } else {
            performanceCollector?.stop();
        }
    };

    const addStrategies = (perfCollector: PerformanceViewerCollector) => {
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
                category: IPerfMetadataCategory.FrameSteps,
                hidden: true,
            });
        }
    };

    useEffect(() => {
        const perfCollector = scene.getPerfCollector();
        addStrategies(perfCollector);
        setPerformanceCollector(perfCollector);
    }, []);

    return (
        <>
            {!isOpen && <ButtonLine label="Open Realtime Perf Viewer" onClick={onPerformanceButtonClick} />}
            {!isOpen && (
                <PlaceholderPropertyLine
                    label="Load Perf Viewer using CSV"
                    value={false}
                    onChange={() => {
                        onLoadClick({} as File);
                    }}
                />
            )}
            <ButtonLine label="Export Perf to CSV" onClick={onExportClick} />
            {!isOpen && <ButtonLine label={performanceCollector?.isStarted ? "Stop Recording" : "Begin Recording"} onClick={onToggleRecording} />}
        </>
    );
};
