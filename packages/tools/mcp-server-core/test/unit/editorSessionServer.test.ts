import * as net from "node:net";

import { McpEditorSessionServer } from "../../src/index";

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
});
