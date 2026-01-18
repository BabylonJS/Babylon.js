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
    const playObservable = useInterceptObservable("function", sound, "play");
    const pauseObservable = useInterceptObservable("function", sound, "pause");
    const stopObservable = useInterceptObservable("function", sound, "stop");

    const isPaused = useObservableState(
        useCallback(() => sound.isPaused, [sound]),
        playObservable,
        pauseObservable,
        stopObservable
    );
    const isPlaying = useObservableState(
        useCallback(() => sound.isPlaying, [sound]),
        playObservable,
        pauseObservable,
        stopObservable
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
                onChange={(value) => {
                    sound.setVolume(value);
                }}
            />
            <BoundProperty component={SwitchPropertyLine} label="Loop" target={sound} propertyKey="loop" />
        </>
    );
};
