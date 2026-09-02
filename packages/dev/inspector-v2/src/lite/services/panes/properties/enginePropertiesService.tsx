import { type EngineContext, type SurfaceContext } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { BoundProperty } from "../../../../components/properties/boundProperty";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";

const EngineProperties: FunctionComponent<{ engine: EngineContext }> = (props) => {
    const { engine } = props;

    return (
        <>
            <StringifiedPropertyLine label="Surface Count" value={engine.surfaces.length} />
            <BoundProperty component={StringifiedPropertyLine} label="Draw Calls" target={engine} propertyKey="drawCallCount" />
            <BoundProperty component={StringifiedPropertyLine} label="GPU Frame Time" target={engine} propertyKey="gpuFrameTimeMs" precision={2} units="ms" />
            <BoundProperty component={BooleanBadgePropertyLine} label="High Precision Matrices" target={engine} propertyKey="useHighPrecisionMatrix" />
            <BoundProperty component={BooleanBadgePropertyLine} label="Floating Origin" target={engine} propertyKey="useFloatingOrigin" />
        </>
    );
};

const SurfaceProperties: FunctionComponent<{ surface: SurfaceContext }> = (props) => {
    const { surface } = props;
    const maxDevicePixelRatio = Number.isFinite(surface.maxDevicePixelRatio) ? surface.maxDevicePixelRatio.toLocaleString() : "Unbounded";

    return (
        <>
            <StringifiedPropertyLine label="Canvas Width" value={surface.canvas.width} units="px" />
            <StringifiedPropertyLine label="Canvas Height" value={surface.canvas.height} units="px" />
            <TextPropertyLine label="Format" value={surface.format} />
            <StringifiedPropertyLine label="MSAA Samples" value={surface.msaaSamples} />
            <TextPropertyLine label="Max Device Pixel Ratio" value={maxDevicePixelRatio} />
        </>
    );
};

export const EnginePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext]> = {
    friendlyName: "Babylon Lite Engine Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity],
    factory: (propertiesService, engineContext) => {
        const engine = engineContext.engine;
        const engineRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Engine Properties",
            predicate: (entity: unknown): entity is EngineContext => entity === engine,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <EngineProperties engine={context} />,
                },
            ],
        });
        const surfaceRegistration = propertiesService.addSectionContent({
            key: "Babylon Lite Surface Properties",
            predicate: (entity: unknown): entity is SurfaceContext => entity !== engine && engine.surfaces.includes(entity as SurfaceContext),
            content: [
                {
                    section: "General",
                    component: ({ context }) => <SurfaceProperties surface={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                engineRegistration.dispose();
                surfaceRegistration.dispose();
            },
        };
    },
};
