import { type FunctionComponent, type ReactNode, useCallback, useEffect, useRef } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";

import { useCurveEditor } from "./normalizedCurveEditorContext";
import { TopBar } from "./topBar";
import { Canvas } from "./canvas/canvas";
import { BottomBar } from "./bottomBar";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        flex: 1,
        backgroundColor: tokens.colorNeutralBackground3,
        color: tokens.colorNeutralForeground1,
        overflow: "hidden",
        fontFamily: "'acumin-pro-condensed', 'Segoe UI', sans-serif",
        outline: "none",
    },
    topBar: {
        flexShrink: 0,
        height: "40px",
    },
    mainContent: {
        display: "flex",
        flexDirection: "row",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
    },
    sideBar: {
        width: "220px",
        flexShrink: 0,
        marginLeft: "10px",
    },
    canvasArea: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        marginLeft: "10px",
        marginRight: "10px",
        overflow: "hidden",
    },
    bottomBar: {
        flexShrink: 0,
        height: "45px",
    },
});

export type CurveEditorContentProps = {
    /** Optional native-editor sidebar content. */
    sideBar?: ReactNode;
};

/**
 * Renders the shared curve editor controls and canvas.
 * @param props - Optional native-editor sidebar content
 * @returns The curve editor content
 */
export const CurveEditorContent: FunctionComponent<CurveEditorContentProps> = (props) => {
    const { sideBar } = props;
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();
    const rootRef = useRef<HTMLDivElement>(null);
    const prepareRef = useRef(() => actions.prepare());
    prepareRef.current = () => actions.prepare();

    useEffect(() => {
        prepareRef.current();
    }, []);

    const handleKeyDown = useCallback(
        (evt: React.KeyboardEvent<HTMLDivElement>) => {
            switch (evt.key) {
                case "Delete":
                case "Backspace":
                    if (state.activeKeyPoints?.length && !state.focusedInput) {
                        observables.onDeleteKeyActiveKeyPoints.notifyObservers();
                    }
                    break;
                case " ":
                    evt.preventDefault();
                    if (state.isPlaying) {
                        actions.stop();
                    } else {
                        actions.play(true);
                    }
                    break;
                case "a":
                    if (evt.ctrlKey) {
                        observables.onSelectAllKeys.notifyObservers();
                        observables.onActiveKeyPointChanged.notifyObservers();
                        evt.preventDefault();
                    }
                    break;
                case "ArrowLeft":
                    if (!state.focusedInput) {
                        actions.moveToFrame(Math.max(0, state.activeFrame - 1));
                        evt.preventDefault();
                    }
                    break;
                case "ArrowRight":
                    if (!state.focusedInput) {
                        actions.moveToFrame(Math.min(state.clipLength, state.activeFrame + 1));
                        evt.preventDefault();
                    }
                    break;
                case "ArrowDown": {
                    if (!state.focusedInput) {
                        const prevKey = actions.getPrevKey();
                        if (prevKey !== null) {
                            actions.moveToFrame(prevKey);
                        }
                        evt.preventDefault();
                    }
                    break;
                }
                case "ArrowUp": {
                    if (!state.focusedInput) {
                        const nextKey = actions.getNextKey();
                        if (nextKey !== null) {
                            actions.moveToFrame(nextKey);
                        }
                        evt.preventDefault();
                    }
                    break;
                }
            }
        },
        [state.activeKeyPoints, state.focusedInput, state.isPlaying, state.activeFrame, state.clipLength, observables, actions]
    );

    useEffect(() => {
        rootRef.current?.focus();
    }, []);

    return (
        <div ref={rootRef} className={styles.root} tabIndex={0} onKeyDown={handleKeyDown}>
            <div className={styles.topBar}>
                <TopBar />
            </div>
            <div className={styles.mainContent}>
                {sideBar && <div className={styles.sideBar}>{sideBar}</div>}
                <div className={styles.canvasArea}>
                    <Canvas />
                </div>
            </div>
            <div className={styles.bottomBar}>
                <BottomBar />
            </div>
        </div>
    );
};
