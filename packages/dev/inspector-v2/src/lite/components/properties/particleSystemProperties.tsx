import { isParticleSystemStarted, type ParticleSystem } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";

import { BoundProperty, ComputedProperty } from "../../../components/properties/boundProperty";
import { useWatchedValue, useWatcher } from "../../../contexts/watcherContext";
import { ToggleParticleSystem } from "../../particleUtils";

type ParticleSystemProps = {
    /** The registered CPU particle system. */
    system: ParticleSystem;
};

const GetName = (system: ParticleSystem) => system.name || "None";
const GetCapacity = (system: ParticleSystem) => system.buffer.capacity;
const GetActiveParticles = (system: ParticleSystem) => system.buffer.alive;
const GetStarted = (system: ParticleSystem) => String(isParticleSystemStarted(system));

/**
 * Renders public CPU particle identity and live counts.
 * @param props The registered CPU particle system.
 * @returns Watched read-only identity and state lines.
 */
export const ParticleSystemGeneralProperties: FunctionComponent<ParticleSystemProps> = (props) => {
    const { system } = props;
    return (
        <>
            <ComputedProperty component={TextPropertyLine} label="Name" target={system} getValue={GetName} />
            <ComputedProperty component={StringifiedPropertyLine} label="Capacity" target={system} getValue={GetCapacity} />
            <ComputedProperty component={StringifiedPropertyLine} label="Active Particles" target={system} getValue={GetActiveParticles} />
            <ComputedProperty component={TextPropertyLine} label="Started" target={system} getValue={GetStarted} />
        </>
    );
};

/**
 * Starts or stops emission, including in manual watcher mode.
 * @param props The registered CPU particle system.
 * @returns A watched start/stop button.
 */
export const ParticleSystemCommandProperties: FunctionComponent<ParticleSystemProps> = (props) => {
    const { system } = props;
    const watcher = useWatcher();
    const started = useWatchedValue(system, isParticleSystemStarted);
    return (
        <ButtonLine
            uniqueId="ParticleStartStop"
            label={started ? "Stop" : "Start"}
            onClick={() => {
                ToggleParticleSystem(system);
                watcher.refresh();
            }}
        />
    );
};

/**
 * Renders only the supported numeric emission controls.
 * @param props The registered CPU particle system.
 * @returns Editable emission property lines.
 */
export const ParticleSystemEmissionProperties: FunctionComponent<ParticleSystemProps> = (props) => {
    const { system } = props;
    return (
        <>
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Emit Rate"
                description="May be overridden by the particle graph"
                target={system}
                propertyKey="emitRate"
                min={0}
            />
            <BoundProperty component={NumberInputPropertyLine} label="Update Speed" target={system} propertyKey="updateSpeed" min={0} />
            <BoundProperty
                component={NumberInputPropertyLine}
                label="Target Stop Duration"
                description="0 = runs until stopped"
                target={system}
                propertyKey="targetStopDuration"
                min={0}
            />
        </>
    );
};
