export * from "./browserActions";
export * from "./cli";
export * from "./config";
export * from "./filters";
export * from "./runner";
export * from "./scenarios";

if (require.main === module) {
    void (async () => {
        const { RunCli } = await import("./cli");
        await RunCli(process.argv.slice(2));
    })();
}
