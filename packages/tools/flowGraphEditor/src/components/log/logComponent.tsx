import { type FunctionComponent, useEffect, useRef, useState } from "react";

import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";

import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";

import { type GlobalState } from "../../globalState";

interface ILogComponentProps {
    globalState: GlobalState;
}

export class LogEntry {
    public time = new Date();

    constructor(
        public message: string,
        public isError: boolean,
        /** Optional block reference — when set, clicking the log entry navigates to this block. */
        public block?: FlowGraphBlock
    ) {}
}

const useStyles = makeStyles({
    console: {
        background: tokens.colorNeutralBackground3,
        height: "100%",
        boxSizing: "border-box",
        margin: 0,
        padding: tokens.spacingHorizontalM,
        width: "100%",
        overflow: "hidden",
        overflowY: "auto",
    },
    log: {
        color: tokens.colorNeutralForeground1,
        fontSize: tokens.fontSizeBase300,
        fontFamily: tokens.fontFamilyMonospace,
    },
    error: {
        color: tokens.colorPaletteRedForeground1,
    },
    clickable: {
        cursor: "pointer",
        textDecoration: "underline",
        textDecorationStyle: "dotted",
        ":hover": {
            opacity: 0.8,
        },
    },
});

/**
 * Console-style log panel rendered at the bottom of the central column.
 * Subscribes to `globalState.onLogRequiredObservable` for new entries and supports
 * click-to-navigate for entries with an attached block.
 * @returns The rendered log panel.
 */
export const LogComponent: FunctionComponent<ILogComponentProps> = ({ globalState }) => {
    const classes = useStyles();
    const consoleRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const observer = globalState.onLogRequiredObservable.add((entry) => {
            setLogs((prev) => [...prev, entry]);
        });
        return () => observer?.remove();
    }, [globalState]);

    // Auto-scroll to the latest entry whenever logs change.
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [logs]);

    const onLogEntryClick = (entry: LogEntry) => {
        if (!entry.block || !globalState.onGetNodeFromBlock) {
            return;
        }
        const node = globalState.onGetNodeFromBlock(entry.block);
        if (!node) {
            return;
        }
        // Select the node and zoom to it
        globalState.stateManager.onSelectionChangedObservable.notifyObservers({ selection: node });
        node.setIsSelected(true, false);

        const ownerCanvas = (node as any)._ownerCanvas;
        if (ownerCanvas && typeof ownerCanvas.zoomToNode === "function") {
            ownerCanvas.zoomToNode(node);
        }
    };

    return (
        <div ref={consoleRef} className={classes.console}>
            {logs.map((l, i) => {
                const hasBlock = !!l.block;
                return (
                    <div
                        key={i}
                        className={mergeClasses(classes.log, l.isError && classes.error, hasBlock && classes.clickable)}
                        onClick={hasBlock ? () => onLogEntryClick(l) : undefined}
                    >
                        {l.time.getHours() + ":" + l.time.getMinutes() + ":" + l.time.getSeconds() + ": " + l.message}
                    </div>
                );
            })}
        </div>
    );
};
