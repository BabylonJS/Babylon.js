export interface ICanvas
{
    width: number;
    height: number;
    getContext(contextType: string, contextAttributes?: any): ICanvasRenderingContext;
    toDataURL(mime: string): string;
}

export interface ICanvasGradient {
    addColorStop(offset: number, color: string): void;
}

export interface ITextMetrics {
    readonly width: number;
}

/**
 * Class used to abstract canvas rendering
 */
export interface ICanvasRenderingContext {
    lineJoin: string;
    miterLimit: number;
    font: string;
    strokeStyle: string;
    fillStyle: string | ICanvasGradient;
    globalAlpha: number;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    lineWidth: number;
    canvas: ICanvas;
    msImageSmoothingEnabled: boolean;

    clearRect(x: number, y: number, width: number, height: number): void;
    save(): void;
    restore(): void;
    fillRect(x: number, y: number, width: number, height: number): void;
    scale(x: number , y: number): void;
    rotate(angle: number): void;
    translate(x: number , y: number): void;
    strokeRect(x: number, y: number, width: number, height: number): void;
    rect(x: number, y: number, width: number, height: number): void;
    clip(): void;
    putImageData(imageData: ImageData, dx: number, dy: number) : void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
    beginPath() : void;
    closePath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    measureText(text: string): ITextMetrics;
    stroke(): void;
    fill(): void;
    drawImage(image: any, sx: number, sy: number, sWidth: number, sHeight: number, dx: number, dy: number, dWidth: number, dHeight: number): void;
    drawImage(image: any, dx: number, dy: number, dWidth: number, dHeight: number): void;
    drawImage(image: any, dx: number, dy: number): void;
    getImageData(sx: number, sy: number, sw: number, sh: number): ImageData;
    setLineDash(segments: Array<number>): void;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    strokeText(text: string, x: number, y: number, maxWidth?: number): void;
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): ICanvasGradient;
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
}
