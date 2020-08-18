import { IToolParameters, IToolData, IToolType } from '../textureEditorComponent';
import { PointerEventTypes, PointerInfo } from 'babylonjs/Events/pointerEvents';
import { TextBlock } from 'babylonjs-gui/2D/controls/textBlock';
import { Slider } from 'babylonjs-gui/2D/controls/sliders/slider';
import { Nullable } from 'babylonjs/types'
import { Observer } from 'babylonjs/Misc/observable';
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { Color3 } from 'babylonjs/Maths/math.color';

export const Paintbrush : IToolData = {
    name: 'Paintbrush',
    type: class implements IToolType {
        getParameters: () => IToolParameters;
        pointerObserver: Nullable<Observer<PointerInfo>>;
        isPainting: boolean;
        GUI: {
            widthLabel : TextBlock;
            widthSlider : Slider;
        };
        width = 15;
        mousePos: Vector2 | null = null;
        ctx: CanvasRenderingContext2D;
        circleCanvas: HTMLCanvasElement;

        constructor(getParameters: () => IToolParameters) {
            this.getParameters = getParameters;
        }

        paint(pointerInfo : PointerInfo) {
            const {getMouseCoordinates, metadata, updatePainting } = this.getParameters();
            let {x, y} = getMouseCoordinates(pointerInfo);
            if (metadata.select.x1 != -1) {
                x -= metadata.select.x1;
                y -= metadata.select.y1;
            }
            if (this.mousePos == null) {
                this.mousePos = new Vector2(x, y);
            }
            const {ctx} = this;
            let xx = this.mousePos.x;
            let yy = this.mousePos.y;
            let stepCount = 0;
            const distance = this.width / 4;
            const step = new Vector2(x - this.mousePos.x, y - this.mousePos.y).normalize().multiplyByFloats(distance, distance);
            const numSteps = new Vector2(x - this.mousePos.x, y - this.mousePos.y).length() / distance;
            while(stepCount < numSteps) {
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = 'destination-out';
                ctx.drawImage(this.circleCanvas, Math.floor(xx - this.width / 2), Math.floor(yy - this.width / 2));
                ctx.globalAlpha = metadata.alpha;
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(this.circleCanvas, Math.floor(xx - this.width / 2), Math.floor(yy - this.width / 2));
                xx += step.x;
                yy += step.y;
                stepCount++;
                if (numSteps - stepCount < 1) {
                    xx = x;
                    yy = y;
                }
            }
            updatePainting();
            this.mousePos = new Vector2(x,y);
        }

        setBrushWidth(width: number) {
            this.width = width;
            this.GUI.widthLabel.text = `Brush Width: ${this.width}`;
        }
        
        setup () {
            const {scene, GUI} = this.getParameters();
            const widthLabel = new TextBlock();
            widthLabel.color = 'white';
            widthLabel.heightInPixels = 20;
            widthLabel.style = GUI.style;
            GUI.toolWindow.addControl(widthLabel);
            const widthSlider = new Slider();
            widthSlider.heightInPixels = 20;
            widthSlider.value = this.width;
            widthSlider.minimum = 1;
            widthSlider.maximum = 100;
            widthSlider.step = 1;
            widthSlider.isThumbCircle = true;
            widthSlider.background = '#a3a3a3';
            widthSlider.color = '#33648f';
            widthSlider.borderColor = '#33648f';
            widthSlider.onValueChangedObservable.add(value => this.setBrushWidth(value));
            GUI.toolWindow.addControl(widthSlider);
            this.GUI = {widthLabel, widthSlider};
            this.setBrushWidth(this.width);

            this.pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
                const {startPainting, stopPainting, metadata} = this.getParameters();
                if (pointerInfo.pickInfo?.hit) {
                    if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                        if (pointerInfo.event.button == 0) {
                            this.isPainting = true;
                            const circleCanvas = document.createElement('canvas');
                            circleCanvas.width = this.width;
                            circleCanvas.height = this.width;
                            const circleCtx = circleCanvas.getContext('2d')!;
                            circleCtx.imageSmoothingEnabled = false;
                            let pixels = new Array(4 * this.width * this.width);
                            const dis = this.width * this.width / 4;
                            const rgb = Color3.FromHexString(metadata.color)!;
                            const r = Math.floor(rgb.r * 255);
                            const g = Math.floor(rgb.g * 255);
                            const b = Math.floor(rgb.b * 255);
                            let idx = 0;
                            for(let y = -Math.ceil(this.width / 2); y < Math.floor(this.width / 2); y++) {
                                for (let x = -Math.ceil(this.width / 2); x < Math.floor(this.width / 2); x++) {
                                    pixels[idx++] = r;
                                    pixels[idx++] = g;
                                    pixels[idx++] = b;
                                    pixels[idx++] = (x * x + y * y <= dis) ? 255 : 0;
                                }
                            }
                            circleCtx.putImageData(new ImageData(Uint8ClampedArray.from(pixels), this.width, this.width), 0, 0);
                            this.circleCanvas = circleCanvas;
                            this.ctx = startPainting();
                            this.paint(pointerInfo);
                          }
                    }
                    if (pointerInfo.type === PointerEventTypes.POINTERMOVE && this.isPainting) {
                        this.paint(pointerInfo);
                    }
                }
                if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                    if (pointerInfo.event.button == 0) {
                        this.isPainting = false;
                        this.circleCanvas.parentNode?.removeChild(this.circleCanvas);
                        stopPainting();
                        this.mousePos = null;
                      }
                }
            });
            this.isPainting = false;
        }
        cleanup () {
            Object.entries(this.GUI).forEach(([key, value]) => value.dispose());
            this.isPainting = false;
            if (this.pointerObserver) {
                this.getParameters().scene.onPointerObservable.remove(this.pointerObserver);
            }
        }       
    },
    usesWindow: true,
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMjksMTFhMy41NywzLjU3LDAsMCwxLDAsNS4wNkwxNywyOGEyLjM0LDIuMzQsMCwwLDEtMSwuNThMMTAuOTEsMzBhLjc1Ljc1LDAsMCwxLS45Mi0uOTJMMTEuMzgsMjRBMi4zNCwyLjM0LDAsMCwxLDEyLDIzbDEyLTEyQTMuNTcsMy41NywwLDAsMSwyOSwxMVpNMjMsMTQuMSwxMywyNGEuNjkuNjksMCwwLDAtLjE5LjMzbC0xLjA1LDMuODUsMy44NS0xQS42OS42OSwwLDAsMCwxNiwyN0wyNS45LDE3Wm0yLTItMSwxTDI3LDE2bDEtMUEyLjA4LDIuMDgsMCwxLDAsMjUsMTIuMDdaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+`
};
