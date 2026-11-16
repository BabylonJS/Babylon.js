import {
    billboardBlendAdditive,
    billboardBlendAlpha,
    billboardBlendCutout,
    billboardBlendPremultiplied,
    type BillboardBlendMode,
    type BillboardSpriteSystem,
    type TextRenderable,
} from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { BoundProperty, ComputedProperty } from "../../../../components/properties/boundProperty";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { SceneNodeTransformProperties } from "../../../components/properties/sceneNodeProperties";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { IsSceneBillboardSystem, IsSceneTextRenderable } from "../../../sceneRenderableUtils";

const TextProperties: FunctionComponent<{ text: TextRenderable }> = (props) => {
    const { text } = props;
    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} label="Opacity" target={text} propertyKey="opacity" min={0} max={1} step={0.01} />
            <TextPropertyLine label="Ignore Depth" value={text.ignoreDepth ? "True" : "False"} />
            <TextPropertyLine label="Order" value={text.order.toString()} />
        </>
    );
};

function GetBillboardCount(system: BillboardSpriteSystem): number {
    return system.count;
}

function GetBillboardBlendModeName(mode: BillboardBlendMode): string {
    switch (mode) {
        case billboardBlendAlpha:
            return "Alpha";
        case billboardBlendPremultiplied:
            return "Premultiplied";
        case billboardBlendAdditive:
            return "Additive";
        case billboardBlendCutout:
            return "Cutout";
        default:
            return "Unsupported descriptor";
    }
}

const BillboardProperties: FunctionComponent<{ system: BillboardSpriteSystem }> = (props) => {
    const { system } = props;
    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Visible" target={system} propertyKey="visible" />
            <BoundProperty component={NumberInputPropertyLine} label="Opacity" target={system} propertyKey="opacity" min={0} max={1} step={0.01} />
            <TextPropertyLine label="Blend Mode" value={GetBillboardBlendModeName(system.blendMode)} />
            {system.blendMode === billboardBlendCutout && (
                <BoundProperty component={NumberInputPropertyLine} label="Alpha Cutoff" target={system} propertyKey="alphaCutoff" min={0} max={1} step={0.01} />
            )}
            <ComputedProperty component={StringifiedPropertyLine} label="Sprite Count" target={system} getValue={GetBillboardCount} />
            <TextPropertyLine label="Orientation" value={system.orientation} />
            {system.orientation === "axis-locked" && <TextPropertyLine label="Axis" value={system.axis.join(", ")} />}
            <TextPropertyLine label="Order" value={system.order.toString()} />
            <TextPropertyLine label="Atlas Frames" value={system.atlas.frames.length.toString()} />
            <TextPropertyLine label="Atlas Size" value={`${system.atlas.textureSizePx[0]} x ${system.atlas.textureSizePx[1]} px`} />
            <TextPropertyLine label="Premultiplied Alpha" value={system.atlas.premultipliedAlpha ? "True" : "False"} />
        </>
    );
};

export const SceneRenderablePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext]> = {
    friendlyName: "Babylon Lite Scene Renderable Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity],
    factory: (properties, engineContext) => {
        const text = properties.addSectionContent({
            key: "Babylon Lite Text Renderable Properties",
            predicate: (entity): entity is TextRenderable => IsSceneTextRenderable(engineContext.engine, entity),
            content: [
                { section: "General", component: ({ context }) => <TextProperties text={context} /> },
                { section: "Transform", component: ({ context }) => <SceneNodeTransformProperties node={context} /> },
            ],
        });
        const billboard = properties.addSectionContent({
            key: "Babylon Lite Billboard Properties",
            predicate: (entity): entity is BillboardSpriteSystem => IsSceneBillboardSystem(engineContext.engine, entity),
            content: [{ section: "General", component: ({ context }) => <BillboardProperties system={context} /> }],
        });
        return {
            dispose: () => {
                text.dispose();
                billboard.dispose();
            },
        };
    },
};
