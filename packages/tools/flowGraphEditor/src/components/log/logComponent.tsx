import { type FunctionComponent, useEffect, useRef, useState } from "react";

import { Text, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";

import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";

import { type GlobalState } from "../../globalState";

interface ILogComponentProps {
    globalState: GlobalState;
}

const MaxLogEntries = 1000;

export class LogEntryBuffer {
    private readonly _pending = new Array<LogEntry | undefined>(MaxLogEntries);
    private _pendingStart = 0;
    private _pendingCount = 0;
    private _frameId = 0;

    public constructor(
        private readonly _publish: (entries: LogEntry[]) => void,
        private readonly _requestFrame: (callback: FrameRequestCallback) => number = (callback) => globalThis.requestAnimationFrame(callback),
        private readonly _cancelFrame: (handle: number) => void = (handle) => globalThis.cancelAnimationFrame(handle)
    ) {}

    public enqueue(entry: LogEntry): void {
        const index = (this._pendingStart + this._pendingCount) % MaxLogEntries;
        this._pending[index] = entry;
        if (this._pendingCount < MaxLogEntries) {
            this._pendingCount++;
        } else {
            this._pendingStart = (this._pendingStart + 1) % MaxLogEntries;
        }
        if (!this._frameId) {
            this._frameId = this._requestFrame(() => this._flush());
        }
    }

    public dispose(): void {
        if (this._frameId) {
            this._cancelFrame(this._frameId);
            this._frameId = 0;
        }
        this._pending.fill(undefined);
        this._pendingStart = 0;
        this._pendingCount = 0;
    }

    private _flush(): void {
        this._frameId = 0;
        const entries = Array.from({ length: this._pendingCount }, (_, index) => {
            const pendingIndex = (this._pendingStart + index) % MaxLogEntries;
            const entry = this._pending[pendingIndex]!;
            this._pending[pendingIndex] = undefined;
            return entry;
        });
        this._pendingStart = 0;
        this._pendingCount = 0;
        this._publish(entries);
    }
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
        // Render as a block so each log entry occupies its own line in the console pane.
        display: "block",
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
 * @param props The component props.
 * @returns The rendered log panel.
 */
export const LogComponent: FunctionComponent<ILogComponentProps> = (props) => {
    const { globalState } = props;
    const classes = useStyles();
    const consoleRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const buffer = new LogEntryBuffer((entries) => {
            setLogs((previous) => [...previous, ...entries].slice(-MaxLogEntries));
        });
        const observer = globalState.onLogRequiredObservable.add((entry) => {
            buffer.enqueue(entry);
        });
        const debugObserver = globalState.onDebugLogRequiredObservable.add(({ message, block }) => {
            buffer.enqueue(new LogEntry(message, false, block));
        });
        return () => {
            observer?.remove();
            debugObserver?.remove();
            buffer.dispose();
        };
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
        <div ref={consoleRef} id="fge-log-console" role="log" aria-label="Flow graph log" className={classes.console}>
            {logs.map((l, i) => {
                const hasBlock = !!l.block;
                return (
                    <Text
                        key={i}
                        font="monospace"
                        size={300}
                        className={mergeClasses(classes.log, l.isError && classes.error, hasBlock && classes.clickable)}
                        onClick={hasBlock ? () => onLogEntryClick(l) : undefined}
                    >
                        {l.time.getHours() + ":" + l.time.getMinutes() + ":" + l.time.getSeconds() + ": " + l.message}
                    </Text>
                );
            })}
        </div>
    );
};
