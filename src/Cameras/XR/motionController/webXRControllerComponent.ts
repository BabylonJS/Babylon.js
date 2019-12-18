import { IMinimalMotionControllerObject, MotionControllerComponentType } from "./webXRAbstractController";
import { Observable } from '../../../Misc/observable';
import { IDisposable } from '../../../scene';

export class WebXRControllerComponent implements IDisposable {

    public onButtonStateChanged: Observable<WebXRControllerComponent> = new Observable();
    public onAxisValueChanged: Observable<{ x: number, y: number }> = new Observable();

    private _currentValue: number = 0;
    private _touched: boolean = false;
    private _pressed: boolean = false;
    private _axes: {
        x: number;
        y: number;
    } = {
            x: 0,
            y: 0
        };

    constructor(public id: string,
        public type: MotionControllerComponentType,
        private _buttonIndex: number = -1,
        private _axesIndices: number[] = []) {

    }

    public get value() {
        return this._currentValue;
    }

    public get pressed() {
        return this._pressed;
    }

    public get touched() {
        return this._touched;
    }

    public isButton() {
        return this._buttonIndex !== -1;
    }

    public isAxes() {
        return this._axesIndices.length !== 0;
    }

    public update(nativeController: IMinimalMotionControllerObject) {
        let buttonUpdated = false;
        let axesUpdate = false;

        if (this.isButton()) {
            const button = nativeController.buttons[this._buttonIndex];
            if (this._currentValue !== button.value) {
                buttonUpdated = true;
                this._currentValue = button.value;
            }
            if (this._touched !== button.touched) {
                buttonUpdated = true;
                this._touched = button.touched;
            }
            if (this._pressed !== button.pressed) {
                buttonUpdated = true;
                this._pressed = button.pressed;
            }
        }

        if (this.isAxes()) {
            if (this._axes.x !== nativeController.axes[this._axesIndices[0]]) {
                this._axes.x = nativeController.axes[this._axesIndices[0]];
                axesUpdate = true;
            }

            if (this._axes.y !== nativeController.axes[this._axesIndices[1]]) {
                this._axes.y = nativeController.axes[this._axesIndices[1]];
                axesUpdate = true;
            }
        }

        if (buttonUpdated) {
            this.onButtonStateChanged.notifyObservers(this);
        }
        if (axesUpdate) {
            this.onAxisValueChanged.notifyObservers(this._axes);
        }
    }

    public dispose(): void {
        this.onAxisValueChanged.clear();
        this.onButtonStateChanged.clear();
    }
}