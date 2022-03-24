import * as React from "react";
import type { IToolParameters, IToolData, IToolType, IToolGUIProps } from "../textureEditorComponent";
import type { PointerInfo } from "core/Events/pointerEvents";
import { PointerEventTypes } from "core/Events/pointerEvents";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Vector2 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";

class PaintbrushTool implements IToolType {
    getParameters: () => IToolParameters;
    pointerObserver: Nullable<Observer<PointerInfo>>;
    isPainting: boolean;
    width = 15;
    mousePos: Vector2 | null = null;
    ctx: CanvasRenderingContext2D;
    circleCanvas: HTMLCanvasElement;

    constructor(getParameters: () => IToolParameters) {
        this.getParameters = getParameters;
    }

    paint(pointerInfo: PointerInfo) {
        const { getMouseCoordinates, metadata, updatePainting } = this.getParameters();
        let { x, y } = getMouseCoordinates(pointerInfo);
        if (metadata.select.x1 != -1) {
            x -= metadata.select.x1;
            y -= metadata.select.y1;
        }
        const { ctx } = this;
        let numSteps, stepVector;
        stepVector = new Vector2();
        if (this.mousePos == null) {
            this.mousePos = new Vector2(x, y);
            numSteps = 1;
        } else {
            const maxDistance = this.width / 4;
            const diffVector = new Vector2(x - this.mousePos.x, y - this.mousePos.y);
            numSteps = Math.ceil(diffVector.length() / maxDistance);
            const trueDistance = diffVector.length() / numSteps;
            stepVector = diffVector.normalize().multiplyByFloats(trueDistance, trueDistance);
        }
        const paintVector = this.mousePos.clone();
        for (let stepCount = 0; stepCount < numSteps; stepCount++) {
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = "destination-out";
            ctx.drawImage(this.circleCanvas, Math.ceil(paintVector.x - this.width / 2), Math.ceil(paintVector.y - this.width / 2));
            ctx.globalAlpha = metadata.alpha;
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(this.circleCanvas, Math.ceil(paintVector.x - this.width / 2), Math.ceil(paintVector.y - this.width / 2));
            paintVector.addInPlace(stepVector);
        }
        updatePainting();
        this.mousePos = new Vector2(x, y);
    }

    setBrushWidth(width: number) {
        this.width = width;
    }

    setup() {
        const { scene } = this.getParameters();

        this.pointerObserver = scene.onPointerObservable.add(async (pointerInfo) => {
            const { startPainting, stopPainting, metadata } = this.getParameters();
            if (!this.isPainting) {
                if (
                    pointerInfo.type === PointerEventTypes.POINTERDOWN &&
                    pointerInfo.event.buttons === 1 &&
                    this.getParameters().interactionEnabled() &&
                    pointerInfo.pickInfo?.hit
                ) {
                    this.isPainting = true;
                    const circleCanvas = document.createElement("canvas");
                    circleCanvas.width = this.width;
                    circleCanvas.height = this.width;
                    const circleCtx = circleCanvas.getContext("2d")!;
                    circleCtx.imageSmoothingEnabled = false;
                    const pixels = new Array(4 * this.width * this.width);
                    const dis = (this.width * this.width) / 4;
                    const rgb = Color3.FromHexString(metadata.color)!;
                    const r = Math.floor(rgb.r * 255);
                    const g = Math.floor(rgb.g * 255);
                    const b = Math.floor(rgb.b * 255);
                    let idx = 0;
                    const x1 = -Math.floor(this.width / 2),
                        x2 = Math.ceil(this.width / 2);
                    const y1 = -Math.floor(this.width / 2),
                        y2 = Math.ceil(this.width / 2);
                    for (let y = y1; y < y2; y++) {
                        for (let x = x1; x < x2; x++) {
                            pixels[idx++] = r;
                            pixels[idx++] = g;
                            pixels[idx++] = b;
                            pixels[idx++] = x * x + y * y <= dis ? 255 : 0;
                        }
                    }
                    circleCtx.putImageData(new ImageData(Uint8ClampedArray.from(pixels), this.width, this.width), 0, 0);
                    this.circleCanvas = circleCanvas;
                    this.ctx = await startPainting();
                    this.paint(pointerInfo);
                }
            } else {
                if (pointerInfo.event.buttons !== 1 || !this.getParameters().interactionEnabled()) {
                    this.isPainting = false;
                    this.circleCanvas.parentNode?.removeChild(this.circleCanvas);
                    stopPainting();
                    this.mousePos = null;
                } else {
                    if (pointerInfo.pickInfo?.hit && pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                        this.paint(pointerInfo);
                    }
                }
            }
        });
        this.isPainting = false;
    }
    cleanup() {
        this.isPainting = false;
        if (this.pointerObserver) {
            this.getParameters().scene.onPointerObservable.remove(this.pointerObserver);
        }
    }
}

class Settings extends React.Component<IToolGUIProps> {
    render() {
        const instance = this.props.instance as PaintbrushTool;
        return (
            <div>
                <label className="tool-slider-input">
                    <span>Size: {instance.width}</span>
                    <input
                        id="contrast-slider"
                        type="range"
                        min={1}
                        max={100}
                        value={instance.width}
                        onChange={(evt) => {
                            instance.setBrushWidth(evt.target.valueAsNumber);
                            this.forceUpdate();
                        }}
                    />
                </label>
            </div>
        );
    }
}

export const Paintbrush: IToolData = {
    name: "Paintbrush",
    type: PaintbrushTool,
    settingsComponent: Settings,
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMjksMTFhMy41NywzLjU3LDAsMCwxLDAsNS4wNkwxNywyOGEyLjM0LDIuMzQsMCwwLDEtMSwuNThMMTAuOTEsMzBhLjc1Ljc1LDAsMCwxLS45Mi0uOTJMMTEuMzgsMjRBMi4zNCwyLjM0LDAsMCwxLDEyLDIzbDEyLTEyQTMuNTcsMy41NywwLDAsMSwyOSwxMVpNMjMsMTQuMSwxMywyNGEuNjkuNjksMCwwLDAtLjE5LjMzbC0xLjA1LDMuODUsMy44NS0xQS42OS42OSwwLDAsMCwxNiwyN0wyNS45LDE3Wm0yLTItMSwxTDI3LDE2bDEtMUEyLjA4LDIuMDgsMCwxLDAsMjUsMTIuMDdaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+`,
    cursor: `iVBORw0KGgoAAAANSUhEUgAAABUAAAAVAgMAAADUeU0FAAAACVBMVEUAAAAAAAD///+D3c/SAAAAAXRSTlMAQObYZgAAAAFiS0dEAmYLfGQAAAA3SURBVAjXY2CAgVUNYGoqhFJjwE2BgQYDBwMXUGiFGtcyBgbVkKmtYXAeVA4O8BkGtQ9qOwgAAEPfC1QJPmWqAAAAAElFTkSuQmCC`,
};
