import type { FunctionComponent } from "react";

import { Color3, CreateLineSystem, FrameGraphUtils, StandardMaterial, TmpVectors, Tools, Vector3, VertexBuffer, type AbstractMesh, type Scene } from "core/index";
import { NormalMaterial } from "materials/normal/normalMaterial";

import type { ISelectionService } from "../../../services/selectionService";

import { Collapse } from "@fluentui/react-motion-components-preview";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { useColor3Property, useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty } from "../boundProperty";

// Ensures that the outlineRenderer properties exist on the prototype of the Mesh
import "core/Rendering/outlineRenderer";

const DisplayNormals = function (mesh: AbstractMesh) {
    const scene = mesh.getScene();

    if (mesh.material && mesh.material.getClassName() === "NormalMaterial") {
        mesh.material.dispose();

        mesh.material = mesh.reservedDataStore.originalMaterial;
        mesh.reservedDataStore.originalMaterial = null;
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
    }
};

const DisplayVertexColors = function (mesh: AbstractMesh) {
    const scene = mesh.getScene();

    if (mesh.material && mesh.material.reservedDataStore && mesh.material.reservedDataStore.isVertexColorMaterial) {
        mesh.material.dispose();

        mesh.material = mesh.reservedDataStore.originalMaterial;
        mesh.reservedDataStore.originalMaterial = null;
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
    }
};

const RenderNormalVectors = function (mesh: AbstractMesh) {
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
};

const RenderWireframeOver = function (mesh: AbstractMesh) {
    const scene = mesh.getScene();

    if (mesh.reservedDataStore && mesh.reservedDataStore.wireframeOver) {
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

export const AbstractMeshGeneralProperties: FunctionComponent<{ mesh: AbstractMesh; selectionService: ISelectionService }> = (props) => {
    const { mesh, selectionService } = props;

    // Use the observable to keep keep state up-to-date and re-render the component when it changes.
    const material = useObservableState(() => mesh.material, mesh.onMaterialChangedObservable);

    return (
        <>
            {material && !material.reservedDataStore?.hidden && (
                <LinkPropertyLine
                    key="Material"
                    label="Material"
                    description={`The material used by the mesh.`}
                    value={material.name}
                    onLink={() => (selectionService.selectedEntity = material)}
                />
            )}
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
        </>
    );
};

export const AbstractMeshOutlineOverlayProperties: FunctionComponent<{ mesh: AbstractMesh }> = (props) => {
    const { mesh } = props;

    const renderOverlay = useProperty(mesh, "renderOverlay");
    const overlayColor = useColor3Property(mesh, "overlayColor");
    const renderOutline = useProperty(mesh, "renderOutline");
    const outlineColor = useColor3Property(mesh, "outlineColor");

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Render Overlay" target={mesh} propertyKey={"renderOverlay"} />
            <Collapse visible={renderOverlay}>
                <Color3PropertyLine
                    key="OverlayColor"
                    label="Overlay Color"
                    value={overlayColor}
                    onChange={(color) => {
                        mesh.overlayColor = color;
                    }}
                />
            </Collapse>
            <BoundProperty component={SwitchPropertyLine} label="Render Outline" target={mesh} propertyKey={"renderOutline"} />
            <Collapse visible={renderOutline}>
                <Color3PropertyLine
                    key="OutlineColor"
                    label="Outline Color"
                    value={outlineColor}
                    onChange={(color) => {
                        mesh.outlineColor = color;
                    }}
                />
            </Collapse>
        </>
    );
};

export const AbstractMeshDebugProperties: FunctionComponent<{ mesh: AbstractMesh }> = (props) => {
    const { mesh } = props;

    const displayNormals = mesh.material != null && mesh.material.getClassName() === "NormalMaterial";
    const displayVertexColors = !!(mesh.material != null && mesh.material.reservedDataStore && mesh.material.reservedDataStore.isVertexColorMaterial);
    const renderNormalVectors = mesh.reservedDataStore && mesh.reservedDataStore.normalLines ? true : false;
    const renderWireframeOver = mesh.reservedDataStore && mesh.reservedDataStore.wireframeOver ? true : false;

    return (
        <>
            <SwitchPropertyLine
                label="Display normals"
                description="Displays the normals for each face of the mesh."
                value={displayNormals}
                onChange={() => DisplayNormals(mesh)}
            />
            <SwitchPropertyLine
                label="Display vertex colors"
                description="Displays the colors for each vertex of the mesh."
                value={displayVertexColors}
                onChange={() => DisplayVertexColors(mesh)}
            />
            <SwitchPropertyLine
                label="Render vertex normals"
                description="Renders the vertex normals for the mesh."
                value={renderNormalVectors}
                onChange={() => RenderNormalVectors(mesh)}
            />
            <SwitchPropertyLine
                label="Render wireframe over mesh"
                description="Display the mesh wireframe over itself."
                value={renderWireframeOver}
                onChange={() => RenderWireframeOver(mesh)}
            />
        </>
    );
};
