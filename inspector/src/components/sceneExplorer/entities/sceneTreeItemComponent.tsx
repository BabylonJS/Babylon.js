import { Scene, Observable, PointerInfo, Observer, Nullable } from "babylonjs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt, faImage, faCrosshairs, faArrowsAlt, faCompress, faRedoAlt } from '@fortawesome/free-solid-svg-icons';
import { IExtensibilityGroup } from "../../../inspector";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

interface ISceneTreeItemComponentProps {
    scene: Scene,
    onRefresh: () => void,
    selectedEntity?: any,
    extensibilityGroups?: IExtensibilityGroup[],
    onSelectionChangeObservable?: Observable<any>
}

export class SceneTreeItemComponent extends React.Component<ISceneTreeItemComponentProps, { isSelected: boolean, isInPickingMode: boolean, gizmoMode: number }> {
    private _onPointerObserver: Nullable<Observer<PointerInfo>>;

    constructor(props: ISceneTreeItemComponentProps) {
        super(props);

        this.state = { isSelected: false, isInPickingMode: false, gizmoMode: 0 };
    }

    shouldComponentUpdate(nextProps: ISceneTreeItemComponentProps, nextState: { isSelected: boolean, isInPickingMode: boolean }) {
        if (nextProps.selectedEntity) {
            if (nextProps.scene === nextProps.selectedEntity) {
                nextState.isSelected = true;
                return true;
            } else {
                nextState.isSelected = false;
            }
        }

        return true;
    }

    componentWillUnmount() {
        const scene = this.props.scene;

        if (this._onPointerObserver) {
            scene.onPointerObservable.remove(this._onPointerObserver);
            this._onPointerObserver = null;
        }
    }

    onSelect() {
        if (!this.props.onSelectionChangeObservable) {
            return;
        }
        const scene = this.props.scene;
        this.props.onSelectionChangeObservable.notifyObservers(scene);
    }

    onPickingMode() {
        const scene = this.props.scene;

        if (this._onPointerObserver) {
            scene.onPointerObservable.remove(this._onPointerObserver);
            this._onPointerObserver = null;
        }

        if (!this.state.isInPickingMode) {
            this._onPointerObserver = scene.onPointerObservable.add(() => {
                const pickPosition = scene.unTranslatedPointer;
                const pickInfo = scene.pick(pickPosition.x, pickPosition.y, mesh => mesh.isEnabled() && mesh.isVisible && mesh.getTotalVertices() > 0);

                if (pickInfo && pickInfo.hit && this.props.onSelectionChangeObservable) {
                    this.props.onSelectionChangeObservable.notifyObservers(pickInfo.pickedMesh);
                }
            }, BABYLON.PointerEventTypes.POINTERTAP)
        }

        this.setState({ isInPickingMode: !this.state.isInPickingMode });
    }

    setGizmoMode(mode: number) {
        this.setState({ gizmoMode: mode });
    }

    render() {
        return (
            <div className={this.state.isSelected ? "itemContainer selected" : "itemContainer"}>
                <div className="sceneNode">
                    <div className="sceneTitle" onClick={() => this.onSelect()} >
                        <FontAwesomeIcon icon={faImage} />&nbsp;Scene
                    </div>
                    <div className={this.state.gizmoMode === 1 ? "translation selected icon" : "translation icon"} onClick={() => this.setGizmoMode(1)} title="Enable/Disable position mode">
                        <FontAwesomeIcon icon={faArrowsAlt} />
                    </div>
                    <div className={this.state.gizmoMode === 2 ? "rotation selected icon" : "rotation icon"} onClick={() => this.setGizmoMode(2)} title="Enable/Disable rotation mode">
                        <FontAwesomeIcon icon={faRedoAlt} />
                    </div>
                    <div className={this.state.gizmoMode === 3 ? "scaling selected icon" : "scaling icon"} onClick={() => this.setGizmoMode(3)} title="Enable/Disable scaling mode">
                        <FontAwesomeIcon icon={faCompress} />
                    </div>
                    <div className="separator" />
                    <div className={this.state.isInPickingMode ? "pickingMode selected icon" : "pickingMode icon"} onClick={() => this.onPickingMode()} title="Turn picking mode on/off">
                        <FontAwesomeIcon icon={faCrosshairs} />
                    </div>
                    <div className="refresh icon" onClick={() => this.props.onRefresh()} title="Refresh the explorer">
                        <FontAwesomeIcon icon={faSyncAlt} />
                    </div>
                    {
                        <ExtensionsComponent target={this.props.scene} extensibilityGroups={this.props.extensibilityGroups} />
                    }
                </div>
            </div>
        )
    }
}