import { ToolParameters, ToolData } from '../textureEditorComponent';
import { PointerEventTypes, PointerInfo } from 'babylonjs/Events/pointerEvents';

export const Eyedropper : ToolData = {
    name: 'Eyedropper',
    type: class {
        getParameters: () => ToolParameters;
        pointerObservable: any;
        isPicking: boolean;

        constructor(getParameters: () => ToolParameters) {
            this.getParameters = getParameters;
        }

        pick(pointerInfo : PointerInfo) {
            const p = this.getParameters();
            const ctx = p.canvas2D.getContext('2d');
            const {x, y} = p.getMouseCoordinates(pointerInfo);
            const pixel = ctx!.getImageData(x, y, 1, 1).data;
            p.setMetadata({
                color: '#' + ('000000' + this.rgbToHex(pixel[0], pixel[1], pixel[2])).slice(-6),
                opacity: pixel[3] / 255
            });
        }
        
        setup () {
            this.pointerObservable = this.getParameters().scene.onPointerObservable.add((pointerInfo) => {
                if (pointerInfo.pickInfo?.hit) {
                    if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
                        this.isPicking = true;
                        this.pick(pointerInfo);
                    }
                    if (pointerInfo.type === PointerEventTypes.POINTERMOVE && this.isPicking) {
                        this.pick(pointerInfo);
                    }
                    if (pointerInfo.type === PointerEventTypes.POINTERUP) {
                        this.isPicking = false;
                    }
                }
            });
            this.isPicking = false;
        }
        cleanup () {
            if (this.pointerObservable) {
                this.getParameters().scene.onPointerObservable.remove(this.pointerObservable);
            }
        }
        rgbToHex(r: number, g:number, b: number) {
            return ((r << 16) | (g << 8) | b).toString(16);
        }
    },
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMjkuMzIsMTAu
    NjhjLTEuNjYtMS42Ni00LjA2LTEtNS41Ni41YTExLjg5LDExLjg5LDAsMCwwLTEuNjYsMi4zMUwyMiwxMy40MWExLjg5LDEuODksMCwwLDAtMi42NiwwbC0uOS45YTEuODksMS44OSwwLDAsMC0uMjIsMi4zOWwtNi4wOSw2LjA5YTIuNzUsMi43NSwwLDAsMC0uNzMs
    MS4yOGwtLjgxLDMuMjYtLjU2LjU2YTEuMTYsMS4xNiwwLDAsMCwwLDEuNjVsLjQxLjQxYTEuMTcsMS4xNywwLDAsMCwxLjY1LDBsLjU2LS41NiwzLjI2LS44MWEyLjc1LDIuNzUsMCwwLDAsMS4yOC0uNzNsNi4xNC02LjE0YTEuODcsMS44NywwLDAsMCwuODQuMjEs
    MS44MywxLjgzLDAsMCwwLDEuMzMtLjU1bC45LS45YTEuODcsMS44NywwLDAsMCwuMDgtMi41NywxMS41NCwxMS41NCwwLDAsMCwyLjMyLTEuNjZDMzAuMzIsMTQuNzQsMzEsMTIuMzUsMjkuMzIsMTAuNjhaTTE2LjE1LDI2Ljc5YTEuMjEsMS4yMSwwLDAsMS0uNTgu
    MzNMMTIsMjhsLjktMy41OWExLjIxLDEuMjEsMCwwLDEsLjMzLS41OGw2LjA3LTYuMDcsMi45NCwyLjk0Wm05LjIxLTcuMzgtLjkuOWMtLjE5LjItLjM0LjItLjU0LDBsLTQuNC00LjRhLjQuNCwwLDAsMSwwLS41NGwuOS0uOWEuNDMuNDMsMCwwLDEsLjI3LS4xMS4z
    OS4zOSwwLDAsMSwuMjcuMTFsNC40LDQuNEEuMzguMzgsMCwwLDEsMjUuMzYsMTkuNDFabTMuMzgtNS45M2EzLjcsMy43LDAsMCwxLTEsMS43LDExLjY3LDExLjY3LDAsMCwxLTIuMzUsMS42MkwyMy4yLDE0LjU5YTExLjY3LDExLjY3LDAsMCwxLDEuNjItMi4zNSwz
    LjcsMy43LDAsMCwxLDEuNy0xLDEuODMsMS44MywwLDAsMSwyLjIyLDIuMjJaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+`
};