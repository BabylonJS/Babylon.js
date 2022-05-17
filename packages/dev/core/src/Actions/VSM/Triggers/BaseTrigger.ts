import { Observable } from "../../../Misc/observable";
import { IDisposable, Scene } from "../../../scene";

export class BaseTrigger<T = void> implements IDisposable {
    public onTriggeredObservable: Observable<T> = new Observable();

    constructor(private _scene: Scene) {}

    dispose(): void {
        console.log(this._scene);
    }
}
