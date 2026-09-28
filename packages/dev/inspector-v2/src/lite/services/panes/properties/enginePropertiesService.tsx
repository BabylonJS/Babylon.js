import { type EngineContext, type SurfaceContext } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { BoundProperty, ComputedProperty } from "../../../../components/properties/boundProperty";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";

const GetSurfaceCount = (engine: EngineContext) => engine.surfaces.length;
const GetCanvasWidth = (surface: SurfaceContext) => surface.canvas.width;
const GetCanvasHeight = (surface: SurfaceContext) => surface.canvas.height;
const GetFormat = (surface: SurfaceContext) => surface.format;
const GetMsaaSamples = (surface: SurfaceContext) => surface.msaaSamples;
const GetMaxDevicePixelRatio = (surface: SurfaceContext) => (Number.isFinite(surface.maxDevicePixelRatio) ? surface.maxDevicePixelRatio.toLocaleString() : "Unbounded");

const EngineProperties: FunctionComponent<{ engine: EngineContext }> = (props) => {
    const { engine } = props;

    return (
        <>
            <ComputedProperty component={StringifiedPropertyLine} label="Surface Count" target={engine} getValue={GetSurfaceCount} />
            <BoundProperty component={StringifiedPropertyLine} label="Draw Calls" target={engine} propertyKey="drawCallCount" />
            <BoundProperty component={StringifiedPropertyLine} label="GPU Frame Time" target={engine} propertyKey="gpuFrameTimeMs" precision={2} units="ms" />
            <BoundProperty component={BooleanBadgePropertyLine} label="High Precision Matrices" target={engine} propertyKey="useHighPrecisionMatrix" />
            <BoundProperty component={BooleanBadgePropertyLine} label="Floating Origin" target={engine} propertyKey="useFloatingOrigin" />
        </>
    );
};

const SurfaceProperties: FunctionComponent<{ surface: SurfaceContext }> = (props) => {
    const { surface } = props;

    return (
        <>
            <ComputedProperty component={StringifiedPropertyLine} label="Canvas Width" target={surface} getValue={GetCanvasWidth} units="px" />
            <ComputedProperty component={StringifiedPropertyLine} label="Canvas Height" target={surface} getValue={GetCanvasHeight} units="px" />
            <ComputedProperty component={TextPropertyLine} label="Format" target={surface} getValue={GetFormat} />
            <ComputedProperty component={StringifiedPropertyLine} label="MSAA Samples" target={surface} getValue={GetMsaaSamples} />
            <ComputedProperty component={TextPropertyLine} label="Max Device Pixel Ratio" target={surface} getValue={GetMaxDevicePixelRatio} />
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
