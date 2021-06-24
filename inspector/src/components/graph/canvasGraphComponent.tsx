import * as React from 'react';
import { useEffect, useRef } from 'react';

interface ICanvasGraphComponentProps {
    id: string;
}

export const CanvasGraphComponent: React.FC<ICanvasGraphComponentProps> = (props: ICanvasGraphComponentProps) => {
    const { id } = props;
    const canvasRef: React.MutableRefObject<HTMLCanvasElement | null>  = useRef(null);
    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) {
            return;
        }
        // for now just draw a line on the screen a simple step 1.
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(100, 100);
        ctx.stroke();
    }, [canvasRef])
   
    return (
        <canvas id={id} ref={canvasRef}>

        </canvas>
    )
}
