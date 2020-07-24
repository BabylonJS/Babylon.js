import { ToolParameters, ToolData } from '../textureEditorComponent';
import { PointerEventTypes, PointerInfo } from 'babylonjs/Events/pointerEvents';

export const Paintbrush : ToolData = {
    name: "Paintbrush",
    type: class {
        getParameters: () => ToolParameters;
        pointerObservable: any;
        isPainting: boolean;

        constructor(getParameters: () => ToolParameters) {
            this.getParameters = getParameters;
        }

        paint(pointerInfo : PointerInfo) {
            const p = this.getParameters();
            const ctx = p.canvas2D.getContext('2d')!;
            const x = pointerInfo.pickInfo!.getTextureCoordinates()!.x * p.size.width;
            const y = (1 - pointerInfo.pickInfo!.getTextureCoordinates()!.y) * p.size.height;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = p.getMetadata().color;
            ctx.globalAlpha = p.getMetadata().opacity;
            ctx.beginPath();
            ctx.ellipse(x, y, 15, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            p.updateTexture();
        }
        
        setup () {
            this.pointerObservable = this.getParameters().scene.onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.pickInfo?.hit) {
                    if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                        if (pointerInfo.event.button == 0) {
                            this.isPainting = true;
                          }
                    }
                    if (pointerInfo.type === PointerEventTypes.POINTERMOVE && this.isPainting) {
                        this.paint(pointerInfo);
                    }
                }
                if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                    if (pointerInfo.event.button == 0) {
                        this.isPainting = false;
                      }
                }
            });
            this.isPainting = false;
        }
        cleanup () {
            this.isPainting = false;
            if (this.pointerObservable) {
                this.getParameters().scene.onPointerObservable.remove(this.pointerObservable);
            }
        }
    },
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMjksMTFhMy41
    NywzLjU3LDAsMCwxLDAsNS4wNkwxNywyOGEyLjM0LDIuMzQsMCwwLDEtMSwuNThMMTAuOTEsMzBhLjc1Ljc1LDAsMCwxLS45Mi0uOTJMMTEuMzgsMjRBMi4zNCwyLjM0LDAsMCwxLDEyLDIzbDEyLTEyQTMuNTcsMy41NywwLDAsMSwyOSwxMVpNMjMsMTQuMSwxMywy
    NGEuNjkuNjksMCwwLDAtLjE5LjMzbC0xLjA1LDMuODUsMy44NS0xQS42OS42OSwwLDAsMCwxNiwyN0wyNS45LDE3Wm0yLTItMSwxTDI3LDE2bDEtMUEyLjA4LDIuMDgsMCwxLDAsMjUsMTIuMDdaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+`
};