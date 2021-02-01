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
    private static _LogLimitOutputs: { [message: string]: { limit: number, current: number } } = {};

    /**
     * Gets a value indicating the number of loading errors
     * @ignorenaming
     */
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

    private static _GenerateLimitMessage(message: string, messageType: number): void {
        let entry = Logger._LogLimitOutputs[message];
        if (!entry || !Logger.MessageLimitReached) {
            return;
        }
        if (entry.current === entry.limit) {
            switch (messageType) {
                case 0:
                    Logger.Log(Logger.MessageLimitReached.replace(/%LIMIT%/g, "" + entry.limit).replace(/%TYPE%/g, "log"));
                    break;
                case 1:
                    Logger.Warn(Logger.MessageLimitReached.replace(/%LIMIT%/g, "" + entry.limit).replace(/%TYPE%/g, "warning"));
                    break;
                case 2:
                    Logger.Error(Logger.MessageLimitReached.replace(/%LIMIT%/g, "" + entry.limit).replace(/%TYPE%/g, "error"));
                    break;
            }
        }
    }

    private static _AddLogEntry(entry: string) {
        Logger._LogCache = entry + Logger._LogCache;

        if (Logger.OnNewCacheEntry) {
            Logger.OnNewCacheEntry(entry);
        }
    }

    private static _FormatMessage(message: string): string {
        var padStr = (i: number) => (i < 10) ? "0" + i : "" + i;

        var date = new Date();
        return "[" + padStr(date.getHours()) + ":" + padStr(date.getMinutes()) + ":" + padStr(date.getSeconds()) + "]: " + message;
    }

    private static _LogDisabled(message: string, limit?: number): void {
        // nothing to do
    }
    private static _LogEnabled(message: string, limit?: number): void {
        if (limit !== undefined && !Logger._CheckLimit(message, limit)) {
            return;
        }

        var formattedMessage = Logger._FormatMessage(message);
        console.log("BJS - " + formattedMessage);

        var entry = "<div style='color:white'>" + formattedMessage + "</div><br>";
        Logger._AddLogEntry(entry);

        Logger._GenerateLimitMessage(message, 0);
    }

    private static _WarnDisabled(message: string, limit?: number): void {
        // nothing to do
    }
    private static _WarnEnabled(message: string, limit?: number): void {
        if (limit !== undefined && !Logger._CheckLimit(message, limit)) {
            return;
        }

        var formattedMessage = Logger._FormatMessage(message);
        console.warn("BJS - " + formattedMessage);

        var entry = "<div style='color:orange'>" + message + "</div><br>";
        Logger._AddLogEntry(entry);

        Logger._GenerateLimitMessage(message, 1);

    }

    private static _ErrorDisabled(message: string, limit?: number): void {
        // nothing to do
    }
    private static _ErrorEnabled(message: string, limit?: number): void {
        if (limit !== undefined && !Logger._CheckLimit(message, limit)) {
            return;
        }

        var formattedMessage = Logger._FormatMessage(message);
        Logger.errorsCount++;
        console.error("BJS - " + formattedMessage);

        var entry = "<div style='color:red'>" + formattedMessage + "</div><br>";
        Logger._AddLogEntry(entry);

        Logger._GenerateLimitMessage(message, 2);
    }

    /**
     * Log a message to the console
     */
    public static Log: (message: string, limit?: number) => void = Logger._LogEnabled;

    /**
     * Write a warning message to the console
     */
    public static Warn: (message: string, limit?: number) => void = Logger._WarnEnabled;

    /**
     * Write an error message to the console
     */
    public static Error: (message: string, limit?: number) => void = Logger._ErrorEnabled;

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
        if ((level & Logger.MessageLogLevel) === Logger.MessageLogLevel) {
            Logger.Log = Logger._LogEnabled;
        }
        else {
            Logger.Log = Logger._LogDisabled;
        }

        if ((level & Logger.WarningLogLevel) === Logger.WarningLogLevel) {
            Logger.Warn = Logger._WarnEnabled;
        }
        else {
            Logger.Warn = Logger._WarnDisabled;
        }

        if ((level & Logger.ErrorLogLevel) === Logger.ErrorLogLevel) {
            Logger.Error = Logger._ErrorEnabled;
        }
        else {
            Logger.Error = Logger._ErrorDisabled;
        }
    }
}