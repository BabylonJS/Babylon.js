/* eslint-disable babylonjs/available */
import type { Nullable, Observer, PointerInfo } from "core/index";
import type { TextureEditorToolProvider } from "../../../components/textureEditor/textureEditor";

import { EyedropperRegular } from "@fluentui/react-icons";

import { PointerEventTypes } from "core/Events/pointerEvents";
import { Color3 } from "core/Maths/math.color";

/**
 * Eyedropper tool for picking colors from the texture
 */
export const Eyedropper: TextureEditorToolProvider = {
    name: "Eyedropper",
    order: 300,
    icon: () => <EyedropperRegular />,
    cursor: "crosshair",
    getTool: (context) => {
        let pointerObserver: Nullable<Observer<PointerInfo>> = null;
        let isPicking = false;

        function pick(pointerInfo: PointerInfo) {
            const { canvas2D, setMetadata, getMouseCoordinates } = context.getParameters();
            const ctx = canvas2D.getContext("2d");
            const { x, y } = getMouseCoordinates(pointerInfo);
            const pixel = ctx!.getImageData(x, y, 1, 1).data;
            setMetadata({
                color: Color3.FromInts(pixel[0], pixel[1], pixel[2]).toHexString(),
                alpha: pixel[3] / 255,
            });
        }

        return {
            activate: () => {
                pointerObserver = context.getParameters().scene.onPointerObservable.add((pointerInfo) => {
                    if (pointerInfo.pickInfo?.hit) {
                        if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.buttons === 1 && context.getParameters().interactionEnabled()) {
                            isPicking = true;
                            pick(pointerInfo);
                        }
                        if (isPicking) {
                            if (pointerInfo.event.buttons !== 1 || !context.getParameters().interactionEnabled()) {
                                isPicking = false;
                            } else {
                                pick(pointerInfo);
                            }
                        }
                    }
                });
                isPicking = false;
            },
            deactivate: () => {
                pointerObserver?.remove();
            },
        };
    },
};
