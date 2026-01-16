import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SettingsPopover } from "./settingsPopover";
import { QuickCreateSection, QuickCreateRow } from "./quickCreateLayout";
import { DefaultRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { SSAORenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline";
import { SSAO2RenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline";
import { SSRRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/ssrRenderingPipeline";
import { IblShadowsRenderPipeline } from "core/Rendering/IBLShadows/iblShadowsRenderPipeline";
import { useProperty } from "../../hooks/compoundPropertyHooks";

type RenderingPipelinesContentProps = {
    scene: Scene;
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
export const RenderingPipelinesContent: FunctionComponent<RenderingPipelinesContentProps> = ({ scene }) => {
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

    const handleCreateDefaultPipeline = () => {
        const name = GetUniquePipelineName(defaultPipelineName, scene);
        new DefaultRenderingPipeline(name, true, scene, scene.cameras);
    };

    const handleCreateSSAOPipeline = () => {
        const name = GetUniquePipelineName(ssaoPipelineName, scene);
        new SSAORenderingPipeline(name, scene, 1, scene.cameras);
    };

    const handleCreateSSAO2Pipeline = () => {
        const name = GetUniquePipelineName(ssao2PipelineName, scene);
        new SSAO2RenderingPipeline(name, scene, 1, scene.cameras);
    };

    const handleCreateSSRPipeline = () => {
        const name = GetUniquePipelineName(ssrPipelineName, scene);
        new SSRRenderingPipeline(name, scene, scene.cameras);
    };

    const handleCreateIBLShadowsPipeline = () => {
        const name = GetUniquePipelineName(iblShadowsPipelineName, scene);
        new IblShadowsRenderPipeline(name, scene, {}, scene.cameras);
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
                    <QuickCreateRow>
                        <Button onClick={handleCreateDefaultPipeline} label="Default Pipeline" />
                        <SettingsPopover>
                            <TextInputPropertyLine label="Name" value={defaultPipelineName} onChange={(value) => setDefaultPipelineName(value)} />
                            <Button appearance="primary" onClick={handleCreateDefaultPipeline} label="Create" />
                        </SettingsPopover>
                    </QuickCreateRow>

                    {/* SSAO Pipeline */}
                    <QuickCreateRow>
                        <Button onClick={handleCreateSSAOPipeline} label="SSAO Pipeline" />
                        <SettingsPopover>
                            <TextInputPropertyLine label="Name" value={ssaoPipelineName} onChange={(value) => setSsaoPipelineName(value)} />
                            <Button appearance="primary" onClick={handleCreateSSAOPipeline} label="Create" />
                        </SettingsPopover>
                    </QuickCreateRow>

                    {/* SSAO2 Pipeline */}
                    {hasDrawBuffers && (
                        <QuickCreateRow>
                            <Button onClick={handleCreateSSAO2Pipeline} label="SSAO2 Pipeline" />
                            <SettingsPopover>
                                <TextInputPropertyLine label="Name" value={ssao2PipelineName} onChange={(value) => setSsao2PipelineName(value)} />
                                <Button appearance="primary" onClick={handleCreateSSAO2Pipeline} label="Create" />
                            </SettingsPopover>
                        </QuickCreateRow>
                    )}

                    {/* SSR Pipeline */}
                    {hasDrawBuffers && hasTexelFetch && (
                        <QuickCreateRow>
                            <Button onClick={handleCreateSSRPipeline} label="SSR Pipeline" />
                            <SettingsPopover>
                                <TextInputPropertyLine label="Name" value={ssrPipelineName} onChange={(value) => setSsrPipelineName(value)} />
                                <Button appearance="primary" onClick={handleCreateSSRPipeline} label="Create" />
                            </SettingsPopover>
                        </QuickCreateRow>
                    )}

                    {/* IBL Shadows Pipeline */}
                    {hasDrawBuffers && hasTexelFetch && (
                        <QuickCreateRow>
                            <Button onClick={handleCreateIBLShadowsPipeline} label="IBL Shadows Pipeline" />
                            <SettingsPopover>
                                <TextInputPropertyLine label="Name" value={iblShadowsPipelineName} onChange={(value) => setIblShadowsPipelineName(value)} />
                                <Button appearance="primary" onClick={handleCreateIBLShadowsPipeline} label="Create" />
                            </SettingsPopover>
                        </QuickCreateRow>
                    )}
                </>
            )}
        </QuickCreateSection>
    );
};
