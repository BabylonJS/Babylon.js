import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { Tools } from "babylonjs/Misc/tools";
import { Vector3, TmpVectors } from "babylonjs/Maths/math.vector";
import { Color3 } from 'babylonjs/Maths/math.color';
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
import { OptionsLineComponent } from '../../../lines/optionsLineComponent';
import { AbstractMesh } from 'babylonjs/Meshes/abstractMesh';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';
import { AnimationGridComponent } from '../animations/animationPropertyGridComponent';
import { RenderingManager } from 'babylonjs/Rendering/renderingManager';
import { CommonPropertyGridComponent } from '../commonPropertyGridComponent';
import { VariantsPropertyGridComponent } from '../variantsPropertyGridComponent';
import { HexLineComponent } from '../../../lines/hexLineComponent';
import { SkeletonViewer } from 'babylonjs/Debug/skeletonViewer';
import { ShaderMaterial } from 'babylonjs/Materials/shaderMaterial';

interface IMeshPropertyGridComponentProps {
    globalState: GlobalState;
    mesh: Mesh;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class MeshPropertyGridComponent extends React.Component<IMeshPropertyGridComponentProps, {
    displayNormals: boolean,
    displayVertexColors: boolean,
    displayBoneWeights: boolean,
    displayBoneIndex: number,
    displaySkeletonMap:boolean
}> {
    constructor(props: IMeshPropertyGridComponentProps) {
        super(props);
        this.state = {
            displayNormals: false,
            displayVertexColors: false,
            displayBoneWeights: false,
            displayBoneIndex: 0,
            displaySkeletonMap: false
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

        var wireframeOver = mesh.clone()!;
        wireframeOver.reservedDataStore = { hidden: true };

        // Sets up the mesh to be attached to the parent.
        // So all neutral in local space.
        wireframeOver.parent = mesh;
        wireframeOver.position = Vector3.Zero();
        wireframeOver.scaling = new Vector3(1, 1, 1);
        wireframeOver.rotation = Vector3.Zero();
        wireframeOver.rotationQuaternion = null;

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
        const bbox = mesh.getBoundingInfo();
        const diag = bbox.maximum.subtractToRef(bbox.minimum, TmpVectors.Vector3[0]);
        const size = diag.length() * 0.05;

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

        if (mesh.material && mesh.material.getClassName() === "NormalMaterial") {
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

            if (!mesh.reservedDataStore.originalMaterial) {
                mesh.reservedDataStore.originalMaterial = mesh.material;
            }

            const normalMaterial = new (BABYLON as any).NormalMaterial("normalMaterial", scene);
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
            if(mesh.skeleton){
                const boneWeightsShader = SkeletonViewer.CreateBoneWeightShader({skeleton:mesh.skeleton}, scene)
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
            if(mesh.skeleton){
                const skeletonMapShader = SkeletonViewer.CreateSkeletonMapShader({skeleton:mesh.skeleton}, scene)
                skeletonMapShader.reservedDataStore = { hidden: true };
                mesh.material = skeletonMapShader;
                this.setState({ displaySkeletonMap: true });
            }            
        }
    }

    onBoneDisplayIndexChange(value:number):void{
        let mesh = this.props.mesh
        mesh.reservedDataStore.displayBoneIndex = value
        this.setState({ displayBoneIndex: value });
        if (mesh.material && mesh.material.getClassName() === "BoneWeightShader") {
            (mesh.material as ShaderMaterial).setFloat('targetBoneIndex', value)
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

    render() {
        const mesh = this.props.mesh;
        const scene = mesh.getScene();

        const displayNormals = mesh.material != null && mesh.material.getClassName() === "NormalMaterial";
        const displayVertexColors = !!(mesh.material != null && mesh.material.reservedDataStore && mesh.material.reservedDataStore.isVertexColorMaterial);
        const renderNormalVectors = (mesh.reservedDataStore && mesh.reservedDataStore.normalLines) ? true : false;
        const renderWireframeOver = (mesh.reservedDataStore && mesh.reservedDataStore.wireframeOver) ? true : false;
        const displayBoneWeights = mesh.material != null && mesh.material.getClassName() === "BoneWeightShader";
        const displaySkeletonMap = mesh.material != null && mesh.material.getClassName() === "SkeletonMapShader";

        var morphTargets: MorphTarget[] = [];

        if (mesh.morphTargetManager) {
            for (var index = 0; index < mesh.morphTargetManager.numTargets; index++) {
                morphTargets.push(mesh.morphTargetManager.getTarget(index));
            }
        }

        var algorithmOptions = [
            { label: "Accurate", value: AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE },
            { label: "Conservative", value: AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE },
        ];

        var occlusionTypeOptions = [
            { label: "None", value: AbstractMesh.OCCLUSION_TYPE_NONE },
            { label: "Optimistic", value: AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC },
            { label: "Strict", value: AbstractMesh.OCCLUSION_TYPE_STRICT },
        ];

        let sortedMaterials = scene.materials.slice(0).sort((a, b) => (a.name || "no name").localeCompare(b.name || "no name"));

        var materialOptions = sortedMaterials.map((m, i) => {
            return {
                label: m.name || "no name",
                value: i
            };});

        materialOptions.splice(0, 0, {
            label: "None",
            value: -1
        });

        return (
            <div className="pane">
                <CustomPropertyGridComponent globalState={this.props.globalState} target={mesh}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="ID" value={mesh.id} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={mesh} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <TextLineComponent label="Unique ID" value={mesh.uniqueId.toString()} />
                    <TextLineComponent label="Class" value={mesh.getClassName()} />
                    <TextLineComponent label="Vertices" value={mesh.getTotalVertices().toString()} />
                    <TextLineComponent label="Faces" value={(mesh.getTotalIndices() / 3).toFixed(0)} />
                    <TextLineComponent label="Sub-meshes" value={mesh.subMeshes ? mesh.subMeshes.length.toString() : "0"} />
                    {
                        mesh.parent &&
                        <TextLineComponent label="Parent" value={mesh.parent.name} onLink={() => this.props.globalState.onSelectionChangedObservable.notifyObservers(mesh.parent)}/>
                    }
                    {
                        mesh.skeleton &&
                        <TextLineComponent label="Skeleton" value={mesh.skeleton.name} onLink={() => this.onSkeletonLink()}/>
                    }
                    <CheckBoxLineComponent label="Is enabled" isSelected={() => mesh.isEnabled()} onSelect={(value) => mesh.setEnabled(value)} />
                    <CheckBoxLineComponent label="Is pickable" target={mesh} propertyName="isPickable" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        mesh.material && (!mesh.material.reservedDataStore || !mesh.material.reservedDataStore.hidden) &&
                        <TextLineComponent label="Link to material" value={mesh.material.name} onLink={() => this.onMaterialLink()} />
                    }
                    {   !mesh.isAnInstance &&
                        <OptionsLineComponent label="Active material" options={materialOptions}
                            target={mesh} propertyName="material"
                            noDirectUpdate={true}
                            onSelect={(value: number) => {
                                if (value < 0) {
                                    mesh.material = null;
                                } else {
                                    mesh.material = sortedMaterials[value];
                                }

                                this.forceUpdate();
                            }}
                            extractValue={() => mesh.material ? sortedMaterials.indexOf(mesh.material) : -1}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        mesh.isAnInstance &&
                        <TextLineComponent label="Source" value={(mesh as any).sourceMesh.name} onLink={() => this.onSourceMeshLink()} />
                    }
                    <ButtonLineComponent label="Dispose" onClick={() => {
                        mesh.dispose();
                        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                    }} />
                </LineContainerComponent>
                <CommonPropertyGridComponent host={mesh} lockObject={this.props.lockObject} globalState={this.props.globalState} />
                <VariantsPropertyGridComponent host={mesh} lockObject={this.props.lockObject} globalState={this.props.globalState} />
                <LineContainerComponent globalState={this.props.globalState} title="TRANSFORMS">
                    <Vector3LineComponent label="Position" target={mesh} propertyName="position" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        !mesh.rotationQuaternion &&
                        <Vector3LineComponent label="Rotation" useEuler={this.props.globalState.onlyUseEulers} target={mesh} propertyName="rotation" step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        mesh.rotationQuaternion &&
                        <QuaternionLineComponent label="Rotation" useEuler={this.props.globalState.onlyUseEulers} target={mesh} propertyName="rotationQuaternion" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
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
                        mesh.isVerticesDataPresent(VertexBuffer.ColorKind) &&
                        <CheckBoxLineComponent label="Has vertex alpha" target={mesh} propertyName="hasVertexAlpha" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        scene.fogMode !== Scene.FOGMODE_NONE &&
                        <CheckBoxLineComponent label="Apply fog" target={mesh} propertyName="applyFog" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        !mesh.parent &&
                        <CheckBoxLineComponent label="Infinite distance" target={mesh} propertyName="infiniteDistance" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <SliderLineComponent label="Rendering group ID" decimalCount={0} target={mesh} propertyName="renderingGroupId" minimum={RenderingManager.MIN_RENDERINGGROUPS} maximum={RenderingManager.MAX_RENDERINGGROUPS - 1} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />                    
                    <HexLineComponent isInteger lockObject={this.props.lockObject} label="Layer mask" target={mesh} propertyName="layerMask" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                {
                    mesh.morphTargetManager != null &&
                    <LineContainerComponent globalState={this.props.globalState} title="MORPH TARGETS" closed={true}>
                        {
                            morphTargets.map((mt, i) => {
                                return (
                                    <SliderLineComponent key={i} label={mt.name} target={mt} propertyName="influence" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                                );
                            })
                        }
                    </LineContainerComponent>

                }
                <AnimationGridComponent globalState={this.props.globalState} animatable={mesh} scene={mesh.getScene()} lockObject={this.props.lockObject} />
                <LineContainerComponent globalState={this.props.globalState} title="ADVANCED" closed={true}>
                    {
                        mesh.useBones &&
                        <CheckBoxLineComponent label="Compute bones using shaders" target={mesh} propertyName="computeBonesUsingShaders" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
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
                {
                    mesh.physicsImpostor != null &&
                    <LineContainerComponent globalState={this.props.globalState} title="PHYSICS" closed={true}>
                        <FloatLineComponent lockObject={this.props.lockObject} label="Mass" target={mesh.physicsImpostor} propertyName="mass" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <FloatLineComponent lockObject={this.props.lockObject} label="Friction" target={mesh.physicsImpostor} propertyName="friction" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <FloatLineComponent lockObject={this.props.lockObject} label="Restitution" target={mesh.physicsImpostor} propertyName="restitution" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <TextLineComponent label="Type" value={this.convertPhysicsTypeToString()} />
                    </LineContainerComponent>
                }
                <LineContainerComponent globalState={this.props.globalState} title="OCCLUSIONS" closed={true}>
                    <OptionsLineComponent label="Type" options={occlusionTypeOptions} target={mesh} propertyName="occlusionType" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Retry count" minimum={-1} maximum={10} decimalCount={0} step={1} target={mesh} propertyName="occlusionRetryCount" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <OptionsLineComponent label="Algorithm" options={algorithmOptions} target={mesh} propertyName="occlusionQueryAlgorithmType" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="EDGE RENDERING" closed={true}>
                    <CheckBoxLineComponent label="Enable" target={mesh} isSelected={() => mesh.edgesRenderer != null} onSelect={(value) => {
                        if (value) {
                            mesh.enableEdgesRendering();
                        } else {
                            mesh.disableEdgesRendering();
                        }
                    }} />
                    <SliderLineComponent label="Edge width" minimum={0} maximum={10} step={0.1} target={mesh} propertyName="edgesWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color3LineComponent label="Edge color" target={mesh} propertyName="edgesColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                {
                        !mesh.isAnInstance &&
                    <LineContainerComponent globalState={this.props.globalState} title="OUTLINE & OVERLAY" closed={true}>
                        <CheckBoxLineComponent label="Render overlay" target={mesh} propertyName="renderOverlay" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <Color3LineComponent label="Overlay color" target={mesh} propertyName="overlayColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <CheckBoxLineComponent label="Render outline" target={mesh} propertyName="renderOutline" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <Color3LineComponent label="Outline color" target={mesh} propertyName="outlineColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    </LineContainerComponent>
                }
                <LineContainerComponent globalState={this.props.globalState} title="DEBUG" closed={true}>
                    {
                        !mesh.isAnInstance &&
                        <CheckBoxLineComponent label="Display normals" isSelected={() => displayNormals} onSelect={() => this.displayNormals()} />
                    }
                    {
                        !mesh.isAnInstance &&
                        <CheckBoxLineComponent label="Display vertex colors" isSelected={() => displayVertexColors} onSelect={() => this.displayVertexColors()} />
                    }
                    {
                        mesh.isVerticesDataPresent(VertexBuffer.NormalKind) &&
                        <CheckBoxLineComponent label="Render vertex normals" isSelected={() => renderNormalVectors} onSelect={() => this.renderNormalVectors()} />
                    }
                    {
                        !mesh.isAnInstance &&
                        <CheckBoxLineComponent label="Render wireframe over mesh" isSelected={() => renderWireframeOver} onSelect={() => this.renderWireframeOver()} />
                    }
                    {
                        !mesh.isAnInstance && mesh.skeleton &&
                        <CheckBoxLineComponent label="Display BoneWeights" isSelected={() => displayBoneWeights} onSelect={() => this.displayBoneWeights()} />
                    }
                    {
                        !mesh.isAnInstance && this.state.displayBoneWeights && mesh.skeleton &&
                        <SliderLineComponent label="Target Bone" decimalCount={0} target={mesh.reservedDataStore} propertyName="displayBoneIndex" minimum={0} maximum={mesh.skeleton.bones.length-1 || 0} step={1} onChange={(value)=>{this.onBoneDisplayIndexChange(value)}} />
                        
                    }
                    {
                        !mesh.isAnInstance && mesh.skeleton &&
                        <CheckBoxLineComponent label="Display SkeletonMap" isSelected={() => displaySkeletonMap } onSelect={() => this.displaySkeletonMap()} />
                    }                

                </LineContainerComponent>
            </div>
        );
    }
}