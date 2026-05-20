import * as net from "node:net";

import {
    FindCompatibleMcpEditorSessionServerAsync,
    IsCompatibleMcpEditorSessionHealth,
    McpEditorSessionController,
    McpEditorSessionServer,
} from "../../src/index";

async function GetFreePortAsync(): Promise<number> {
    return await new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (!address || typeof address === "string") {
                server.close(() => reject(new Error("Could not allocate a test port.")));
                return;
            }
            const port = address.port;
            server.close(() => resolve(port));
        });
    });
}

describe("editor session server", () => {
    it("creates reusable sessions and reports health", async () => {
        const port = await GetFreePortAsync();
        let document = JSON.stringify({ value: 1 });
        const server = new McpEditorSessionServer(
            {
                serverName: "Test Session Server",
                documentKind: "test-document",
                getDocument: () => document,
                setDocument: (_session, nextDocument) => {
                    document = nextDocument;
                },
            },
            { defaultPort: port, legacyDocumentRoutes: ["legacy"] }
        );

        try {
            const firstSession = server.createSession("main");
            const secondSession = server.createSession("main");
            const listeningPort = await server.startAsync();
            const health = await (await fetch(`http://localhost:${listeningPort}/health`)).json();
            const sessionInfo = await (await fetch(`http://localhost:${listeningPort}/session/${firstSession.id}`)).json();

            expect(secondSession.id).toBe(firstSession.id);
            expect(health).toMatchObject({
                protocol: "babylon-mcp-editor-session",
                serverName: "Test Session Server",
                documentKind: "test-document",
                running: true,
                activeSessionCount: 1,
            });
            expect(typeof health.workspaceId).toBe("string");
            expect(typeof health.ownerId).toBe("string");
            expect(sessionInfo).toMatchObject({
                sessionId: firstSession.id,
                documentUrl: `/session/${firstSession.id}/document`,
                legacyUrl: `/session/${firstSession.id}/legacy`,
            });
        } finally {
            await server.stopAsync();
        }
    });

    it("serves document routes and accepts editor pushes", async () => {
        const port = await GetFreePortAsync();
        let document = JSON.stringify({ value: 1 });
        const server = new McpEditorSessionServer(
            {
                serverName: "Test Session Server",
                documentKind: "test-document",
                getDocument: () => document,
                setDocument: (_session, nextDocument) => {
                    document = nextDocument;
                },
            },
            { defaultPort: port, legacyDocumentRoutes: ["material"] }
        );

        try {
            const session = server.createSession("main");
            const listeningPort = await server.startAsync();
            const documentUrl = `http://localhost:${listeningPort}/session/${session.id}/document`;
            const legacyUrl = `http://localhost:${listeningPort}/session/${session.id}/material`;

            await expect((await fetch(documentUrl)).json()).resolves.toEqual({ value: 1 });
            await expect((await fetch(legacyUrl)).json()).resolves.toEqual({ value: 1 });

            const postResponse = await fetch(documentUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value: 2 }),
            });
            const postResult = await postResponse.json();

            expect(postResponse.ok).toBe(true);
            expect(postResult).toMatchObject({ ok: true, revision: 1 });
            await expect((await fetch(documentUrl)).json()).resolves.toEqual({ value: 2 });
        } finally {
            await server.stopAsync();
        }
    });

    it("stops cleanly and clears sessions", async () => {
        const port = await GetFreePortAsync();
        const server = new McpEditorSessionServer({
            serverName: "Test Session Server",
            documentKind: "test-document",
            getDocument: () => JSON.stringify({ value: 1 }),
            setDocument: () => undefined,
        });

        const session = server.createSession("main");
        await server.startAsync(port);
        expect(server.isRunning()).toBe(true);

        await server.stopAsync();

        expect(server.isRunning()).toBe(false);
        expect(server.getPort()).toBe(0);
        expect(server.closeSession(session.id)).toBe(false);
    });

    it("updates revisions for MCP-side notifications even without editor subscribers", async () => {
        const port = await GetFreePortAsync();
        const server = new McpEditorSessionServer({
            serverName: "Test Session Server",
            documentKind: "test-document",
            getDocument: () => JSON.stringify({ value: 1 }),
            setDocument: () => undefined,
        });

        try {
            const session = server.createSession("main");
            await server.startAsync(port);

            server.notifySessionUpdate(session.id);

            expect(session.revision).toBe(1);
        } finally {
            await server.stopAsync();
        }
    });

    it("binds a document manager through the reusable controller", async () => {
        const port = await GetFreePortAsync();
        const manager = {
            document: JSON.stringify({ value: 1 }),
            exportJSON: () => manager.document,
            importJSON: (document: string) => {
                manager.document = document;
                return "OK";
            },
        };
        const controller = new McpEditorSessionController<typeof manager>({
            serverName: "Controller Test Server",
            documentKind: "controller-document",
            getDocument: (manager) => manager.exportJSON(),
            setDocument: (manager, _session, document) => {
                const result = manager.importJSON(document);
                return result === "OK" ? undefined : result;
            },
        });

        try {
            const listeningPort = await controller.startAsync(manager, port);
            const sessionId = controller.createSession("main");
            const sessionUrl = controller.getSessionUrl(sessionId, listeningPort);

            expect(controller.getSessionIdForName("main")).toBe(sessionId);
            expect(controller.getHealth()).toMatchObject({
                serverName: "Controller Test Server",
                documentKind: "controller-document",
                running: true,
            });

            const postResponse = await fetch(`${sessionUrl}/document`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value: 2 }),
            });

            expect(postResponse.ok).toBe(true);
            expect(JSON.parse(manager.document)).toEqual({ value: 2 });
            expect(controller.closeSessionForName("main")).toBe(true);
        } finally {
            await controller.stopAsync();
        }
    });

    it("checks discovered health payload compatibility", () => {
        const health = {
            protocol: "babylon-mcp-editor-session",
            protocolVersion: "1.0",
            serverName: "Discovery Test Server",
            port: 3001,
            host: "127.0.0.1",
            publicHostname: "localhost",
            documentKind: "test-document",
            running: true,
            activeSessionCount: 0,
            capabilities: ["sse", "document-get", "document-post", "session-close"],
            workspaceId: "workspace-a",
            ownerId: "owner-a",
        };

        expect(IsCompatibleMcpEditorSessionHealth(health, { documentKind: "test-document" })).toBe(true);
        expect(IsCompatibleMcpEditorSessionHealth(health, { workspaceId: "workspace-a", ownerId: "owner-a" })).toBe(true);
        expect(IsCompatibleMcpEditorSessionHealth(health, { documentKind: "other-document" })).toBe(false);
        expect(IsCompatibleMcpEditorSessionHealth(health, { workspaceId: "workspace-b" })).toBe(false);
        expect(IsCompatibleMcpEditorSessionHealth(health, { ownerId: "owner-b" })).toBe(false);
        expect(IsCompatibleMcpEditorSessionHealth({ ...health, protocol: "other-protocol" }, { documentKind: "test-document" })).toBe(false);
        expect(IsCompatibleMcpEditorSessionHealth({ ...health, protocolVersion: "2.0" }, { documentKind: "test-document" })).toBe(false);
    });

    it("discovers compatible running session servers by health", async () => {
        const port = await GetFreePortAsync();
        const server = new McpEditorSessionServer(
            {
                serverName: "Discovery Test Server",
                documentKind: "test-document",
                getDocument: () => JSON.stringify({ value: 1 }),
                setDocument: () => undefined,
            },
            { defaultPort: port, workspaceId: "workspace-a", ownerId: "owner-a" }
        );

        try {
            await server.startAsync();

            const discovery = await FindCompatibleMcpEditorSessionServerAsync({ startPort: port, portRange: 1, documentKind: "test-document", workspaceId: "workspace-a" });
            const incompatibleDiscovery = await FindCompatibleMcpEditorSessionServerAsync({ startPort: port, portRange: 1, documentKind: "other-document" });
            const wrongWorkspaceDiscovery = await FindCompatibleMcpEditorSessionServerAsync({
                startPort: port,
                portRange: 1,
                documentKind: "test-document",
                workspaceId: "workspace-b",
            });

            expect(discovery).toMatchObject({
                port,
                health: {
                    serverName: "Discovery Test Server",
                    documentKind: "test-document",
                    workspaceId: "workspace-a",
                    ownerId: "owner-a",
                },
            });
            expect(incompatibleDiscovery).toBeUndefined();
            expect(wrongWorkspaceDiscovery).toBeUndefined();
        } finally {
            await server.stopAsync();
        }
    });
});
