import type { Mesh } from "core/index";

import type { FunctionComponent } from "react";

import { Collapse } from "@fluentui/react-motion-components-preview";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { useColor3Property, useProperty } from "../../hooks/compoundPropertyHooks";
import { BoundProperty } from "./boundProperty";

// Ensures that the outlineRenderer properties exist on the prototype of the Mesh
import "core/Rendering/outlineRenderer";

export const MeshOutlineOverlayProperties: FunctionComponent<{ mesh: Mesh }> = (props) => {
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
