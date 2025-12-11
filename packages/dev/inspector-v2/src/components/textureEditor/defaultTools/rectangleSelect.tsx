/* eslint-disable babylonjs/available */
import type { IToolData, IToolParameters } from "../textureEditor";
import type { PointerInfo } from "core/Events/pointerEvents";
import { PointerEventTypes } from "core/Events/pointerEvents";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { SelectObjectRegular } from "@fluentui/react-icons";

/**
 * Rectangle selection tool for selecting regions of the texture
 */
export const RectangleSelect: IToolData = {
    name: "Rectangle Select",
    type: class {
        getParameters: () => IToolParameters;
        pointerObserver: Nullable<Observer<PointerInfo>> = null;
        isSelecting = false;
        xStart: number = -1;
        yStart: number = -1;

        constructor(getParameters: () => IToolParameters) {
            this.getParameters = getParameters;
        }

        setup() {
            const { scene } = this.getParameters();
            this.pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
                const { getMouseCoordinates, setMetadata, metadata } = this.getParameters();
                if (!this.isSelecting) {
                    if (
                        pointerInfo.type === PointerEventTypes.POINTERDOWN &&
                        pointerInfo &&
                        pointerInfo.event.buttons === 1 &&
                        this.getParameters().interactionEnabled() &&
                        pointerInfo.pickInfo?.hit
                    ) {
                        this.isSelecting = true;
                        const { x, y } = ({ x: this.xStart, y: this.yStart } = getMouseCoordinates(pointerInfo));
                        setMetadata({
                            select: {
                                x1: x,
                                y1: y,
                                x2: x,
                                y2: y,
                            },
                        });
                    }
                } else {
                    if (pointerInfo.event.buttons !== 1 || !this.getParameters().interactionEnabled()) {
                        this.isSelecting = false;
                        if (metadata.select.x1 === metadata.select.x2 || metadata.select.y1 === metadata.select.y2) {
                            setMetadata({
                                select: {
                                    x1: -1,
                                    y1: -1,
                                    x2: -1,
                                    y2: -1,
                                },
                            });
                        }
                    } else {
                        if (pointerInfo.pickInfo?.hit && pointerInfo.type === PointerEventTypes.POINTERMOVE) {
                            if (pointerInfo.type === PointerEventTypes.POINTERMOVE && this.isSelecting) {
                                const { x, y } = getMouseCoordinates(pointerInfo);
                                setMetadata({
                                    select: {
                                        x1: Math.min(x, this.xStart),
                                        y1: Math.min(y, this.yStart),
                                        x2: Math.max(x, this.xStart),
                                        y2: Math.max(y, this.yStart),
                                    },
                                });
                            }
                        }
                    }
                }
            });
        }

        cleanup() {
            this.isSelecting = false;
            if (this.pointerObserver) {
                this.getParameters().scene.onPointerObservable.remove(this.pointerObserver);
            }
        }
    },
    icon: () => <SelectObjectRegular />,
    cursor: "crosshair",
};
