import type { PerformanceViewerCollector } from "core/Misc/PerformanceViewer/performanceViewerCollector";
import type { Observable } from "core/Misc/observable";
import * as React from "react";
import { useEffect, useRef } from "react";
import { CanvasGraphService } from "./canvasGraphService";
import type { IPerfLayoutSize, IVisibleRangeChangedObservableProps } from "./graphSupportingTypes";
import type { IPerfMetadata } from "core/Misc/interfaces/iPerfViewer";
import type { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";

interface ICanvasGraphComponentProps {
    id: string;
    scene: Scene;
    collector: PerformanceViewerCollector;
    layoutObservable?: Observable<IPerfLayoutSize>;
    returnToPlayheadObservable?: Observable<void>;
    onVisibleRangeChangedObservable?: Observable<IVisibleRangeChangedObservableProps>;
    initialGraphSize?: { width: number; height: number };
}

export const CanvasGraphComponent: React.FC<ICanvasGraphComponentProps> = (props: ICanvasGraphComponentProps) => {
    const { id, collector, scene, layoutObservable, returnToPlayheadObservable, onVisibleRangeChangedObservable, initialGraphSize } = props;
    const canvasRef: React.MutableRefObject<HTMLCanvasElement | null> = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        if (initialGraphSize) {
            canvasRef.current.width = initialGraphSize.width;
            canvasRef.current.height = initialGraphSize.height;
        }

        let cs: CanvasGraphService | undefined;

        try {
            cs = new CanvasGraphService(canvasRef.current, { datasets: collector.datasets, onVisibleRangeChangedObservable });
        } catch (error) {
            Logger.Error(error);
            return;
        }

        const layoutUpdated = (newSize: IPerfLayoutSize) => {
            if (!canvasRef.current) {
                return;
            }
            const { left, top } = canvasRef.current.getBoundingClientRect();
            newSize.width = newSize.width - left;
            newSize.height = newSize.height - top;
            cs?.resize(newSize);
        };

        const dataUpdated = () => {
            cs?.update();
        };

        const metaUpdated = (meta: Map<string, IPerfMetadata>) => {
            if (!cs) {
                return;
            }
            cs.metadata = meta;
            cs.update();
        };

        const resetDataPosition = () => {
            cs?.resetDataPosition();
        };

        scene.onAfterRenderObservable.add(dataUpdated);
        collector.metadataObservable.add(metaUpdated);

        layoutObservable?.add(layoutUpdated);
        returnToPlayheadObservable?.add(resetDataPosition);
        return () => {
            cs?.destroy();
            layoutObservable?.removeCallback(layoutUpdated);
            scene.onAfterRenderObservable.removeCallback(dataUpdated);
            collector.metadataObservable.removeCallback(metaUpdated);
        };
    }, [canvasRef]);

    return <canvas id={id} ref={canvasRef}></canvas>;
};
