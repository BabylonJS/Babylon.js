import { Logger } from "core/Misc/logger";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReadJsonFromDataStorage, ReadJsonRecordFromDataStorage, WriteJsonToDataStorage, type IDataStorageStringAdapter } from "../../src/tools/dataStorageJson";

class MemoryStringStorage implements IDataStorageStringAdapter {
    public readonly values = new Map<string, string>();

    public readString(key: string, defaultValue: string): string {
        return this.values.get(key) ?? defaultValue;
    }

    public writeString(key: string, value: string): void {
        this.values.set(key, value);
    }
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Sandbox JSON data storage", () => {
    it("returns the provided default when the key is missing", () => {
        const storage = new MemoryStringStorage();
        const defaultValue = { enabled: true };

        expect(ReadJsonFromDataStorage("missing", defaultValue, storage)).toBe(defaultValue);
    });

    it("reads and writes valid JSON", () => {
        const storage = new MemoryStringStorage();

        WriteJsonToDataStorage("settings", { enabled: true, count: 2 }, storage);

        expect(storage.values.get("settings")).toBe('{"enabled":true,"count":2}');
        expect(ReadJsonFromDataStorage("settings", {}, storage)).toEqual({ enabled: true, count: 2 });
    });

    it("warns and returns the default for malformed JSON", () => {
        const storage = new MemoryStringStorage();
        const defaultValue = { enabled: false };
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        storage.values.set("settings", "not-json");

        expect(ReadJsonFromDataStorage("settings", defaultValue, storage)).toBe(defaultValue);
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toContain('key "settings"');
        expect(warn.mock.calls[0]).toHaveLength(1);
    });

    it.each(["null", "[]", '"value"', "42", "true"])("returns the provided record default for non-record JSON %s", (storedValue) => {
        const storage = new MemoryStringStorage();
        const defaultValue = { enabled: false };
        storage.values.set("settings", storedValue);

        expect(ReadJsonRecordFromDataStorage("settings", defaultValue, storage)).toBe(defaultValue);
    });

    it("reads a JSON record", () => {
        const storage = new MemoryStringStorage();
        storage.values.set("settings", '{"enabled":true}');

        expect(ReadJsonRecordFromDataStorage("settings", {}, storage)).toEqual({ enabled: true });
    });

    it("preserves storage read and write errors", () => {
        const readError = new Error("Read unavailable");
        const writeError = new Error("Write unavailable");
        const storage: IDataStorageStringAdapter = {
            readString: () => {
                throw readError;
            },
            writeString: () => {
                throw writeError;
            },
        };

        expect(() => ReadJsonFromDataStorage("settings", null, storage)).toThrow(readError);
        expect(() => WriteJsonToDataStorage("settings", {}, storage)).toThrow(writeError);
    });
});
