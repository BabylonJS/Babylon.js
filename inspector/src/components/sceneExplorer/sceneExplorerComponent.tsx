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
import { GlobalState } from "../../components/globalState";
import { DefaultRenderingPipeline } from 'babylonjs/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';

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
    private _onNewSceneAddedObserver: Nullable<Observer<Scene>>;

    private _once = true;

    private sceneMutationFunc: () => void;

    constructor(props: ISceneExplorerComponentProps) {
        super(props);

        this.state = { filter: null, selectedEntity: null, scene: this.props.scene };

        this.sceneMutationFunc = this.processMutation.bind(this);
    }

    processMutation() {
        if (this.props.globalState.blockMutationUpdates) {
            return;
        }

        this.forceUpdate();
    }

    componentWillMount() {
        this._onSelectionChangeObserver = this.props.globalState.onSelectionChangedObservable.add((entity) => {
            if (this.state.selectedEntity !== entity) {
                this.setState({ selectedEntity: entity });
            }
        });
    }

    componentWillUnmount() {
        if (this._onSelectionChangeObserver) {
            this.props.globalState.onSelectionChangedObservable.remove(this._onSelectionChangeObserver);
        }

        if (this._onNewSceneAddedObserver) {
            EngineStore.LastCreatedEngine!.onNewSceneAddedObservable.remove(this._onNewSceneAddedObserver);
        }

        const scene = this.state.scene;

        scene.onNewCameraAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewLightAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewMaterialAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewMeshAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewTextureAddedObservable.removeCallback(this.sceneMutationFunc);
        scene.onNewTransformNodeAddedObservable.removeCallback(this.sceneMutationFunc);

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

        let guiElements = scene.textures.filter((t) => t.getClassName() === "AdvancedDynamicTexture");
        let textures = scene.textures.filter((t) => t.getClassName() !== "AdvancedDynamicTexture");
        let postProcessses = scene.postProcesses;
        let pipelines = scene.postProcessRenderPipelineManager.supportedPipelines;

        let pipelineContextMenus: { label: string, action: () => void }[] = [];

        if (scene.activeCamera) {
            if (!pipelines.some(p => p.getClassName() === "DefaultRenderingPipeline")) {
                pipelineContextMenus.push({
                    label: "Add new Default Rendering Pipeline",
                    action: () => {
                        let newPipeline = new DefaultRenderingPipeline("Default rendering pipeline", true, scene, [scene.activeCamera!]);
                        this.props.globalState.onSelectionChangedObservable.notifyObservers(newPipeline);
                    }
                })
            }
        }

        return (
            <div id="tree">
                <SceneExplorerFilterComponent onFilter={(filter) => this.filterContent(filter)} />
                <SceneTreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.state.selectedEntity} scene={scene} onRefresh={() => this.forceUpdate()} onSelectionChangedObservable={this.props.globalState.onSelectionChangedObservable} />
                <TreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.state.selectedEntity} items={scene.rootNodes} label="Nodes" offset={1} filter={this.state.filter} />
                <TreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.state.selectedEntity} items={scene.materials} label="Materials" offset={1} filter={this.state.filter} />
                <TreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.state.selectedEntity} items={textures} label="Textures" offset={1} filter={this.state.filter} />
                {
                    postProcessses.length > 0 &&
                    <TreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.state.selectedEntity} items={postProcessses} label="Post-processes" offset={1} filter={this.state.filter} />
                }
                <TreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups}
                    contextMenuItems={pipelineContextMenus}
                    selectedEntity={this.state.selectedEntity} items={pipelines} label="Rendering pipelines" offset={1} filter={this.state.filter} />
                {
                    guiElements && guiElements.length > 0 &&
                    <TreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.state.selectedEntity} items={guiElements} label="GUI" offset={1} filter={this.state.filter} />
                }
                {
                    scene.animationGroups.length > 0 &&
                    <TreeItemComponent globalState={this.props.globalState} extensibilityGroups={this.props.extensibilityGroups} selectedEntity={this.state.selectedEntity} items={scene.animationGroups} label="Animation groups" offset={1} filter={this.state.filter} />
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
        if (this.props.popupMode) {
            return (
                <div id="sceneExplorer">
                    {
                        !this.props.noHeader &&
                        <HeaderComponent title="SCENE EXPLORER" noClose={this.props.noClose} noExpand={this.props.noExpand} noCommands={this.props.noCommands} onClose={() => this.onClose()} onPopup={() => this.onPopup()} />
                    }
                    {this.renderContent()}
                </div>
            );
        }

        if (this._once) {
            this._once = false;
            const scene = this.state.scene;

            scene.onNewCameraAddedObservable.add(this.sceneMutationFunc);
            scene.onNewLightAddedObservable.add(this.sceneMutationFunc);
            scene.onNewMaterialAddedObservable.add(this.sceneMutationFunc);
            scene.onNewMeshAddedObservable.add(this.sceneMutationFunc);
            scene.onNewTextureAddedObservable.add(this.sceneMutationFunc);
            scene.onNewTransformNodeAddedObservable.add(this.sceneMutationFunc);

            scene.onMeshRemovedObservable.add(this.sceneMutationFunc);
            scene.onCameraRemovedObservable.add(this.sceneMutationFunc);
            scene.onLightRemovedObservable.add(this.sceneMutationFunc);
            scene.onMaterialRemovedObservable.add(this.sceneMutationFunc);
            scene.onTransformNodeRemovedObservable.add(this.sceneMutationFunc);
            scene.onTextureRemovedObservable.add(this.sceneMutationFunc);

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
            <Resizable tabIndex={-1} id="sceneExplorer" ref="sceneExplorer" size={{ height: "100%" }} minWidth={300} maxWidth={600} minHeight="100%" enable={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }} onKeyDown={(keyEvent) => this.processKeys(keyEvent)}>
                {
                    !this.props.noHeader &&
                    <HeaderComponent title="SCENE EXPLORER" noClose={this.props.noClose} noExpand={this.props.noExpand} noCommands={this.props.noCommands} onClose={() => this.onClose()} onPopup={() => this.onPopup()} />
                }
                {this.renderContent()}
            </Resizable>
        );
    }
}
