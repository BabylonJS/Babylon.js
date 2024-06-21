// global-teardown.js
import { bsLocal } from "./browserstack.config";
import { promisify } from "util";
const sleep = promisify(setTimeout);
export default async () => {
    // Stop the Local instance after your test run is completed, i.e after driver.quit
    let localStopped = false;

    if (bsLocal && bsLocal.isRunning()) {
        bsLocal.stop(() => {
            localStopped = true;
            console.log("Stopped BrowserStackLocal");
        });
        while (!localStopped) {
            await sleep(1000);
        }
    }
};
