import { ToolParameters, ToolData } from '../textureEditorComponent';
import { PointerEventTypes, PointerInfo } from 'babylonjs/Events/pointerEvents';

export const Paintbrush : ToolData = {
    name: "Paintbrush",
    type: class {
        parameters: ToolParameters;
        pointerObservable: any;
        isPainting: boolean;

        constructor(parameters: ToolParameters) {
            this.parameters = parameters;
        }

        paint(pointerInfo : PointerInfo) {
            const ctx = this.parameters.canvas2D.getContext('2d')!;
            const x = pointerInfo.pickInfo!.getTextureCoordinates()!.x * this.parameters.size.width;
            const y = (1 - pointerInfo.pickInfo!.getTextureCoordinates()!.y) * this.parameters.size.height;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = this.parameters.getMetadata().color;
            ctx.globalAlpha = this.parameters.getMetadata().opacity;
            ctx.beginPath();
            ctx.ellipse(x, y, 15, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            this.parameters.updateTexture();
        }
        
        setup () {
            this.pointerObservable = this.parameters.scene.onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.pickInfo?.hit) {
                    if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                        if (pointerInfo.event.button == 0) {
                            this.isPainting = true;
                          }
                    }
                    if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                        if (pointerInfo.event.button == 0) {
                            this.isPainting = false;
                          }
                    }
                    if (pointerInfo.type === PointerEventTypes.POINTERMOVE && this.isPainting) {
                        this.paint(pointerInfo);
                    }
                    
                }
            });
            this.isPainting = false;
        }
        cleanup () {
            this.isPainting = false;
            if (this.pointerObservable) {
                this.parameters.scene.onPointerObservable.remove(this.pointerObservable);
            }
        }
    },
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMjksMTFhMy41
    NywzLjU3LDAsMCwxLDAsNS4wNkwxNywyOGEyLjM0LDIuMzQsMCwwLDEtMSwuNThMMTAuOTEsMzBhLjc1Ljc1LDAsMCwxLS45Mi0uOTJMMTEuMzgsMjRBMi4zNCwyLjM0LDAsMCwxLDEyLDIzbDEyLTEyQTMuNTcsMy41NywwLDAsMSwyOSwxMVpNMjMsMTQuMSwxMywy
    NGEuNjkuNjksMCwwLDAtLjE5LjMzbC0xLjA1LDMuODUsMy44NS0xQS42OS42OSwwLDAsMCwxNiwyN0wyNS45LDE3Wm0yLTItMSwxTDI3LDE2bDEtMUEyLjA4LDIuMDgsMCwxLDAsMjUsMTIuMDdaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+`
};