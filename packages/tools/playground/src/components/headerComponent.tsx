import * as React from "react";
import type { GlobalState } from "../globalState";

import LogoImage from "../imgs/logo.svg";
import { CommandBarComponent } from "./commandBarComponent";
import { Utilities } from "../tools/utilities";

import "../scss/header.scss";
import { Engine, EngineStore } from "@dev/core";

interface IHeaderComponentProps {
    globalState: GlobalState;
}

export class HeaderComponent extends React.Component<IHeaderComponentProps> {
    private _refVersionNumber: React.RefObject<HTMLSpanElement>;

    public constructor(props: IHeaderComponentProps) {
        super(props);

        this._refVersionNumber = React.createRef();

        this.props.globalState.onLanguageChangedObservable.add(() => {
            this.updateDescription();
            this.forceUpdate();
        });

        this.props.globalState.onRunExecutedObservable.add(() => {
            this.updateDescription();
        });
    }

    updateDescription() {
        this._refVersionNumber.current!.innerHTML = Engine.Version;

        if (EngineStore.LastCreatedEngine && EngineStore.LastCreatedEngine.name) {
            this._refVersionNumber.current!.innerHTML += ` (${EngineStore.LastCreatedEngine.name}${
                EngineStore.LastCreatedEngine.version > 1 ? EngineStore.LastCreatedEngine.version : ""
            })`;
        }
    }

    componentDidMount() {
        this.updateDescription();
    }

    public render() {
        return (
            <div id="pg-header">
                <div className="logo-area">
                    <LogoImage />
                    <div className="version">
                        <div className="version-text">Playground&nbsp;</div>
                        <span className="version-number" ref={this._refVersionNumber}></span>
                    </div>
                </div>
                <div className="command-bar">
                    {this.props.globalState.language === "JS" && (
                        <>
                            <div
                                className="language-button active background-ts"
                                onClick={() => {
                                    this.props.globalState.loadingCodeInProgress = false;
                                    Utilities.SwitchLanguage("TS", this.props.globalState);
                                }}
                            >
                                TS
                            </div>
                            <div className="language-button background-js">Javascript</div>
                        </>
                    )}
                    {this.props.globalState.language === "TS" && (
                        <>
                            <div
                                className="language-button active background-js"
                                onClick={() => {
                                    this.props.globalState.loadingCodeInProgress = false;
                                    Utilities.SwitchLanguage("JS", this.props.globalState);
                                }}
                            >
                                JS
                            </div>
                            <div className="language-button background-ts">TypeScript</div>
                        </>
                    )}
                    <CommandBarComponent globalState={this.props.globalState} />
                </div>
            </div>
        );
    }
}
