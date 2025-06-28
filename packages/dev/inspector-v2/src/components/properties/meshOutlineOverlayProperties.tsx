import type { Mesh } from "core/index";

import type { FunctionComponent } from "react";

import { Collapse } from "@fluentui/react-motion-components-preview";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { useColor3Property } from "../../hooks/compoundPropertyHooks";
import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";

// Ensures that the outlineRenderer properties exist on the prototype of the Mesh
import "core/Rendering/outlineRenderer";

export const MeshOutlineOverlayProperties: FunctionComponent<{ mesh: Mesh }> = (props) => {
    const { mesh } = props;

    // There is no observable for colors, so we use an interceptor to listen for changes.
    const renderOverlay = useObservableState(() => mesh.renderOverlay, useInterceptObservable("property", mesh, "renderOverlay"));
    const overlayColor = useColor3Property(mesh, "overlayColor");

    const renderOutline = useObservableState(() => mesh.renderOutline, useInterceptObservable("property", mesh, "renderOutline"));
    const outlineColor = useColor3Property(mesh, "outlineColor");

    return (
        <>
            <SwitchPropertyLine key="RenderOverlay" label="Render Overlay" value={renderOverlay} onChange={(checked) => (mesh.renderOverlay = checked)} />
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
            <SwitchPropertyLine key="RenderOutline" label="Render Outline" value={renderOutline} onChange={(checked) => (mesh.renderOutline = checked)} />
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
