import * as React from "react";

import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Scene } from "babylonjs/scene";
import { TreeItemComponent } from "./treeItemComponent";
import { Tools } from "../../tools";
import { GlobalState } from "../../globalState";

require("./sceneExplorer.scss");

interface ISceneExplorerFilterComponentProps {
    onFilter: (filter: string) => void;
}

export class SceneExplorerFilterComponent extends React.Component<ISceneExplorerFilterComponentProps> {
    constructor(props: ISceneExplorerFilterComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="filter">
                <input type="text" placeholder="Filter" onChange={(evt) => this.props.onFilter(evt.target.value)} />
            </div>
        );
    }
}

interface ISceneExplorerComponentProps {
    scene?: Scene;
    noCommands?: boolean;
    noHeader?: boolean;
    noExpand?: boolean;
    noClose?: boolean;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    globalState: GlobalState;
    popupMode?: boolean;
    onPopup?: () => void;
    onClose?: () => void;
}

export class SceneExplorerComponent extends React.Component<ISceneExplorerComponentProps, { filter: Nullable<string>; selectedEntity: any; scene: Nullable<Scene> }> {
    private _onSelectionChangeObserver: Nullable<Observer<any>>;
    private _onParrentingChangeObserver: Nullable<Observer<any>>;
    private _onNewSceneObserver: Nullable<Observer<Nullable<Scene>>>;

    constructor(props: ISceneExplorerComponentProps) {
        super(props);

        this.state = { filter: null, selectedEntity: null, scene: this.props.scene ? this.props.scene : null };
        this._onNewSceneObserver = this.props.globalState.onNewSceneObservable.add((scene: Nullable<Scene>) => {
            this.setState({
                scene,
            });
        });
    }

    processMutation() {
        if (this.props.globalState.blockMutationUpdates) {
            return;
        }

        setTimeout(() => this.forceUpdate());
    }

    componentDidMount() {
        this._onSelectionChangeObserver = this.props.globalState.onSelectionChangedObservable.add((entity) => {
            if (this.state.selectedEntity !== entity) {
                this.setState({ selectedEntity: entity });
            }
        });

        this.props.globalState.onSelectionChangedObservable.add(() => {
            this.forceUpdate();
        });
        
        this._onParrentingChangeObserver = this.props.globalState.onParentingChangeObservable.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        if (this._onSelectionChangeObserver) {
            this.props.globalState.onSelectionChangedObservable.remove(this._onSelectionChangeObserver);
        }

        if (this._onNewSceneObserver) {
            this.props.globalState.onNewSceneObservable.remove(this._onNewSceneObserver);
        }

        if (this._onParrentingChangeObserver) {
            this.props.globalState.onParentingChangeObservable.remove(this._onParrentingChangeObserver);
        }
    }

    filterContent(filter: string) {
        this.setState({ filter: filter });
    }

    findSiblings(parent: any, items: any[], target: any, goNext: boolean, data: { previousOne?: any; found?: boolean }): boolean {
        if (!items) {
            return false;
        }

        const sortedItems = Tools.SortAndFilter(parent, items);

        if (!items || sortedItems.length === 0) {
            return false;
        }

        for (var item of sortedItems) {
            if (item === target) {
                // found the current selection!
                data.found = true;
                if (!goNext) {
                    if (data.previousOne) {
                        this.props.globalState.onSelectionChangedObservable.notifyObservers(data.previousOne);
                    }
                    return true;
                }
            } else {
                if (data.found) {
                    this.props.globalState.onSelectionChangedObservable.notifyObservers(item);
                    return true;
                }
                data.previousOne = item;
            }

            if (item.getChildren && item.reservedDataStore && item.reservedDataStore.isExpanded) {
                if (this.findSiblings(item, item.getChildren(), target, goNext, data)) {
                    return true;
                }
            }
        }

        return false;
    }

    processKeys(keyEvent: React.KeyboardEvent<HTMLDivElement>) {
        if (!this.state.selectedEntity) {
            return;
        }

        const scene = this.state.scene;
        let search = false;
        let goNext = false;

        switch (keyEvent.key) {
            case "ArrowUp":
                search = true;
                break;
            case "ArrowDown":
                goNext = true;
                search = true;
                break;
            case "Enter":
            case "ArrowRight":
                var reservedDataStore = this.state.selectedEntity.reservedDataStore;
                if (reservedDataStore && reservedDataStore.setExpandedState) {
                    reservedDataStore.setExpandedState(true);
                }
                keyEvent.preventDefault();
                return;
            case "ArrowLeft":
                var reservedDataStore = this.state.selectedEntity.reservedDataStore;
                if (reservedDataStore && reservedDataStore.setExpandedState) {
                    reservedDataStore.setExpandedState(false);
                }
                keyEvent.preventDefault();
                return;
                break;
            case "Delete":
                this.state.selectedEntity.dispose();
                break;
            default:
                break;
        }

        if (!search) {
            return;
        }

        keyEvent.preventDefault();
        if (scene) {
            let data = {};
            if (!this.findSiblings(null, scene.rootNodes, this.state.selectedEntity, goNext, data)) {
                if (!this.findSiblings(null, scene.materials, this.state.selectedEntity, goNext, data)) {
                    this.findSiblings(null, scene.textures, this.state.selectedEntity, goNext, data);
                }
            }
        }
    }

    renderContent() {
        const scene = this.state.scene;

        if (!scene) {
            return null;
        }

        let guiElements = scene.textures.filter((t) => t.getClassName() === "AdvancedDynamicTexture");

        return (
            <div id="tree"             
            onDrop={event => {
                this.props.globalState.onParentingChangeObservable.notifyObservers(null);
            }}
            onDragOver={event => {
                event.preventDefault();
            }}>
                {guiElements && guiElements.length > 0 && <TreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.state.selectedEntity} items={guiElements} label="GUI" offset={1} filter={this.state.filter} />}
            </div>
        );
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
        return (
            <div id="ge-sceneExplorer" tabIndex={0} onKeyDown={(keyEvent) => this.processKeys(keyEvent)}>
                {this.renderContent()}
            </div>
        );
    }
}
