export interface ICanvas
{
    /**
     * Canvas width
     */
    width: number;
    /**
     * Canvas height
     */
    height: number;
    /**
     * 
     * @param contextType 
     * @param contextAttributes 
     * @returns ICanvasRenderingContext
     */
    getContext(contextType: string, contextAttributes?: any): ICanvasRenderingContext;
    /**
     * 
     * @param mime 
     * @returns string
     */
    toDataURL(mime: string): string;
}

export interface ICanvasGradient {
    /**
     * @param offset 
     * @param color 
     */
    addColorStop(offset: number, color: string): void;
}

export interface ITextMetrics {
    /**
     * Text width
     */
    readonly width: number;
}

/**
 * Class used to abstract canvas rendering
 */
export interface ICanvasRenderingContext {
    /**
     * 
     */
    lineJoin: string;
    /**
     * 
     */
    miterLimit: number;
    /**
     * 
     */
    font: string;
    /**
     * 
     */
    strokeStyle: string;
    /**
     * 
     */
    fillStyle: string | ICanvasGradient;
    /**
     * 
     */
    globalAlpha: number;
    /**
     * 
     */
    shadowColor: string;
    /**
     * 
     */
    shadowBlur: number;
    /**
     * 
     */
    shadowOffsetX: number;
    /**
     * 
     */
    shadowOffsetY: number;
    /**
     * 
     */
    lineWidth: number;
    /**
     * 
     */
    canvas: ICanvas;

    /**
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    clearRect(x: number, y: number, width: number, height: number): void;
    /**
     * 
     */
    save(): void;
    /**
     * 
     */
    restore(): void;
    /**
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    fillRect(x: number, y: number, width: number, height: number): void;
    /**
     * 
     * @param x 
     * @param y 
     */
    scale(x: number , y: number): void;
    /**
     * 
     * @param angle 
     */
    rotate(angle: number): void;
    /**
     * 
     * @param x 
     * @param y 
     */
    translate(x: number , y: number): void;
    /**
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    strokeRect(x: number, y: number, width: number, height: number): void;
    /**
     * 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     */
    rect(x: number, y: number, width: number, height: number): void;
    /**
     * 
     */
    clip(): void;
    /**
     * 
     * @param imageData 
     * @param dx 
     * @param dy 
     */
    putImageData(imageData: ImageData, dx: number, dy: number) : void;
    /**
     * 
     * @param x 
     * @param y 
     * @param radius 
     * @param startAngle 
     * @param endAngle 
     * @param anticlockwise 
     */
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
    /**
     * 
     */
    beginPath() : void;
    /**
     * 
     */
    closePath(): void;
    /**
     * 
     * @param x 
     * @param y 
     */
    moveTo(x: number, y: number): void;
    /**
     * 
     * @param x 
     * @param y 
     */
    lineTo(x: number, y: number): void;
    /**
     * 
     * @param cpx 
     * @param cpy 
     * @param x 
     * @param y 
     */
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    /**
     * 
     * @param text 
     * @returns ITextMetrics
     */
    measureText(text: string): ITextMetrics;
    /**
     * 
     */
    stroke(): void;
    /**
     * 
     */
    fill(): void;
    /**
     * 
     * @param image 
     * @param sx 
     * @param sy 
     * @param sWidth 
     * @param sHeight 
     * @param dx 
     * @param dy 
     * @param dWidth 
     * @param dHeight 
     */
    drawImage(image: any, sx: number, sy: number, sWidth: number, sHeight: number, dx: number, dy: number, dWidth: number, dHeight: number): void;
    /**
     * 
     * @param image 
     * @param dx 
     * @param dy 
     * @param dWidth 
     * @param dHeight 
     */
    drawImage(image: any, dx: number, dy: number, dWidth: number, dHeight: number): void;
    /**
     * 
     * @param image 
     * @param dx 
     * @param dy 
     */
    drawImage(image: any, dx: number, dy: number): void;
    /**
     * 
     * @param sx 
     * @param sy 
     * @param sw 
     * @param sh 
     * @returns ImageData
     */
    getImageData(sx: number, sy: number, sw: number, sh: number): ImageData;
    /**
     * 
     * @param segments 
     */
    setLineDash(segments: Array<number>): void;
    /**
     * 
     * @param text 
     * @param x 
     * @param y 
     * @param maxWidth 
     */
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    /**
     * 
     * @param text 
     * @param x 
     * @param y 
     * @param maxWidth 
     */
    strokeText(text: string, x: number, y: number, maxWidth?: number): void;
    /**
     * 
     * @param x0 
     * @param y0 
     * @param x1 
     * @param y1 
     * @returns ICanvasGradient
     */
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): ICanvasGradient;
    /**
     * 
     * @param a 
     * @param b 
     * @param c 
     * @param d 
     * @param e 
     * @param f 
     */
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
}
