import type { PerformanceViewerCollector } from "core/Misc/PerformanceViewer/performanceViewerCollector";
import type { Observable } from "core/Misc/observable";
import type { FunctionComponent } from "react";
import type { PerfLayoutSize, VisibleRangeChangedObservableProps } from "./graphSupportingTypes";
import type { IPerfMetadata } from "core/Misc/interfaces/iPerfViewer";
import type { Scene } from "core/scene";
import type { Vector2 } from "core/Maths/math.vector";

import { makeStyles } from "@fluentui/react-components";
import { useEffect, useRef } from "react";

import { CanvasGraphService } from "./canvasGraphService";
import { Logger } from "core/Misc/logger";

const useStyles = makeStyles({
    canvas: {
        flexGrow: 1,
        width: "100%",
        height: "100%",
    },
});

type CanvasGraphProps = {
    scene: Scene;
    collector: PerformanceViewerCollector;
    layoutObservable?: Observable<PerfLayoutSize>;
    returnToPlayheadObservable?: Observable<void>;
    onVisibleRangeChangedObservable?: Observable<VisibleRangeChangedObservableProps>;
    initialGraphSize?: Vector2;
};

export const CanvasGraph: FunctionComponent<CanvasGraphProps> = (props) => {
    const { collector, scene, layoutObservable, returnToPlayheadObservable, onVisibleRangeChangedObservable, initialGraphSize } = props;
    const classes = useStyles();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        if (initialGraphSize) {
            canvasRef.current.width = initialGraphSize.x;
            canvasRef.current.height = initialGraphSize.y;
        }

        let cs: CanvasGraphService | undefined;

        try {
            cs = new CanvasGraphService(canvasRef.current, { datasets: collector.datasets, onVisibleRangeChangedObservable });
        } catch (error) {
            Logger.Error(error as string);
            return;
        }

        const layoutUpdated = (newSize: PerfLayoutSize) => {
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
    }, [canvasRef, collector, scene, layoutObservable, returnToPlayheadObservable, onVisibleRangeChangedObservable, initialGraphSize]);

    return <canvas className={classes.canvas} ref={canvasRef}></canvas>;
};
