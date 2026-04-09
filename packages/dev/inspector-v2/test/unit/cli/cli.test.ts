import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ParseCliArgs, ParseCommandArgs, PrintCommandHelp, ResolveSessionId, SendAndReceive, ValidateSessionId } from "../../../src/cli/cli";
import { type CommandArgInfo, type CommandInfo, type SessionInfo, type SessionsResponse } from "../../../src/cli/protocol";
import { EventEmitter } from "events";

// ---------------------------------------------------------------------------
// ParseCliArgs
// ---------------------------------------------------------------------------

describe("ParseCliArgs", () => {
    it("returns defaults when no arguments are given", () => {
        const args = ParseCliArgs([]);
        expect(args.help).toBe(false);
        expect(args.session).toBe(false);
        expect(args.sessionId).toBeUndefined();
        expect(args.stop).toBe(false);
        expect(args.command).toBe(false);
        expect(args.bridgeScript).toBeUndefined();
        expect(args.rest).toEqual([]);
    });

    it("parses --help", () => {
        const args = ParseCliArgs(["--help"]);
        expect(args.help).toBe(true);
    });

    it("parses --stop", () => {
        const args = ParseCliArgs(["--stop"]);
        expect(args.stop).toBe(true);
    });

    it("parses --session without an id", () => {
        const args = ParseCliArgs(["--session"]);
        expect(args.session).toBe(true);
        expect(args.sessionId).toBeUndefined();
    });

    it("parses --session with a numeric id", () => {
        const args = ParseCliArgs(["--session", "3"]);
        expect(args.session).toBe(true);
        expect(args.sessionId).toBe("3");
    });

    it("does not treat a non-numeric token after --session as the session id", () => {
        const args = ParseCliArgs(["--session", "abc"]);
        expect(args.session).toBe(true);
        expect(args.sessionId).toBeUndefined();
        expect(args.rest).toContain("abc");
    });

    it("parses --command alone", () => {
        const args = ParseCliArgs(["--command"]);
        expect(args.command).toBe(true);
        expect(args.rest).toEqual([]);
    });

    it("parses --command with a command id as a positional", () => {
        const args = ParseCliArgs(["--command", "query-mesh"]);
        expect(args.command).toBe(true);
        expect(args.rest).toEqual(["query-mesh"]);
    });

    it("parses --bridge-script value", () => {
        const args = ParseCliArgs(["--bridge-script", "/path/to/bridge.js"]);
        expect(args.bridgeScript).toBe("/path/to/bridge.js");
    });

    it("collects unknown --options into rest", () => {
        const args = ParseCliArgs(["--command", "query-mesh", "--uniqueId", "42"]);
        expect(args.command).toBe(true);
        expect(args.rest).toEqual(["query-mesh", "--uniqueId", "42"]);
    });

    it("collects unknown boolean-style options (no value) into rest", () => {
        const args = ParseCliArgs(["--command", "my-cmd", "--verbose"]);
        expect(args.rest).toEqual(["my-cmd", "--verbose"]);
    });

    it("handles combined --session <id> --command <cmd> --arg <val>", () => {
        const args = ParseCliArgs(["--session", "2", "--command", "query-mesh", "--uniqueId", "42"]);
        expect(args.session).toBe(true);
        expect(args.sessionId).toBe("2");
        expect(args.command).toBe(true);
        expect(args.rest).toEqual(["query-mesh", "--uniqueId", "42"]);
    });

    it("handles --help with --command (help for a specific command)", () => {
        const args = ParseCliArgs(["--command", "query-mesh", "--help"]);
        expect(args.help).toBe(true);
        expect(args.command).toBe(true);
        expect(args.rest).toEqual(["query-mesh"]);
    });
});

// ---------------------------------------------------------------------------
// ParseCommandArgs
// ---------------------------------------------------------------------------

describe("ParseCommandArgs", () => {
    it("returns empty args when rest has only the command id", () => {
        const { args, wantsHelp } = ParseCommandArgs(["query-mesh"], false);
        expect(args).toEqual({});
        expect(wantsHelp).toBe(false);
    });

    it("parses key-value pairs from rest", () => {
        const { args } = ParseCommandArgs(["query-mesh", "--uniqueId", "42", "--name", "box"], false);
        expect(args).toEqual({ uniqueId: "42", name: "box" });
    });

    it("detects --help in the arguments", () => {
        const { wantsHelp } = ParseCommandArgs(["query-mesh", "--help"], false);
        expect(wantsHelp).toBe(true);
    });

    it("inherits globalHelp when set to true", () => {
        const { wantsHelp } = ParseCommandArgs(["query-mesh"], true);
        expect(wantsHelp).toBe(true);
    });

    it("ignores a trailing --key without a value", () => {
        const { args } = ParseCommandArgs(["cmd", "--orphan"], false);
        expect(args).toEqual({});
    });

    it("handles mixed --help and key-value args", () => {
        const { args, wantsHelp } = ParseCommandArgs(["cmd", "--help", "--key", "val"], false);
        expect(wantsHelp).toBe(true);
        expect(args).toEqual({ key: "val" });
    });
});

// ---------------------------------------------------------------------------
// PrintCommandHelp
// ---------------------------------------------------------------------------

describe("PrintCommandHelp", () => {
    let logSpy: ReturnType<typeof vi.spyOn>;
    let errorSpy: ReturnType<typeof vi.spyOn>;
    let originalExitCode: number | undefined;

    beforeEach(() => {
        logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        originalExitCode = process.exitCode as number | undefined;
        process.exitCode = undefined;
    });

    afterEach(() => {
        logSpy.mockRestore();
        errorSpy.mockRestore();
        process.exitCode = originalExitCode;
    });

    it("prints the command description", () => {
        const descriptor: CommandInfo = { id: "test-cmd", description: "Does a thing" };
        PrintCommandHelp("test-cmd", descriptor, [], true);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Does a thing"));
    });

    it("prints argument list when args are present", () => {
        const descriptor: CommandInfo = {
            id: "test-cmd",
            description: "Does a thing",
            args: [
                { name: "foo", description: "The foo param", required: true },
                { name: "bar", description: "The bar param" },
            ],
        };
        PrintCommandHelp("test-cmd", descriptor, [], true);
        const allOutput = logSpy.mock.calls.map((c: unknown[]) => c.join(" ")).join("\n");
        expect(allOutput).toContain("--foo");
        expect(allOutput).toContain("(required)");
        expect(allOutput).toContain("--bar");
    });

    it("prints missing required args as an error and sets exitCode", () => {
        const missing: CommandArgInfo[] = [{ name: "uniqueId", description: "entity id", required: true }];
        const descriptor: CommandInfo = {
            id: "test-cmd",
            description: "Does a thing",
            args: [{ name: "uniqueId", description: "entity id", required: true }],
        };
        PrintCommandHelp("test-cmd", descriptor, missing, false);
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("--uniqueId"));
        expect(process.exitCode).toBe(1);
    });

    it("does not set exitCode when help is explicitly requested", () => {
        const missing: CommandArgInfo[] = [{ name: "uniqueId", description: "entity id", required: true }];
        const descriptor: CommandInfo = {
            id: "test-cmd",
            description: "Does a thing",
            args: [{ name: "uniqueId", description: "entity id", required: true }],
        };
        PrintCommandHelp("test-cmd", descriptor, missing, true);
        expect(errorSpy).not.toHaveBeenCalled();
        expect(process.exitCode).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// ValidateSessionId
// ---------------------------------------------------------------------------

describe("ValidateSessionId", () => {
    const sessions: SessionInfo[] = [
        { id: 1, name: "Scene A", connectedAt: new Date().toISOString() },
        { id: 3, name: "Scene B", connectedAt: new Date().toISOString() },
    ];

    it("returns the matching session when id exists", () => {
        const match = ValidateSessionId("1", sessions);
        expect(match.id).toBe(1);
        expect(match.name).toBe("Scene A");
    });

    it("throws for a non-numeric id", () => {
        expect(() => ValidateSessionId("abc", sessions)).toThrow("Session id must be a number.");
    });

    it("throws when id does not exist and lists active sessions", () => {
        expect(() => ValidateSessionId("2", sessions)).toThrow(/Session 2 does not exist.*Scene A.*Scene B/s);
    });

    it("throws when id does not exist and no sessions are active", () => {
        expect(() => ValidateSessionId("2", [])).toThrow(/Session 2 does not exist.*No active sessions/);
    });
});

// ---------------------------------------------------------------------------
// ResolveSessionId
// ---------------------------------------------------------------------------

describe("ResolveSessionId", () => {
    function makeMockSocket(response: unknown): { on: ReturnType<typeof vi.fn>; once: ReturnType<typeof vi.fn>; send: ReturnType<typeof vi.fn> } {
        const mock = {
            on: vi.fn(),
            once: vi.fn(),
            send: vi.fn(),
        };
        mock.once.mockImplementation((_event: string, cb: (data: string) => void) => {
            queueMicrotask(() => cb(JSON.stringify(response)));
        });
        return mock;
    }

    it("returns the parsed id when an explicit numeric id matches an active session", async () => {
        const response: SessionsResponse = {
            type: "sessionsResponse",
            sessions: [{ id: 5, name: "My Scene", connectedAt: new Date().toISOString() }],
        };
        const socket = makeMockSocket(response);
        const id = await ResolveSessionId(socket as never, "5");
        expect(id).toBe(5);
    });

    it("throws for a non-numeric explicit id", async () => {
        const response: SessionsResponse = { type: "sessionsResponse", sessions: [] };
        const socket = makeMockSocket(response);
        await expect(ResolveSessionId(socket as never, "abc")).rejects.toThrow("Session id must be a number.");
    });

    it("throws when explicit session id does not exist and lists active sessions", async () => {
        const response: SessionsResponse = {
            type: "sessionsResponse",
            sessions: [
                { id: 1, name: "Scene A", connectedAt: new Date().toISOString() },
                { id: 3, name: "Scene B", connectedAt: new Date().toISOString() },
            ],
        };
        const socket = makeMockSocket(response);
        await expect(ResolveSessionId(socket as never, "2")).rejects.toThrow(/Session 2 does not exist.*Scene A.*Scene B/s);
    });

    it("throws when explicit session id does not exist and no sessions are active", async () => {
        const response: SessionsResponse = { type: "sessionsResponse", sessions: [] };
        const socket = makeMockSocket(response);
        await expect(ResolveSessionId(socket as never, "2")).rejects.toThrow(/Session 2 does not exist.*No active sessions/);
    });

    it("auto-resolves when exactly one session is active", async () => {
        const response: SessionsResponse = {
            type: "sessionsResponse",
            sessions: [{ id: 7, name: "My Scene", connectedAt: new Date().toISOString() }],
        };
        const socket = makeMockSocket(response);
        const id = await ResolveSessionId(socket as never);
        expect(id).toBe(7);
    });

    it("throws when no sessions are active", async () => {
        const response: SessionsResponse = { type: "sessionsResponse", sessions: [] };
        const socket = makeMockSocket(response);
        await expect(ResolveSessionId(socket as never)).rejects.toThrow("No active sessions");
    });

    it("throws when multiple sessions are active", async () => {
        const response: SessionsResponse = {
            type: "sessionsResponse",
            sessions: [
                { id: 1, name: "Scene A", connectedAt: new Date().toISOString() },
                { id: 2, name: "Scene B", connectedAt: new Date().toISOString() },
            ],
        };
        const socket = makeMockSocket(response);
        await expect(ResolveSessionId(socket as never)).rejects.toThrow("Multiple active sessions");
    });
});

// ---------------------------------------------------------------------------
// SendAndReceive
// ---------------------------------------------------------------------------

describe("SendAndReceive", () => {
    function makeMockSocket() {
        const emitter = new EventEmitter();
        return {
            on: emitter.on.bind(emitter),
            once: emitter.once.bind(emitter),
            send: vi.fn(() => {
                // Simulate async response
            }),
            _emitter: emitter,
        };
    }

    it("sends a JSON message and resolves with the parsed response", async () => {
        const socket = makeMockSocket();
        const responsePayload = { type: "sessionsResponse", sessions: [] };

        const promise = SendAndReceive(socket as never, { type: "sessions" });

        // Simulate bridge responding
        socket._emitter.emit("message", JSON.stringify(responsePayload));

        const result = await promise;
        expect(result).toEqual(responsePayload);
        expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ type: "sessions" }));
    });

    it("rejects on timeout", async () => {
        vi.useFakeTimers();
        const socket = makeMockSocket();

        const promise = SendAndReceive(socket as never, { type: "sessions" });
        vi.advanceTimersByTime(15001);

        await expect(promise).rejects.toThrow("Timeout");
        vi.useRealTimers();
    });

    it("rejects when the response is not valid JSON", async () => {
        const socket = makeMockSocket();

        const promise = SendAndReceive(socket as never, { type: "sessions" });
        socket._emitter.emit("message", "not json{{{");

        await expect(promise).rejects.toThrow("Failed to parse");
    });
});
