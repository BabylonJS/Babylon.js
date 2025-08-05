import type { FunctionComponent } from "react";
import { useState } from "react";

import type { AbstractMesh } from "core/index";
import type { ISelectionService } from "../../../services/selectionService";

import { makeStyles } from "@fluentui/react-components";
import { Collapse } from "@fluentui/react-motion-components-preview";

import { Color3PropertyLine, Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { useColor3Property, useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty } from "../boundProperty";

// Ensures that the outlineRenderer properties exist on the prototype of the Mesh
import "core/Rendering/outlineRenderer";
import "core/Rendering/edgesRenderer";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";

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

const OcclusionTypes = [
    { label: "None", value: 0 },
    { label: "Optimistic", value: 1 },
    { label: "Strict", value: 2 },
] as const;

const OcclusionQueryAlgorithmTypes = [
    { label: "Conservative", value: 0 },
    { label: "Accurate", value: 1 },
] as const;

export const AbstractMeshOcclusionsProperties: FunctionComponent<{ mesh: AbstractMesh }> = ({ mesh }) => (
    <>
        <BoundProperty
            component={NumberDropdownPropertyLine}
            label="Type"
            description="Occlusion type for the mesh."
            target={mesh}
            propertyKey="occlusionType"
            options={OcclusionTypes}
        />
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
);

const useStyles = makeStyles({
    contentDiv: {
        overflow: "hidden",
    },
});

export const AbstractMeshEdgeRenderingProperties: FunctionComponent<{ mesh: AbstractMesh }> = ({ mesh }) => {
    const classes = useStyles();
    // Track enabled state locally to trigger re-render
    const [enabled, setEnabled] = useState(mesh.edgesRenderingEnabled());

    return (
        <>
            <SwitchPropertyLine
                label="Enable"
                value={enabled}
                onChange={(isEnabled: boolean) => {
                    if (isEnabled) {
                        mesh.enableEdgesRendering();
                    } else {
                        mesh.disableEdgesRendering();
                    }
                    setEnabled(mesh.edgesRenderingEnabled());
                }}
            />
            <Collapse visible={enabled}>
                <div className={classes.contentDiv}>
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
                    <Color4PropertyLine
                        label="Edge Color"
                        value={mesh.edgesColor}
                        onChange={(color) => {
                            mesh.edgesColor = color;
                        }}
                    />
                </div>
            </Collapse>
        </>
    );
};
