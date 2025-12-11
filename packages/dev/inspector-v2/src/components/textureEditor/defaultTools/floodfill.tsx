/* eslint-disable babylonjs/available */
import type { IToolParameters, IToolData } from "../textureEditor";
import type { PointerInfo } from "core/Events/pointerEvents";
import { PointerEventTypes } from "core/Events/pointerEvents";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";

import { PaintBucketRegular } from "@fluentui/react-icons";

/**
 * Floodfill tool for filling regions with a solid color
 */
export const Floodfill: IToolData = {
    name: "Floodfill",
    type: class {
        getParameters: () => IToolParameters;
        pointerObserver: Nullable<Observer<PointerInfo>> = null;

        constructor(getParameters: () => IToolParameters) {
            this.getParameters = getParameters;
        }

        async fillAsync() {
            const { metadata, startPainting, updatePainting, stopPainting } = this.getParameters();
            const ctx = await startPainting();
            ctx.fillStyle = metadata.color;
            ctx.globalAlpha = metadata.alpha;
            ctx.globalCompositeOperation = "copy";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            updatePainting();
            stopPainting();
        }

        setup() {
            this.pointerObserver = this.getParameters().scene.onPointerObservable.add((pointerInfo) => {
                if (
                    pointerInfo.type === PointerEventTypes.POINTERDOWN &&
                    pointerInfo.event.buttons === 1 &&
                    this.getParameters().interactionEnabled() &&
                    pointerInfo.pickInfo?.hit
                ) {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.fillAsync();
                }
            });
        }

        cleanup() {
            if (this.pointerObserver) {
                this.getParameters().scene.onPointerObservable.remove(this.pointerObserver);
            }
        }
    },
    icon: () => <PaintBucketRegular />,
};
