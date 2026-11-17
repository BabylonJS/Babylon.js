import { FetchSnippet } from "../../src/fetchSnippet";

describe("FetchSnippet", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.each([
        ["#ABC123#2", "ABC123/2"],
        ["ABC123/2", "ABC123/2"],
        ["ABC123", "ABC123/0"],
        ["AB C?#2", "AB%20C%3F/2"],
    ])("requests %s as %s", async (snippetId, expectedPath) => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ jsonPayload: "{}" }),
        });
        vi.stubGlobal("fetch", fetchMock);

        await FetchSnippet(snippetId, "https://snippets.test");

        expect(fetchMock).toHaveBeenCalledWith(`https://snippets.test/${expectedPath}`);
    });

    it("rejects an empty snippet identifier", async () => {
        await expect(FetchSnippet("")).rejects.toThrow("Snippet identifier cannot be empty.");
    });
});
