/*
Raphael.js declarations
*/

// Raphael.js bounding box interface
interface RaphaelBoundingBox {
    width: number;
    height: number;
}

// Raphael.js animation interface
interface RaphaelAnimation
{ }

// Raphael.js element interface
interface RaphaelElement {
    attr(attribute: string, value?: any): any;

    remove(): void;

    hide(): void;
    show(): void;

    isPointInside(x: number, y: number): boolean;
    getBBox(): RaphaelBoundingBox;

    animate(attributes: any, time: number, type: string, callback?: () => void): void;
    stop(animation: RaphaelAnimation);
    animation: RaphaelAnimation;

    click(onClick: (event: MouseEvent) => void);
    drag(onMove: (dx: number, dy: number, x: number, y: number) => void, onStart: (x: number, y: number, event: MouseEvent) => void, onEnd: (event: MouseEvent) => void): void;
    undrag(): void;
}

// Raphael.js rect interface
interface Rect extends RaphaelElement
{ }

// Raphael.js text interface
interface Text extends RaphaelElement
{ }

// Raphael.js path interface
interface Path extends RaphaelElement
{ }

// Raphael.js rgb interface
interface RaphaelColor
{ }

// Raphael.js paper interface
interface Paper {
    canvas: HTMLCanvasElement;

    width: number;
    height: number;
    setSize(width: number, height: number);

    rect(x: number, y: number, width: number, height: number, r?: number): Rect;
    text(x: number, y: number, text: string): Text;
    path(pathString: string);
}

// Raphael.js
declare var Raphael: {
    (containerID: string, width: number, height: number): Paper;
    rgb(r: number, g: number, b: number): RaphaelColor;
}
