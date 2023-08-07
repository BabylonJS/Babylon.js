// TODO move it here?
import type { ICanvas } from "core/Engines/ICanvas";

export interface HostInformation {
    /**
     * Defines if the current host is a mobile
     */
    isMobile: boolean;
    documentAvailable: boolean;
    windowAvailable: boolean;
}

export const hostInformation: HostInformation = {
    isMobile: isMobile(),
    documentAvailable: IsDocumentAvailable(),
    windowAvailable: IsWindowObjectExist(),
};

/**
 * Checks if the window object exists
 * @returns true if the window object exists
 */
export function IsWindowObjectExist(): boolean {
    return typeof window !== "undefined";
}

/**
 * Checks if the navigator object exists
 * @returns true if the navigator object exists
 */
export function IsNavigatorAvailable(): boolean {
    return typeof navigator !== "undefined";
}

/**
 * Check if the document object exists
 * @returns true if the document object exists
 */
export function IsDocumentAvailable(): boolean {
    return typeof document !== "undefined";
}

/**
 * Create a canvas. This method is overridden by other engines
 * @param width width
 * @param height height
 * @returns ICanvas interface
 */
export function createHTMLCanvas(width: number, height: number): ICanvas {
    if (!IsDocumentAvailable()) {
        return new OffscreenCanvas(width, height) as unknown as ICanvas;
    }
    const canvas = document.createElement("canvas") as ICanvas;
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function isMobile(): boolean {
    if (IsNavigatorAvailable()) {
        const currentUA = navigator.userAgent;
        return (
            currentUA.indexOf("Mobile") !== -1 ||
            // Needed for iOS 13+ detection on iPad (inspired by solution from https://stackoverflow.com/questions/9038625/detect-if-device-is-ios)
            (currentUA.indexOf("Mac") !== -1 && IsDocumentAvailable() && "ontouchend" in document)
        );
    }
    return false;
}

export function updateHostInformation(): void {
    hostInformation.isMobile = isMobile();
    hostInformation.documentAvailable = IsDocumentAvailable();
    hostInformation.windowAvailable = IsWindowObjectExist();
}
