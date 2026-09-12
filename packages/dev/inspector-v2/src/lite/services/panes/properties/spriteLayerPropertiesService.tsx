import {
    getRenderingContextKind,
    getRenderingContexts,
    spriteBlendAdditive,
    spriteBlendAlpha,
    spriteBlendMultiply,
    spriteBlendOneOne,
    spriteBlendOpaque,
    spriteBlendPremultiplied,
    type EngineContext,
    type Sprite2DLayer,
    type SpriteBlendMode,
    type SpriteRenderer,
} from "@babylonjs/lite";
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

function GetSpriteCount(layer: Sprite2DLayer): number {
    return layer.count;
}

function GetSpriteBlendModeName(blendMode: SpriteBlendMode): string {
    switch (blendMode) {
        case spriteBlendAlpha:
            return "Alpha";
        case spriteBlendPremultiplied:
            return "Premultiplied";
        case spriteBlendAdditive:
            return "Additive";
        case spriteBlendMultiply:
            return "Multiply";
        case spriteBlendOneOne:
            return "One-One";
        case spriteBlendOpaque:
            return "Opaque";
        default:
            return "Unsupported descriptor";
    }
}

function IsRegisteredSpriteLayer(engine: EngineContext, entity: unknown): entity is Sprite2DLayer {
    if (typeof entity !== "object" || entity === null) {
        return false;
    }

    return engine.surfaces.some((surface) =>
        getRenderingContexts(surface).some(
            (context) => getRenderingContextKind(context) === "sprite-renderer" && (context as SpriteRenderer).layers.includes(entity as Sprite2DLayer)
        )
    );
}

const SpriteLayerProperties: FunctionComponent<{ engine: EngineContext; layer: Sprite2DLayer }> = (props) => {
    const { engine, layer } = props;

    return (
        <>
            <ComputedProperty
                component={TextPropertyLine}
                label="Name"
                target={layer}
                getValue={(target) => GetRenderingLayerDisplayName<Sprite2DLayer, SpriteRenderer>(engine, "sprite-renderer", target, "Sprite Layer")}
            />
            <BoundProperty component={SwitchPropertyLine} label="Visible" target={layer} propertyKey="visible" />
            <BoundProperty component={NumberInputPropertyLine} label="Order" target={layer} propertyKey="order" />
            <BoundProperty component={NumberInputPropertyLine} label="Opacity" target={layer} propertyKey="opacity" min={0} max={1} step={0.01} />
            <ComputedProperty component={StringifiedPropertyLine} label="Sprite Count" target={layer} getValue={GetSpriteCount} />
            <TextPropertyLine label="Depth Mode" value={layer.depth} />
            <TextPropertyLine label="Blend Mode" value={GetSpriteBlendModeName(layer.blendMode)} />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="View Position X"
                target={layer.view.positionPx}
                propertyKey={0}
                propertyPath="view.positionPx[0]"
                step={1}
                unit="px"
            />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="View Position Y"
                target={layer.view.positionPx}
                propertyKey={1}
                propertyPath="view.positionPx[1]"
                step={1}
                unit="px"
            />
            <BoundProperty component={NumberInputPropertyLine} label="View Zoom" target={layer.view} propertyKey="zoom" min={0} step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} label="View Rotation" target={layer.view} propertyKey="rotation" step={0.01} unit="rad" />
            <BoundProperty component={NumberInputPropertyLine} label="Pivot X" target={layer.pivot} propertyKey={0} propertyPath="pivot[0]" min={0} max={1} step={0.01} />
            <BoundProperty component={NumberInputPropertyLine} label="Pivot Y" target={layer.pivot} propertyKey={1} propertyPath="pivot[1]" min={0} max={1} step={0.01} />
            <TextPropertyLine label="Default Depth" value="Not applicable to renderer-owned layers." />
            <TextPropertyLine label="Atlas Frames" value={layer.atlas.frames.length.toString()} />
            <TextPropertyLine label="Atlas Size" value={`${layer.atlas.textureSizePx[0]} x ${layer.atlas.textureSizePx[1]} px`} />
            <TextPropertyLine label="Premultiplied Alpha" value={layer.atlas.premultipliedAlpha ? "True" : "False"} />
        </>
    );
};

export const SpriteLayerPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext]> = {
    friendlyName: "Babylon Lite Sprite Layer Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity],
    factory: (propertiesService, engineContext) =>
        propertiesService.addSectionContent({
            key: "Babylon Lite Sprite Layer Properties",
            predicate: (entity: unknown): entity is Sprite2DLayer => IsRegisteredSpriteLayer(engineContext.engine, entity),
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SpriteLayerProperties engine={engineContext.engine} layer={context} />,
                },
            ],
        }),
};
