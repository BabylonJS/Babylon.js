import { Observable } from 'babylonjs/Misc/observable';

export enum EditionMode {
    Desktop,
    CodeOnly,
    RenderingOnly
}

export class GlobalState {
    public readonly MobileSizeTrigger = 1024;
    public currentCode: string;
    public language: "JS" | "TS" = "JS";
    public fpsElement: HTMLDivElement;
    public mobileDefaultMode = EditionMode.RenderingOnly;

    public onRunRequiredObservable = new Observable<void>();
    public onNewRequiredObservable = new Observable<void>();
    public onErrorObservable = new Observable<string>();    
    public onMobileDefaultModeChangedObservable = new Observable<void>();
}