import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { QuickCreateSection, QuickCreateItem } from "./quickCreateLayout";
import type { ISelectionService } from "../../services/selectionService";
import { DefaultRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { SSAORenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline";
import { SSAO2RenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline";
import { SSRRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssrRenderingPipeline";
import { IblShadowsRenderPipeline } from "core/Rendering/IBLShadows/iblShadowsRenderPipeline";
import { useProperty } from "../../hooks/compoundPropertyHooks";

type RenderingPipelinesContentProps = {
    scene: Scene;
    selectionService: ISelectionService;
};

const GetUniquePipelineName = (baseName: string, scene: Scene): string => {
    const pipelines = scene.postProcessRenderPipelineManager.supportedPipelines;
    const existingNames = new Set(pipelines.map((p) => p._name));

    if (!existingNames.has(baseName)) {
        return baseName;
    }

    let counter = 1;
    let uniqueName = `${baseName} ${counter}`;
    while (existingNames.has(uniqueName)) {
        counter++;
        uniqueName = `${baseName} ${counter}`;
    }
    return uniqueName;
};

/**
 * Rendering Pipelines content component
 * @param props - Component props
 * @returns React component
 */
export const RenderingPipelinesContent: FunctionComponent<RenderingPipelinesContentProps> = ({ scene, selectionService }) => {
    // Default Rendering Pipeline state
    const [defaultPipelineName, setDefaultPipelineName] = useState("Default rendering pipeline");

    // SSAO Pipeline state
    const [ssaoPipelineName, setSsaoPipelineName] = useState("SSAO rendering pipeline");

    // SSAO2 Pipeline state
    const [ssao2PipelineName, setSsao2PipelineName] = useState("SSAO2 rendering pipeline");

    // SSR Pipeline state
    const [ssrPipelineName, setSsrPipelineName] = useState("SSR rendering pipeline");

    // IBL Shadows Pipeline state
    const [iblShadowsPipelineName, setIblShadowsPipelineName] = useState("IBL Shadows rendering pipeline");

    const createDefaultPipeline = () => {
        const name = GetUniquePipelineName(defaultPipelineName, scene);
        return new DefaultRenderingPipeline(name, true, scene, scene.cameras);
    };

    const createSSAOPipeline = () => {
        const name = GetUniquePipelineName(ssaoPipelineName, scene);
        return new SSAORenderingPipeline(name, scene, 1, scene.cameras);
    };

    const createSSAO2Pipeline = () => {
        const name = GetUniquePipelineName(ssao2PipelineName, scene);
        return new SSAO2RenderingPipeline(name, scene, 1, scene.cameras);
    };

    const createSSRPipeline = () => {
        const name = GetUniquePipelineName(ssrPipelineName, scene);
        return new SSRRenderingPipeline(name, scene, scene.cameras);
    };

    const createIBLShadowsPipeline = () => {
        const name = GetUniquePipelineName(iblShadowsPipelineName, scene);
        return new IblShadowsRenderPipeline(name, scene, {}, scene.cameras);
    };

    const caps = scene.getEngine().getCaps();
    const hasDrawBuffers = caps.drawBuffersExtension;
    const hasTexelFetch = caps.texelFetch;
    const camera = useProperty(scene, "activeCamera");
    return (
        <QuickCreateSection>
            {!camera ? (
                <MessageBar message="Cannot create rendering pipeline without an active camera." title="No active camera" intent="info"></MessageBar>
            ) : (
                <>
                    {/* Default Rendering Pipeline */}
                    <QuickCreateItem selectionService={selectionService} label="Default Pipeline" onCreate={() => createDefaultPipeline()}>
                        <TextInputPropertyLine label="Name" value={defaultPipelineName} onChange={(value) => setDefaultPipelineName(value)} />
                    </QuickCreateItem>

                    {/* SSAO Pipeline */}
                    <QuickCreateItem selectionService={selectionService} label="SSAO Pipeline" onCreate={() => createSSAOPipeline()}>
                        <TextInputPropertyLine label="Name" value={ssaoPipelineName} onChange={(value) => setSsaoPipelineName(value)} />
                    </QuickCreateItem>

                    {/* SSAO2 Pipeline */}
                    {hasDrawBuffers && (
                        <QuickCreateItem selectionService={selectionService} label="SSAO2 Pipeline" onCreate={() => createSSAO2Pipeline()}>
                            <TextInputPropertyLine label="Name" value={ssao2PipelineName} onChange={(value) => setSsao2PipelineName(value)} />
                        </QuickCreateItem>
                    )}

                    {/* SSR Pipeline */}
                    {hasDrawBuffers && hasTexelFetch && (
                        <QuickCreateItem selectionService={selectionService} label="SSR Pipeline" onCreate={() => createSSRPipeline()}>
                            <TextInputPropertyLine label="Name" value={ssrPipelineName} onChange={(value) => setSsrPipelineName(value)} />
                        </QuickCreateItem>
                    )}

                    {/* IBL Shadows Pipeline */}
                    {hasDrawBuffers && hasTexelFetch && (
                        <QuickCreateItem selectionService={selectionService} label="IBL Shadows Pipeline" onCreate={() => createIBLShadowsPipeline()}>
                            <TextInputPropertyLine label="Name" value={iblShadowsPipelineName} onChange={(value) => setIblShadowsPipelineName(value)} />
                        </QuickCreateItem>
                    )}
                </>
            )}
        </QuickCreateSection>
    );
};
