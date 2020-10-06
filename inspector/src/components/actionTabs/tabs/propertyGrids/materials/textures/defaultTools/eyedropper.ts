import { IToolParameters, IToolData } from '../textureEditorComponent';
import { PointerEventTypes, PointerInfo } from 'babylonjs/Events/pointerEvents';
import { Nullable } from 'babylonjs/types'
import { Observer } from 'babylonjs/Misc/observable';
import { Color3 } from 'babylonjs/Maths/math.color';

export const Eyedropper : IToolData = {
    name: 'Eyedropper',
    type: class {
        getParameters: () => IToolParameters;
        pointerObserver: Nullable<Observer<PointerInfo>>;
        isPicking: boolean;

        constructor(getParameters: () => IToolParameters) {
            this.getParameters = getParameters;
        }

        pick(pointerInfo : PointerInfo) {
            const {canvas2D, setMetadata, getMouseCoordinates} = this.getParameters();
            const ctx = canvas2D.getContext('2d');
            const {x, y} = getMouseCoordinates(pointerInfo);
            const pixel = ctx!.getImageData(x, y, 1, 1).data;
            setMetadata({
                color: Color3.FromInts(pixel[0], pixel[1], pixel[2]).toHexString(),
                alpha: pixel[3] / 255
            });
        }
        
        setup () {
            this.pointerObserver = this.getParameters().scene.onPointerObservable.add((pointerInfo) => {
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
            if (this.pointerObserver) {
                this.getParameters().scene.onPointerObservable.remove(this.pointerObserver);
            }
        }
    },
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMjkuMzIsMTAu
    NjhjLTEuNjYtMS42Ni00LjA2LTEtNS41Ni41YTExLjg5LDExLjg5LDAsMCwwLTEuNjYsMi4zMUwyMiwxMy40MWExLjg5LDEuODksMCwwLDAtMi42NiwwbC0uOS45YTEuODksMS44OSwwLDAsMC0uMjIsMi4zOWwtNi4wOSw2LjA5YTIuNzUsMi43NSwwLDAsMC0uNzMs
    MS4yOGwtLjgxLDMuMjYtLjU2LjU2YTEuMTYsMS4xNiwwLDAsMCwwLDEuNjVsLjQxLjQxYTEuMTcsMS4xNywwLDAsMCwxLjY1LDBsLjU2LS41NiwzLjI2LS44MWEyLjc1LDIuNzUsMCwwLDAsMS4yOC0uNzNsNi4xNC02LjE0YTEuODcsMS44NywwLDAsMCwuODQuMjEs
    MS44MywxLjgzLDAsMCwwLDEuMzMtLjU1bC45LS45YTEuODcsMS44NywwLDAsMCwuMDgtMi41NywxMS41NCwxMS41NCwwLDAsMCwyLjMyLTEuNjZDMzAuMzIsMTQuNzQsMzEsMTIuMzUsMjkuMzIsMTAuNjhaTTE2LjE1LDI2Ljc5YTEuMjEsMS4yMSwwLDAsMS0uNTgu
    MzNMMTIsMjhsLjktMy41OWExLjIxLDEuMjEsMCwwLDEsLjMzLS41OGw2LjA3LTYuMDcsMi45NCwyLjk0Wm05LjIxLTcuMzgtLjkuOWMtLjE5LjItLjM0LjItLjU0LDBsLTQuNC00LjRhLjQuNCwwLDAsMSwwLS41NGwuOS0uOWEuNDMuNDMsMCwwLDEsLjI3LS4xMS4z
    OS4zOSwwLDAsMSwuMjcuMTFsNC40LDQuNEEuMzguMzgsMCwwLDEsMjUuMzYsMTkuNDFabTMuMzgtNS45M2EzLjcsMy43LDAsMCwxLTEsMS43LDExLjY3LDExLjY3LDAsMCwxLTIuMzUsMS42MkwyMy4yLDE0LjU5YTExLjY3LDExLjY3LDAsMCwxLDEuNjItMi4zNSwz
    LjcsMy43LDAsMCwxLDEuNy0xLDEuODMsMS44MywwLDAsMSwyLjIyLDIuMjJaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+`,
    cursor: `iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAABmJLR0QA/wD/AP+gvaeTAAAByklEQVQ4jbWUv4saQRTHd+4s/BuCYRH1n7BQEhCRuyJ3RQgpRVt/tFvYSAjLxMPiWIJ1OA6OKwKBdCGBkIS4pFs76xgXhOlyyconzSrrojub4l618+a9z/u+mTdrGPdgIk0QwDZBCG3OUerqepYeCgigAbyJ+a+AEyB9lTDxAfBhPp9jWRZh+wB0u11msxnAJyCXSmkI/DIejx9Vq1Ujm83u7OdyOaPRaBi2bVeAr8BDnUIBfJRSUi6XWSwWa+B1VClw6ft+UKlUsG0b4DNw+G6AU8/zME2T5XIZAE9C/xYark983/9rmubmKM6SoNedTofRaARwqenqQkpJr9cDuI3uiYiSvbaZS4Dod1J8JrJIUoUQYgs+FLuplYk79lQ2hBAipvSggH2Vbvr9PlJKgFea2JeO49BqtQDeJgWee55HPp9ntVr9AR6H/vjtV5VSd8Vikel0CvA0CXoEfBsOh9RqNZRSd8CL2JwOlVK/6/X65rVNgWPdEeTX6/XPwWBAqVRiMpnsPFPHcSgUCliWRRAEv4BCIjAKBr67rkuz2dyBttttXNcF+AEUUwEj4GPgGfAu1v574DmQ0UI0BXYuSmepf9L/NZv3Yf8AKtG4imEra4UAAAAASUVORK5CYII=`
};
