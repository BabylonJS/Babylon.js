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

import { BoundProperty, ComputedProperty, DerivedProperty } from "../../../../components/properties/boundProperty";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { GetRenderingLayerDisplayName } from "../../../renderingLayerUtils";

const SpriteLayerDisplayNameGetters = new WeakMap<EngineContext, (layer: Sprite2DLayer) => string>();

function GetSpriteLayerDisplayNameGetter(engine: EngineContext): (layer: Sprite2DLayer) => string {
    let getter = SpriteLayerDisplayNameGetters.get(engine);
    if (!getter) {
        getter = (layer) => GetRenderingLayerDisplayName<Sprite2DLayer, SpriteRenderer>(engine, "sprite-renderer", layer, "Sprite Layer");
        SpriteLayerDisplayNameGetters.set(engine, getter);
    }
    return getter;
}

function GetSpriteCount(layer: Sprite2DLayer): number {
    return layer.count;
}

function GetViewPositionX(layer: Sprite2DLayer): number {
    return layer.view.positionPx[0];
}

function SetViewPositionX(layer: Sprite2DLayer, value: number): void {
    layer.view.positionPx[0] = value;
}

function GetViewPositionY(layer: Sprite2DLayer): number {
    return layer.view.positionPx[1];
}

function SetViewPositionY(layer: Sprite2DLayer, value: number): void {
    layer.view.positionPx[1] = value;
}

function GetViewPosition(layer: Sprite2DLayer): Sprite2DLayer["view"]["positionPx"] {
    return layer.view.positionPx;
}

function GetViewZoom(layer: Sprite2DLayer): number {
    return layer.view.zoom;
}

function SetViewZoom(layer: Sprite2DLayer, value: number): void {
    layer.view.zoom = value;
}

function IsNonZero(value: number): boolean {
    return value !== 0;
}

function GetView(layer: Sprite2DLayer): Sprite2DLayer["view"] {
    return layer.view;
}

function GetViewRotation(layer: Sprite2DLayer): number {
    return layer.view.rotation;
}

function SetViewRotation(layer: Sprite2DLayer, value: number): void {
    layer.view.rotation = value;
}

function GetPivotX(layer: Sprite2DLayer): number {
    return layer.pivot[0];
}

function SetPivotX(layer: Sprite2DLayer, value: number): void {
    layer.pivot[0] = value;
}

function GetPivotY(layer: Sprite2DLayer): number {
    return layer.pivot[1];
}

function SetPivotY(layer: Sprite2DLayer, value: number): void {
    layer.pivot[1] = value;
}

function GetPivot(layer: Sprite2DLayer): Sprite2DLayer["pivot"] {
    return layer.pivot;
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
            <ComputedProperty component={TextPropertyLine} label="Name" target={layer} getValue={GetSpriteLayerDisplayNameGetter(engine)} />
            <BoundProperty component={SwitchPropertyLine} label="Visible" target={layer} propertyKey="visible" />
            <BoundProperty component={NumberInputPropertyLine} label="Order" target={layer} propertyKey="order" />
            <BoundProperty component={NumberInputPropertyLine} label="Opacity" target={layer} propertyKey="opacity" min={0} max={1} step={0.01} />
            <ComputedProperty component={StringifiedPropertyLine} label="Sprite Count" target={layer} getValue={GetSpriteCount} />
            <TextPropertyLine label="Depth Mode" value={layer.depth} />
            <TextPropertyLine label="Blend Mode" value={GetSpriteBlendModeName(layer.blendMode)} />
            <DerivedProperty
                component={NumberInputPropertyLine}
                label="View Position X"
                target={layer}
                getValue={GetViewPositionX}
                setValue={SetViewPositionX}
                propertyPath="view.positionPx[0]"
                getPropertyOwner={GetViewPosition}
                propertyKey={0}
                step={1}
                unit="px"
            />
            <DerivedProperty
                component={NumberInputPropertyLine}
                label="View Position Y"
                target={layer}
                getValue={GetViewPositionY}
                setValue={SetViewPositionY}
                propertyPath="view.positionPx[1]"
                getPropertyOwner={GetViewPosition}
                propertyKey={1}
                step={1}
                unit="px"
            />
            <DerivedProperty
                component={NumberInputPropertyLine}
                label="View Zoom"
                target={layer}
                getValue={GetViewZoom}
                setValue={SetViewZoom}
                propertyPath="view.zoom"
                getPropertyOwner={GetView}
                propertyKey="zoom"
                validator={IsNonZero}
                step={0.1}
            />
            <DerivedProperty
                component={NumberInputPropertyLine}
                label="View Rotation"
                target={layer}
                getValue={GetViewRotation}
                setValue={SetViewRotation}
                propertyPath="view.rotation"
                getPropertyOwner={GetView}
                propertyKey="rotation"
                step={0.01}
                unit="rad"
            />
            <DerivedProperty
                component={NumberInputPropertyLine}
                label="Pivot X"
                target={layer}
                getValue={GetPivotX}
                setValue={SetPivotX}
                propertyPath="pivot[0]"
                getPropertyOwner={GetPivot}
                propertyKey={0}
                min={0}
                max={1}
                step={0.01}
            />
            <DerivedProperty
                component={NumberInputPropertyLine}
                label="Pivot Y"
                target={layer}
                getValue={GetPivotY}
                setValue={SetPivotY}
                propertyPath="pivot[1]"
                getPropertyOwner={GetPivot}
                propertyKey={1}
                min={0}
                max={1}
                step={0.01}
            />
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
