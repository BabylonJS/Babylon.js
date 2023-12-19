/* eslint-disable no-console */
/**
 * Logger used throughout the application to allow configuration of
 * the log level required for the messages.
 */
export class Logger {
    /**
     * No log
     */
    public static readonly NoneLogLevel = 0;
    /**
     * Only message logs
     */
    public static readonly MessageLogLevel = 1;
    /**
     * Only warning logs
     */
    public static readonly WarningLogLevel = 2;
    /**
     * Only error logs
     */
    public static readonly ErrorLogLevel = 4;
    /**
     * All logs
     */
    public static readonly AllLogLevel = 7;

    /**
     * Message to display when a message has been logged too many times
     */
    public static MessageLimitReached = "Too many %TYPE%s (%LIMIT%), no more %TYPE%s will be reported for this message.";

    private static _LogCache = "";
    private static _LogLimitOutputs: { [message: string]: { limit: number; current: number } } = {};
    // levels according to the (binary) numbering.
    private static _Levels = [
        {},
        { color: "white", logFunc: console.log, name: "Log" },
        { color: "orange", logFunc: console.warn, name: "Warn" },
        {},
        { color: "red", logFunc: console.error, name: "Error" },
    ];

    /**
     * Gets a value indicating the number of loading errors
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static errorsCount = 0;

    /**
     * Callback called when a new log is added
     */
    public static OnNewCacheEntry: (entry: string) => void;

    private static _CheckLimit(message: string, limit: number): boolean {
        let entry = Logger._LogLimitOutputs[message];
        if (!entry) {
            entry = { limit, current: 1 };
            Logger._LogLimitOutputs[message] = entry;
        } else {
            entry.current++;
        }
        return entry.current <= entry.limit;
    }

    private static _GenerateLimitMessage(message: string, level: number = 1): void {
        const entry = Logger._LogLimitOutputs[message];
        if (!entry || !Logger.MessageLimitReached) {
            return;
        }
        const type = this._Levels[level];
        if (entry.current === entry.limit) {
            Logger[type.name as "Log" | "Warn" | "Error"](Logger.MessageLimitReached.replace(/%LIMIT%/g, "" + entry.limit).replace(/%TYPE%/g, type.name ?? ""));
        }
    }

    private static _AddLogEntry(entry: string) {
        Logger._LogCache = entry + Logger._LogCache;

        if (Logger.OnNewCacheEntry) {
            Logger.OnNewCacheEntry(entry);
        }
    }

    private static _FormatMessage(message: string): string {
        const padStr = (i: number) => (i < 10 ? "0" + i : "" + i);

        const date = new Date();
        return "[" + padStr(date.getHours()) + ":" + padStr(date.getMinutes()) + ":" + padStr(date.getSeconds()) + "]: " + message;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static _LogDisabled(message: string | any[], limit?: number): void {
        // nothing to do
    }
    private static _LogEnabled(level: number = 1, message: string | any[], limit?: number): void {
        // take first message if array
        const msg = Array.isArray(message) ? message[0] : message;
        if (limit !== undefined && !Logger._CheckLimit(msg, limit)) {
            return;
        }

        const formattedMessage = Logger._FormatMessage(msg);
        const type = this._Levels[level];
        const optionals = Array.isArray(message) ? message.slice(1) : [];
        type.logFunc && type.logFunc("BJS - " + formattedMessage, ...optionals);

        const entry = `<div style='color:${type.color}'>${formattedMessage}</div><br>`;
        Logger._AddLogEntry(entry);
        Logger._GenerateLimitMessage(msg, level);
    }

    /**
     * Log a message to the console
     */
    public static Log: (message: string | any[], limit?: number) => void = Logger._LogEnabled.bind(Logger, Logger.MessageLogLevel);

    /**
     * Write a warning message to the console
     */
    public static Warn: (message: string | any[], limit?: number) => void = Logger._LogEnabled.bind(Logger, Logger.WarningLogLevel);

    /**
     * Write an error message to the console
     */
    public static Error: (message: string | any[], limit?: number) => void = Logger._LogEnabled.bind(Logger, Logger.ErrorLogLevel);

    /**
     * Gets current log cache (list of logs)
     */
    public static get LogCache(): string {
        return Logger._LogCache;
    }

    /**
     * Clears the log cache
     */
    public static ClearLogCache(): void {
        Logger._LogCache = "";
        Logger._LogLimitOutputs = {};
        Logger.errorsCount = 0;
    }

    /**
     * Sets the current log level (MessageLogLevel / WarningLogLevel / ErrorLogLevel)
     */
    public static set LogLevels(level: number) {
        Logger.Log = Logger._LogDisabled;
        Logger.Warn = Logger._LogDisabled;
        Logger.Error = Logger._LogDisabled;
        [Logger.MessageLogLevel, Logger.WarningLogLevel, Logger.ErrorLogLevel].forEach((l) => {
            if ((level & l) === l) {
                const type = this._Levels[l];
                Logger[type.name as "Log" | "Warn" | "Error"] = Logger._LogEnabled.bind(Logger, l);
            }
        });
    }
}
