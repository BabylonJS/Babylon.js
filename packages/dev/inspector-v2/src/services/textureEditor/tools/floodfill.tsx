/* eslint-disable babylonjs/available */
import type { Nullable, Observer, PointerInfo } from "core/index";
import type { TextureEditorToolProvider } from "../../../components/textureEditor/textureEditor";

import { PaintBucketRegular } from "@fluentui/react-icons";

import { PointerEventTypes } from "core/Events/pointerEvents";

/**
 * Floodfill tool for filling regions with a solid color
 */
export const Floodfill: TextureEditorToolProvider = {
    name: "Floodfill",
    order: 400,
    icon: () => <PaintBucketRegular />,
    cursor: "crosshair",
    getTool: (context) => {
        let pointerObserver: Nullable<Observer<PointerInfo>> = null;

        async function fillAsync() {
            const { metadata, startPainting, updatePainting, stopPainting } = context.getParameters();
            const ctx = await startPainting();
            ctx.fillStyle = metadata.color;
            ctx.globalAlpha = metadata.alpha;
            ctx.globalCompositeOperation = "copy";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            updatePainting();
            stopPainting();
        }

        return {
            activate: () => {
                pointerObserver = context.getParameters().scene.onPointerObservable.add((pointerInfo) => {
                    if (
                        pointerInfo.type === PointerEventTypes.POINTERDOWN &&
                        pointerInfo.event.buttons === 1 &&
                        context.getParameters().interactionEnabled() &&
                        pointerInfo.pickInfo?.hit
                    ) {
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        fillAsync();
                    }
                });
            },
            deactivate: () => {
                pointerObserver?.remove();
            },
        };
    },
};
