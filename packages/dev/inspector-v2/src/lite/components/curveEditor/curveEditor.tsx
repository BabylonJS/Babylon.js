import { getAnimationGroupTracks, setAnimationTrackKeys, type AnimationGroup, type EngineContext } from "@babylonjs/lite";
import { type FunctionComponent, useEffect, useMemo } from "react";

import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { NormalizedCurveEditor } from "../../../components/curveEditor/normalizedCurveEditor";
import { CreateLiteCurveEditorSource } from "./curveEditorSource";
import { LiteCurveEditorSideBar } from "./sideBar";

/**
 * Props for the LiteCurveEditor component
 */
export type LiteCurveEditorProps = {
    /** Engine used to seek and refresh paused poses. */
    engine: EngineContext;
    /** Animation group to edit. */
    group: AnimationGroup;
    /** Editor title */
    title?: string;
};

/**
 * Animation Curve Editor for a Lite animation group
 * @param props - The component props
 * @returns The curve editor component, or a warning when the group cannot be edited
 */
export const LiteCurveEditor: FunctionComponent<LiteCurveEditorProps> = (props) => {
    const { engine, group, title } = props;
    const result = useMemo(() => {
        try {
            return { source: CreateLiteCurveEditorSource(group, engine, { getAnimationGroupTracks, setAnimationTrackKeys }) };
        } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }, [engine, group]);

    useEffect(() => () => result.source?.playback.dispose?.(), [result.source]);

    if (!result.source) {
        return <MessageBar intent="warning" title="Animation Curves Unavailable" message={result.error ?? ""} />;
    }

    return <NormalizedCurveEditor source={result.source} title={title} sideBar={<LiteCurveEditorSideBar />} />;
};
