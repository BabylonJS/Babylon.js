import * as React from "react";
import { HeaderComponent } from "../headerComponent";
import { Resizable } from "re-resizable";
import { SceneExplorerComponent } from "../sceneExplorer/sceneExplorerComponent";
import { ActionTabsComponent } from "../actionTabs/actionTabsComponent";
import type { Scene } from "core/scene";
import type { GlobalState } from "../../components/globalState";
import type { IExplorerExtensibilityGroup, DebugLayerTab, IExplorerAdditionalNode } from "core/Debug/debugLayer";

const Split = require("split.js").default;

const ResizableCasted = Resizable as any as React.ComponentClass<any>;

import "./embedHost.scss";

interface IEmbedHostComponentProps {
    scene: Scene;
    globalState: GlobalState;
    popupMode: boolean;
    noClose?: boolean;
    noExpand?: boolean;
    onClose: () => void;
    onPopup: () => void;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    additionalNodes?: IExplorerAdditionalNode[];
    initialTab?: DebugLayerTab;
}

export class EmbedHostComponent extends React.Component<IEmbedHostComponentProps> {
    private _once = true;
    private _splitRef: React.RefObject<HTMLDivElement>;
    private _topPartRef: React.RefObject<HTMLDivElement>;
    private _bottomPartRef: React.RefObject<HTMLDivElement>;

    constructor(props: IEmbedHostComponentProps) {
        super(props);

        this._splitRef = React.createRef();
        this._topPartRef = React.createRef();
        this._bottomPartRef = React.createRef();
    }

    override componentDidMount() {
        const container = this._splitRef.current;

        if (!container) {
            return;
        }

        Split([this._topPartRef.current, this._bottomPartRef.current], {
            direction: "vertical",
            minSize: [200, 200],
            gutterSize: 4,
        });
    }

    renderContent() {
        if (this.props.popupMode) {
            return (
                <div id="split" className="splitPopup">
                    <div id="topPart">
                        <SceneExplorerComponent
                            scene={this.props.scene}
                            extensibilityGroups={this.props.extensibilityGroups}
                            additionalNodes={this.props.additionalNodes}
                            popupMode={true}
                            globalState={this.props.globalState}
                            noHeader={true}
                        />
                    </div>
                    <div id="separator" />
                    <div id="bottomPart" style={{ marginTop: "4px", overflow: "hidden" }}>
                        <ActionTabsComponent scene={this.props.scene} popupMode={true} globalState={this.props.globalState} noHeader={true} initialTab={this.props.initialTab} />
                    </div>
                </div>
            );
        }

        return (
            <div ref={this._splitRef} id="split" className="noPopup">
                <div id="topPart" ref={this._topPartRef}>
                    <SceneExplorerComponent
                        scene={this.props.scene}
                        extensibilityGroups={this.props.extensibilityGroups}
                        additionalNodes={this.props.additionalNodes}
                        globalState={this.props.globalState}
                        popupMode={true}
                        noHeader={true}
                    />
                </div>
                <div id="bottomPart" ref={this._bottomPartRef} style={{ marginTop: "4px", overflow: "hidden" }}>
                    <ActionTabsComponent scene={this.props.scene} globalState={this.props.globalState} popupMode={true} noHeader={true} initialTab={this.props.initialTab} />
                </div>
            </div>
        );
    }

    override render() {
        if (this.props.popupMode) {
            return (
                <div id="embed">
                    <HeaderComponent
                        title="INSPECTOR"
                        noClose={this.props.noClose}
                        noExpand={this.props.noExpand}
                        handleBack={true}
                        onClose={() => this.props.onClose()}
                        onPopup={() => this.props.onPopup()}
                        onSelectionChangedObservable={this.props.globalState.onSelectionChangedObservable}
                    />
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
            <ResizableCasted
                id="embed"
                minWidth={300}
                maxWidth={600}
                defaultSize={{ height: "100%" }}
                minHeight="100%"
                enable={{ top: false, right: false, bottom: false, left: true, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
            >
                <HeaderComponent
                    title="INSPECTOR"
                    noClose={this.props.noClose}
                    noExpand={this.props.noExpand}
                    handleBack={true}
                    onClose={() => this.props.onClose()}
                    onPopup={() => this.props.onPopup()}
                    onSelectionChangedObservable={this.props.globalState.onSelectionChangedObservable}
                />
                {this.renderContent()}
            </ResizableCasted>
        );
    }
}
