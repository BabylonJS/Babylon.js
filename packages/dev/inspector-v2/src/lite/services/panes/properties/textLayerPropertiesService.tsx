import { getRenderingContextKind, getRenderingContexts, type EngineContext, type TextLayer, type TextRenderer } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { BoundProperty, ComputedProperty } from "../../../../components/properties/boundProperty";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { GetRenderingLayerDisplayName } from "../../../renderingLayerUtils";

function GetRunCount(layer: TextLayer): number {
    return layer.data.runs.length;
}

function GetGlyphCount(layer: TextLayer): number {
    return layer.data.runs.reduce((count, run) => count + run.glyphs.length, 0);
}

function IsRegisteredTextLayer(engine: EngineContext, entity: unknown): entity is TextLayer {
    if (typeof entity !== "object" || entity === null) {
        return false;
    }

    return engine.surfaces.some((surface) =>
        getRenderingContexts(surface).some((context) => getRenderingContextKind(context) === "text-renderer" && (context as TextRenderer).layers.includes(entity as TextLayer))
    );
}

const TextLayerProperties: FunctionComponent<{ engine: EngineContext; layer: TextLayer }> = (props) => {
    const { engine, layer } = props;

    return (
        <>
            <ComputedProperty
                component={TextPropertyLine}
                label="Name"
                target={layer}
                getValue={(target) => GetRenderingLayerDisplayName<TextLayer, TextRenderer>(engine, "text-renderer", target, "Text Layer")}
            />
            <BoundProperty component={SwitchPropertyLine} label="Visible" target={layer} propertyKey="visible" />
            <BoundProperty component={NumberInputPropertyLine} label="Position X" target={layer.positionPx} propertyKey="x" propertyPath="positionPx.x" step={1} unit="px" />
            <BoundProperty component={NumberInputPropertyLine} label="Position Y" target={layer.positionPx} propertyKey="y" propertyPath="positionPx.y" step={1} unit="px" />
            <BoundProperty component={NumberInputPropertyLine} label="Rotation" target={layer} propertyKey="rotationRad" step={0.01} unit="rad" />
            <BoundProperty component={NumberInputPropertyLine} label="Scale" target={layer} propertyKey="scale" step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="Order" target={layer} propertyKey="order" />
            <BoundProperty component={NumberInputPropertyLine} label="Opacity" target={layer} propertyKey="opacity" min={0} max={1} step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="Coverage Gamma" target={layer} propertyKey="coverageGamma" step={0.1} />
            <ComputedProperty component={StringifiedPropertyLine} label="Run Count" target={layer} getValue={GetRunCount} />
            <ComputedProperty component={StringifiedPropertyLine} label="Glyph Count" target={layer} getValue={GetGlyphCount} />
        </>
    );
};

export const TextLayerPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext]> = {
    friendlyName: "Babylon Lite Text Layer Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity],
    factory: (propertiesService, engineContext) =>
        propertiesService.addSectionContent({
            key: "Babylon Lite Text Layer Properties",
            predicate: (entity: unknown): entity is TextLayer => IsRegisteredTextLayer(engineContext.engine, entity),
            content: [
                {
                    section: "General",
                    component: ({ context }) => <TextLayerProperties engine={engineContext.engine} layer={context} />,
                },
            ],
        }),
};
