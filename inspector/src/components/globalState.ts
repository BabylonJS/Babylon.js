import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "./propertyChangedEvent";

export class GlobalState {
    public onSelectionChangeObservable: Observable<string>;
    public onPropertyChangedObservable: Observable<PropertyChangedEvent>;
}