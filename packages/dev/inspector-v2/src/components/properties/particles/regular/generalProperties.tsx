import type { FunctionComponent } from "react";
import type { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import type { ISelectionService } from "../../../../services/selectionService";
import { EyeRegular } from "@fluentui/react-icons";

import { ParticleSystem } from "core/Particles/particleSystem";
import { ConvertToNodeParticleSystemSetAsync } from "core/Particles/Node/nodeParticleSystemSet.helper";
import { BlendModeOptions, ParticleBillboardModeOptions } from "shared-ui-components/constToOptionsMaps";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../../hooks/observableHooks";
import { BoundProperty } from "../../boundProperty";

/**
 * Display general (high-level) information about a particle system.
 * @param props Component props.
 * @returns Render property lines.
 */
export const ParticleSystemGeneralProperties: FunctionComponent<{ particleSystem: ParticleSystem | GPUParticleSystem; selectionService: ISelectionService }> = (props) => {
    const { particleSystem: system } = props;

    const scene = system.getScene();

    const isBillboardBased = useProperty(system, "isBillboardBased");

    const capacity = useObservableState(() => system.getCapacity());
    const activeCount = useObservableState(() => system.getActiveCount(), scene?.onBeforeRenderObservable);

    return (
        <>
            <StringifiedPropertyLine label="Capacity" description="Maximum number of particles in the system." value={capacity} />
            <StringifiedPropertyLine label="Active Particles" description="Current number of active particles." value={activeCount} />

            <BoundProperty component={NumberDropdownPropertyLine} label="Blend Mode" target={system} propertyKey="blendMode" options={BlendModeOptions} />
            <BoundProperty component={Vector3PropertyLine} label="World Offset" target={system} propertyKey="worldOffset" />
            <BoundProperty component={Vector3PropertyLine} label="Gravity" target={system} propertyKey="gravity" />
            <BoundProperty component={SwitchPropertyLine} label="Is Billboard" target={system} propertyKey="isBillboardBased" />
            {isBillboardBased && (
                <BoundProperty component={NumberDropdownPropertyLine} label="Billboard Mode" target={system} propertyKey="billboardMode" options={ParticleBillboardModeOptions} />
            )}
            <BoundProperty component={SwitchPropertyLine} label="Is Local" target={system} propertyKey="isLocal" />
            <BoundProperty component={SwitchPropertyLine} label="Force Depth Write" target={system} propertyKey="forceDepthWrite" />
            <BoundProperty component={NumberInputPropertyLine} label="Update Speed" target={system} propertyKey="updateSpeed" min={0} step={0.01} />

            {system instanceof ParticleSystem && (
                <ButtonLine
                    label={"View as Node-Based Particle System"}
                    icon={EyeRegular}
                    onClick={async () => {
                        const scene = system.getScene();
                        if (!scene) {
                            return;
                        }

                        const systemSet = await ConvertToNodeParticleSystemSetAsync("source", [system]);
                        if (systemSet) {
                            await systemSet.editAsync({ nodeEditorConfig: { backgroundColor: scene.clearColor, disposeOnClose: true } });
                        }
                    }}
                />
            )}
        </>
    );
};
