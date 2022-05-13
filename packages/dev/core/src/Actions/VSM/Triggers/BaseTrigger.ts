import { Observable } from "core/Misc/observable";
import { Scene, IDisposable } from "core/scene";

export class BaseTrigger<T = void> implements IDisposable {
    public onTriggeredObservable: Observable<T> = new Observable();

    constructor(private _scene: Scene) {}

    dispose(): void {
        
    }
}
