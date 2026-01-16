import type { FunctionComponent } from "react";

import type { AbstractMesh, ShaderMaterial } from "core/index";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import type { ISelectionService } from "../../../services/selectionService";

import { useState } from "react";

import { SkeletonViewer } from "core/Debug/skeletonViewer";
import { FrameGraphUtils } from "core/FrameGraph/frameGraphUtils";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3 } from "core/Maths/math.color";
import { TmpVectors, Vector3 } from "core/Maths/math.vector";
import { VertexBuffer } from "core/Meshes/buffer";
import { CreateLineSystem } from "core/Meshes/Builders/linesBuilder";
import { InstancedMesh } from "core/Meshes/instancedMesh";
import { Tools } from "core/Misc/tools";
import { RenderingManager } from "core/Rendering/renderingManager";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { Color3PropertyLine, Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { MaterialSelectorPropertyLine, NodeSelectorPropertyLine, SkeletonSelectorPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/entitySelectorPropertyLine";
import { Constants } from "core/Engines/constants";

// Ensures that the outlineRenderer and edgesRenderer properties exist on the prototype of the Mesh
import "core/Rendering/edgesRenderer";
import "core/Rendering/outlineRenderer";
import { HexPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/hexPropertyLine";

export const AbstractMeshGeneralProperties: FunctionComponent<{ mesh: AbstractMesh; selectionService: ISelectionService }> = (props) => {
    const { mesh, selectionService } = props;

    // Use the observable to keep keep state up-to-date and re-render the component when it changes.
    const isAnInstance = useProperty(mesh, "isAnInstance");
    // TODO: Handle case where array is mutated
    const subMeshes = useProperty(mesh, "subMeshes");

    return (
        <>
            <StringifiedPropertyLine label="Vertices" value={mesh.getTotalVertices()} />
            <StringifiedPropertyLine label="Faces" value={mesh.getTotalIndices() / 3} />
            <StringifiedPropertyLine label="Sub-Meshes" value={subMeshes.length} />
            <BoundProperty
                defaultValue={null}
                component={SkeletonSelectorPropertyLine}
                label="Skeleton"
                description="The skeleton associated with the mesh."
                target={mesh}
                propertyKey="skeleton"
                scene={mesh.getScene()}
                onLink={(skeleton) => (selectionService.selectedEntity = skeleton)}
            />
            {!mesh.isAnInstance && (
                <BoundProperty
                    defaultValue={null}
                    component={MaterialSelectorPropertyLine}
                    label="Material"
                    description="The material used by the mesh."
                    target={mesh}
                    propertyKey="material"
                    scene={mesh.getScene()}
                    onLink={(material) => (selectionService.selectedEntity = material)}
                />
            )}
            <BoundProperty component={SwitchPropertyLine} label="Is Pickable" target={mesh} propertyKey={"isPickable"} />
            {isAnInstance && mesh instanceof InstancedMesh && (
                <BoundProperty
                    component={NodeSelectorPropertyLine}
                    label="Source"
                    description="The source mesh from which this instance was created."
                    target={mesh}
                    propertyKey="sourceMesh"
                    scene={mesh.getScene()}
                    onLink={(node) => (selectionService.selectedEntity = node)}
                />
            )}
        </>
    );
};

export const AbstractMeshDisplayProperties: FunctionComponent<{ mesh: AbstractMesh }> = (props) => {
    const { mesh } = props;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Alpha Index" target={mesh} propertyKey="alphaIndex" />
            <BoundProperty component={SwitchPropertyLine} label="Receive Shadows" target={mesh} propertyKey="receiveShadows" />

            {mesh.isVerticesDataPresent(VertexBuffer.ColorKind) && (
                <>
                    <BoundProperty label="Use Vertex Colors" component={SwitchPropertyLine} target={mesh} propertyKey="useVertexColors" />
                    <BoundProperty label="Has Vertex Alpha" component={SwitchPropertyLine} target={mesh} propertyKey="hasVertexAlpha" />
                </>
            )}
            {mesh.getScene().fogMode !== Constants.FOGMODE_NONE && <BoundProperty label="Apply Fog" component={SwitchPropertyLine} target={mesh} propertyKey="applyFog" />}
            {!mesh.parent && <BoundProperty component={SwitchPropertyLine} label="Infinite distance" target={mesh} propertyKey="infiniteDistance" />}
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Rendering Group Id"
                target={mesh}
                propertyKey="renderingGroupId"
                min={RenderingManager.MIN_RENDERINGGROUPS}
                max={RenderingManager.MAX_RENDERINGGROUPS - 1}
                step={1}
            />
            <BoundProperty component={HexPropertyLine} label="Layer Mask" target={mesh} propertyKey="layerMask" />
        </>
    );
};

export const AbstractMeshAdvancedProperties: FunctionComponent<{ mesh: AbstractMesh }> = (props) => {
    const { mesh } = props;

    return (
        <>
            {mesh.useBones && (
                <BoundProperty
                    component={SwitchPropertyLine}
                    label="Compute Bones Using Shaders"
                    description="Whether to compute bones using shaders."
                    target={mesh}
                    propertyKey={"computeBonesUsingShaders"}
                />
            )}
            <BoundProperty component={SwitchPropertyLine} label="Check Collisions" description="Whether to check for collisions." target={mesh} propertyKey={"checkCollisions"} />
            <TextPropertyLine label="Geometry ID" value={mesh.geometry?.uniqueId.toString() ?? "N/A"} />
            <BooleanBadgePropertyLine label="Has Normals" value={mesh.isVerticesDataPresent(VertexBuffer.NormalKind)} />
            <BooleanBadgePropertyLine label="Has Vertex Colors" value={mesh.isVerticesDataPresent(VertexBuffer.ColorKind)} />
            <BooleanBadgePropertyLine label="Has UV Set 0" value={mesh.isVerticesDataPresent(VertexBuffer.UVKind)} />
            <BooleanBadgePropertyLine label="Has UV Set 1" value={mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)} />
            <BooleanBadgePropertyLine label="Has UV Set 2" value={mesh.isVerticesDataPresent(VertexBuffer.UV3Kind)} />
            <BooleanBadgePropertyLine label="Has UV Set 3" value={mesh.isVerticesDataPresent(VertexBuffer.UV4Kind)} />
            <BooleanBadgePropertyLine label="Has Tangents" value={mesh.isVerticesDataPresent(VertexBuffer.TangentKind)} />
            <BooleanBadgePropertyLine label="Has Matrix Weights" value={mesh.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind)} />
            <BooleanBadgePropertyLine label="Has Matrix Indices" value={mesh.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind)} />
        </>
    );
};

export const AbstractMeshOutlineOverlayProperties: FunctionComponent<{ mesh: AbstractMesh }> = (props) => {
    const { mesh } = props;

    const renderOverlay = useProperty(mesh, "renderOverlay");
    const renderOutline = useProperty(mesh, "renderOutline");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Render Overlay" target={mesh} propertyKey="renderOverlay" />
            <Collapse visible={renderOverlay}>
                <BoundProperty label="Overlay Color" component={Color3PropertyLine} target={mesh} propertyKey="overlayColor" />
            </Collapse>
            <BoundProperty component={SwitchPropertyLine} label="Render Outline" target={mesh} propertyKey="renderOutline" />
            <Collapse visible={renderOutline}>
                <BoundProperty label="Outline Color" component={Color3PropertyLine} target={mesh} propertyKey="outlineColor" />
                <BoundProperty label="Outline Width" component={NumberInputPropertyLine} target={mesh} propertyKey="outlineWidth" step={0.001} />
            </Collapse>
        </>
    );
};

const OcclusionTypes = [
    { label: "None", value: 0 },
    { label: "Optimistic", value: 1 },
    { label: "Strict", value: 2 },
] as const satisfies readonly DropdownOption<number>[];

const OcclusionQueryAlgorithmTypes = [
    { label: "Conservative", value: 0 },
    { label: "Accurate", value: 1 },
] as const satisfies readonly DropdownOption<number>[];

export const AbstractMeshOcclusionsProperties: FunctionComponent<{ mesh: AbstractMesh }> = ({ mesh }) => {
    const occlusionType = useProperty(mesh, "occlusionType");

    return (
        <>
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Type"
                description="Occlusion type for the mesh."
                target={mesh}
                propertyKey="occlusionType"
                options={OcclusionTypes}
            />
            <Collapse visible={occlusionType !== 0}>
                <>
                    <BoundProperty
                        component={NumberInputPropertyLine}
                        label="Occlusion Retry Count"
                        description="Number of retries for occlusion (-1 disables retries)."
                        target={mesh}
                        propertyKey="occlusionRetryCount"
                        min={-1}
                        max={10}
                        step={1}
                    />
                    <BoundProperty
                        component={NumberDropdownPropertyLine}
                        label="Algorithm"
                        description="Occlusion query algorithm type."
                        target={mesh}
                        propertyKey="occlusionQueryAlgorithmType"
                        options={OcclusionQueryAlgorithmTypes}
                    />
                </>
            </Collapse>
        </>
    );
};

export const AbstractMeshEdgeRenderingProperties: FunctionComponent<{ mesh: AbstractMesh }> = ({ mesh }) => {
    const edgesRenderer = useProperty(mesh, "_edgesRenderer");

    return (
        <>
            <SwitchPropertyLine
                label="Enable"
                value={!!edgesRenderer}
                onChange={(isEnabled: boolean) => {
                    if (isEnabled) {
                        mesh.enableEdgesRendering();
                    } else {
                        mesh.disableEdgesRendering();
                    }
                }}
            />
            <Collapse visible={!!edgesRenderer}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Edges Width"
                    description="Width of the rendered edges (0 to 10)."
                    target={mesh}
                    propertyKey="edgesWidth"
                    min={0}
                    max={10}
                    step={0.1}
                />
                <BoundProperty component={Color4PropertyLine} label="Edge Color" target={mesh} propertyKey="edgesColor" />
            </Collapse>
        </>
    );
};

export const AbstractMeshDebugProperties: FunctionComponent<{ mesh: AbstractMesh }> = (props) => {
    const { mesh } = props;

    const skeleton = useProperty(mesh, "skeleton");

    const [displayNormals, setDisplayNormals] = useState(mesh.material?.getClassName() === "NormalMaterial");
    const [displayVertexColors, setDisplayVertexColors] = useState(mesh.material?.reservedDataStore?.isVertexColorMaterial ? true : false);
    const [renderNormalVectors] = useState(mesh.reservedDataStore?.normalLines ? true : false);
    const [renderWireframeOver] = useState(mesh.reservedDataStore?.wireframeOver ? true : false);
    const [displayBoneWeights, setDisplayBoneWeights] = useState(mesh.material?.getClassName() === "BoneWeightShader");
    const [displaySkeletonMap, setDisplaySkeletonMap] = useState(mesh.material?.getClassName() === "SkeletonMapShader");
    const [displayBoneIndex, setDisplayBoneIndex] = useState(mesh.reservedDataStore?.displayBoneIndex ?? 0);

    const [targetBoneOptions] = useState<DropdownOption<number>[]>(
        mesh.skeleton
            ? mesh.skeleton.bones
                  .filter((bone) => bone.getIndex() >= 0)
                  .sort((bone1, bone2) => bone1.getIndex() - bone2.getIndex())
                  .map((bone) => {
                      return {
                          label: bone.name,
                          value: bone.getIndex(),
                      };
                  })
            : []
    );

    const displayNormalsHandlerAsync = async function () {
        const scene = mesh.getScene();

        if (mesh.material?.getClassName() === "NormalMaterial") {
            mesh.material.dispose();

            mesh.material = mesh.reservedDataStore.originalMaterial;
            mesh.reservedDataStore.originalMaterial = null;
            setDisplayNormals(false);
        } else {
            try {
                const { NormalMaterial } = await import("materials/normal/normalMaterial");

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

                setDisplayVertexColors(false);
                setDisplayBoneWeights(false);
                setDisplaySkeletonMap(false);
                setDisplayNormals(true);
            } catch {
                Tools.Warn("NormalMaterial could not be loaded.");
            }
        }
    };

    const displayVertexColorsHandler = function () {
        const scene = mesh.getScene();

        if (mesh.material?.reservedDataStore?.isVertexColorMaterial) {
            mesh.material.dispose();

            mesh.material = mesh.reservedDataStore.originalMaterial;
            mesh.reservedDataStore.originalMaterial = null;
            setDisplayVertexColors(false);
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

            setDisplayNormals(false);
            setDisplayBoneWeights(false);
            setDisplaySkeletonMap(false);
            setDisplayVertexColors(true);
        }
    };

    const renderNormalVectorsHandler = function () {
        const scene = mesh.getScene();

        if (mesh.reservedDataStore && mesh.reservedDataStore.normalLines) {
            mesh.reservedDataStore.normalLines.dispose();
            mesh.reservedDataStore.normalLines = null;

            return;
        }

        const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

        const color = Color3.White();
        const bbox = mesh.getBoundingInfo();
        const diag = bbox.maximum.subtractToRef(bbox.minimum, TmpVectors.Vector3[0]);
        const size = diag.length() * 0.05;

        const lines: [Vector3, Vector3][] = [];
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
    };

    const renderWireframeOverHandler = function () {
        const scene = mesh.getScene();

        if (mesh.reservedDataStore?.wireframeOver) {
            const frameGraph = scene.frameGraph;
            if (frameGraph) {
                const objectRenderer = FrameGraphUtils.FindMainObjectRenderer(frameGraph);
                if (objectRenderer && objectRenderer.objectList.meshes) {
                    const idx = objectRenderer.objectList.meshes.indexOf(mesh.reservedDataStore.wireframeOver);
                    if (idx !== -1) {
                        objectRenderer.objectList.meshes!.splice(idx, 1);
                    }
                }
            }

            mesh.reservedDataStore.wireframeOver.dispose(false, true);
            mesh.reservedDataStore.wireframeOver = null;

            return;
        }

        const wireframeOver = mesh.clone(mesh.name + "_wireframeover", null, true);
        if (wireframeOver === null) {
            return;
        }

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

        const frameGraph = scene.frameGraph;
        if (frameGraph) {
            const objectRenderer = FrameGraphUtils.FindMainObjectRenderer(frameGraph);
            if (objectRenderer && objectRenderer.objectList.meshes) {
                objectRenderer.objectList.meshes.push(wireframeOver);
            }
        }
    };

    const displayBoneWeightsHandler = function () {
        const scene = mesh.getScene();

        if (mesh.material?.getClassName() === "BoneWeightShader") {
            mesh.material.dispose();
            mesh.material = mesh.reservedDataStore.originalMaterial;
            mesh.reservedDataStore.originalMaterial = null;
            setDisplayBoneWeights(false);
        } else {
            if (!mesh.reservedDataStore) {
                mesh.reservedDataStore = {};
            }
            if (!mesh.reservedDataStore.originalMaterial) {
                mesh.reservedDataStore.originalMaterial = mesh.material;
            }
            if (!mesh.reservedDataStore.displayBoneIndex) {
                //mesh.reservedDataStore.displayBoneIndex = this.state.displayBoneIndex;
            }
            if (mesh.skeleton) {
                const boneWeightsShader = SkeletonViewer.CreateBoneWeightShader({ skeleton: mesh.skeleton }, scene);
                boneWeightsShader.reservedDataStore = { hidden: true };
                mesh.material = boneWeightsShader;
            }
            setDisplayNormals(false);
            setDisplayVertexColors(false);
            setDisplaySkeletonMap(false);
            setDisplayBoneWeights(true);
        }
    };

    const displaySkeletonMapHandler = function () {
        const scene = mesh.getScene();

        if (mesh.material?.getClassName() === "SkeletonMapShader") {
            mesh.material.dispose();
            mesh.material = mesh.reservedDataStore.originalMaterial;
            mesh.reservedDataStore.originalMaterial = null;
            setDisplaySkeletonMap(false);
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
            }
            setDisplayNormals(false);
            setDisplayVertexColors(false);
            setDisplayBoneWeights(false);
            setDisplaySkeletonMap(true);
        }
    };

    const onBoneDisplayIndexChangeHandler = function (value: number): void {
        mesh.reservedDataStore.displayBoneIndex = value;
        setDisplayBoneIndex(value);
        if (mesh.material && mesh.material.getClassName() === "BoneWeightShader") {
            (mesh.material as ShaderMaterial).setFloat("targetBoneIndex", value);
        }
    };

    return (
        <>
            <SwitchPropertyLine label="Display Normals" value={displayNormals} onChange={async () => await displayNormalsHandlerAsync()} />
            <SwitchPropertyLine label="Display Vertex Colors" value={displayVertexColors} onChange={() => displayVertexColorsHandler()} />
            <SwitchPropertyLine label="Render Vertex Normals" value={renderNormalVectors} onChange={() => renderNormalVectorsHandler()} />
            <SwitchPropertyLine label="Render Wireframe over Mesh" value={renderWireframeOver} onChange={() => renderWireframeOverHandler()} />
            {skeleton && <SwitchPropertyLine label="Display Bone Weights" value={displayBoneWeights} onChange={() => displayBoneWeightsHandler()} />}
            <Collapse visible={displayBoneWeights}>
                <div>
                    <NumberDropdownPropertyLine
                        label="Target Bone Name"
                        options={targetBoneOptions}
                        value={displayBoneIndex}
                        onChange={(value) => {
                            onBoneDisplayIndexChangeHandler(value);
                        }}
                    />
                    <SyncedSliderPropertyLine
                        label="Target Bone"
                        value={displayBoneIndex}
                        min={0}
                        max={targetBoneOptions.length - 1}
                        step={1}
                        onChange={(value) => onBoneDisplayIndexChangeHandler(value)}
                    />
                </div>
            </Collapse>
            {skeleton && <SwitchPropertyLine label="Display Skeleton Map" value={displaySkeletonMap} onChange={() => displaySkeletonMapHandler()} />}
        </>
    );
};
