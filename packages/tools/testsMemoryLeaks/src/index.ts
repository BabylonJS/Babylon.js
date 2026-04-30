import { populateEnvironment } from "@dev/build-tools";

// Load repo-root .env (CDN_BASE_URL, VIEWER_BASE_URL, etc.) before anything else imports config.
populateEnvironment();

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
