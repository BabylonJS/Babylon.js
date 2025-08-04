import type { FunctionComponent } from "react";

import { VertexBuffer } from "core/Meshes/buffer";
import { RenderingManager } from "core/Rendering/renderingManager";

import { Collapse } from "@fluentui/react-motion-components-preview";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { PlaceholderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";

import type { ISelectionService } from "../../../services/selectionService";
import { useColor3Property, useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty } from "../boundProperty";

// Ensures that the outlineRenderer properties exist on the prototype of the Mesh
import "core/Rendering/outlineRenderer";
import { LinkToNodePropertyLine } from "../linkToNodePropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { InstancedMesh } from "core/Meshes/instancedMesh";

export const AbstractMeshGeneralProperties: FunctionComponent<{ mesh: AbstractMesh; selectionService: ISelectionService }> = (props) => {
    const { mesh, selectionService } = props;

    // Use the observable to keep keep state up-to-date and re-render the component when it changes.
    const material = useObservableState(() => mesh.material, mesh.onMaterialChangedObservable);
    const skeleton = useProperty(mesh, "skeleton");
    const isAnInstance = useProperty(mesh, "isAnInstance");
    // TODO: Handle case where array is mutated
    const subMeshes = useProperty(mesh, "subMeshes");

    return (
        <>
            <StringifiedPropertyLine label="Vertices" value={mesh.getTotalVertices()} />
            <StringifiedPropertyLine label="Faces" value={mesh.getTotalIndices() / 3} />
            <StringifiedPropertyLine label="Sub-Meshes" value={subMeshes.length} />
            <LinkToNodePropertyLine label="Skeleton" description="The skeleton associated with the mesh." node={skeleton} selectionService={selectionService} />
            <LinkToNodePropertyLine label="Material" description="The material used by the mesh." node={material} selectionService={selectionService} />
            <BoundProperty component={SwitchPropertyLine} label="Is Pickable" target={mesh} propertyKey={"isPickable"} />
            {isAnInstance && mesh instanceof InstancedMesh && (
                <LinkToNodePropertyLine
                    label="Source"
                    description="The source mesh from which this instance was created."
                    node={mesh.sourceMesh}
                    selectionService={selectionService}
                />
            )}
            <ButtonLine label="Dispose" onClick={() => mesh.dispose()} />
        </>
    );
};

export const AbstractMeshDisplayProperties: FunctionComponent<{ mesh: AbstractMesh }> = (props) => {
    const { mesh } = props;

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Alpha Index" target={mesh} propertyKey="alphaIndex" />
            <BoundProperty component={SwitchPropertyLine} label="Receive Shadows" target={mesh} propertyKey="receiveShadows" />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Rendering Group Id"
                target={mesh}
                propertyKey="renderingGroupId"
                min={RenderingManager.MIN_RENDERINGGROUPS}
                max={RenderingManager.MAX_RENDERINGGROUPS - 1}
                step={1}
            />
            {/* TODO: Placeholder should be a hex property line */}
            <BoundProperty component={PlaceholderPropertyLine} label="TODO: Layer Mask" target={mesh} propertyKey="layerMask" />
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
