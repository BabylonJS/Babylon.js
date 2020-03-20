import { Nullable } from "babylonjs/types";
import { Observer, Observable } from "babylonjs/Misc/observable";
import { PointerInfo, PointerEventTypes } from "babylonjs/Events/pointerEvents";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { GizmoManager } from "babylonjs/Gizmos/gizmoManager";
import { Scene } from "babylonjs/scene";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt, faImage, faCrosshairs, faArrowsAlt, faCompress, faRedoAlt, faVectorSquare } from '@fortawesome/free-solid-svg-icons';
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

import { GlobalState } from "../../globalState";
import { UtilityLayerRenderer } from "babylonjs/Rendering/utilityLayerRenderer";
import { PropertyChangedEvent } from '../../../components/propertyChangedEvent';
import { LightGizmo } from 'babylonjs/Gizmos/lightGizmo';
import { TmpVectors, Vector3 } from 'babylonjs/Maths/math';

interface ISceneTreeItemComponentProps {
    scene: Scene;
    onRefresh: () => void;
    selectedEntity?: any;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onSelectionChangedObservable?: Observable<any>;
    globalState: GlobalState;
}

export class SceneTreeItemComponent extends React.Component<ISceneTreeItemComponentProps, { isSelected: boolean, isInPickingMode: boolean, gizmoMode: number }> {
    private _gizmoLayerOnPointerObserver: Nullable<Observer<PointerInfo>>;
    private _onPointerObserver: Nullable<Observer<PointerInfo>>;
    private _onSelectionChangeObserver: Nullable<Observer<any>>;
    private _selectedEntity: any;

    private _posDragEnd: Nullable<Observer<PropertyChangedEvent>> = null;
    private _scaleDragEnd: Nullable<Observer<PropertyChangedEvent>> = null;
    private _rotateDragEnd: Nullable<Observer<PropertyChangedEvent>> = null;

    constructor(props: ISceneTreeItemComponentProps) {
        super(props);

        const scene = this.props.scene;
        let gizmoMode = 0;
        if (scene.reservedDataStore && scene.reservedDataStore.gizmoManager) {
            const manager: GizmoManager = scene.reservedDataStore.gizmoManager;
            if (manager.positionGizmoEnabled) {
                gizmoMode = 1;
            } else if (manager.rotationGizmoEnabled) {
                gizmoMode = 2;
            } else if (manager.scaleGizmoEnabled) {
                gizmoMode = 3;
            } else if (manager.boundingBoxGizmoEnabled) {
                gizmoMode = 4;
            }
        }

        this.state = { isSelected: false, isInPickingMode: false, gizmoMode: gizmoMode };
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

    componentDidMount() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        const scene = this.props.scene;
        this._onSelectionChangeObserver = this.props.onSelectionChangedObservable.add((entity) => {
            this._selectedEntity = entity;
            if (entity && scene.reservedDataStore && scene.reservedDataStore.gizmoManager) {
                const manager: GizmoManager = scene.reservedDataStore.gizmoManager;

                const className = entity.getClassName();

                if (className === "TransformNode" || className.indexOf("Mesh") !== -1) {
                    manager.attachToMesh(entity);
                } else if (className.indexOf("Light") !== -1) {
                    if (!this._selectedEntity.reservedDataStore || !this._selectedEntity.reservedDataStore.lightGizmo) {
                        this.props.globalState.enableLightGizmo(this._selectedEntity, true);
                        this.forceUpdate();
                    }
                    manager.attachToMesh(this._selectedEntity.reservedDataStore.lightGizmo.attachedMesh);
                } else {
                    manager.attachToMesh(null);
                }
            }
        });
    }

    componentWillUnmount() {
        const scene = this.props.scene;

        if (this._onPointerObserver) {
            scene.onPointerObservable.remove(this._onPointerObserver);
            this._onPointerObserver = null;
        }

        if (this._gizmoLayerOnPointerObserver) {
            scene.onPointerObservable.remove(this._gizmoLayerOnPointerObserver);
            this._gizmoLayerOnPointerObserver = null;
        }

        if (this._onSelectionChangeObserver && this.props.onSelectionChangedObservable) {
            this.props.onSelectionChangedObservable.remove(this._onSelectionChangeObserver);
        }
    }

    onSelect() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }
        const scene = this.props.scene;
        this.props.onSelectionChangedObservable.notifyObservers(scene);
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
                const pickInfo = scene.pick(pickPosition.x, pickPosition.y, (mesh) => mesh.isEnabled() && mesh.isVisible && mesh.getTotalVertices() > 0, false,
                    undefined, (p0, p1, p2, ray) => {
                        if (!this.props.globalState.ignoreBackfacesForPicking) {
                            return true;
                        }

                        let p0p1 = TmpVectors.Vector3[0];
                        let p1p2 = TmpVectors.Vector3[1];
                        let normal = TmpVectors.Vector3[2];

                        p1.subtractToRef(p0, p0p1);
                        p2.subtractToRef(p1, p1p2);

                        normal = Vector3.Cross(p0p1, p1p2);


                        return Vector3.Dot(normal, ray.direction) < 0;
                    });

                // Pick light gizmos first
                if (this.props.globalState.lightGizmos.length > 0) {
                    var gizmoScene = this.props.globalState.lightGizmos[0].gizmoLayer.utilityLayerScene;
                    let pickInfo = gizmoScene.pick(pickPosition.x, pickPosition.y, (m: any) => {
                        for (var g of (this.props.globalState.lightGizmos as any)) {
                            if (g.attachedMesh == m) {
                                return true;
                            }
                        }
                        return false;
                    });
                    if (pickInfo && pickInfo.hit && this.props.onSelectionChangedObservable) {
                        this.props.onSelectionChangedObservable.notifyObservers(pickInfo.pickedMesh);
                        return;
                    }
                }
                if (pickInfo && pickInfo.hit && this.props.onSelectionChangedObservable) {
                    this.props.onSelectionChangedObservable.notifyObservers(pickInfo.pickedMesh);
                }

            }, PointerEventTypes.POINTERTAP);
        }

        this.setState({ isInPickingMode: !this.state.isInPickingMode });
    }

    setGizmoMode(mode: number) {
        const scene = this.props.scene;

        if (!scene.reservedDataStore) {
            scene.reservedDataStore = {};
        }

        if (this._gizmoLayerOnPointerObserver) {
            scene.onPointerObservable.remove(this._gizmoLayerOnPointerObserver);
            this._gizmoLayerOnPointerObserver = null;
        }

        if (!scene.reservedDataStore.gizmoManager) {
            scene.reservedDataStore.gizmoManager = new GizmoManager(scene);
        }

        const manager: GizmoManager = scene.reservedDataStore.gizmoManager;
        // Allow picking of light gizmo when a gizmo mode is selected
        this._gizmoLayerOnPointerObserver = UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type == PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh) {
                    var node: Nullable<any> = pointerInfo.pickInfo.pickedMesh;
                    // Attach to the most parent node
                    while (node && node.parent != null) {
                        node = node.parent;
                    }
                    for (var gizmo of this.props.globalState.lightGizmos) {
                        if (gizmo._rootMesh == node) {
                            manager.attachToMesh(gizmo.attachedMesh);
                        }
                    }
                }
            }
        })

        manager.boundingBoxGizmoEnabled = false;
        manager.positionGizmoEnabled = false;
        manager.rotationGizmoEnabled = false;
        manager.scaleGizmoEnabled = false;

        if (this.state.gizmoMode === mode) {
            mode = 0;
            manager.dispose();
            scene.reservedDataStore.gizmoManager = null;
        } else {
            switch (mode) {
                case 1:
                    manager.positionGizmoEnabled = true;
                    if (!this._posDragEnd) {
                        // Record movement for generating replay code
                        this._posDragEnd = manager.gizmos.positionGizmo!.onDragEndObservable.add(() => {
                            if (manager.gizmos.positionGizmo && manager.gizmos.positionGizmo.attachedMesh) {
                                var lightGizmo: Nullable<LightGizmo> = manager.gizmos.positionGizmo.attachedMesh.reservedDataStore ? manager.gizmos.positionGizmo.attachedMesh.reservedDataStore.lightGizmo : null;
                                var obj: any = (lightGizmo && lightGizmo.light) ? lightGizmo.light : manager.gizmos.positionGizmo.attachedMesh;

                                if (obj.position) {
                                    var e = new PropertyChangedEvent();
                                    e.object = obj
                                    e.property = "position"
                                    e.value = obj.position;
                                    this.props.globalState.onPropertyChangedObservable.notifyObservers(e)
                                }
                            }
                        })
                    }

                    break;
                case 2:
                    manager.rotationGizmoEnabled = true;
                    if (!this._rotateDragEnd) {
                        // Record movement for generating replay code
                        this._rotateDragEnd = manager.gizmos.rotationGizmo!.onDragEndObservable.add(() => {
                            if (manager.gizmos.rotationGizmo && manager.gizmos.rotationGizmo.attachedMesh) {
                                var lightGizmo: Nullable<LightGizmo> = manager.gizmos.rotationGizmo.attachedMesh.reservedDataStore ? manager.gizmos.rotationGizmo.attachedMesh.reservedDataStore.lightGizmo : null;
                                var obj: any = (lightGizmo && lightGizmo.light) ? lightGizmo.light : manager.gizmos.rotationGizmo.attachedMesh;

                                if (obj.rotationQuaternion) {
                                    var e = new PropertyChangedEvent();
                                    e.object = obj;
                                    e.property = "rotationQuaternion";
                                    e.value = obj.rotationQuaternion;
                                    this.props.globalState.onPropertyChangedObservable.notifyObservers(e);
                                } else if (obj.rotation) {
                                    var e = new PropertyChangedEvent();
                                    e.object = obj;
                                    e.property = "rotation";
                                    e.value = obj.rotation;
                                    this.props.globalState.onPropertyChangedObservable.notifyObservers(e);
                                } else if (obj.direction) {
                                    var e = new PropertyChangedEvent();
                                    e.object = obj;
                                    e.property = "direction";
                                    e.value = obj.direction;
                                    this.props.globalState.onPropertyChangedObservable.notifyObservers(e);
                                }
                            }
                        })
                    }

                    break;
                case 3:
                    manager.scaleGizmoEnabled = true;
                    if (!this._scaleDragEnd) {
                        // Record movement for generating replay code
                        this._scaleDragEnd = manager.gizmos.scaleGizmo!.onDragEndObservable.add(() => {
                            if (manager.gizmos.scaleGizmo && manager.gizmos.scaleGizmo.attachedMesh) {
                                var lightGizmo: Nullable<LightGizmo> = manager.gizmos.scaleGizmo.attachedMesh.reservedDataStore ? manager.gizmos.scaleGizmo.attachedMesh.reservedDataStore.lightGizmo : null;
                                var obj: any = (lightGizmo && lightGizmo.light) ? lightGizmo.light : manager.gizmos.scaleGizmo.attachedMesh;

                                if (obj.scaling) {
                                    var e = new PropertyChangedEvent();
                                    e.object = obj;
                                    e.property = "scaling";
                                    e.value = obj.scaling;
                                    this.props.globalState.onPropertyChangedObservable.notifyObservers(e);
                                }
                            }
                        })
                    }

                    break;
                case 4:
                    manager.boundingBoxGizmoEnabled = true;
                    if (manager.gizmos.boundingBoxGizmo) {
                        manager.gizmos.boundingBoxGizmo.fixedDragMeshScreenSize = true;
                    }
                    break;
            }

            if (this._selectedEntity && this._selectedEntity.getClassName) {
                const className = this._selectedEntity.getClassName();

                if (className === "TransformNode" || className.indexOf("Mesh") !== -1) {
                    manager.attachToMesh(this._selectedEntity);
                } else if (className.indexOf("Light") !== -1) {
                    if (!this._selectedEntity.reservedDataStore || !this._selectedEntity.reservedDataStore.lightGizmo) {
                        this.props.globalState.enableLightGizmo(this._selectedEntity, true);
                        this.forceUpdate();
                    }
                    manager.attachToMesh(this._selectedEntity.reservedDataStore.lightGizmo.attachedMesh);
                }
            }
        }

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
                    <div className={this.state.gizmoMode === 4 ? "bounding selected icon" : "bounding icon"} onClick={() => this.setGizmoMode(4)} title="Enable/Disable bounding box mode">
                        <FontAwesomeIcon icon={faVectorSquare} />
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
        );
    }
}
