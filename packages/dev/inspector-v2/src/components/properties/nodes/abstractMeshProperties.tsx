import type { FunctionComponent } from "react";

import type { AbstractMesh } from "core/index";

import { RenderingManager } from "core/Rendering/renderingManager";

import type { ISelectionService } from "../../../services/selectionService";

import { Collapse } from "@fluentui/react-motion-components-preview";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { PlaceholderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { useColor3Property, useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty } from "../boundProperty";

// Ensures that the outlineRenderer properties exist on the prototype of the Mesh
import "core/Rendering/outlineRenderer";

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
