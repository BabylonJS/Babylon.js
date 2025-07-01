import type { Scene } from "core/index";

import type { FunctionComponent } from "react";

import { useCallback } from "react";

import { PlaceholderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";
import { useObservableState } from "../../hooks/observableHooks";

export const SystemStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const engine = scene.getEngine();
    const caps = engine.getCaps();
    const resolution = useObservableState(
        useCallback(() => `${engine.getRenderWidth()} x ${engine.getRenderHeight()}`, [engine]),
        engine.onResizeObservable
    );
    const hardwareScalingLevel = useObservableState(
        useCallback(() => engine.getHardwareScalingLevel(), [engine]),
        engine.onResizeObservable
    );

    // TODO: replace these references to PlaceholderPropertyLine with BooleanPropertyLine when it is available
    return (
        <>
            <TextPropertyLine key="Resolution" label="Resolution" value={resolution} />
            <TextPropertyLine key="HardwareScalingLevel" label="Hardware Scaling Level" value={hardwareScalingLevel.toString()} />
            <TextPropertyLine key="Engine" label="Engine" value={engine.description} />
            <PlaceholderPropertyLine key="StdDerivatives" label="StdDerivatives" value={caps.standardDerivatives ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="CompressedTextures" label="Compressed Textures" value={caps.s3tc !== undefined ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="HardwareInstances" label="Hardware Instances" value={caps.instancedArrays ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="TextureFloat" label="Texture Float" value={caps.textureFloat ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="TextureHalfFloat" label="Texture Half Float" value={caps.textureHalfFloat ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="RenderToTextureFloat" label="Render to Texture Float" value={caps.textureFloatRender ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine
                key="RenderToTextureHalfFloat"
                label="Render to Texture Half Float"
                value={caps.textureHalfFloatRender ? "true" : "false"}
                onChange={() => {}}
            />
            <PlaceholderPropertyLine key="32bitsIndices" label="32bits Indices" value={caps.uintIndices ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="FragmentDepth" label="Fragment Depth" value={caps.fragmentDepthSupported ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="HighPrecisionShaders" label="High Precision Shaders" value={caps.highPrecisionShaderSupported ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="DrawBuffers" label="Draw Buffers" value={caps.drawBuffersExtension ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="VertexArrayObject" label="Vertex Array Object" value={caps.vertexArrayObject ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="TimerQuery" label="Timer Query" value={caps.timerQuery !== undefined ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine key="Stencil" label="Stencil" value={engine.isStencilEnable ? "true" : "false"} onChange={() => {}} />
            <PlaceholderPropertyLine
                key="ParallelShaderCompilation"
                label="Parallel Shader Compilation"
                value={caps.parallelShaderCompile != null ? "true" : "false"}
                onChange={() => {}}
            />
            <TextPropertyLine key="MaxTexturesUnits" label="Max Textures Units" value={caps.maxTexturesImageUnits.toLocaleString()} />
            <TextPropertyLine key="MaxTexturesSize" label="Max Textures Size" value={caps.maxTextureSize.toLocaleString()} />
            <TextPropertyLine key="MaxAnisotropy" label="Max Anisotropy" value={caps.maxAnisotropy.toLocaleString()} />
            <TextPropertyLine key="Driver" label="Driver" value={engine.extractDriverInfo()} />
        </>
    );
};
