import { Observable } from 'babylonjs/Misc/observable';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { CanvasGraphService } from './canvasGraphService';
import { IPerfLayoutSize } from './graphSupportingTypes';

interface ICanvasGraphComponentProps {
    id: string;
    canvasServiceCallback: (canvasService: CanvasGraphService) => void;
    layoutObservable?: Observable<IPerfLayoutSize>;
}

export const CanvasGraphComponent: React.FC<ICanvasGraphComponentProps> = (props: ICanvasGraphComponentProps) => {
    const { id, canvasServiceCallback, layoutObservable } = props;
    const canvasRef: React.MutableRefObject<HTMLCanvasElement | null>  = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        
        let cs: CanvasGraphService | undefined;

        // temporarily set empty array, will eventually be passed by props!
        try {
            cs = new CanvasGraphService(canvasRef.current, {datasets: []});
            canvasServiceCallback(cs);
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

        layoutObservable?.add(layoutUpdated);

        return () => {
            cs?.destroy();
            layoutObservable?.removeCallback(layoutUpdated);
        };
    }, [canvasRef]);
    
    return (
        <canvas id={id} ref={canvasRef}>

        </canvas>
    )
}
