import { makeStyles, mergeClasses } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import { useRef, useEffect, useState } from "react";
import type { Observable } from "core/Misc/observable";

type LoggerProps = {
    onLogRequiredObservable: Observable<LogEntry>;
};

const useLoggerStyles = makeStyles({
    logConsole: {
        backgroundColor: "#333333",
        height: "120px",
        boxSizing: "border-box",
        margin: "0",
        padding: "10px",
        width: "100%",
        overflow: "hidden",
        overflowY: "auto",
        whiteSpace: "pre-wrap",
    },
    logBase: {
        fontSize: "14px",
        fontFamily: '"Courier New", Courier, monospace',
    },
    logNormal: {
        color: "white",
    },
    logError: {
        color: "red",
    },
});

export class LogEntry {
    public time = new Date();

    constructor(
        public message: string,
        public isError: boolean
    ) {}
}

export const Logger: FunctionComponent<LoggerProps> = ({ onLogRequiredObservable }) => {
    const classes = useLoggerStyles();
    const logConsoleRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const observer = onLogRequiredObservable.add((log: LogEntry) => {
            setLogs((currentLogs) => [...currentLogs, log]);
        });

        return () => {
            onLogRequiredObservable.remove(observer);
        };
    }, [onLogRequiredObservable]);

    useEffect(() => {
        if (logConsoleRef.current) {
            logConsoleRef.current.scrollTop = logConsoleRef.current.scrollHeight;
        }
    }, [logs]);

    const formatTime = (time: Date) => {
        const h = time.getHours().toString().padStart(2, "0");
        const m = time.getMinutes().toString().padStart(2, "0");
        const s = time.getSeconds().toString().padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    return (
        <div className={classes.logConsole} ref={logConsoleRef}>
            {logs.map((log, index) => (
                <div key={index} className={mergeClasses(classes.logBase, log.isError ? classes.logError : classes.logNormal)}>
                    {formatTime(log.time)}: {log.message}
                </div>
            ))}
        </div>
    );
};
