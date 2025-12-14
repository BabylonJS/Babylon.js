/* eslint-disable babylonjs/available */
import type { Nullable, PointerInfo } from "core/index";
import type { TextureEditorToolProvider } from "../../../components/textureEditor/textureEditor";

import { Label, makeStyles, Slider, tokens } from "@fluentui/react-components";
import { InkStrokeRegular } from "@fluentui/react-icons";
import { useCallback } from "react";

import { PointerEventTypes } from "core/Events/pointerEvents";
import { Color3 } from "core/Maths/math.color";
import { Vector2 } from "core/Maths/math.vector";
import { Observable, type Observer } from "core/Misc/observable";
import { useObservableState } from "../../../hooks/observableHooks";

const useStyles = makeStyles({
    settingsContainer: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
        minWidth: "150px",
    },
    sliderRow: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
});

export const Paintbrush: TextureEditorToolProvider = {
    name: "Paintbrush",
    order: 200,
    icon: () => <InkStrokeRegular />,
    cursor: "crosshair",
    getTool: (context) => {
        let pointerObserver: Nullable<Observer<PointerInfo>> = null;
        let isPainting = false;
        let _width = 15;
        let mousePos: Vector2 | null = null;
        let ctx: CanvasRenderingContext2D | null = null;
        let circleCanvas: HTMLCanvasElement | null = null;
        const stateChangedObservable = new Observable<void>();

        function setWidth(width: number) {
            _width = width;
            stateChangedObservable.notifyObservers();
        }

        function paint(pointerInfo: PointerInfo) {
            if (ctx && circleCanvas) {
                const { getMouseCoordinates, metadata, updatePainting } = context.getParameters();
                let { x, y } = getMouseCoordinates(pointerInfo);
                if (metadata.select.x1 !== -1) {
                    x -= metadata.select.x1;
                    y -= metadata.select.y1;
                }
                let numSteps, stepVector;
                stepVector = new Vector2();
                if (mousePos === null) {
                    mousePos = new Vector2(x, y);
                    numSteps = 1;
                } else {
                    const maxDistance = _width / 4;
                    const diffVector = new Vector2(x - mousePos.x, y - mousePos.y);
                    numSteps = Math.ceil(diffVector.length() / maxDistance);
                    const trueDistance = diffVector.length() / numSteps;
                    stepVector = diffVector.normalize().multiplyByFloats(trueDistance, trueDistance);
                }
                const paintVector = mousePos.clone();
                for (let stepCount = 0; stepCount < numSteps; stepCount++) {
                    ctx.globalAlpha = 1.0;
                    ctx.globalCompositeOperation = "destination-out";
                    ctx.drawImage(circleCanvas, Math.ceil(paintVector.x - _width / 2), Math.ceil(paintVector.y - _width / 2));
                    ctx.globalAlpha = metadata.alpha;
                    ctx.globalCompositeOperation = "source-over";
                    ctx.drawImage(circleCanvas, Math.ceil(paintVector.x - _width / 2), Math.ceil(paintVector.y - _width / 2));
                    paintVector.addInPlace(stepVector);
                }
                updatePainting();
                mousePos = new Vector2(x, y);
            }
        }

        return {
            activate: () => {
                const { scene } = context.getParameters();

                pointerObserver = scene.onPointerObservable.add(async (pointerInfo) => {
                    const { startPainting, stopPainting, metadata } = context.getParameters();
                    if (!isPainting) {
                        if (
                            pointerInfo.type === PointerEventTypes.POINTERDOWN &&
                            pointerInfo.event.buttons === 1 &&
                            context.getParameters().interactionEnabled() &&
                            pointerInfo.pickInfo?.hit
                        ) {
                            isPainting = true;
                            circleCanvas = document.createElement("canvas");
                            circleCanvas.width = _width;
                            circleCanvas.height = _width;
                            const circleCtx = circleCanvas.getContext("2d")!;
                            circleCtx.imageSmoothingEnabled = false;
                            const pixels = new Array(4 * _width * _width);
                            const dis = (_width * _width) / 4;
                            const rgb = Color3.FromHexString(metadata.color);
                            const r = Math.floor(rgb.r * 255);
                            const g = Math.floor(rgb.g * 255);
                            const b = Math.floor(rgb.b * 255);
                            let idx = 0;
                            const x1 = -Math.floor(_width / 2),
                                x2 = Math.ceil(_width / 2);
                            const y1 = -Math.floor(_width / 2),
                                y2 = Math.ceil(_width / 2);
                            for (let y = y1; y < y2; y++) {
                                for (let x = x1; x < x2; x++) {
                                    pixels[idx++] = r;
                                    pixels[idx++] = g;
                                    pixels[idx++] = b;
                                    pixels[idx++] = x * x + y * y <= dis ? 255 : 0;
                                }
                            }
                            circleCtx.putImageData(new ImageData(Uint8ClampedArray.from(pixels), _width, _width), 0, 0);
                            ctx = await startPainting();
                            paint(pointerInfo);
                        }
                    } else {
                        if (pointerInfo.event.buttons !== 1 || !context.getParameters().interactionEnabled()) {
                            isPainting = false;
                            circleCanvas?.parentNode?.removeChild(circleCanvas);
                            stopPainting();
                            mousePos = null;
                        } else {
                            if (pointerInfo.pickInfo?.hit && pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                                paint(pointerInfo);
                            }
                        }
                    }
                });
                isPainting = false;
            },
            deactivate: () => {
                isPainting = false;
                pointerObserver?.remove();
            },
            settingsComponent: () => {
                const classes = useStyles();
                const width = useObservableState(
                    useCallback(() => _width, []),
                    stateChangedObservable
                );

                const handleWidthChange = (_: unknown, data: { value: number }) => {
                    setWidth(data.value);
                };

                return (
                    <div className={classes.settingsContainer}>
                        <div className={classes.sliderRow}>
                            <Label>Size: {width}</Label>
                            <Slider min={1} max={100} value={width} onChange={handleWidthChange} />
                        </div>
                    </div>
                );
            },
        };
    },
};
