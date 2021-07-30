import { PerformanceViewerCollector } from 'babylonjs/Misc/PerformanceViewer/performanceViewerCollector';
import { Observable } from 'babylonjs/Misc/observable';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { CanvasGraphService } from './canvasGraphService';
import { IPerfLayoutSize } from './graphSupportingTypes';
import { IPerfMetadata } from 'babylonjs/Misc/interfaces/iPerfViewer';
import { Scene } from 'babylonjs/scene';

interface ICanvasGraphComponentProps {
    id: string;
    scene: Scene;
    collector: PerformanceViewerCollector
    layoutObservable?: Observable<IPerfLayoutSize>;
}

export const CanvasGraphComponent: React.FC<ICanvasGraphComponentProps> = (props: ICanvasGraphComponentProps) => {
    const { id, collector, scene, layoutObservable } = props;
    const canvasRef: React.MutableRefObject<HTMLCanvasElement | null>  = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        
        let cs: CanvasGraphService | undefined;

        // TODO: SET datasets as collector.datasets once canvas graph service pr is up.
        try {
            cs = new CanvasGraphService(canvasRef.current, {datasets: []});
        } catch (error) {
            console.error(error);
            return;
        }

        const layoutUpdated = (newSize: IPerfLayoutSize) => {
            if (!canvasRef.current) {
                return;
            }
            const {left, top} = canvasRef.current.getBoundingClientRect();
            newSize.width = newSize.width - left;
            newSize.height = newSize.height - top;
            cs?.resize(newSize);
        };

        const dataUpdated = () => {
            cs?.update();
        };

        const metaUpdated = (_: Map<string, IPerfMetadata>) => {
            if (!cs) {
                return;
            }
            // TODO: add this line once canvas graph service pr is up. cs.metadata = meta;
            cs.update();
        };
        
        scene.onAfterRenderObservable.add(dataUpdated);
        collector.metadataObservable.add(metaUpdated);

        layoutObservable?.add(layoutUpdated);

        return () => {
            cs?.destroy();
            layoutObservable?.removeCallback(layoutUpdated);
            scene.onAfterRenderObservable.removeCallback(dataUpdated);
            collector.metadataObservable.removeCallback(metaUpdated);
        };
    }, [canvasRef]);
    
    return (
        <canvas id={id} ref={canvasRef}>

        </canvas>
    )
}
