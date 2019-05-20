import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { Tools } from "babylonjs/Misc/tools";
import { Color3, Vector3 } from "babylonjs/Maths/math";
import { Mesh } from "babylonjs/Meshes/mesh";
import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { LinesBuilder } from "babylonjs/Meshes/Builders/linesBuilder";
import { PhysicsImpostor } from "babylonjs/Physics/physicsImpostor";
import { Scene } from "babylonjs/scene";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { Vector3LineComponent } from "../../../lines/vector3LineComponent";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { QuaternionLineComponent } from "../../../lines/quaternionLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { CustomPropertyGridComponent } from '../customPropertyGridComponent';
import { StandardMaterial } from 'babylonjs/Materials/standardMaterial';
import { Color3LineComponent } from '../../../lines/color3LineComponent';
import { MorphTarget } from 'babylonjs/Morph/morphTarget';

interface IMeshPropertyGridComponentProps {
    globalState: GlobalState;
    mesh: Mesh;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class MeshPropertyGridComponent extends React.Component<IMeshPropertyGridComponentProps, {
    displayNormals: boolean
}> {
    constructor(props: IMeshPropertyGridComponentProps) {
        super(props);

        this.state = {
            displayNormals: false
        };
    }

    renderWireframeOver() {
        const mesh = this.props.mesh;
        const scene = mesh.getScene();

        if (mesh.reservedDataStore && mesh.reservedDataStore.wireframeOver) {
            mesh.reservedDataStore.wireframeOver.dispose(false, true);
            mesh.reservedDataStore.wireframeOver = null;

            this.forceUpdate();
            return;
        }

        var wireframeOver = mesh.clone();
        wireframeOver.reservedDataStore = { hidden: true };
        wireframeOver.position = Vector3.Zero();
        wireframeOver.setParent(mesh);
        var material = new StandardMaterial("wireframeOver", scene);
        material.reservedDataStore = { hidden: true };
        wireframeOver.material = material;
        material.zOffset = 1;
        material.disableLighting = true;
        material.backFaceCulling = false;
        material.emissiveColor = Color3.White();

        material.wireframe = true;

        if (!mesh.reservedDataStore) {
            mesh.reservedDataStore = {};
        }

        mesh.reservedDataStore.wireframeOver = wireframeOver;

        this.forceUpdate();
    }

    renderNormalVectors() {
        const mesh = this.props.mesh;
        const scene = mesh.getScene();

        if (mesh.reservedDataStore && mesh.reservedDataStore.normalLines) {
            mesh.reservedDataStore.normalLines.dispose();
            mesh.reservedDataStore.normalLines = null;

            this.forceUpdate();
            return;
        }

        var normals = mesh.getVerticesData(VertexBuffer.NormalKind);
        var positions = mesh.getVerticesData(VertexBuffer.PositionKind);

        const color = Color3.White();
        const size = mesh.getBoundingInfo().diagonalLength * 0.05;

        var lines = [];
        for (var i = 0; i < normals!.length; i += 3) {
            var v1 = Vector3.FromArray(positions!, i);
            var v2 = v1.add(Vector3.FromArray(normals!, i).scaleInPlace(size));
            lines.push([v1, v2]);
        }

        var normalLines = LinesBuilder.CreateLineSystem("normalLines", { lines: lines }, scene);
        normalLines.color = color;
        normalLines.parent = mesh;
        normalLines.reservedDataStore = { hidden: true };

        if (!mesh.reservedDataStore) {
            mesh.reservedDataStore = {};
        }

        mesh.reservedDataStore.normalLines = normalLines;

        this.forceUpdate();
    }

    displayNormals() {
        const mesh = this.props.mesh;
        const scene = mesh.getScene();
        if (!mesh.material) {
            return;
        }

        if (mesh.material.getClassName() === "NormalMaterial") {
            mesh.material.dispose();

            mesh.material = mesh.reservedDataStore.originalMaterial;
            mesh.reservedDataStore.originalMaterial = null;
            this.setState({ displayNormals: false });
        } else {

            if (!(BABYLON as any).NormalMaterial) {
                this.setState({ displayNormals: true });
                Tools.LoadScript("https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.js", () => {
                    this.displayNormals();
                });
                return;
            }

            if (!mesh.reservedDataStore) {
                mesh.reservedDataStore = {};
            }

            mesh.reservedDataStore.originalMaterial = mesh.material;
            const normalMaterial = new (BABYLON as any).NormalMaterial("normalMaterial", scene);
            normalMaterial.disableLighting = true;
            normalMaterial.sideOrientation = mesh.material.sideOrientation;
            normalMaterial.reservedDataStore = { hidden: true };
            mesh.material = normalMaterial;
            this.setState({ displayNormals: true });
        }
    }

    onMaterialLink() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        const mesh = this.props.mesh;
        this.props.onSelectionChangedObservable.notifyObservers(mesh.material);
    }

    onSourceMeshLink() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        const instanceMesh = this.props.mesh as any;
        this.props.onSelectionChangedObservable.notifyObservers(instanceMesh.sourceMesh);
    }

    convertPhysicsTypeToString(): string {
        const mesh = this.props.mesh;
        switch (mesh.physicsImpostor!.type) {
            case PhysicsImpostor.NoImpostor:
                return "No impostor";
            case PhysicsImpostor.SphereImpostor:
                return "Sphere";
            case PhysicsImpostor.BoxImpostor:
                return "Box";
            case PhysicsImpostor.PlaneImpostor:
                return "Plane";
            case PhysicsImpostor.MeshImpostor:
                return "Mesh";
            case PhysicsImpostor.CylinderImpostor:
                return "Cylinder";
            case PhysicsImpostor.ParticleImpostor:
                return "Particle";
            case PhysicsImpostor.HeightmapImpostor:
                return "Heightmap";
            case PhysicsImpostor.ConvexHullImpostor:
                return "Convex hull";
            case PhysicsImpostor.RopeImpostor:
                return "Rope";
            case PhysicsImpostor.SoftbodyImpostor:
                return "Soft body";
        }

        return "Unknown";
    }

    render() {
        const mesh = this.props.mesh;
        const scene = mesh.getScene();

        const displayNormals = mesh.material != null && mesh.material.getClassName() === "NormalMaterial";
        const renderNormalVectors = (mesh.reservedDataStore && mesh.reservedDataStore.normalLines) ? true : false;
        const renderWireframeOver = (mesh.reservedDataStore && mesh.reservedDataStore.wireframeOver) ? true : false;

        var morphTargets: MorphTarget[] = [];

        if (mesh.morphTargetManager) {
            for (var index = 0; index < mesh.morphTargetManager.numTargets; index++) {
                morphTargets.push(mesh.morphTargetManager.getTarget(index));
            }
        }

        return (
            <div className="pane">
                <CustomPropertyGridComponent globalState={this.props.globalState} target={mesh}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="ID" value={mesh.id} />
                    <TextLineComponent label="Unique ID" value={mesh.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={mesh.getClassName()} />
                    <TextLineComponent label="Vertices" value={mesh.getTotalVertices().toString()} />
                    <TextLineComponent label="Faces" value={(mesh.getTotalIndices() / 3).toFixed(0)} />
                    <TextLineComponent label="Sub-meshes" value={mesh.subMeshes ? mesh.subMeshes.length.toString() : "0"} />
                    <TextLineComponent label="Has skeleton" value={mesh.skeleton ? "Yes" : "No"} />
                    <CheckBoxLineComponent label="IsEnabled" isSelected={() => mesh.isEnabled()} onSelect={(value) => mesh.setEnabled(value)} />
                    <CheckBoxLineComponent label="IsPickable" target={mesh} propertyName="isPickable" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        mesh.material &&
                        <TextLineComponent label="Material" value={mesh.material.name} onLink={() => this.onMaterialLink()} />
                    }
                    {
                        mesh.isAnInstance &&
                        <TextLineComponent label="Source" value={(mesh as any).sourceMesh.name} onLink={() => this.onSourceMeshLink()} />
                    }
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="TRANSFORMS">
                    <Vector3LineComponent label="Position" target={mesh} propertyName="position" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        !mesh.rotationQuaternion &&
                        <Vector3LineComponent label="Rotation" target={mesh} propertyName="rotation" step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        mesh.rotationQuaternion &&
                        <QuaternionLineComponent label="Rotation" target={mesh} propertyName="rotationQuaternion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <Vector3LineComponent label="Scaling" target={mesh} propertyName="scaling" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="DISPLAY" closed={true}>
                    {
                        !mesh.isAnInstance &&
                        <SliderLineComponent label="Visibility" target={mesh} propertyName="visibility" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <FloatLineComponent lockObject={this.props.lockObject} label="Alpha index" target={mesh} propertyName="alphaIndex" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Receive shadows" target={mesh} propertyName="receiveShadows" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        mesh.isVerticesDataPresent(VertexBuffer.ColorKind) &&
                        <CheckBoxLineComponent label="Use vertex colors" target={mesh} propertyName="useVertexColors" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        scene.fogMode !== Scene.FOGMODE_NONE &&
                        <CheckBoxLineComponent label="Apply fog" target={mesh} propertyName="applyFog" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        !mesh.parent &&
                        <CheckBoxLineComponent label="Infinite distance" target={mesh} propertyName="infiniteDistance" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                </LineContainerComponent>
                {
                    mesh.morphTargetManager != null &&
                    <LineContainerComponent globalState={this.props.globalState} title="MORPH TARGETS" closed={true}>
                        {
                            morphTargets.map((mt, i) => {
                                return (
                                    <SliderLineComponent label={mt.name} target={mt} propertyName="influence" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                                )
                            })
                        }
                    </LineContainerComponent>

                }
                <LineContainerComponent globalState={this.props.globalState} title="ADVANCED" closed={true}>
                    {
                        mesh.useBones &&
                        <CheckBoxLineComponent label="Compute bones using shaders" target={mesh} propertyName="computeBonesUsingShaders" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <CheckBoxLineComponent label="Collisions" target={mesh} propertyName="checkCollisions" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextLineComponent label="Has normals" value={mesh.isVerticesDataPresent(VertexBuffer.NormalKind) ? "Yes" : "No"} />
                    <TextLineComponent label="Has vertex colors" value={mesh.isVerticesDataPresent(VertexBuffer.ColorKind) ? "Yes" : "No"} />
                    <TextLineComponent label="Has UV set 0" value={mesh.isVerticesDataPresent(VertexBuffer.UVKind) ? "Yes" : "No"} />
                    <TextLineComponent label="Has UV set 1" value={mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) ? "Yes" : "No"} />
                    <TextLineComponent label="Has UV set 2" value={mesh.isVerticesDataPresent(VertexBuffer.UV3Kind) ? "Yes" : "No"} />
                    <TextLineComponent label="Has UV set 3" value={mesh.isVerticesDataPresent(VertexBuffer.UV4Kind) ? "Yes" : "No"} />
                    <TextLineComponent label="Has tangents" value={mesh.isVerticesDataPresent(VertexBuffer.TangentKind) ? "Yes" : "No"} />
                    <TextLineComponent label="Has matrix weights" value={mesh.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind) ? "Yes" : "No"} />
                    <TextLineComponent label="Has matrix indices" value={mesh.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind) ? "Yes" : "No"} />
                </LineContainerComponent>
                {
                    mesh.physicsImpostor != null &&
                    <LineContainerComponent globalState={this.props.globalState} title="PHYSICS" closed={true}>
                        <FloatLineComponent lockObject={this.props.lockObject} label="Mass" target={mesh.physicsImpostor} propertyName="mass" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <FloatLineComponent lockObject={this.props.lockObject} label="Friction" target={mesh.physicsImpostor} propertyName="friction" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <FloatLineComponent lockObject={this.props.lockObject} label="Restitution" target={mesh.physicsImpostor} propertyName="restitution" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <TextLineComponent label="Type" value={this.convertPhysicsTypeToString()} />
                    </LineContainerComponent>
                }
                <LineContainerComponent globalState={this.props.globalState} title="EDGE RENDERING" closed={true}>
                    <CheckBoxLineComponent label="Enable" target={mesh} isSelected={() => mesh.edgesRenderer != null} onSelect={value => {
                        if (value) {
                            mesh.enableEdgesRendering();
                        } else {
                            mesh.disableEdgesRendering();
                        }
                    }} />
                    <SliderLineComponent label="Edge width" minimum={0} maximum={10} step={0.1} target={mesh} propertyName="edgesWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Edge color" target={mesh} propertyName="edgesColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="OUTLINE & OVERLAY" closed={true}>
                    <CheckBoxLineComponent label="Render overlay" target={mesh} propertyName="renderOverlay" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Overlay color" target={mesh} propertyName="overlayColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Render outline" target={mesh} propertyName="renderOutline" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Outline color" target={mesh} propertyName="outlineColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="DEBUG" closed={true}>
                    {
                        mesh.material &&
                        <CheckBoxLineComponent label="Display normals" isSelected={() => displayNormals} onSelect={() => this.displayNormals()} />
                    }
                    {
                        mesh.isVerticesDataPresent(VertexBuffer.NormalKind) &&
                        <CheckBoxLineComponent label="Render vertex normals" isSelected={() => renderNormalVectors} onSelect={() => this.renderNormalVectors()} />
                    }
                    <CheckBoxLineComponent label="Render wireframe over mesh" isSelected={() => renderWireframeOver} onSelect={() => this.renderWireframeOver()} />
                </LineContainerComponent>
            </div>
        );
    }
}