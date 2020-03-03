import * as React from "react";
import { HeaderComponent } from "../headerComponent";
import Resizable from "re-resizable";
import { SceneExplorerComponent } from "../sceneExplorer/sceneExplorerComponent";
import { ActionTabsComponent } from "../actionTabs/actionTabsComponent";
import { Scene } from "babylonjs/scene";
import { GlobalState } from "../../components/globalState";
import { IExplorerExtensibilityGroup, DebugLayerTab } from 'babylonjs/Debug/debugLayer';

const Split = require('split.js').default;

require("./embedHost.scss");

interface IEmbedHostComponentProps {
    scene: Scene,
    globalState: GlobalState,
    popupMode: boolean,
    noClose?: boolean,
    noExpand?: boolean,
    onClose: () => void,
    onPopup: () => void,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    initialTab?: DebugLayerTab
}

export class EmbedHostComponent extends React.Component<IEmbedHostComponentProps> {
    private _once = true;
    private splitRef: React.RefObject<HTMLDivElement>;
    private topPartRef: React.RefObject<HTMLDivElement>;
    private bottomPartRef: React.RefObject<HTMLDivElement>;

    constructor(props: IEmbedHostComponentProps) {
        super(props);        

        this.splitRef = React.createRef();
        this.topPartRef = React.createRef();
        this.bottomPartRef = React.createRef();
    }

    componentDidMount() {
        const container = this.splitRef.current;

        if (!container) {
            return;
        }

        Split([this.topPartRef.current, this.bottomPartRef.current], {
            direction: "vertical",
            minSize: [200, 200],
            gutterSize: 4
        });
    }

    renderContent() {
        if (this.props.popupMode) {
            return (
                <div id="split" className="splitPopup">
                    <div id="topPart">
                        <SceneExplorerComponent scene={this.props.scene}
                            extensibilityGroups={this.props.extensibilityGroups}
                            popupMode={true}
                            globalState={this.props.globalState} noHeader={true} />
                    </div>
                    <div id="separator" />
                    <div id="bottomPart" style={{ marginTop: "4px", overflow: "hidden" }}>
                        <ActionTabsComponent scene={this.props.scene}
                            popupMode={true}
                            globalState={this.props.globalState} noHeader={true} 
                            initialTab={this.props.initialTab} />
                    </div>
                </div>
            )
        }

        return (
            <div ref={this.splitRef} id="split" className="noPopup">
                <div id="topPart" ref={this.topPartRef}>
                    <SceneExplorerComponent scene={this.props.scene}
                        extensibilityGroups={this.props.extensibilityGroups}
                        globalState={this.props.globalState}
                        popupMode={true}
                        noHeader={true} />
                </div>
                <div id="bottomPart" ref={this.bottomPartRef} style={{ marginTop: "4px", overflow: "hidden" }}>
                    <ActionTabsComponent scene={this.props.scene}
                        globalState={this.props.globalState}
                        popupMode={true}
                        noHeader={true}
                        initialTab={this.props.initialTab} />
                </div>
            </div>
        );
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