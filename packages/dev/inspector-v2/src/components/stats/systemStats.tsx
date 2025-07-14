import type { Scene } from "core/index";

import type { FunctionComponent } from "react";

import { ReadonlyBooleanLine } from "shared-ui-components/fluent/hoc/readonlyBooleanLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";
import { useObservableState } from "../../hooks/observableHooks";

export const SystemStats: FunctionComponent<{ context: Scene }> = ({ context: scene }) => {
    const engine = scene.getEngine();
    const caps = engine.getCaps();
    const resolution = useObservableState(() => `${engine.getRenderWidth()} x ${engine.getRenderHeight()}`, engine.onResizeObservable);
    const hardwareScalingLevel = useObservableState(() => engine.getHardwareScalingLevel(), engine.onResizeObservable);

    return (
        <>
            <TextPropertyLine key="Resolution" label="Resolution" value={resolution} />
            <TextPropertyLine key="HardwareScalingLevel" label="Hardware Scaling Level" value={hardwareScalingLevel.toString()} />
            <TextPropertyLine key="Engine" label="Engine" value={engine.description} />
            <ReadonlyBooleanLine key="StdDerivatives" label="StdDerivatives" value={caps.standardDerivatives} />
            <ReadonlyBooleanLine key="CompressedTextures" label="Compressed Textures" value={caps.s3tc !== undefined} />
            <ReadonlyBooleanLine key="HardwareInstances" label="Hardware Instances" value={caps.instancedArrays} />
            <ReadonlyBooleanLine key="TextureFloat" label="Texture Float" value={caps.textureFloat} />
            <ReadonlyBooleanLine key="TextureHalfFloat" label="Texture Half Float" value={caps.textureHalfFloat} />
            <ReadonlyBooleanLine key="RenderToTextureFloat" label="Render to Texture Float" value={caps.textureFloatRender} />
            <ReadonlyBooleanLine key="RenderToTextureHalfFloat" label="Render to Texture Half Float" value={caps.textureHalfFloatRender} />
            <ReadonlyBooleanLine key="32bitsIndices" label="32bits Indices" value={caps.uintIndices} />
            <ReadonlyBooleanLine key="FragmentDepth" label="Fragment Depth" value={caps.fragmentDepthSupported} />
            <ReadonlyBooleanLine key="HighPrecisionShaders" label="High Precision Shaders" value={caps.highPrecisionShaderSupported} />
            <ReadonlyBooleanLine key="DrawBuffers" label="Draw Buffers" value={caps.drawBuffersExtension} />
            <ReadonlyBooleanLine key="VertexArrayObject" label="Vertex Array Object" value={caps.vertexArrayObject} />
            <ReadonlyBooleanLine key="TimerQuery" label="Timer Query" value={caps.timerQuery !== undefined} />
            <ReadonlyBooleanLine key="Stencil" label="Stencil" value={engine.isStencilEnable} />
            <ReadonlyBooleanLine key="ParallelShaderCompilation" label="Parallel Shader Compilation" value={caps.parallelShaderCompile != null} />
            <TextPropertyLine key="MaxTexturesUnits" label="Max Textures Units" value={caps.maxTexturesImageUnits.toLocaleString()} />
            <TextPropertyLine key="MaxTexturesSize" label="Max Textures Size" value={caps.maxTextureSize.toLocaleString()} />
            <TextPropertyLine key="MaxAnisotropy" label="Max Anisotropy" value={caps.maxAnisotropy.toLocaleString()} />
            <TextPropertyLine key="Driver" label="Driver" value={engine.extractDriverInfo()} />
        </>
    );
};
