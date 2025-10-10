/* eslint-disable github/no-then */
import * as React from "react";
import type { GlobalState } from "../globalState";
import { CommandButtonComponent } from "./commandButtonComponent";
import { CommandDropdownComponent } from "./commandDropdownComponent";
import { Utilities } from "../tools/utilities";
import { WebGPUEngine } from "@dev/core";

import "../scss/commandBar.scss";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let Versions: any;

interface ICommandBarComponentProps {
    globalState: GlobalState;
}

interface ICommandBarComponentState {
    isInspectorV2ModeEnabled: boolean;
}

export class CommandBarComponent extends React.Component<ICommandBarComponentProps, ICommandBarComponentState> {
    private _webGPUSupported: boolean = false;
    private _procedural: {
        label: string;
        tooltip: string;
        subItems?: string[];
        keepExpanded?: boolean;
    }[];

    public constructor(props: ICommandBarComponentProps) {
        super(props);

        const searchParams = new URL(window.location.href).searchParams;
        this.state = {
            isInspectorV2ModeEnabled: searchParams.has("inspectorv2") && searchParams.get("inspectorv2") !== "false",
        };

        // First Fetch JSON data for procedural code
        this._procedural = [];
        const url = "procedural.json?uncacher=" + Date.now();
        fetch(url)
            .then(async (response) => await response.json())
            .then((data) => {
                this._procedural = data;
                this._load();
            })
            .catch((err) => {
                this._load();
            });
    }

    private _load() {
        this.props.globalState.onLanguageChangedObservable.add(() => {
            this.forceUpdate();
        });

        if (typeof WebGPUEngine !== "undefined") {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            WebGPUEngine.IsSupportedAsync.then((result) => {
                this._webGPUSupported = result;
                if (location.search.indexOf("webgpu") !== -1 && this._webGPUSupported) {
                    Utilities.StoreStringToStore("engineVersion", "WebGPU", true);
                }
                this.forceUpdate();
            });
        }
    }

    onPlay() {
        this.props.globalState.onRunRequiredObservable.notifyObservers();
    }

    onNew() {
        this.props.globalState.onNewRequiredObservable.notifyObservers();
    }

    onInsertSnippet(snippetKey: string) {
        this.props.globalState.onInsertSnippetRequiredObservable.notifyObservers(snippetKey);
    }

    onClear() {
        this.props.globalState.onClearRequiredObservable.notifyObservers();
    }

    onSave() {
        this.props.globalState.onSaveRequiredObservable.notifyObservers();
    }

    onDownload() {
        this.props.globalState.onDownloadRequiredObservable.notifyObservers();
    }

    onInspector(action: "refresh" | "toggle") {
        this.props.globalState.onInspectorRequiredObservable.notifyObservers(action);
    }

    onExamples() {
        this.props.globalState.onExamplesDisplayChangedObservable.notifyObservers();
    }

    onToggleInspectorV2Mode() {
        const newState = !this.state.isInspectorV2ModeEnabled;
        this.setState({ isInspectorV2ModeEnabled: newState }, () => {
            // Update URL after state is set
            const url = new URL(window.location.href);
            if (this.state.isInspectorV2ModeEnabled) {
                url.searchParams.set("inspectorv2", "true");
                localStorage.setItem("inspectorv2", "true");
            } else {
                url.searchParams.delete("inspectorv2");
                localStorage.removeItem("inspectorv2");
            }
            window.history.pushState({}, "", url.toString());
            this.onInspector("refresh");
        });
    }

    override componentDidMount(): void {
        if (!this.state.isInspectorV2ModeEnabled && localStorage.getItem("inspectorv2") === "true") {
            if (new URL(window.location.href).searchParams.get("inspectorv2") === "false") {
                localStorage.removeItem("inspectorv2");
            } else {
                this.onToggleInspectorV2Mode();
            }
        }
    }

    public override render() {
        // Main options for the editor itself
        const editorOptions = [
            {
                label: "Theme",
                tooltip: "Controls the color scheme of the playground",
                storeKey: "theme",
                defaultValue: "Light",
                subItems: ["Light", "Dark"],
                onClick: () => {
                    this.props.globalState.onThemeChangedObservable.notifyObservers();
                },
            },
            {
                label: "Font size",
                tooltip: "Change the font size of the code editor",
                storeKey: "font-size",
                defaultValue: "14",
                subItems: ["12", "14", "16", "18", "20", "22", "24", "26", "28", "30"],
                onClick: () => {
                    this.props.globalState.onFontSizeChangedObservable.notifyObservers();
                },
            },
            {
                label: "Safe mode",
                tooltip: "Asks to confirm if you leave page without saving",
                storeKey: "safe-mode",
                defaultValue: false,
                onCheck: () => {},
            },
            {
                label: "CTRL+S to save",
                tooltip: "Saves your playground code online and creates a shareable link",
                storeKey: "ctrl-s-to-save",
                defaultValue: true,
                onCheck: () => {},
            },
            {
                label: "editor",
                tooltip: "Show/Hide the Code Editor",
                storeKey: "editor",
                defaultValue: true,
                onCheck: (value: boolean) => {
                    this.props.globalState.onEditorDisplayChangedObservable.notifyObservers(value);
                },
            },
            {
                label: "minimap",
                tooltip: "Show/Hide the Code Minimap",
                storeKey: "minimap",
                defaultValue: true,
                onCheck: (value: boolean) => {
                    this.props.globalState.onMinimapChangedObservable.notifyObservers(value);
                },
            },
            {
                label: "fullscreen",
                tooltip: "Makes the canvas fullscreen",
                onClick: () => {
                    this.props.globalState.onFullcreenRequiredObservable.notifyObservers();
                },
            },
            {
                label: "fullscreen editor",
                tooltip: "Makes the code editor fullscreen",
                onClick: () => {
                    this.props.globalState.onEditorFullcreenRequiredObservable.notifyObservers();
                },
            },
            {
                label: "format code",
                tooltip: "Autoformats code",
                onClick: () => {
                    this.props.globalState.onFormatCodeRequiredObservable.notifyObservers();
                },
            },
            {
                label: "metadata",
                tooltip: "Edit the playground title, description, and tags",
                onClick: () => {
                    this.props.globalState.onDisplayMetadataObservable.notifyObservers(true);
                },
            },
            {
                label: "QR code",
                tooltip: "Shows a QR code that points to this playground",
                onClick: () => {
                    this.props.globalState.onQRCodeRequiredObservable.notifyObservers(true);
                },
            },
            {
                label: "Load Babylon Toolkit",
                tooltip: "Loads the Babylon Toolkit into the playground",
                storeKey: "babylon-toolkit",
                defaultValue: false,
                onCheck: () => {},
            },
            {
                label: "Auto-run",
                tooltip: "Playground code runs automatically after loading",
                storeKey: "auto-run",
                defaultValue: true,
                onCheck: () => {},
            },
        ];

        // Procedural Code Generator Options (build from procedural.json)
        let proceduralOptions: any[] = [];
        proceduralOptions = this._procedural.map((item) => ({
            ...item,
            onClick: () => {},
            onInsert: (snippetKey: string) => {
                this.onInsertSnippet(snippetKey);
            },
        }));

        // Engine Version Options
        const activeVersion = Utilities.ReadStringFromStore("version", "Latest", true);
        const activeEngineVersion = Utilities.ReadStringFromStore("engineVersion", "WebGL2", true);

        const versionOptions = Object.keys(Versions)
            .filter((key) => key !== "local")
            .map((key) => {
                return {
                    label: key,
                    tooltip: `Use Babylon.js version: ${key}`,
                    storeKey: "version",
                    isActive: activeVersion === key,
                    onClick: () => {
                        Utilities.StoreStringToStore("version", key, true);
                        window.location.reload();
                    },
                    validate: () => window.confirm(Utilities.GetCodeLostConfirmationMessage("version")),
                };
            });

        const engineOptions = [
            {
                label: "WebGL2",
                tooltip: "Use WebGL 2 Renderer",
                storeKey: "engineVersion",
                isActive: activeEngineVersion === "WebGL2",
                onClick: () => {
                    Utilities.StoreStringToStore("engineVersion", "WebGL2", true);
                    if (location.search.indexOf("webgpu") !== -1) {
                        location.search = location.search.replace("webgpu", "");
                    } else {
                        window.location.reload();
                    }
                },
                validate: () => window.confirm(Utilities.GetCodeLostConfirmationMessage("version")),
            },
            {
                label: "WebGL",
                tooltip: "Use WebGL 1 Renderer",
                storeKey: "engineVersion",
                isActive: activeEngineVersion === "WebGL",
                onClick: () => {
                    if (location.search.indexOf("webgpu") !== -1) {
                        location.search = location.search.replace("webgpu", "");
                    }
                    Utilities.StoreStringToStore("engineVersion", "WebGL", true);
                    if (location.search.indexOf("webgpu") !== -1) {
                        location.search = location.search.replace("webgpu", "");
                    } else {
                        window.location.reload();
                    }
                },
                validate: () => window.confirm(Utilities.GetCodeLostConfirmationMessage("version")),
            },
        ];

        const fileOptions = [
            {
                label: "Load",
                tooltip: "Load a saved playground from a local file",
                onClick: () => {
                    this.props.globalState.onLocalLoadRequiredObservable.notifyObservers();
                },
            },
            {
                label: "Save",
                tooltip: "Save the playground to a local file",
                onClick: () => {
                    this.props.globalState.onLocalSaveRequiredObservable.notifyObservers();
                },
            },
        ];

        if (this._webGPUSupported) {
            engineOptions.splice(0, 0, {
                label: "WebGPU",
                tooltip: "Use WebGPU Renderer (experimental)",
                storeKey: "engineVersion",
                isActive: activeEngineVersion === "WebGPU",
                onClick: () => {
                    Utilities.StoreStringToStore("engineVersion", "WebGPU", true);
                    window.location.reload();
                },
                validate: () => window.confirm(Utilities.GetCodeLostConfirmationMessage("version")),
            });
        }

        return (
            <div className={"commands " + (this.props.globalState.language === "JS" ? "background-js" : "background-ts")}>
                <div className="commands-left">
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Run" icon="play" shortcut="Alt+Enter" isActive={true} onClick={() => this.onPlay()} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Save" icon="save" shortcut="Ctrl+S" isActive={false} onClick={() => this.onSave()} />
                    <CommandDropdownComponent globalState={this.props.globalState} icon="saveLocal" tooltip="Local file" items={fileOptions} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Inspector" icon="inspector" isActive={false} onClick={() => this.onInspector("toggle")} />
                    <CommandButtonComponent
                        globalState={this.props.globalState}
                        tooltip="Download"
                        icon="download"
                        shortcut="Shift+Ctrl+S"
                        isActive={false}
                        onClick={() => this.onDownload()}
                    />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Create new" icon="new" isActive={false} onClick={() => this.onNew()} />
                    <CommandDropdownComponent globalState={this.props.globalState} icon="fluentCode" tooltip="Code Generator" items={proceduralOptions} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Clear code" icon="clear" isActive={false} onClick={() => this.onClear()} />
                    <CommandDropdownComponent globalState={this.props.globalState} icon="options" tooltip="Options" items={editorOptions} />
                </div>
                <div className="commands-right">
                    <CommandDropdownComponent
                        globalState={this.props.globalState}
                        storeKey={"engineVersion"}
                        defaultValue={activeEngineVersion}
                        tooltip="Engine"
                        useSessionStorage={true}
                        toRight={true}
                        items={engineOptions}
                    />
                    <CommandDropdownComponent
                        globalState={this.props.globalState}
                        storeKey={"version"}
                        defaultValue={activeVersion}
                        useSessionStorage={true}
                        tooltip="Versions"
                        toRight={true}
                        items={versionOptions}
                    />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Examples" icon="examples" onClick={() => this.onExamples()} isActive={false} />
                    <div className="language-button active inspector-v2-button" onClick={() => this.onToggleInspectorV2Mode()}>
                        {this.state.isInspectorV2ModeEnabled ? "Back to Old Inspector" : "Try the New Inspector"}
                    </div>
                </div>
            </div>
        );
    }
}
