import { FetchSnippet } from "../../src/fetchSnippet";

describe("FetchSnippet", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("encodes snippet path segments before fetching", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ jsonPayload: "{}" }),
        });
        vi.stubGlobal("fetch", fetchMock);

        await FetchSnippet("#ABC/123#2");

        expect(fetchMock).toHaveBeenCalledWith("https://snippet.babylonjs.com/ABC%2F123/2");
    });

    it("rejects an empty snippet identifier", async () => {
        await expect(FetchSnippet("")).rejects.toThrow("Snippet identifier cannot be empty.");
    });
});
