import * as React from "react";

import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Scene } from "babylonjs/scene";
import { EngineStore } from "babylonjs/Engines/engineStore";

import { TreeItemComponent } from "./treeItemComponent";
import Resizable from "re-resizable";
import { HeaderComponent } from "../headerComponent";
import { SceneTreeItemComponent } from "./entities/sceneTreeItemComponent";
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
    scene: Scene;
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

export class SceneExplorerComponent extends React.Component<ISceneExplorerComponentProps, { filter: Nullable<string>, selectedEntity: any, scene: Scene }> {
    private _onSelectionChangeObserver: Nullable<Observer<any>>;
    private _onSelectionRenamedObserver: Nullable<Observer<void>>;
    private _onNewSceneAddedObserver: Nullable<Observer<Scene>>;
    private _onNewSceneObserver: Nullable<Observer<Scene>>;
    private sceneExplorerRef: React.RefObject<Resizable>;

    private _once = true;
    private _hooked = false;

    private sceneMutationFunc: () => void;

    constructor(props: ISceneExplorerComponentProps) {
        super(props);

        this.state = { filter: null, selectedEntity: null, scene: this.props.scene };

        this.sceneMutationFunc = this.processMutation.bind(this);

        this.sceneExplorerRef = React.createRef();
        this._onNewSceneObserver = this.props.globalState.onNewSceneObservable.add((scene: Scene) => {
            this.setState({
                scene
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

        this._onSelectionRenamedObserver = this.props.globalState.onSelectionRenamedObservable.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        if (this._onSelectionChangeObserver) {
            this.props.globalState.onSelectionChangedObservable.remove(this._onSelectionChangeObserver);
        }

        if (this._onSelectionRenamedObserver) {
            this.props.globalState.onSelectionRenamedObservable.remove(this._onSelectionRenamedObserver);
        }

        if (this._onNewSceneAddedObserver) {
            EngineStore.LastCreatedEngine!.onNewSceneAddedObservable.remove(this._onNewSceneAddedObserver);
        }

        if (this._onNewSceneObserver) {
            this.props.globalState.onNewSceneObservable.remove(this._onNewSceneObserver);
        }

        const scene = this.state.scene;

        scene.onNewSkeletonAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewCameraAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewLightAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewMaterialAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewMeshAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewTextureAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewTransformNodeAddedObservable.removeCallback(this.sceneMutationFunc);

        scene.onSkeletonRemovedObservable.removeCallback(this.sceneMutationFunc);
        scene.onMeshRemovedObservable.removeCallback(this.sceneMutationFunc);
        scene.onCameraRemovedObservable.removeCallback(this.sceneMutationFunc);
        scene.onLightRemovedObservable.removeCallback(this.sceneMutationFunc);
        scene.onMaterialRemovedObservable.removeCallback(this.sceneMutationFunc);
        scene.onTransformNodeRemovedObservable.removeCallback(this.sceneMutationFunc);
        scene.onTextureRemovedObservable.removeCallback(this.sceneMutationFunc);
    }

    filterContent(filter: string) {
        this.setState({ filter: filter });
    }

    findSiblings(parent: any, items: any[], target: any, goNext: boolean, data: { previousOne?: any, found?: boolean }): boolean {
        if (!items) {
            return false;
        }

        const sortedItems = Tools.SortAndFilter(parent, items);

        if (!items || sortedItems.length === 0) {
            return false;
        }

        for (var item of sortedItems) {
            if (item === target) { // found the current selection!
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

        if (keyEvent.keyCode === 38) { // up
            search = true;
        } else if (keyEvent.keyCode === 40) { // down
            goNext = true;
            search = true;
        } else if (keyEvent.keyCode === 13 || keyEvent.keyCode === 39) { // enter or right
            var reservedDataStore = this.state.selectedEntity.reservedDataStore;
            if (reservedDataStore && reservedDataStore.setExpandedState) {
                reservedDataStore.setExpandedState(true);
            }
            keyEvent.preventDefault();
            return;
        } else if (keyEvent.keyCode === 37) { // left
            var reservedDataStore = this.state.selectedEntity.reservedDataStore;
            if (reservedDataStore && reservedDataStore.setExpandedState) {
                reservedDataStore.setExpandedState(false);
            }
            keyEvent.preventDefault();
            return;
        } else if (keyEvent.keyCode === 46) { // delete
            this.state.selectedEntity.dispose();
        }

        if (!search) {
            return;
        }

        keyEvent.preventDefault();

        let data = {};
        if (!this.findSiblings(null, scene.rootNodes, this.state.selectedEntity, goNext, data)) {
            if (!this.findSiblings(null, scene.materials, this.state.selectedEntity, goNext, data)) {
                this.findSiblings(null, scene.textures, this.state.selectedEntity, goNext, data);
            }
        }

    }

    renderContent() {
        const scene = this.state.scene;

        if (!scene) {
            this._onNewSceneAddedObserver = EngineStore.LastCreatedEngine!.onNewSceneAddedObservable.addOnce((scene) => this.setState({ scene: scene }));
            return null;
        }

        if (!this._hooked) {
            this._hooked = true;
            scene.onNewSkeletonAddedObservable.add(this.sceneMutationFunc);
            scene.onNewCameraAddedObservable.add(this.sceneMutationFunc);
            scene.onNewLightAddedObservable.add(this.sceneMutationFunc);
            scene.onNewMaterialAddedObservable.add(this.sceneMutationFunc);
            scene.onNewMeshAddedObservable.add(this.sceneMutationFunc);
            scene.onNewTextureAddedObservable.add(this.sceneMutationFunc);
            scene.onNewTransformNodeAddedObservable.add(this.sceneMutationFunc);

            scene.onSkeletonRemovedObservable.add(this.sceneMutationFunc);
            scene.onMeshRemovedObservable.add(this.sceneMutationFunc);
            scene.onCameraRemovedObservable.add(this.sceneMutationFunc);
            scene.onLightRemovedObservable.add(this.sceneMutationFunc);
            scene.onMaterialRemovedObservable.add(this.sceneMutationFunc);
            scene.onTransformNodeRemovedObservable.add(this.sceneMutationFunc);
            scene.onTextureRemovedObservable.add(this.sceneMutationFunc);
        }

        let guiElements = scene.textures.filter((t) => t.getClassName() === "AdvancedDynamicTexture");
        let textures = scene.textures.filter((t) => t.getClassName() !== "AdvancedDynamicTexture");

        
        /*const getUniqueName = (name: string) : string => {
            let idSubscript = 1;
            while (scene.getMaterialByID(name)) {
                name = name + " " + idSubscript++;
            }
            return name;
        };
        
        <SceneExplorerFilterComponent onFilter={(filter) => this.filterContent(filter)} />
                <SceneTreeItemComponent globalState={this.props.globalState}
                extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.state.selectedEntity} scene={scene} onRefresh={() => this.forceUpdate()} onSelectionChangedObservable={this.props.globalState.onSelectionChangedObservable} />
        */
        
        //return (<div></div>);
     
        return (
            <div id="tree" onContextMenu={(e) => e.preventDefault()}>       
                {
                    guiElements && guiElements.length > 0 &&
                    <TreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.state.selectedEntity} items={guiElements} label="GUI" offset={1} filter={this.state.filter} />
                }
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
        //f (this.props.popupMode) {
            return (
                <div id="sceneExplorer" tabIndex={0} onKeyDown={(keyEvent) => this.processKeys(keyEvent)}>
                    {
                        !this.props.noHeader &&
                        <HeaderComponent title="SCENE EXPLORER" noClose={this.props.noClose} noExpand={this.props.noExpand} noCommands={this.props.noCommands} onClose={() => this.onClose()} onPopup={() => this.onPopup()} />
                    }
                    {this.renderContent()}
                </div>
            );
        //}

        if (this._once) {
            this._once = false;
            // A bit hacky but no other way to force the initial width to 300px and not auto
            setTimeout(() => {
                const element = document.getElementById("sceneExplorer");
                if (!element) {
                    return;
                }
                element.style.width = "300px";
            }, 150);
        }

        return (
            <Resizable tabIndex={-1} id="sceneExplorer" ref={this.sceneExplorerRef} size={{ height: "100%" }} minWidth={300} maxWidth={600} minHeight="100%" enable={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }} onKeyDown={(keyEvent) => this.processKeys(keyEvent)}>
                {
                    !this.props.noHeader &&
                    <HeaderComponent title="SCENE EXPLORER" noClose={this.props.noClose} noExpand={this.props.noExpand} noCommands={this.props.noCommands} onClose={() => this.onClose()} onPopup={() => this.onPopup()} />
                }
                {this.renderContent()}
            </Resizable>
        );
    }
}
