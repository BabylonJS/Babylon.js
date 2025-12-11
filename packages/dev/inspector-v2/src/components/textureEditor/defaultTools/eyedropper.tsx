/* eslint-disable babylonjs/available */
import type { IToolParameters, IToolData } from "../textureEditor";
import type { PointerInfo } from "core/Events/pointerEvents";
import { PointerEventTypes } from "core/Events/pointerEvents";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Color3 } from "core/Maths/math.color";

import { EyedropperRegular } from "@fluentui/react-icons";

/**
 * Eyedropper tool for picking colors from the texture
 */
export const Eyedropper: IToolData = {
    name: "Eyedropper",
    type: class {
        getParameters: () => IToolParameters;
        pointerObserver: Nullable<Observer<PointerInfo>> = null;
        isPicking = false;

        constructor(getParameters: () => IToolParameters) {
            this.getParameters = getParameters;
        }

        pick(pointerInfo: PointerInfo) {
            const { canvas2D, setMetadata, getMouseCoordinates } = this.getParameters();
            const ctx = canvas2D.getContext("2d");
            const { x, y } = getMouseCoordinates(pointerInfo);
            const pixel = ctx!.getImageData(x, y, 1, 1).data;
            setMetadata({
                color: Color3.FromInts(pixel[0], pixel[1], pixel[2]).toHexString(),
                alpha: pixel[3] / 255,
            });
        }

        setup() {
            this.pointerObserver = this.getParameters().scene.onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.pickInfo?.hit) {
                    if (pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.buttons === 1 && this.getParameters().interactionEnabled()) {
                        this.isPicking = true;
                        this.pick(pointerInfo);
                    }
                    if (this.isPicking) {
                        if (pointerInfo.event.buttons !== 1 || !this.getParameters().interactionEnabled()) {
                            this.isPicking = false;
                        } else {
                            this.pick(pointerInfo);
                        }
                    }
                }
            });
            this.isPicking = false;
        }

        cleanup() {
            if (this.pointerObserver) {
                this.getParameters().scene.onPointerObservable.remove(this.pointerObserver);
            }
        }
    },
    icon: () => <EyedropperRegular />,
    cursor: "crosshair",
};
