/* eslint-disable jsdoc/require-jsdoc */

import { Utilities } from "./tools/utilities";
import type { CompilationError } from "./components/errorDisplayComponent";
import { Observable } from "@dev/core";
import type { Nullable } from "@dev/core";
import type { V2Runner } from "./tools/monaco/run/runner";
import type { V2Manifest } from "./tools/snippet";

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
    public currentCode!: string;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public getRunnable: () => Promise<V2Runner> = async () => {
        throw new Error("Must be set in runtime");
    };
    currentRunner?: V2Runner | null;

    public language = Utilities.ReadStringFromStore("language", "JS");
    public fpsElement!: HTMLDivElement;
    public mobileDefaultMode = EditionMode.RenderingOnly;
    public runtimeMode = RuntimeMode.Editor;
    public version: string = "";
    public bundles: string[] = [];

    public currentSnippetTitle = "";
    public currentSnippetDescription = "";
    public currentSnippetTags = "";
    public currentSnippetToken = "";
    public currentSnippetRevision = "";
    public files: Record<string, string> = {};

    /** Active file path (internal) */
    public activeFilePath: string = Utilities.ReadStringFromStore("language", "JS") === "JS" ? "index.js" : "index.ts";
    /** Import map for V2 multi-file */
    public importsMap: Record<string, string> = {};
    /** Entry file for execution */
    public entryFilePath: string = Utilities.ReadStringFromStore("language", "JS") === "JS" ? "index.js" : "index.ts";
    /** Manual tab order */
    public filesOrder: string[] = [];

    public openEditors: string[] = []; // paths that are open in tabs
    public activeEditorPath: string | undefined; // current active tab
    public onOpenEditorsChangedObservable: Observable<void> = new Observable<void>();
    public onActiveEditorChangedObservable: Observable<void> = new Observable<void>();

    public onEngineChangedObservable = new Observable<string | void>();
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
    public onInspectorRequiredObservable = new Observable<void>();
    public onFormatCodeRequiredObservable = new Observable<void>();
    public onFullcreenRequiredObservable = new Observable<void>();
    public onEditorFullcreenRequiredObservable = new Observable<void>();
    public onMinimapChangedObservable = new Observable<boolean>();
    public onEditorDisplayChangedObservable = new Observable<boolean>();
    public onThemeChangedObservable = new Observable<void>();
    public onFontSizeChangedObservable = new Observable<void>();
    public onLanguageChangedObservable = new Observable<void>();
    public onNavigateRequiredObservable = new Observable<{
        lineNumber: number;
        column: number;
    }>();
    public onExamplesDisplayChangedObservable = new Observable<void>();
    public onQRCodeRequiredObservable = new Observable<boolean>();
    public onNewDropdownButtonClicked = new Observable<any>();
    public onFilesChangedObservable = new Observable<void>();
    public onActiveFileChangedObservable = new Observable<void>();
    public onManifestChangedObservable = new Observable<void>();
    public onFilesOrderChangedObservable = new Observable<void>();
    public onV2HydrateRequiredObservable = new Observable<V2Manifest>();

    public loadingCodeInProgress = false;
    public onCodeLoaded = new Observable<string>();
    public doNotRun = false;
}
