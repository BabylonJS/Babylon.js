import {
    getRenderingContextKind,
    getRenderingContexts,
    type EngineContext,
    type RenderingContext,
    type SceneContext,
    type SpriteRenderer,
    type TextRenderer,
} from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { BoundProperty } from "../../../../components/properties/boundProperty";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";

function IsRegisteredRenderingContext(engine: EngineContext, entity: unknown): entity is RenderingContext {
    return typeof entity === "object" && entity !== null && engine.surfaces.some((surface) => getRenderingContexts(surface).includes(entity as RenderingContext));
}

const SceneProperties: FunctionComponent<{ scene: SceneContext }> = (props) => {
    const { scene } = props;

    return (
        <>
            <StringifiedPropertyLine label="Mesh Count" value={scene.meshes.length} />
            <StringifiedPropertyLine label="Light Count" value={scene.lights.length} />
            <StringifiedPropertyLine label="Animation Group Count" value={scene.animationGroups.length} />
            <StringifiedPropertyLine label="Shadow Generator Count" value={scene.shadowGenerators.length} />
            <BoundProperty component={NumberInputPropertyLine} label="Fixed Delta (ms)" target={scene} propertyKey="fixedDeltaMs" min={0} step={1} />
        </>
    );
};

const TextRendererProperties: FunctionComponent<{ renderer: TextRenderer }> = (props) => {
    const { renderer } = props;

    return <StringifiedPropertyLine label="Layer Count" value={renderer.layers.length} />;
};

const SpriteRendererProperties: FunctionComponent<{ renderer: SpriteRenderer }> = (props) => {
    const { renderer } = props;

    return <StringifiedPropertyLine label="Layer Count" value={renderer.layers.length} />;
};

export const RenderingContextPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext]> = {
    friendlyName: "Babylon Lite Rendering Context Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity],
    factory: (propertiesService, engineContext) => {
        const engine = engineContext.engine;
        const sceneRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Scene Properties",
            predicate: (entity: unknown): entity is SceneContext => {
                if (!IsRegisteredRenderingContext(engine, entity)) {
                    return false;
                }
                const kind = getRenderingContextKind(entity);
                return kind === "scene" || kind === "utility-layer";
            },
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SceneProperties scene={context} />,
                },
            ],
        });
        const textRendererRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Text Renderer Properties",
            predicate: (entity: unknown): entity is TextRenderer => IsRegisteredRenderingContext(engine, entity) && getRenderingContextKind(entity) === "text-renderer",
            content: [
                {
                    section: "General",
                    component: ({ context }) => <TextRendererProperties renderer={context} />,
                },
            ],
        });
        const spriteRendererRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Sprite Renderer Properties",
            predicate: (entity: unknown): entity is SpriteRenderer => IsRegisteredRenderingContext(engine, entity) && getRenderingContextKind(entity) === "sprite-renderer",
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SpriteRendererProperties renderer={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                sceneRegistration.dispose();
                textRendererRegistration.dispose();
                spriteRendererRegistration.dispose();
            },
        };
    },
};
