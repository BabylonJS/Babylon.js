import { Utilities } from "./tools/utilities";
import type { CompilationError } from "./components/errorDisplayComponent";
import { Observable } from "@dev/core";

import type { Nullable } from "@dev/core";

export enum EditionMode {
    Desktop,
    CodeOnly,
    RenderingOnly,
}

export enum RuntimeMode {
    Editor = 0,
    Full = 1,
    Frame = 2,
}

export class GlobalState {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public readonly MobileSizeTrigger = 1024;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public SnippetServerUrl = "https://snippet.babylonjs.com";

    public currentCode: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public getCompiledCode: () => Promise<string> = async () => {
        return await Promise.resolve(this.currentCode);
    };
    public language = Utilities.ReadStringFromStore("language", "JS");
    public fpsElement: HTMLDivElement;
    public mobileDefaultMode = EditionMode.RenderingOnly;

    public runtimeMode = RuntimeMode.Editor;
    public version: string;

    public currentSnippetTitle = "";
    public currentSnippetDescription = "";
    public currentSnippetTags = "";
    public currentSnippetToken = "";

    public zipCode = "";

    public onRunRequiredObservable = new Observable<void>();
    public onRunExecutedObservable = new Observable<void>();
    public onSavedObservable = new Observable<void>();
    public onNewRequiredObservable = new Observable<void>();
    public onInsertSnippetRequiredObservable = new Observable<string>();
    public onClearRequiredObservable = new Observable<void>();
    public onSaveRequiredObservable = new Observable<void>();
    public onLocalSaveRequiredObservable = new Observable<void>();
    public onLoadRequiredObservable = new Observable<string>();
    public onLocalLoadRequiredObservable = new Observable<void>();
    public onErrorObservable = new Observable<Nullable<CompilationError>>();
    public onMobileDefaultModeChangedObservable = new Observable<void>();
    public onDisplayWaitRingObservable = new Observable<boolean>();
    public onDisplayMetadataObservable = new Observable<boolean>();
    public onMetadataUpdatedObservable = new Observable<void>();
    public onMetadataWindowHiddenObservable = new Observable<boolean>();
    public onDownloadRequiredObservable = new Observable<void>();
    public onInspectorRequiredObservable = new Observable<"refresh" | "toggle" | "enable" | "disable">();
    public onFormatCodeRequiredObservable = new Observable<void>();
    public onFullcreenRequiredObservable = new Observable<void>();
    public onEditorFullcreenRequiredObservable = new Observable<void>();
    public onMinimapChangedObservable = new Observable<boolean>();
    public onEditorDisplayChangedObservable = new Observable<boolean>();
    public onThemeChangedObservable = new Observable<void>();
    public onFontSizeChangedObservable = new Observable<void>();
    public onLanguageChangedObservable = new Observable<void>();
    public onNavigateRequiredObservable = new Observable<{ lineNumber: number; column: number }>();
    public onExamplesDisplayChangedObservable = new Observable<void>();
    public onQRCodeRequiredObservable = new Observable<boolean>();
    public onNewDropdownButtonClicked = new Observable<any>();

    public loadingCodeInProgress = false;
    public onCodeLoaded = new Observable<string>();

    public doNotRun = false;
}
