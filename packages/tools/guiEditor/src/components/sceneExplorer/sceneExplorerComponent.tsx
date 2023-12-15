import * as React from "react";

import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import type { Scene } from "core/scene";
import { TreeItemComponent } from "./treeItemComponent";
import { Tools } from "../../tools";
import type { GlobalState } from "../../globalState";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";

import "./sceneExplorer.scss";
import { Logger } from "core/Misc/logger";

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
    private _onPropertyChangedObservable: Nullable<Observer<PropertyChangedEvent>>;
    private _onUpdateRequiredObserver: Nullable<Observer<void>>;

    constructor(props: ISceneExplorerComponentProps) {
        super(props);
        this.state = { filter: null, selectedEntity: null, scene: this.props.scene ? this.props.scene : null };
        this._onNewSceneObserver = this.props.globalState.onNewSceneObservable.add((scene: Nullable<Scene>) => {
            this.setState({
                scene,
            });
        });

        this._onPropertyChangedObservable = this.props.globalState.onPropertyChangedObservable.add((event: PropertyChangedEvent) => {
            if (event.property === "name" || event.property === "_columnNumber" || event.property === "_rowNumber") {
                this.forceUpdate();
            }
        });
        this._onUpdateRequiredObserver = this.props.globalState.onUpdateRequiredObservable.add(() => {
            this.forceUpdate();
        });
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

        if (this._onPropertyChangedObservable) {
            this.props.globalState.onPropertyChangedObservable.remove(this._onPropertyChangedObservable);
        }

        if (this._onUpdateRequiredObserver) {
            this.props.globalState.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
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

        for (const item of sortedItems) {
            if (item === target) {
                // found the current selection!
                data.found = true;
                if (!goNext) {
                    if (data.previousOne) {
                        this.props.globalState.select(data.previousOne);
                    }
                    return true;
                }
            } else {
                if (data.found) {
                    this.props.globalState.select(item);
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
        // if typing inside a text box, don't process keys
        if ((keyEvent.target as HTMLElement).localName === "input") return;

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
                this.props.globalState.selectedControls.forEach((node) => {
                    const reservedDataStore = (node as any).reservedDataStore;
                    if (reservedDataStore && reservedDataStore.setExpandedState) {
                        reservedDataStore.setExpandedState(true);
                    }
                });
                keyEvent.preventDefault();
                this.forceUpdate();
                return;
            case "ArrowLeft":
                this.props.globalState.selectedControls.forEach((node) => {
                    const reservedDataStore = (node as any).reservedDataStore;
                    Logger.Log(reservedDataStore);
                    if (reservedDataStore && reservedDataStore.setExpandedState) {
                        reservedDataStore.setExpandedState(false);
                    }
                });
                keyEvent.preventDefault();
                this.forceUpdate();
                return;
            case "Delete":
            case "Backspace":
                this.props.globalState.deleteSelectedNodes();
                this.forceUpdate();
                break;
        }

        if (!search) {
            return;
        }

        keyEvent.preventDefault();
        if (scene) {
            const selectedEntity = this.props.globalState.selectedControls[this.props.globalState.selectedControls.length - 1];
            const data = {};
            if (!this.findSiblings(null, scene.rootNodes, selectedEntity, goNext, data)) {
                if (!this.findSiblings(null, scene.materials, selectedEntity, goNext, data)) {
                    this.findSiblings(null, scene.textures, selectedEntity, goNext, data);
                }
            }
        }
    }

    renderContent() {
        const scene = this.state.scene;

        if (!scene) {
            return null;
        }

        const guiElements = [this.props.globalState.guiTexture];

        return (
            <div
                id="tree"
                onDrop={() => {
                    this.props.globalState.onDropObservable.notifyObservers();
                    this.props.globalState.onParentingChangeObservable.notifyObservers(null);
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                }}
                onClick={() => {
                    if (!this.props.globalState.selectionLock) {
                        this.props.globalState.setSelection([]);
                    } else {
                        this.props.globalState.selectionLock = false;
                    }
                }}
                onContextMenu={(ev) => ev.preventDefault()}
            >
                {guiElements && guiElements.length > 0 && (
                    <TreeItemComponent
                        globalState={this.props.globalState}
                        extensibilityGroups={this.props.extensibilityGroups}
                        selectedEntities={this.props.globalState.selectedControls}
                        items={guiElements}
                        label="GUI"
                        offset={1}
                        filter={this.state.filter}
                    />
                )}
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
                {this.props.children}
                {this.renderContent()}
            </div>
        );
    }
}
