import * as React from "react";
import { HeaderComponent } from "../headerComponent";
import Resizable from "re-resizable";
import { SceneExplorerComponent } from "../sceneExplorer/sceneExplorerComponent";
import { ActionTabsComponent } from "../actionTabs/actionTabsComponent";
import { Scene } from "babylonjs/scene";
import { GlobalState } from "components/globalState";

const Split = require('split.js').default;

require("./embedHost.scss");

interface IEmbedHostComponentProps {
    scene: Scene,
    globalState: GlobalState,
    popupMode: boolean,
    noClose?: boolean,
    noExpand?: boolean,
    onClose: () => void,
    onPopup: () => void
}

export class EmbedHostComponent extends React.Component<IEmbedHostComponentProps> {
    private _once = true;

    constructor(props: IEmbedHostComponentProps) {
        super(props);
    }

    componentDidMount() {
        const container = this.refs.split;

        if (!container) {
            return;
        }

        Split([this.refs.topPart, this.refs.bottomPart], {
            direction: "vertical",
            minSize: [200, 200],
            gutterSize: 4
        })
    }

    renderContent() {
        if (this.props.popupMode) {
            return (
                <div id="split" className="splitPopup">
                    <div id="topPart">
                        <SceneExplorerComponent scene={this.props.scene}
                            popupMode={true}
                            globalState={this.props.globalState} noHeader={true} />
                    </div>
                    <div id="separator" />
                    <div id="bottomPart" style={{ marginTop: "4px", overflow: "hidden" }}>
                        <ActionTabsComponent scene={this.props.scene}
                            popupMode={true}
                            globalState={this.props.globalState} noHeader={true} />
                    </div>
                </div>
            )
        }

        return (
            <div ref="split" id="split" className="noPopup">
                <div id="topPart" ref="topPart">
                    <SceneExplorerComponent scene={this.props.scene}
                        globalState={this.props.globalState}
                        popupMode={true}
                        noHeader={true} />
                </div>
                <div id="bottomPart" ref="bottomPart" style={{ marginTop: "4px", overflow: "hidden" }}>
                    <ActionTabsComponent scene={this.props.scene}
                        globalState={this.props.globalState}
                        popupMode={true}
                        noHeader={true} />
                </div>
            </div>
        )
    }

    render() {
        if (this.props.popupMode) {
            return (
                <div id="embed">
                    <HeaderComponent title="INSPECTOR" noClose={this.props.noClose} noExpand={this.props.noExpand} handleBack={true} onClose={() => this.props.onClose()} onPopup={() => this.props.onPopup()} onSelectionChangedObservable={this.props.globalState.onSelectionChangedObservable} />
                    {this.renderContent()}
                </div>
            );
        }

        if (this._once) {
            this._once = false;
            // A bit hacky but no other way to force the initial width to 300px and not auto
            setTimeout(() => {
                const element = document.getElementById("embed");
                if (!element) {
                    return;
                }
                element.style.width = "300px";
            }, 150);
        }

        return (
            <Resizable id="embed" minWidth={300} maxWidth={600} size={{ height: "100%" }} minHeight="100%" enable={{ top: false, right: false, bottom: false, left: true, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}>
                <HeaderComponent title="INSPECTOR" noClose={this.props.noClose} noExpand={this.props.noExpand} handleBack={true} onClose={() => this.props.onClose()} onPopup={() => this.props.onPopup()} onSelectionChangedObservable={this.props.globalState.onSelectionChangedObservable} />
                {this.renderContent()}
            </Resizable>
        );
    }
}