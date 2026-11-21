import { type FunctionComponent, type ReactNode } from "react";

import { CurveEditorProvider } from "./normalizedCurveEditorContext";
import { CurveEditorContent } from "./curveEditorContent";
import { type ICurveEditorSource } from "./curveEditorModel";

export type NormalizedCurveEditorProps = {
    /** Host-independent animation source and playback operations. */
    source: ICurveEditorSource;
    /** Optional editor title. */
    title?: string;
    /** Optional host-specific sidebar content. */
    sideBar?: ReactNode;
};

/**
 * Renders the shared curve editor for a host-provided animation source.
 * @param props - Normalized animations and host playback operations
 * @returns The shared curve editor without native-only panels
 */
export const NormalizedCurveEditor: FunctionComponent<NormalizedCurveEditorProps> = (props) => {
    const { source, title, sideBar } = props;
    return (
        <CurveEditorProvider source={source} title={title}>
            <CurveEditorContent sideBar={sideBar} />
        </CurveEditorProvider>
    );
};
