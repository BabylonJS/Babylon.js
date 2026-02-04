import type { Sound } from "core/index";

import type { FunctionComponent } from "react";

import { useCallback } from "react";

import { PauseRegular, PlayRegular } from "@fluentui/react-icons";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useInterceptObservable } from "../../../hooks/instrumentationHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty, Property } from "../boundProperty";

function useSoundState(sound: Sound) {
    const stateChangedObservables = [
        useInterceptObservable("function", sound, "play"),
        useInterceptObservable("function", sound, "pause"),
        useInterceptObservable("function", sound, "stop"),
    ] as const;

    const isPaused = useObservableState(
        useCallback(() => sound.isPaused, [sound]),
        ...stateChangedObservables
    );

    const isPlaying = useObservableState(
        useCallback(() => sound.isPlaying, [sound]),
        ...stateChangedObservables
    );

    return isPaused ? "Paused" : isPlaying ? "Playing" : "Stopped";
}

export const SoundGeneralProperties: FunctionComponent<{ sound: Sound }> = (props) => {
    const { sound } = props;

    const soundState = useSoundState(sound);

    return (
        <>
            <TextPropertyLine label="Status" value={soundState} />
        </>
    );
};

export const SoundCommandProperties: FunctionComponent<{ sound: Sound }> = (props) => {
    const { sound } = props;

    const soundState = useSoundState(sound);

    const volume = useObservableState(
        useCallback(() => sound.getVolume(), [sound]),
        useInterceptObservable("function", sound, "setVolume")
    );

    return (
        <>
            <ButtonLine
                uniqueId="Start/Stop"
                label={soundState === "Playing" ? "Pause" : "Play"}
                icon={soundState === "Playing" ? PauseRegular : PlayRegular}
                onClick={() => {
                    if (soundState === "Playing") {
                        sound.pause();
                    } else {
                        sound.play();
                    }
                }}
            />
            <Property
                component={SyncedSliderPropertyLine}
                label="Volume"
                functionPath="setVolume"
                value={volume}
                min={0}
                max={5}
                step={0.1}
                onChange={(value) => {
                    sound.setVolume(value);
                }}
            />
            <BoundProperty component={SwitchPropertyLine} label="Loop" target={sound} propertyKey="loop" />
        </>
    );
};
