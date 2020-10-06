import { Observable } from 'babylonjs/Misc/observable';
import { Utilities } from './tools/utilities';
import { CompilationError } from './components/errorDisplayComponent';
import { Nullable } from 'babylonjs/types';

export enum EditionMode {
    Desktop,
    CodeOnly,
    RenderingOnly
}

export enum RuntimeMode {
    Editor = 0,
    Full = 1,
    Frame = 2
}

export class GlobalState {
    public readonly MobileSizeTrigger = 1024;
    public readonly SnippetServerUrl = "https://snippet.babylonjs.com";

    public currentCode: string;
    public getCompiledCode: () => Promise<string> = () => {
        return Promise.resolve(this.currentCode);
    }
    public language = Utilities.ReadStringFromStore("language", "JS");
    public fpsElement: HTMLDivElement;
    public mobileDefaultMode = EditionMode.RenderingOnly;

    public runtimeMode = RuntimeMode.Editor;
    public inspectorIsOpened = false;

    public currentSnippetTitle = "";
    public currentSnippetDescription = "";
    public currentSnippetTags = "";
    public currentSnippetToken = "";

    public zipCode = "";

    public onRunRequiredObservable = new Observable<void>();
    public onSavedObservable = new Observable<void>();
    public onNewRequiredObservable = new Observable<void>();
    public onClearRequiredObservable = new Observable<void>();
    public onSaveRequiredObservable = new Observable<void>();
    public onLoadRequiredObservable = new Observable<string>();
    public onErrorObservable = new Observable<Nullable<CompilationError>>();
    public onMobileDefaultModeChangedObservable = new Observable<void>();
    public onDisplayWaitRingObservable = new Observable<boolean>();
    public onDisplayMetadataObservable = new Observable<boolean>();
    public onMetadataUpdatedObservable = new Observable<void>();
    public onMetadataWindowHiddenObservable = new Observable<boolean>();
    public onDownloadRequiredObservable = new Observable<void>();
    public onInspectorRequiredObservable = new Observable<boolean>();
    public onFormatCodeRequiredObservable = new Observable<void>();
    public onFullcreenRequiredObservable = new Observable<void>();
    public onEditorFullcreenRequiredObservable = new Observable<void>();
    public onMinimapChangedObservable = new Observable<boolean>();
    public onEditorDisplayChangedObservable = new Observable<boolean>();
    public onThemeChangedObservable = new Observable<void>();
    public onFontSizeChangedObservable = new Observable<void>();
    public onLanguageChangedObservable = new Observable<void>();
    public onNavigateRequiredObservable = new Observable<{lineNumber: number, column: number}>();
    public onExamplesDisplayChangedObservable = new Observable<void>();
    public onQRCodeRequiredObservable = new Observable<boolean>();

    public loadingCodeInProgress = false;
    public onCodeLoaded = new Observable<string>();
}