import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { StartBridge, type IBridgeHandle } from "../../../src/cli/bridge";
import WebSocket from "ws";
import {
    type BrowserResponse,
    type CommandListResponse,
    type CommandResponse,
    type CommandsResponse,
    type ExecResponse,
    type SessionsResponse,
    type StopResponse,
} from "../../../src/cli/protocol";

function connect(port: number): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}`);
        ws.on("open", () => resolve(ws));
        ws.on("error", (err) => reject(err));
    });
}

function sendAndReceive<T>(ws: WebSocket, message: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("sendAndReceive timeout")), 5000);
        ws.once("message", (data) => {
            clearTimeout(timeout);
            resolve(JSON.parse(data.toString()) as T);
        });
        ws.send(JSON.stringify(message));
    });
}

function waitForMessage<T>(ws: WebSocket): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("waitForMessage timeout")), 5000);
        ws.once("message", (data) => {
            clearTimeout(timeout);
            resolve(JSON.parse(data.toString()) as T);
        });
    });
}

function close(ws: WebSocket): Promise<void> {
    return new Promise((resolve) => {
        if (ws.readyState === WebSocket.CLOSED) {
            resolve();
            return;
        }
        ws.on("close", () => resolve());
        ws.close();
    });
}

function tick(ms = 50): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Inspector Bridge", () => {
    let bridge: IBridgeHandle;

    beforeEach(async () => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        bridge = await StartBridge({ browserPort: 0, cliPort: 0, sessionWaitTimeoutMs: 200 });
    });

    afterEach(() => {
        bridge.shutdown();
        vi.restoreAllMocks();
    });

    it("assigns real ports when started with port 0", () => {
        expect(bridge.browserPort).toBeGreaterThan(0);
        expect(bridge.cliPort).toBeGreaterThan(0);
        expect(bridge.browserPort).not.toBe(bridge.cliPort);
    });

    it("registers a browser session and lists it via CLI", async () => {
        const browser = await connect(bridge.browserPort);
        browser.send(JSON.stringify({ type: "register", name: "Test Scene" }));
        await tick();

        const cli = await connect(bridge.cliPort);
        const response = await sendAndReceive<SessionsResponse>(cli, { type: "sessions" });

        expect(response.type).toBe("sessionsResponse");
        expect(response.sessions).toHaveLength(1);
        expect(response.sessions[0].name).toBe("Test Scene");
        expect(response.sessions[0].id).toBeGreaterThan(0);

        await close(browser);
        await close(cli);
    });

    it("returns empty session list when no browser is connected", async () => {
        const cli = await connect(bridge.cliPort);

        // WaitForSession has a default 5s timeout. We need it to time out.
        // Use a short timeout by sending sessions request and waiting.
        const responsePromise = sendAndReceive<SessionsResponse>(cli, { type: "sessions" });

        // Wait for the bridge's WaitForSession to time out (default 5s).
        // This test may take up to 5s.
        const response = await responsePromise;

        expect(response.type).toBe("sessionsResponse");
        expect(response.sessions).toHaveLength(0);

        await close(cli);
    });

    it("removes session when browser disconnects", async () => {
        const browser = await connect(bridge.browserPort);
        browser.send(JSON.stringify({ type: "register", name: "Temporary Scene" }));
        await tick();

        // Verify session exists.
        const cli1 = await connect(bridge.cliPort);
        const before = await sendAndReceive<SessionsResponse>(cli1, { type: "sessions" });
        expect(before.sessions).toHaveLength(1);
        await close(cli1);

        // Disconnect browser.
        await close(browser);
        await tick();

        // Verify session is gone (will wait for WaitForSession timeout).
        const cli2 = await connect(bridge.cliPort);
        const after = await sendAndReceive<SessionsResponse>(cli2, { type: "sessions" });
        expect(after.sessions).toHaveLength(0);
        await close(cli2);
    });

    it("forwards command listing from browser to CLI", async () => {
        const browser = await connect(bridge.browserPort);
        browser.send(JSON.stringify({ type: "register", name: "Scene" }));
        await tick();

        // Get session id.
        const cli = await connect(bridge.cliPort);
        const sessions = await sendAndReceive<SessionsResponse>(cli, { type: "sessions" });
        const sessionId = sessions.sessions[0].id;

        // CLI requests commands — bridge forwards to browser.
        const cliResponsePromise = sendAndReceive<CommandsResponse>(cli, { type: "commands", sessionId });

        // Browser receives listCommands request and responds.
        const browserReq = await waitForMessage<BrowserResponse>(browser);
        expect(browserReq.type).toBe("listCommands");
        expect("requestId" in browserReq).toBe(true);

        const commandList: CommandListResponse = {
            type: "commandListResponse",
            requestId: (browserReq as { requestId: string }).requestId,
            commands: [{ id: "take-screenshot", description: "Takes a screenshot" }],
        };
        browser.send(JSON.stringify(commandList));

        const cliResponse = await cliResponsePromise;
        expect(cliResponse.type).toBe("commandListResponse");
        expect(cliResponse.commands).toHaveLength(1);
        expect(cliResponse.commands![0].id).toBe("take-screenshot");

        await close(browser);
        await close(cli);
    });

    it("forwards command execution from CLI to browser", async () => {
        const browser = await connect(bridge.browserPort);
        browser.send(JSON.stringify({ type: "register", name: "Scene" }));
        await tick();

        const cli = await connect(bridge.cliPort);
        const sessions = await sendAndReceive<SessionsResponse>(cli, { type: "sessions" });
        const sessionId = sessions.sessions[0].id;

        // CLI executes a command.
        const cliResponsePromise = sendAndReceive<ExecResponse>(cli, {
            type: "exec",
            sessionId,
            commandId: "query-mesh",
            args: { uniqueId: "42" },
        });

        // Browser receives execCommand and responds.
        const browserReq = await waitForMessage<BrowserResponse>(browser);
        expect(browserReq.type).toBe("execCommand");

        const commandResult: CommandResponse = {
            type: "commandResponse",
            requestId: (browserReq as { requestId: string }).requestId,
            result: '{"name":"box","position":[0,0,0]}',
        };
        browser.send(JSON.stringify(commandResult));

        const cliResponse = await cliResponsePromise;
        expect(cliResponse.type).toBe("commandResponse");
        expect(cliResponse.result).toBe('{"name":"box","position":[0,0,0]}');

        await close(browser);
        await close(cli);
    });

    it("returns error for commands on invalid session", async () => {
        const cli = await connect(bridge.cliPort);
        const response = await sendAndReceive<CommandsResponse>(cli, { type: "commands", sessionId: 999 });

        expect(response.type).toBe("commandsResponse");
        expect(response.error).toContain("999");

        await close(cli);
    });

    it("returns error for exec on invalid session", async () => {
        const cli = await connect(bridge.cliPort);
        const response = await sendAndReceive<ExecResponse>(cli, {
            type: "exec",
            sessionId: 999,
            commandId: "test",
            args: {},
        });

        expect(response.type).toBe("execResponse");
        expect(response.error).toContain("999");

        await close(cli);
    });

    it("handles stop request", async () => {
        const cli = await connect(bridge.cliPort);
        const response = await sendAndReceive<StopResponse>(cli, { type: "stop" });

        expect(response.type).toBe("stopResponse");
        expect(response.success).toBe(true);

        await close(cli);
    });

    it("supports multiple browser sessions", async () => {
        const browser1 = await connect(bridge.browserPort);
        browser1.send(JSON.stringify({ type: "register", name: "Scene A" }));
        await tick();

        const browser2 = await connect(bridge.browserPort);
        browser2.send(JSON.stringify({ type: "register", name: "Scene B" }));
        await tick();

        const cli = await connect(bridge.cliPort);
        const response = await sendAndReceive<SessionsResponse>(cli, { type: "sessions" });

        expect(response.sessions).toHaveLength(2);
        const names = response.sessions.map((s) => s.name).sort();
        expect(names).toEqual(["Scene A", "Scene B"]);

        await close(browser1);
        await close(browser2);
        await close(cli);
    });

    it("ignores malformed JSON on browser port", async () => {
        const browser = await connect(bridge.browserPort);
        browser.send("not valid json{{{");
        await tick();

        // Bridge should still be functional.
        browser.send(JSON.stringify({ type: "register", name: "After Bad JSON" }));
        await tick();

        const cli = await connect(bridge.cliPort);
        const response = await sendAndReceive<SessionsResponse>(cli, { type: "sessions" });
        expect(response.sessions).toHaveLength(1);
        expect(response.sessions[0].name).toBe("After Bad JSON");

        await close(browser);
        await close(cli);
    });

    it("ignores malformed JSON on CLI port", async () => {
        const cli = await connect(bridge.cliPort);
        cli.send("not valid json{{{");
        await tick();

        // Bridge should still be functional — send a valid request.
        const browser = await connect(bridge.browserPort);
        browser.send(JSON.stringify({ type: "register", name: "Scene" }));
        await tick();

        const response = await sendAndReceive<SessionsResponse>(cli, { type: "sessions" });
        expect(response.sessions).toHaveLength(1);

        await close(browser);
        await close(cli);
    });
});
