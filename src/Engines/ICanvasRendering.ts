export interface ICanvas
{
    width: number;
    height: number;
    textBaseline: string;
    imageSmoothingEnabled: boolean;
    getContext(contextType: string, contextAttributes?: any): ICanvasRenderingContext2D | null;
    toDataURL(mime: string): string;
}

export interface IOffscreenCanvas extends ICanvas{

/*
    // used by ThinEngine only
    convertToBlob(options: any): Promise<Blob>;
    transferToImageBitmap(): ImageBitmap;
    addEventListener(event: string, func: any): void;
    dispatchEvent(evt: any): void;
    removeEventListener(event: string, func: any): void;
*/
}

export interface ICanvasElement extends ICanvas{
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
    beginPath() : void;
    stroke(): void;
    closePath(): void;
    drawImage(image: any, dx: number, dy: number): void;
    drawImage(image: any, dx: number, dy: number, dWidth: number, dHeight: number): void;
    drawImage(image: any, sx: number, sy: number, sWidth: number, sHeight: number, dx: number, dy: number, dWidth: number, dHeight: number): void;
    fillRect(x: number, y: number, width: number, height: number): void;
    clearRect(x: number, y: number, width: number, height: number): void;
    fill(): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
    getImageData(sx: number, sy: number, sw: number, sh: number): any; // check uses!!!
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): ICanvasGradient;
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    measureText(text: string): ITextMetrics;
    strokeText(text: string, x: number, y: number, maxWidth?: number): void;
    strokeRect(x: number, y: number, width: number, height: number): void;
    setLineDash(segments: Array<number>): void;
    save(): void;
    restore(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    scale(x: number , y: number): void;
    rotate(angle: number): void;
    translate(x: number , y: number): void;
    rect(x: number, y: number, width: number, height: number): void;
    clip(): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    putImageData(imageData: ImageData, dx: number, dy: number) : void;
    globalAlpha: number;
    lineWidth: number;
    strokeStyle: string;
    fillStyle: string | ICanvasGradient;
    font: string;
    readonly canvas: ICanvas;
    msImageSmoothingEnabled: boolean;
    imageSmoothingEnabled: boolean; //?
    textBaseline: string;

    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;

    lineJoin: string;
    miterLimit: number;
}

export interface ICanvasRenderingContext2D extends ICanvasRenderingContext {
}

export interface IOffscreenCanvasRenderingContext2D extends ICanvasRenderingContext {
}