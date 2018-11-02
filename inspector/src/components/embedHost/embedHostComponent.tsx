import * as React from "react";
import { HeaderComponent } from "../headerComponent";
import Resizable from "re-resizable";
import { SceneExplorerComponent } from "../sceneExplorer/sceneExplorerComponent";
import { ActionTabsComponent } from "../actionTabs/actionTabsComponent";
import { Scene, Observable } from "babylonjs";
import Split from 'react-split';

require("./embedHost.scss");

interface IEmbedHostComponentProps {
    scene: Scene,
    onSelectionChangeObservable: Observable<any>,
    popupMode: boolean,
    onClose: () => void,
    onPopup: () => void
}

export class EmbedHostComponent extends React.Component<IEmbedHostComponentProps> {
    private _once = true;

    constructor(props: IEmbedHostComponentProps) {
        super(props);
    }

    renderContent() {
        if (this.props.popupMode) {
            return (
                <div id="split" className="popup">
                    <div id="topPart">
                        <SceneExplorerComponent scene={this.props.scene}
                            popupMode={true}
                            onSelectionChangeObservable={this.props.onSelectionChangeObservable} noHeader={true} />
                    </div>
                    <div id="bottomPart" style={{ marginTop: "4px", overflow: "hidden" }}>
                        <ActionTabsComponent scene={this.props.scene}
                            popupMode={true}
                            onSelectionChangeObservable={this.props.onSelectionChangeObservable} noHeader={true} />
                    </div>
                </div>
            )
        }

        return (
            <Split id="split" direction="vertical" gutterSize={5} cursor="grab" minSize={[300, 300]}>
                <div id="topPart">
                    <SceneExplorerComponent scene={this.props.scene}
                        popupMode={true}
                        onSelectionChangeObservable={this.props.onSelectionChangeObservable} noHeader={true} />
                </div>
                <div id="bottomPart" style={{ marginTop: "4px", overflow: "hidden" }}>
                    <ActionTabsComponent scene={this.props.scene}
                        popupMode={true}
                        onSelectionChangeObservable={this.props.onSelectionChangeObservable} noHeader={true} />
                </div>
            </Split>
        )
    }

    render() {
        if (this.props.popupMode) {
            return (
                <div id="embed">
                    <HeaderComponent title="INSPECTOR" handleBack={true} onClose={() => this.props.onClose()} onPopup={() => this.props.onPopup()} onSelectionChangeObservable={this.props.onSelectionChangeObservable} />
                    {this.renderContent()}
                </div>
            );
        }

        if (this._once) {
            this._once = false;
            // A bit hacky but no other way to force the initial width to 300px and not auto
            setTimeout(() => {
                document.getElementById("embed")!.style.width = "300px";
            }, 150);
        }

        return (
            <Resizable id="embed" minWidth={300} maxWidth={600} size={{ height: "100%" }} minHeight="100%" enable={{ top: false, right: false, bottom: false, left: true, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}>
                <HeaderComponent title="INSPECTOR" handleBack={true} onClose={() => this.props.onClose()} onPopup={() => this.props.onPopup()} onSelectionChangeObservable={this.props.onSelectionChangeObservable} />
                {this.renderContent()}
            </Resizable>
        );
    }
}