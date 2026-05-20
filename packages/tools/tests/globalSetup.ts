import { BS_LOCAL_ARGS, browserStackLocalIdentifier, bsLocal } from "./browserstack.config";

export default async () => {
    console.log(`Starting BrowserStackLocal${browserStackLocalIdentifier ? ` (${browserStackLocalIdentifier})` : ""} ...`);
    await new Promise<void>((resolve, reject) => {
        bsLocal.start(BS_LOCAL_ARGS, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });

    if (!bsLocal.isRunning()) {
        throw new Error("BrowserStackLocal start completed but the tunnel is not running.");
    }

    console.log("BrowserStackLocal Started");
};
