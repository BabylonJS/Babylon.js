// eslint-disable-next-line import/no-internal-modules
import type { Color3, Mesh } from "core/index";

import type { FunctionComponent } from "react";

import { Collapse } from "@fluentui/react-motion-components-preview";

import { Color3PropertyLine } from "shared-ui-components/fluent/hoc/colorPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";

// Ensures that the outlineRenderer properties exist on the prototype of the Mesh
import "core/Rendering/outlineRenderer";

type Color3Keys<T> = { [P in keyof T]: T[P] extends Color3 ? P : never }[keyof T];

// eslint-disable-next-line @typescript-eslint/naming-convention
function useColor3Property<T extends object, K extends Color3Keys<T>>(target: T, propertyKey: K): Color3 {
    const color = useObservableState(() => target[propertyKey] as Color3, useInterceptObservable("property", target, propertyKey));
    useObservableState(() => color.r, useInterceptObservable("property", color, "r"));
    useObservableState(() => color.g, useInterceptObservable("property", color, "g"));
    useObservableState(() => color.b, useInterceptObservable("property", color, "b"));
    return color;
}

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
