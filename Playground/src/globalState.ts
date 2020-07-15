import { Observable } from 'babylonjs/Misc/observable';

export enum EditionMode {
    Desktop,
    CodeOnly,
    RenderingOnly
}

export class GlobalState {
    public readonly MobileSizeTrigger = 1024;
    public readonly SnippetServerUrl = "https://snippet.babylonjs.com";

    public currentCode: string;
    public language: "JS" | "TS" = "JS";
    public fpsElement: HTMLDivElement;
    public mobileDefaultMode = EditionMode.RenderingOnly;

    public currentSnippetTitle = "";
    public currentSnippetDescription = "";
    public currentSnippetTags = "";
    public currentSnippetToken = "";

    public zipCode = "";

    public onRunRequiredObservable = new Observable<void>();
    public onNewRequiredObservable = new Observable<void>();
    public onClearRequiredObservable = new Observable<void>();
    public onSaveRequiredObservable = new Observable<void>();
    public onErrorObservable = new Observable<string>();    
    public onMobileDefaultModeChangedObservable = new Observable<void>();
    public onDisplayWaitRingObservable = new Observable<boolean>();
    public onDisplayMetadataObservable = new Observable<boolean>();    
    public onMetadataUpdatedObservable = new Observable<void>();  
    public onMetadataWindowHiddenObservable = new Observable<boolean>();
    public onDownloadRequiredObservable = new Observable<void>();
    public onInspectorRequiredObservable = new Observable<void>();    
    public onFormatCodeRequiredObservable = new Observable<void>();  
    public onFullcreenRequiredObservable = new Observable<void>();
    public onEditorFullcreenRequiredObservable = new Observable<void>();
    public onMinimapChangedObservable = new Observable<boolean>();
    public onEditorDisplayChangedObservable = new Observable<boolean>();

    public loadingCodeInProgress = false;
    public onCodeLoaded = new Observable<string>();
}