import * as React from 'react';
import { useEffect, useRef } from 'react';
import { CanvasGraphService } from './canvasGraphService';

interface ICanvasGraphComponentProps {
    id: string;
    canvasServiceCallback: (canvasService: CanvasGraphService) => void;
}

export const CanvasGraphComponent: React.FC<ICanvasGraphComponentProps> = (props: ICanvasGraphComponentProps) => {
    const { id, canvasServiceCallback } = props;
    const canvasRef: React.MutableRefObject<HTMLCanvasElement | null>  = useRef(null);
    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        
        let canvasGraphService: CanvasGraphService | undefined;

        // temporarily set empty array, will eventually be passed by props!
        try {
            canvasGraphService = new CanvasGraphService(canvasRef.current, {datasets: []});
            canvasServiceCallback(canvasGraphService);
        } catch (error) {
            console.error(error);
            return;
        }

        return () => canvasGraphService?.destroy();
    }, [canvasRef])
   
    return (
        <canvas id={id} ref={canvasRef}>

        </canvas>
    )
}
