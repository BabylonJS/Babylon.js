import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

import { PostProcessRenderPipeline } from "core/PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { DefaultRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { LensRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/lensRenderingPipeline";
import { SSAORenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline";
import { SSAO2RenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline";
import { SSRRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssrRenderingPipeline";
import { IblShadowsRenderPipeline } from "core/Rendering/IBLShadows/iblShadowsRenderPipeline";

import { PostProcessRenderPipelineSamplesProperties } from "../../../components/properties/renderingPipelines/postProcessRenderPipelineProperties";
import {
    DefaultRenderingPipelineBloomProperties,
    DefaultRenderingPipelineChromaticAberrationProperties,
    DefaultRenderingPipelineDepthOfFieldProperties,
    DefaultRenderingPipelineFxaaGlowProperties,
    DefaultRenderingPipelineGrainProperties,
    DefaultRenderingPipelineImageProcessingProperties,
    DefaultRenderingPipelineSharpenProperties,
} from "../../../components/properties/renderingPipelines/defaultRenderingPipelineProperties";
import {
    LensRenderingPipelineOptionsProperties,
    LensRenderingPipelineDepthOfFieldProperties,
} from "../../../components/properties/renderingPipelines/lensRenderingPipelineProperties";
import { SSAORenderingPipelineProperties } from "../../../components/properties/renderingPipelines/ssaoRenderingPipelineProperties";
import { SSAO2RenderingPipelineSSAOProperties, SSAO2RenderingPipelineDenoiserProperties } from "../../../components/properties/renderingPipelines/ssao2RenderingPipelineProperties";
import {
    SSRRenderingPipelineSSRProperties,
    SSRRenderingPipelineThicknessProperties,
    SSRRenderingPipelineBlurProperties,
    SSRRenderingPipelineAttenuationProperties,
    SSRRenderingPipelineColorSpaceProperties,
} from "../../../components/properties/renderingPipelines/ssrRenderingPipelineProperties";
import {
    IblShadowsRenderPipelineVoxelProperties,
    IblShadowsRenderPipelineScreenspaceProperties,
    IblShadowsRenderPipelineDebugProperties,
} from "../../../components/properties/renderingPipelines/iblShadowsRenderPipelineProperties";

import { PropertiesServiceIdentity } from "./propertiesService";

export const RenderingPipelinePropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Rendering Pipeline Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        // Base PostProcessRenderPipeline properties (Samples slider)
        const baseRegistration = propertiesService.addSectionContent({
            key: "PostProcessRenderPipeline Properties",
            predicate: (entity: unknown) => entity instanceof PostProcessRenderPipeline,
            content: [
                {
                    section: "General",
                    component: ({ context }) => <PostProcessRenderPipelineSamplesProperties pipeline={context} />,
                },
            ],
        });

        // DefaultRenderingPipeline properties
        const defaultRegistration = propertiesService.addSectionContent({
            key: "DefaultRenderingPipeline Properties",
            predicate: (entity: unknown) => entity instanceof DefaultRenderingPipeline,
            content: [
                {
                    section: "Bloom",
                    component: ({ context }) => <DefaultRenderingPipelineBloomProperties pipeline={context} />,
                },
                {
                    section: "Chromatic Aberration",
                    component: ({ context }) => <DefaultRenderingPipelineChromaticAberrationProperties pipeline={context} />,
                },
                {
                    section: "Depth of Field",
                    component: ({ context }) => <DefaultRenderingPipelineDepthOfFieldProperties pipeline={context} />,
                },
                {
                    section: "FXAA & Glow",
                    component: ({ context }) => <DefaultRenderingPipelineFxaaGlowProperties pipeline={context} />,
                },
                {
                    section: "Grain",
                    component: ({ context }) => <DefaultRenderingPipelineGrainProperties pipeline={context} />,
                },
                {
                    section: "Image Processing",
                    component: ({ context }) => <DefaultRenderingPipelineImageProcessingProperties pipeline={context} />,
                },
                {
                    section: "Sharpen",
                    component: ({ context }) => <DefaultRenderingPipelineSharpenProperties pipeline={context} />,
                },
            ],
        });

        // LensRenderingPipeline properties
        const lensRegistration = propertiesService.addSectionContent({
            key: "LensRenderingPipeline Properties",
            predicate: (entity: unknown) => entity instanceof LensRenderingPipeline,
            content: [
                {
                    section: "Options",
                    component: ({ context }) => <LensRenderingPipelineOptionsProperties pipeline={context} />,
                },
                {
                    section: "Depth of Field",
                    component: ({ context }) => <LensRenderingPipelineDepthOfFieldProperties pipeline={context} />,
                },
            ],
        });

        // SSAORenderingPipeline properties
        const ssaoRegistration = propertiesService.addSectionContent({
            key: "SSAORenderingPipeline Properties",
            predicate: (entity: unknown) => entity instanceof SSAORenderingPipeline,
            content: [
                {
                    section: "SSAO",
                    component: ({ context }) => <SSAORenderingPipelineProperties pipeline={context} />,
                },
            ],
        });

        // SSAO2RenderingPipeline properties
        const ssao2Registration = propertiesService.addSectionContent({
            key: "SSAO2RenderingPipeline Properties",
            predicate: (entity: unknown) => entity instanceof SSAO2RenderingPipeline,
            content: [
                {
                    section: "SSAO",
                    component: ({ context }) => <SSAO2RenderingPipelineSSAOProperties pipeline={context} />,
                },
                {
                    section: "Denoiser",
                    component: ({ context }) => <SSAO2RenderingPipelineDenoiserProperties pipeline={context} />,
                },
            ],
        });

        // SSRRenderingPipeline properties
        const ssrRegistration = propertiesService.addSectionContent({
            key: "SSRRenderingPipeline Properties",
            predicate: (entity: unknown) => entity instanceof SSRRenderingPipeline,
            content: [
                {
                    section: "SSR",
                    component: ({ context }) => <SSRRenderingPipelineSSRProperties pipeline={context} />,
                },
                {
                    section: "Automatic Thickness",
                    component: ({ context }) => <SSRRenderingPipelineThicknessProperties pipeline={context} />,
                },
                {
                    section: "Blur",
                    component: ({ context }) => <SSRRenderingPipelineBlurProperties pipeline={context} />,
                },
                {
                    section: "Attenuations",
                    component: ({ context }) => <SSRRenderingPipelineAttenuationProperties pipeline={context} />,
                },
                {
                    section: "Color Space",
                    component: ({ context }) => <SSRRenderingPipelineColorSpaceProperties pipeline={context} />,
                },
            ],
        });

        // IblShadowsRenderPipeline properties
        const iblShadowsRegistration = propertiesService.addSectionContent({
            key: "IblShadowsRenderPipeline Properties",
            predicate: (entity: unknown) => entity instanceof IblShadowsRenderPipeline,
            content: [
                {
                    section: "Voxel Shadows",
                    component: ({ context }) => <IblShadowsRenderPipelineVoxelProperties pipeline={context} />,
                },
                {
                    section: "Screenspace Shadows",
                    component: ({ context }) => <IblShadowsRenderPipelineScreenspaceProperties pipeline={context} />,
                },
                {
                    section: "Debug",
                    component: ({ context }) => <IblShadowsRenderPipelineDebugProperties pipeline={context} />,
                },
            ],
        });

        return {
            dispose: () => {
                baseRegistration.dispose();
                defaultRegistration.dispose();
                lensRegistration.dispose();
                ssaoRegistration.dispose();
                ssao2Registration.dispose();
                ssrRegistration.dispose();
                iblShadowsRegistration.dispose();
            },
        };
    },
};
