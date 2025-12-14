/* eslint-disable babylonjs/available */
import type { PointerInfo } from "core/Events/pointerEvents";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import type { TextureEditorToolProvider } from "../../../components/textureEditor/textureEditor";

import { SelectObjectRegular } from "@fluentui/react-icons";
import { PointerEventTypes } from "core/Events/pointerEvents";

/**
 * Rectangle selection tool for selecting regions of the texture
 */
export const RectangleSelect: TextureEditorToolProvider = {
    name: "Rectangle Select",
    order: 100,
    icon: () => <SelectObjectRegular />,
    cursor: "crosshair",
    getTool: (context) => {
        let pointerObserver: Nullable<Observer<PointerInfo>> = null;
        let isSelecting = false;
        let xStart: number = -1;
        let yStart: number = -1;

        return {
            activate: () => {
                const { scene } = context.getParameters();
                pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
                    const { getMouseCoordinates, setMetadata, metadata } = context.getParameters();
                    if (!isSelecting) {
                        if (
                            pointerInfo.type === PointerEventTypes.POINTERDOWN &&
                            pointerInfo &&
                            pointerInfo.event.buttons === 1 &&
                            context.getParameters().interactionEnabled() &&
                            pointerInfo.pickInfo?.hit
                        ) {
                            isSelecting = true;
                            const { x, y } = ({ x: xStart, y: yStart } = getMouseCoordinates(pointerInfo));
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
                        if (pointerInfo.event.buttons !== 1 || !context.getParameters().interactionEnabled()) {
                            isSelecting = false;
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
                                if (pointerInfo.type === PointerEventTypes.POINTERMOVE && isSelecting) {
                                    const { x, y } = getMouseCoordinates(pointerInfo);
                                    setMetadata({
                                        select: {
                                            x1: Math.min(x, xStart),
                                            y1: Math.min(y, yStart),
                                            x2: Math.max(x, xStart),
                                            y2: Math.max(y, yStart),
                                        },
                                    });
                                }
                            }
                        }
                    }
                });
            },
            deactivate() {
                isSelecting = false;
                pointerObserver?.remove();
            },
        };
    },
};
