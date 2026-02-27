import { Observable } from "core/Misc/observable";
import { Vector2 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import * as React from "react";
import { useEffect, useState } from "react";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { IPerfLayoutSize } from "../../../graph/graphSupportingTypes";
import type { PerformanceViewerCollector } from "core/Misc/PerformanceViewer/performanceViewerCollector";
import { PerfCollectionStrategy } from "core/Misc/PerformanceViewer/performanceViewerCollectionStrategies";
import { Tools } from "core/Misc/tools";
import "core/Misc/PerformanceViewer/performanceViewerSceneExtension";
import { Inspector } from "../../../../inspector";
import { PerformanceViewerPopupComponent } from "./performanceViewerPopupComponent";
import { PressureObserverWrapper } from "core/Misc/pressureObserverWrapper";

import "./scss/performanceViewer.scss";

interface IPerformanceViewerComponentProps {
    scene: Scene;
}

// arbitrary window size
const InitialWindowSize = { width: 1024, height: 512 };
const InitialGraphSize = new Vector2(724, 512);

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

export const PerformanceViewerComponent: React.FC<IPerformanceViewerComponentProps> = (props: IPerformanceViewerComponentProps) => {
    const { scene } = props;
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
        <LineContainerComponent title="Performance Viewer">
            {!isOpen && <ButtonLineComponent label="Open Realtime Perf Viewer" onClick={onPerformanceButtonClick} />}
            {!isOpen && <FileButtonLine accept="csv" label="Load Perf Viewer using CSV" onClick={onLoadClick} />}
            <ButtonLineComponent label="Export Perf to CSV" onClick={onExportClick} />
            {!isOpen && <ButtonLineComponent label={performanceCollector?.isStarted ? "Stop Recording" : "Begin Recording"} onClick={onToggleRecording} />}
        </LineContainerComponent>
    );
};
