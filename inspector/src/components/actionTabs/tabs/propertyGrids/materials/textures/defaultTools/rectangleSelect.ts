import { IToolData, IToolParameters } from '../textureEditorComponent';
import { PointerEventTypes, PointerInfo } from 'babylonjs/Events/pointerEvents';
import { Observer, Nullable } from 'babylonjs';

export const RectangleSelect : IToolData = {
    name: 'Rectangle Select',
    type: class {
        getParameters: () => IToolParameters;
        pointerObserver: Nullable<Observer<PointerInfo>>;
        isSelecting = false;
        xStart : number = -1;
        yStart : number = -1;
        constructor(getParameters: () => IToolParameters) {
            this.getParameters = getParameters;
        }
        setup() {
            const {scene} = this.getParameters();
            this.pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
                const {getMouseCoordinates, setMetadata, metadata} = this.getParameters();
                if (pointerInfo.pickInfo?.hit) {
                    if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                        if (pointerInfo.event.button == 0) {
                            this.isSelecting = true;
                            const {x, y} = {x: this.xStart, y: this.yStart} = getMouseCoordinates(pointerInfo);
                            setMetadata({
                                select: {
                                    x1: x,
                                    y1: y,
                                    x2: x,
                                    y2: y
                                }
                            })
                          }
                    }
                    if (pointerInfo.type === PointerEventTypes.POINTERMOVE && this.isSelecting) {
                        const {x, y} = getMouseCoordinates(pointerInfo);
                        setMetadata({
                            select: {
                                x1: Math.min(x, this.xStart),
                                y1: Math.min(y, this.yStart),
                                x2: Math.max(x, this.xStart),
                                y2: Math.max(y, this.yStart)
                            }
                        })
                    }
                }
                if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                    if (pointerInfo.event.button == 0) {
                        this.isSelecting = false;
                        if (metadata.select.x1 === metadata.select.x2 || metadata.select.y1 === metadata.select.y2) {
                            setMetadata({
                                select: {
                                    x1: -1, y1: -1, x2: -1, y2: -1
                                }
                            })
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
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMTEuNjMsMTUuNjNIMTAuMzh2LTMuN2ExLjU0LDEuNTQsMCwwLDEsMS41NS0xLjU1aDMuN3YxLjI1SDEyLjI1YS42Mi42MiwwLDAsMC0uNjIuNjJaIiBzdHlsZT0iZmlsbDojZmZmIi8+PHBhdGggZD0iTTExLjYzLDIyLjYzSDEwLjM4VjE3LjM4aDEuMjVaIiBzdHlsZT0iZmlsbDojZmZmIi8+PHBhdGggZD0iTTI5LjYzLDIyLjYzSDI4LjM4VjE3LjM4aDEuMjVaIiBzdHlsZT0iZmlsbDojZmZmIi8+PHBhdGggZD0iTTE1LjYzLDI5LjYzaC0zLjdhMS41NSwxLjU1LDAsMCwxLTEuNTUtMS41NlYyNC4zOGgxLjI1djMuMzdhLjYzLjYzLDAsMCwwLC42Mi42M2gzLjM4WiIgc3R5bGU9ImZpbGw6I2ZmZiIvPjxwYXRoIGQ9Ik0yOC4wNywyOS42M0gyNC4zOFYyOC4zOGgzLjM3YS42NC42NCwwLDAsMCwuNjMtLjYzVjI0LjM4aDEuMjV2My42OUExLjU2LDEuNTYsMCwwLDEsMjguMDcsMjkuNjNaIiBzdHlsZT0iZmlsbDojZmZmIi8+PHBhdGggZD0iTTIyLjYzLDExLjYzSDE3LjM4VjEwLjM4aDUuMjVaIiBzdHlsZT0iZmlsbDojZmZmIi8+PHBhdGggZD0iTTI5LjYzLDE1LjYzSDI4LjM4VjEyLjI1YS42My42MywwLDAsMC0uNjMtLjYySDI0LjM4VjEwLjM4aDMuNjlhMS41NSwxLjU1LDAsMCwxLDEuNTYsMS41NVoiIHN0eWxlPSJmaWxsOiNmZmYiLz48cGF0aCBkPSJNMjIuNjMsMjkuNjNIMTcuMzhWMjguMzhoNS4yNVoiIHN0eWxlPSJmaWxsOiNmZmYiLz48L3N2Zz4=`
}