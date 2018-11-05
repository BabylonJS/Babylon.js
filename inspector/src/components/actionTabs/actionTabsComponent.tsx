import * as React from "react";
import { Observer, Scene, Nullable } from "babylonjs";
import { TabsComponent } from "./tabsComponent";
import { faFileAlt, faWrench, faBug, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { StatisticsTabComponent } from "./tabs/statisticsTabComponent";
import { DebugTabComponent } from "./tabs/debugTabComponent";
import Resizable from "re-resizable";
import { PropertyGridTabComponent } from "./tabs/propertyGridTabComponent";
import { HeaderComponent } from "../headerComponent";
import { ToolsTabComponent } from "./tabs/toolsTabComponent";
import { GlobalState } from "components/globalState";

require("./actionTabs.scss");

interface IActionTabsComponentProps {
    scene: Scene,
    noCommands?: boolean,
    noHeader?: boolean,
    noExpand?: boolean,
    popupMode?: boolean,
    onPopup?: () => void,
    onClose?: () => void,
    globalState: GlobalState
}

export class ActionTabsComponent extends React.Component<IActionTabsComponentProps, { selectedEntity: any, selectedIndex: number }> {
    private _onSelectionChangeObserver: Nullable<Observer<any>>;
    private _once = true;

    constructor(props: IActionTabsComponentProps) {
        super(props);

        this.state = { selectedEntity: null, selectedIndex: 0 }
    }

    componentWillMount() {
        this._onSelectionChangeObserver = this.props.globalState.onSelectionChangeObservable.add((entity) => {
            this.setState({ selectedEntity: entity, selectedIndex: 0 });
        });
    }

    componentWillUnmount() {
        if (this._onSelectionChangeObserver) {
            this.props.globalState.onSelectionChangeObservable.remove(this._onSelectionChangeObserver);
        }
    }

    renderContent() {
        return (
            <TabsComponent selectedIndex={this.state.selectedIndex} onSelectedIndexChange={(value) => this.setState({ selectedIndex: value })}>
                <PropertyGridTabComponent
                    title="Properties" icon={faFileAlt} scene={this.props.scene} selectedEntity={this.state.selectedEntity}
                    onSelectionChangeObservable={this.props.globalState.onSelectionChangeObservable}
                    onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />
                <DebugTabComponent title="Debug" icon={faBug} scene={this.props.scene} />
                <StatisticsTabComponent title="Statistics" icon={faChartBar} scene={this.props.scene} />
                <ToolsTabComponent title="Tools" icon={faWrench} scene={this.props.scene} />
            </TabsComponent>
        )
    }

    onClose() {
        if (!this.props.onClose) {
            return;
        }
        this.props.onClose();
    }

    onPopup() {
        if (!this.props.onPopup) {
            return;
        }
        this.props.onPopup();
    }

    render() {
        if (this.props.popupMode) {
            return (
                <div id="actionTabs">
                    {
                        !this.props.noHeader &&
                        <HeaderComponent title="INSPECTOR" handleBack={true} noCommands={this.props.noCommands} onClose={() => this.onClose()} onPopup={() => this.onPopup()} onSelectionChangeObservable={this.props.globalState.onSelectionChangeObservable} />
                    }
                    {this.renderContent()}
                </div>
            );
        }

        if (this._once) {
            this._once = false;
            // A bit hacky but no other way to force the initial width to 300px and not auto
            setTimeout(() => {
                document.getElementById("actionTabs")!.style.width = "300px";
            }, 150);
        }

        return (
            <Resizable id="actionTabs" minWidth={300} maxWidth={600} size={{ height: "100%" }} minHeight="100%" enable={{ top: false, right: false, bottom: false, left: true, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}>
                {
                    !this.props.noHeader &&
                    <HeaderComponent title="INSPECTOR" handleBack={true} noExpand={this.props.noExpand} noCommands={this.props.noCommands} onClose={() => this.onClose()} onPopup={() => this.onPopup()} onSelectionChangeObservable={this.props.globalState.onSelectionChangeObservable} />
                }
                {this.renderContent()}
            </Resizable>
        );
    }
}
