import * as React from "react";
import { GlobalState } from "../globalState";
import { CommandButtonComponent } from "./commandButtonComponent";

import HambugerButton from "../imgs/hamburger.svg";
import { CommandDropdownComponent } from "./commandDropdownComponent";
import { Utilities } from "../tools/utilities";

require("../scss/hamburgerMenu.scss");

declare var Versions: any;

interface IHamburgerMenuComponentProps {
    globalState: GlobalState;
}

export class HamburgerMenuComponent extends React.Component<IHamburgerMenuComponentProps, { isExpanded: boolean }> {
    private webGPUSupported: boolean = false;
    public constructor(props: IHamburgerMenuComponentProps) {
        super(props);
        this.state = { isExpanded: false };

        if (typeof BABYLON.WebGPUEngine !== "undefined") {
            BABYLON.WebGPUEngine.IsSupportedAsync.then((result) => {
                this.webGPUSupported = result;
                if (location.search.indexOf("webgpu") !== -1 && this.webGPUSupported) {
                    Utilities.StoreStringToStore("engineVersion", "WebGPU");
                }
                this.forceUpdate();
            });
        }
    }

    onPlay() {
        this.props.globalState.onRunRequiredObservable.notifyObservers();
        this.setState({ isExpanded: false });
    }

    onNew() {
        this.props.globalState.onNewRequiredObservable.notifyObservers();
        this.setState({ isExpanded: false });
    }

    onClear() {
        this.props.globalState.onClearRequiredObservable.notifyObservers();
        this.setState({ isExpanded: false });
    }

    onSave() {
        this.props.globalState.onSaveRequiredObservable.notifyObservers();
        this.setState({ isExpanded: false });
    }

    onDownload() {
        this.props.globalState.onDownloadRequiredObservable.notifyObservers();
        this.setState({ isExpanded: false });
    }

    onInspector() {
        this.props.globalState.onInspectorRequiredObservable.notifyObservers(!this.props.globalState.inspectorIsOpened);
        this.setState({ isExpanded: false });
    }

    onFormatCode() {
        this.props.globalState.onFormatCodeRequiredObservable.notifyObservers();
        this.setState({ isExpanded: false });
    }

    onMetadata() {
        this.props.globalState.onDisplayMetadataObservable.notifyObservers(true);
        this.setState({ isExpanded: false });
    }

    onExamples() {
        this.props.globalState.onExamplesDisplayChangedObservable.notifyObservers();
        this.setState({ isExpanded: false });
    }

    switch() {
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    public render() {
        let activeVersion = Utilities.ReadStringFromStore("version", "Latest");
        let activeEngineVersion = Utilities.ReadStringFromStore("engineVersion", "WebGL2");

        var versionOptions = Object.keys(Versions).map((key) => {
            return {
                label: key,
                tooltip: `Use Babylon.js version: ${key}`,
                storeKey: "version",
                isActive: activeVersion === key,
                onClick: () => {
                    Utilities.StoreStringToStore("engineVersion", key);
                    window.location.reload();
                },
            };
        });

        var engineOptions = [
            {
                label: "WebGL2",
                tooltip: "Use WebGL 2 Renderer",
                storeKey: "engineVersion",
                isActive: activeEngineVersion === "WebGL2",
                onClick: () => {
                    Utilities.StoreStringToStore("engineVersion", "WebGL2");
                    window.location.reload();
                },
            },
            {
                label: "WebGL",
                tooltip: "Use WebGL 1 Renderer",
                storeKey: "engineVersion",
                isActive: activeEngineVersion === "WebGL",
                onClick: () => {
                    Utilities.StoreStringToStore("engineVersion", "WebGL");
                    window.location.reload();
                },
            },
        ];

        if (this.webGPUSupported) {
            engineOptions.splice(0, 0, {
                label: "WebGPU",
                tooltip: "Use WebGPU Renderer (experimental)",
                storeKey: "engineVersion",
                isActive: activeEngineVersion === "WebGPU",
                onClick: () => {
                    Utilities.StoreStringToStore("engineVersion", "WebGPU");
                    window.location.reload();
                },
            });
        }
        return (
            <>
                {this.state.isExpanded && <div className="click-blocker" onClick={() => this.setState({ isExpanded: false })}></div>}
                <div className={"hamburger-button " + (this.props.globalState.language === "JS" ? "background-js" : "background-ts")} onClick={() => this.switch()}>
                    <HambugerButton />
                </div>
                <div className={"hambuger-menu " + (this.props.globalState.language === "JS" ? "background-js" : "background-ts") + (this.state.isExpanded ? " expanded" : "")}>
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Run" icon="play" isActive={true} onClick={() => this.onPlay()} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Save" icon="save" isActive={false} onClick={() => this.onSave()} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Inspector" icon="inspector" isActive={false} onClick={() => this.onInspector()} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Download" icon="download" isActive={false} onClick={() => this.onDownload()} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Create new" icon="new" isActive={false} onClick={() => this.onNew()} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Clear code" icon="clear" isActive={false} onClick={() => this.onClear()} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Format code" icon="options" isActive={false} onClick={() => this.onFormatCode()} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Metadata" icon="options" isActive={false} onClick={() => this.onMetadata()} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Examples" icon="examples" onClick={() => this.onExamples()} isActive={false} />
                    <CommandDropdownComponent
                        globalState={this.props.globalState}
                        hamburgerMode={true}
                        icon="engineVersion"
                        defaultValue={activeEngineVersion}
                        tooltip="Engine"
                        toRight={true}
                        items={engineOptions}
                    />
                    <CommandDropdownComponent
                        globalState={this.props.globalState}
                        hamburgerMode={true}
                        icon="renderer"
                        defaultValue={activeVersion}
                        tooltip="Versions"
                        toRight={true}
                        items={versionOptions}
                    />
                </div>
            </>
        );
    }
}
