import * as React from "react";

import type { Observable } from "core/Misc/observable";
import { Vector3, TmpVectors } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import type { Mesh } from "core/Meshes/mesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { CreateLineSystem } from "core/Meshes/Builders/linesBuilder";
import { PhysicsImpostor } from "core/Physics/v1/physicsImpostor";
import { Scene } from "core/scene";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { QuaternionLineComponent } from "../../../lines/quaternionLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { CustomPropertyGridComponent } from "../customPropertyGridComponent";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import type { MorphTarget } from "core/Morph/morphTarget";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { AnimationGridComponent } from "../animations/animationPropertyGridComponent";
import { RenderingManager } from "core/Rendering/renderingManager";
import { CommonPropertyGridComponent } from "../commonPropertyGridComponent";
import { VariantsPropertyGridComponent } from "../variantsPropertyGridComponent";
import { HexLineComponent } from "shared-ui-components/lines/hexLineComponent";
import { SkeletonViewer } from "core/Debug/skeletonViewer";
import type { ShaderMaterial } from "core/Materials/shaderMaterial";
import type { IInspectableOptions } from "core/Misc/iInspectable";
import { NormalMaterial } from "materials/normal/normalMaterial";

import "core/Physics/physicsEngineComponent";
import "core/Physics/v1/physicsEngineComponent";

import { ParentPropertyGridComponent } from "../parentPropertyGridComponent";
import { Tools } from "core/Misc/tools";
import { PhysicsBodyGridComponent } from "./physics/physicsBodyGridComponent";

interface IMeshPropertyGridComponentProps {
    globalState: GlobalState;
    mesh: Mesh;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class MeshPropertyGridComponent extends React.Component<
    IMeshPropertyGridComponentProps,
    {
        displayNormals: boolean;
        displayVertexColors: boolean;
        displayBoneWeights: boolean;
        displayBoneIndex: number;
        displaySkeletonMap: boolean;
    }
> {
    constructor(props: IMeshPropertyGridComponentProps) {
        super(props);

        const mesh = this.props.mesh;

        this.state = {
            displayNormals: false,
            displayVertexColors: false,
            displayBoneWeights: !!(mesh.material && mesh.material.getClassName() === "BoneWeightShader"),
            displayBoneIndex: 0,
            displaySkeletonMap: false,
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

        const wireframeOver = mesh.clone(mesh.name + "_wireframeover", null, true, false)!;
        wireframeOver.reservedDataStore = { hidden: true };

        // Sets up the mesh to be attached to the parent.
        // So all neutral in local space.
        wireframeOver.parent = mesh;
        wireframeOver.position = Vector3.Zero();
        wireframeOver.scaling = new Vector3(1, 1, 1);
        wireframeOver.rotation = Vector3.Zero();
        wireframeOver.rotationQuaternion = null;

        const material = new StandardMaterial("wireframeOver", scene);
        material.reservedDataStore = { hidden: true };
        wireframeOver.material = material;
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

        const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

        const color = Color3.White();
        const bbox = mesh.getBoundingInfo();
        const diag = bbox.maximum.subtractToRef(bbox.minimum, TmpVectors.Vector3[0]);
        const size = diag.length() * 0.05;

        const lines = [];
        for (let i = 0; i < normals!.length; i += 3) {
            const v1 = Vector3.FromArray(positions!, i);
            const v2 = v1.add(Vector3.FromArray(normals!, i).scaleInPlace(size));
            lines.push([v1, v2]);
        }

        const normalLines = CreateLineSystem("normalLines", { lines: lines }, scene);
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

        if (mesh.material && mesh.material.getClassName() === "NormalMaterial") {
            mesh.material.dispose();

            mesh.material = mesh.reservedDataStore.originalMaterial;
            mesh.reservedDataStore.originalMaterial = null;
            this.setState({ displayNormals: false });
        } else {
            if (typeof NormalMaterial === "undefined") {
                Tools.Warn("NormalMaterial not found. Make sure to load the materials library.");
                return;
            }

            if (!mesh.reservedDataStore) {
                mesh.reservedDataStore = {};
            }

            if (!mesh.reservedDataStore.originalMaterial) {
                mesh.reservedDataStore.originalMaterial = mesh.material;
            }

            const normalMaterial = new NormalMaterial("normalMaterial", scene);
            normalMaterial.disableLighting = true;
            if (mesh.material) {
                normalMaterial.sideOrientation = mesh.material.sideOrientation;
            }
            normalMaterial.reservedDataStore = { hidden: true };
            mesh.material = normalMaterial;
            this.setState({ displayNormals: true });
        }
    }

    displayVertexColors() {
        const mesh = this.props.mesh;
        const scene = mesh.getScene();

        if (mesh.material && mesh.material.reservedDataStore && mesh.material.reservedDataStore.isVertexColorMaterial) {
            mesh.material.dispose();

            mesh.material = mesh.reservedDataStore.originalMaterial;
            mesh.reservedDataStore.originalMaterial = null;
            this.setState({ displayVertexColors: false });
        } else {
            if (!mesh.reservedDataStore) {
                mesh.reservedDataStore = {};
            }

            if (!mesh.reservedDataStore.originalMaterial) {
                mesh.reservedDataStore.originalMaterial = mesh.material;
            }
            const vertexColorMaterial = new StandardMaterial("vertex colors", scene);
            vertexColorMaterial.disableLighting = true;
            vertexColorMaterial.emissiveColor = Color3.White();
            if (mesh.material) {
                vertexColorMaterial.sideOrientation = mesh.material.sideOrientation;
            }
            vertexColorMaterial.reservedDataStore = { hidden: true, isVertexColorMaterial: true };
            mesh.useVertexColors = true;
            mesh.material = vertexColorMaterial;
            this.setState({ displayVertexColors: true });
        }
    }

    displayBoneWeights() {
        const mesh = this.props.mesh;
        const scene = mesh.getScene();

        if (mesh.material && mesh.material.getClassName() === "BoneWeightShader") {
            mesh.material.dispose();
            mesh.material = mesh.reservedDataStore.originalMaterial;
            mesh.reservedDataStore.originalMaterial = null;
            this.setState({ displayBoneWeights: false });
        } else {
            if (!mesh.reservedDataStore) {
                mesh.reservedDataStore = {};
            }
            if (!mesh.reservedDataStore.originalMaterial) {
                mesh.reservedDataStore.originalMaterial = mesh.material;
            }
            if (!mesh.reservedDataStore.displayBoneIndex) {
                mesh.reservedDataStore.displayBoneIndex = this.state.displayBoneIndex;
            }
            if (mesh.skeleton) {
                const boneWeightsShader = SkeletonViewer.CreateBoneWeightShader({ skeleton: mesh.skeleton }, scene);
                boneWeightsShader.reservedDataStore = { hidden: true };
                mesh.material = boneWeightsShader;
                this.setState({ displayBoneWeights: true });
            }
        }
    }

    displaySkeletonMap() {
        const mesh = this.props.mesh;
        const scene = mesh.getScene();

        if (mesh.material && mesh.material.getClassName() === "SkeletonMapShader") {
            mesh.material.dispose();
            mesh.material = mesh.reservedDataStore.originalMaterial;
            mesh.reservedDataStore.originalMaterial = null;
            this.setState({ displaySkeletonMap: false });
        } else {
            if (!mesh.reservedDataStore) {
                mesh.reservedDataStore = {};
            }
            if (!mesh.reservedDataStore.originalMaterial) {
                mesh.reservedDataStore.originalMaterial = mesh.material;
            }
            if (mesh.skeleton) {
                const skeletonMapShader = SkeletonViewer.CreateSkeletonMapShader({ skeleton: mesh.skeleton }, scene);
                skeletonMapShader.reservedDataStore = { hidden: true };
                mesh.material = skeletonMapShader;
                this.setState({ displaySkeletonMap: true });
            }
        }
    }

    onBoneDisplayIndexChange(value: number): void {
        const mesh = this.props.mesh;
        mesh.reservedDataStore.displayBoneIndex = value;
        this.setState({ displayBoneIndex: value });
        if (mesh.material && mesh.material.getClassName() === "BoneWeightShader") {
            (mesh.material as ShaderMaterial).setFloat("targetBoneIndex", value);
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

    onSkeletonLink() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        const mesh = this.props.mesh;
        this.props.onSelectionChangedObservable.notifyObservers(mesh.skeleton);
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

    private _getIdForDisplay(id: any) {
        if (typeof id === "string") {
            return id;
        }
        return "[INVALID ID]";
    }

    render() {
        const mesh = this.props.mesh;
        const scene = mesh.getScene();

        const displayNormals = mesh.material != null && mesh.material.getClassName() === "NormalMaterial";
        const displayVertexColors = !!(mesh.material != null && mesh.material.reservedDataStore && mesh.material.reservedDataStore.isVertexColorMaterial);
        const renderNormalVectors = mesh.reservedDataStore && mesh.reservedDataStore.normalLines ? true : false;
        const renderWireframeOver = mesh.reservedDataStore && mesh.reservedDataStore.wireframeOver ? true : false;
        const displayBoneWeights = mesh.material != null && mesh.material.getClassName() === "BoneWeightShader";
        const displaySkeletonMap = mesh.material != null && mesh.material.getClassName() === "SkeletonMapShader";

        const morphTargets: MorphTarget[] = [];

        if (mesh.morphTargetManager) {
            for (let index = 0; index < mesh.morphTargetManager.numTargets; index++) {
                morphTargets.push(mesh.morphTargetManager.getTarget(index));
            }
        }

        const algorithmOptions = [
            { label: "Accurate", value: AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE },
            { label: "Conservative", value: AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE },
        ];

        const occlusionTypeOptions = [
            { label: "None", value: AbstractMesh.OCCLUSION_TYPE_NONE },
            { label: "Optimistic", value: AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC },
            { label: "Strict", value: AbstractMesh.OCCLUSION_TYPE_STRICT },
        ];

        const sortedMaterials = scene.materials.slice(0).sort((a, b) => (a.name || "no name").localeCompare(b.name || "no name"));

        const materialOptions = sortedMaterials.map((m, i) => {
            return {
                label: m.name || "no name",
                value: i,
            };
        });

        materialOptions.splice(0, 0, {
            label: "None (Default Fallback)",
            value: -1,
        });

        const targetBoneOptions: IInspectableOptions[] = mesh.skeleton
            ? mesh.skeleton.bones
                  .filter((bone) => bone.getIndex() >= 0)
                  .sort((bone1, bone2) => bone1.getIndex() - bone2.getIndex())
                  .map((bone) => {
                      return {
                          label: bone.name,
                          value: bone.getIndex(),
                      };
                  })
            : [];

        return (
            <>
                <CustomPropertyGridComponent
                    globalState={this.props.globalState}
                    target={mesh}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="ID" value={this._getIdForDisplay(mesh.id)} />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={mesh}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Unique ID" value={mesh.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={mesh.getClassName()} />
                    <TextLineComponent label="Vertices" value={mesh.getTotalVertices().toString()} />
                    <TextLineComponent label="Faces" value={(mesh.getTotalIndices() / 3).toFixed(0)} />
                    <TextLineComponent label="Sub-meshes" value={mesh.subMeshes ? mesh.subMeshes.length.toString() : "0"} />
                    <ParentPropertyGridComponent
                        globalState={this.props.globalState}
                        node={mesh}
                        lockObject={this.props.lockObject}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {mesh.skeleton && <TextLineComponent label="Skeleton" value={mesh.skeleton.name} onLink={() => this.onSkeletonLink()} />}
                    <CheckBoxLineComponent
                        label="Is enabled"
                        isSelected={() => mesh.isEnabled()}
                        onSelect={(value) => {
                            const prevValue = mesh.isEnabled();
                            mesh.setEnabled(value);
                            this.props.onPropertyChangedObservable?.notifyObservers({
                                object: mesh,
                                property: "isEnabled",
                                value,
                                initialValue: prevValue,
                            });
                        }}
                    />
                    <CheckBoxLineComponent label="Is pickable" target={mesh} propertyName="isPickable" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {mesh.material && (!mesh.material.reservedDataStore || !mesh.material.reservedDataStore.hidden) && (
                        <TextLineComponent label="Link to material" value={mesh.material.name} onLink={() => this.onMaterialLink()} />
                    )}
                    {!mesh.isAnInstance && (
                        <OptionsLineComponent
                            label="Active material"
                            options={materialOptions}
                            target={mesh}
                            propertyName="material"
                            noDirectUpdate={true}
                            onSelect={(value) => {
                                if ((value as number) < 0) {
                                    mesh.material = null;
                                } else {
                                    mesh.material = sortedMaterials[value as number];
                                }

                                this.forceUpdate();
                            }}
                            extractValue={() => (mesh.material ? sortedMaterials.indexOf(mesh.material) : -1)}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {mesh.isAnInstance && <TextLineComponent label="Source" value={(mesh as any).sourceMesh.name} onLink={() => this.onSourceMeshLink()} />}
                    <ButtonLineComponent
                        label="Dispose"
                        onClick={() => {
                            mesh.dispose();
                            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                        }}
                    />
                </LineContainerComponent>
                <CommonPropertyGridComponent host={mesh} lockObject={this.props.lockObject} globalState={this.props.globalState} />
                <VariantsPropertyGridComponent host={mesh} lockObject={this.props.lockObject} globalState={this.props.globalState} />
                <LineContainerComponent title="TRANSFORMS" selection={this.props.globalState}>
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Position"
                        target={mesh}
                        propertyName="position"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {!mesh.rotationQuaternion && (
                        <Vector3LineComponent
                            lockObject={this.props.lockObject}
                            label="Rotation"
                            useEuler={this.props.globalState.onlyUseEulers}
                            target={mesh}
                            propertyName="rotation"
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {mesh.rotationQuaternion && (
                        <QuaternionLineComponent
                            lockObject={this.props.lockObject}
                            label="Rotation"
                            useEuler={this.props.globalState.onlyUseEulers}
                            target={mesh}
                            propertyName="rotationQuaternion"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Scaling"
                        target={mesh}
                        propertyName="scaling"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                {mesh._internalMetadata && mesh._internalMetadata.nodeGeometry && (
                    <LineContainerComponent title="NODE GEOMETRY" selection={this.props.globalState}>
                        <ButtonLineComponent
                            label="Edit"
                            onClick={() => {
                                mesh._internalMetadata.nodeGeometry.edit({
                                    nodeGeometryEditorConfig: {
                                        backgroundColor: mesh.getScene().clearColor,
                                        hostMesh: mesh,
                                        hostScene: mesh.getScene(),
                                    },
                                });
                            }}
                        />
                    </LineContainerComponent>
                )}
                <LineContainerComponent title="DISPLAY" closed={true} selection={this.props.globalState}>
                    {!mesh.isAnInstance && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Visibility"
                            target={mesh}
                            propertyName="visibility"
                            minimum={0}
                            maximum={1}
                            step={0.01}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Alpha index"
                        target={mesh}
                        propertyName="alphaIndex"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="Receive shadows"
                        target={mesh}
                        propertyName="receiveShadows"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {mesh.isVerticesDataPresent(VertexBuffer.ColorKind) && (
                        <CheckBoxLineComponent
                            label="Use vertex colors"
                            target={mesh}
                            propertyName="useVertexColors"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {mesh.isVerticesDataPresent(VertexBuffer.ColorKind) && (
                        <CheckBoxLineComponent
                            label="Has vertex alpha"
                            target={mesh}
                            propertyName="hasVertexAlpha"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {scene.fogMode !== Scene.FOGMODE_NONE && (
                        <CheckBoxLineComponent label="Apply fog" target={mesh} propertyName="applyFog" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    )}
                    {!mesh.parent && (
                        <CheckBoxLineComponent
                            label="Infinite distance"
                            target={mesh}
                            propertyName="infiniteDistance"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Rendering group ID"
                        decimalCount={0}
                        target={mesh}
                        propertyName="renderingGroupId"
                        minimum={RenderingManager.MIN_RENDERINGGROUPS}
                        maximum={RenderingManager.MAX_RENDERINGGROUPS - 1}
                        step={1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <HexLineComponent
                        isInteger
                        lockObject={this.props.lockObject}
                        label="Layer mask"
                        target={mesh}
                        propertyName="layerMask"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                {mesh.morphTargetManager != null && (
                    <LineContainerComponent title="MORPH TARGETS" closed={true} selection={this.props.globalState}>
                        {morphTargets.map((mt, i) => {
                            return (
                                <SliderLineComponent
                                    lockObject={this.props.lockObject}
                                    key={i}
                                    label={mt.name}
                                    target={mt}
                                    propertyName="influence"
                                    minimum={0}
                                    maximum={1}
                                    step={0.01}
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                            );
                        })}
                    </LineContainerComponent>
                )}
                <AnimationGridComponent globalState={this.props.globalState} animatable={mesh} scene={mesh.getScene()} lockObject={this.props.lockObject} />
                <LineContainerComponent title="ADVANCED" closed={true} selection={this.props.globalState}>
                    {mesh.useBones && (
                        <CheckBoxLineComponent
                            label="Compute bones using shaders"
                            target={mesh}
                            propertyName="computeBonesUsingShaders"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <CheckBoxLineComponent label="Collisions" target={mesh} propertyName="checkCollisions" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextLineComponent label="Geometry ID" value={mesh.geometry?.uniqueId.toString()} />
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
                {mesh.physicsImpostor != null && (
                    <LineContainerComponent title="PHYSICS" closed={true} selection={this.props.globalState}>
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="Mass"
                            target={mesh.physicsImpostor}
                            propertyName="mass"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="Friction"
                            target={mesh.physicsImpostor}
                            propertyName="friction"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="Restitution"
                            target={mesh.physicsImpostor}
                            propertyName="restitution"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <TextLineComponent label="Type" value={this.convertPhysicsTypeToString()} />
                    </LineContainerComponent>
                )}
                {mesh.physicsBody && (
                    <PhysicsBodyGridComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        body={mesh.physicsBody}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                )}
                <LineContainerComponent title="OCCLUSIONS" closed={true} selection={this.props.globalState}>
                    <OptionsLineComponent
                        label="Type"
                        options={occlusionTypeOptions}
                        target={mesh}
                        propertyName="occlusionType"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Retry count"
                        minimum={-1}
                        maximum={10}
                        decimalCount={0}
                        step={1}
                        target={mesh}
                        propertyName="occlusionRetryCount"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <OptionsLineComponent
                        label="Algorithm"
                        options={algorithmOptions}
                        target={mesh}
                        propertyName="occlusionQueryAlgorithmType"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="EDGE RENDERING" closed={true} selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Enable"
                        target={mesh}
                        isSelected={() => mesh.edgesRenderer != null}
                        onSelect={(value) => {
                            if (value) {
                                mesh.enableEdgesRendering();
                            } else {
                                mesh.disableEdgesRendering();
                            }
                        }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Edge width"
                        minimum={0}
                        maximum={10}
                        step={0.1}
                        target={mesh}
                        propertyName="edgesWidth"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Color4LineComponent
                        lockObject={this.props.lockObject}
                        label="Edge color"
                        target={mesh}
                        propertyName="edgesColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                {!mesh.isAnInstance && (
                    <LineContainerComponent title="OUTLINE & OVERLAY" closed={true} selection={this.props.globalState}>
                        <CheckBoxLineComponent
                            label="Render overlay"
                            target={mesh}
                            propertyName="renderOverlay"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <Color3LineComponent
                            lockObject={this.props.lockObject}
                            label="Overlay color"
                            target={mesh}
                            propertyName="overlayColor"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Render outline"
                            target={mesh}
                            propertyName="renderOutline"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <Color3LineComponent
                            lockObject={this.props.lockObject}
                            label="Outline color"
                            target={mesh}
                            propertyName="outlineColor"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </LineContainerComponent>
                )}
                <LineContainerComponent title="DEBUG" closed={true} selection={this.props.globalState}>
                    {!mesh.isAnInstance && <CheckBoxLineComponent label="Display normals" isSelected={() => displayNormals} onSelect={() => this.displayNormals()} />}
                    {!mesh.isAnInstance && (
                        <CheckBoxLineComponent label="Display vertex colors" isSelected={() => displayVertexColors} onSelect={() => this.displayVertexColors()} />
                    )}
                    {mesh.isVerticesDataPresent(VertexBuffer.NormalKind) && (
                        <CheckBoxLineComponent label="Render vertex normals" isSelected={() => renderNormalVectors} onSelect={() => this.renderNormalVectors()} />
                    )}
                    {!mesh.isAnInstance && (
                        <CheckBoxLineComponent label="Render wireframe over mesh" isSelected={() => renderWireframeOver} onSelect={() => this.renderWireframeOver()} />
                    )}
                    {!mesh.isAnInstance && mesh.skeleton && (
                        <CheckBoxLineComponent label="Display BoneWeights" isSelected={() => displayBoneWeights} onSelect={() => this.displayBoneWeights()} />
                    )}
                    {!mesh.isAnInstance && this.state.displayBoneWeights && mesh.skeleton && (
                        <OptionsLineComponent
                            label="Target Bone Name"
                            options={targetBoneOptions}
                            target={mesh.reservedDataStore}
                            propertyName="displayBoneIndex"
                            noDirectUpdate={true}
                            onSelect={(value) => {
                                this.onBoneDisplayIndexChange(value as number);
                                this.forceUpdate();
                            }}
                        />
                    )}
                    {!mesh.isAnInstance && this.state.displayBoneWeights && mesh.skeleton && (
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Target Bone"
                            decimalCount={0}
                            target={mesh.reservedDataStore}
                            propertyName="displayBoneIndex"
                            minimum={0}
                            maximum={targetBoneOptions.length - 1 || 0}
                            step={1}
                            onChange={(value) => {
                                this.onBoneDisplayIndexChange(value);
                                this.forceUpdate();
                            }}
                        />
                    )}
                    {!mesh.isAnInstance && mesh.skeleton && (
                        <CheckBoxLineComponent label="Display SkeletonMap" isSelected={() => displaySkeletonMap} onSelect={() => this.displaySkeletonMap()} />
                    )}
                </LineContainerComponent>
            </>
        );
    }
}
