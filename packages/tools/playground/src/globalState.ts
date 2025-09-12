/* eslint-disable jsdoc/require-jsdoc */

import { Utilities } from "./tools/utilities";
import type { CompilationError } from "./components/errorDisplayComponent";
import { Observable } from "@dev/core";
import type { Nullable } from "@dev/core";
import type { V2Runner } from "./tools/monaco/run/runner";

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
    public currentSnippetTitle = "";
    public currentSnippetDescription = "";
    public currentSnippetTags = "";
    public currentSnippetToken = "";
    public files: Record<string, string> = {};

    /** Active file path (internal) */
    public activeFilePath: string = Utilities.ReadStringFromStore("language", "JS") === "JS" ? "index.js" : "index.ts";
    /** Import map for V2 multi-file */
    public importsMap: Record<string, string> = {};
    /** Flag indicating multi-file (V2) mode */
    public isMultiFile: boolean = false;
    /** Entry file for execution */
    public entryFilePath: string = Utilities.ReadStringFromStore("language", "JS") === "JS" ? "index.js" : "index.ts";
    /** Manual tab order */
    public filesOrder: string[] = [];

    /** Zipped code cache */
    public zipCode = "";

    public onRunRequiredObservable = new Observable<void>();
    public onRunExecutedObservable = new Observable<void>();
    public onSavedObservable = new Observable<void>();
    public onNewRequiredObservable = new Observable<void>();
    public onInsertSnippetRequiredObservable = new Observable<string>();
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
    public onV2HydrateRequiredObservable = new Observable<{
        files: Record<string, string>;
        entry: string;
        imports?: Record<string, string>;
        language: "JS" | "TS";
    }>();

    public loadingCodeInProgress = false;
    public onCodeLoaded = new Observable<string>();
    public doNotRun = false;
}
