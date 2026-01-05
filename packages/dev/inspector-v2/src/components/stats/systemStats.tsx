import type { Scene } from "core/index";

import type { FunctionComponent } from "react";

import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { useObservableState } from "../../hooks/observableHooks";

export const SystemStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const engine = scene.getEngine();
    const caps = engine.getCaps();
    const resolution = useObservableState(() => `${engine.getRenderWidth()} x ${engine.getRenderHeight()}`, engine.onResizeObservable);
    const hardwareScalingLevel = useObservableState(() => engine.getHardwareScalingLevel(), engine.onResizeObservable);

    return (
        <>
            <TextPropertyLine key="Resolution" label="Resolution" value={resolution} />
            <StringifiedPropertyLine key="HardwareScalingLevel" label="Hardware Scaling Level" value={hardwareScalingLevel} />
            <TextPropertyLine key="Engine" label="Engine" value={engine.description} />
            <BooleanBadgePropertyLine key="StdDerivatives" label="StdDerivatives" value={caps.standardDerivatives} />
            <BooleanBadgePropertyLine key="CompressedTextures" label="Compressed Textures" value={caps.s3tc !== undefined} />
            <BooleanBadgePropertyLine key="HardwareInstances" label="Hardware Instances" value={caps.instancedArrays} />
            <BooleanBadgePropertyLine key="TextureFloat" label="Texture Float" value={caps.textureFloat} />
            <BooleanBadgePropertyLine key="TextureHalfFloat" label="Texture Half Float" value={caps.textureHalfFloat} />
            <BooleanBadgePropertyLine key="RenderToTextureFloat" label="Render to Texture Float" value={caps.textureFloatRender} />
            <BooleanBadgePropertyLine key="RenderToTextureHalfFloat" label="Render to Texture Half Float" value={caps.textureHalfFloatRender} />
            <BooleanBadgePropertyLine key="32bitsIndices" label="32bits Indices" value={caps.uintIndices} />
            <BooleanBadgePropertyLine key="FragmentDepth" label="Fragment Depth" value={caps.fragmentDepthSupported} />
            <BooleanBadgePropertyLine key="HighPrecisionShaders" label="High Precision Shaders" value={caps.highPrecisionShaderSupported} />
            <BooleanBadgePropertyLine key="DrawBuffers" label="Draw Buffers" value={caps.drawBuffersExtension} />
            <BooleanBadgePropertyLine key="VertexArrayObject" label="Vertex Array Object" value={caps.vertexArrayObject} />
            <BooleanBadgePropertyLine key="TimerQuery" label="Timer Query" value={caps.timerQuery !== undefined} />
            <BooleanBadgePropertyLine key="Stencil" label="Stencil" value={engine.isStencilEnable} />
            <BooleanBadgePropertyLine key="ParallelShaderCompilation" label="Parallel Shader Compilation" value={caps.parallelShaderCompile != null} />
            <StringifiedPropertyLine key="MaxTexturesUnits" label="Max Textures Units" value={caps.maxTexturesImageUnits} />
            <StringifiedPropertyLine key="MaxTexturesSize" label="Max Textures Size" value={caps.maxTextureSize} />
            <StringifiedPropertyLine key="MaxAnisotropy" label="Max Anisotropy" value={caps.maxAnisotropy} />
            <TextPropertyLine key="Driver" label="Driver" value={engine.extractDriverInfo()} />
        </>
    );
};
