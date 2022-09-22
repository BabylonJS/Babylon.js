import { run } from "@memlab/api";
import type { IScenario } from "@memlab/core";

const playgrounds: string[] = ["#2FDQT5#1508", "#T90MQ4#14", "#8EDB5N#2", "#YACNQS#2", "#SLV8LW#3"];

(async function () {
    const scenarios = playgrounds.map((playground) => {
        return async () => {
            const scenario: IScenario = {
                url: () => "https://localhost:1337/test.html" + playground,
                action: async (page) => {
                    await page.click("#start");
                },
                back: async (page) => {
                    await page.click("#dispose");
                },
            };
            console.log("Running scenario", scenario.url());
            const { leaks } = await run({ scenario });
            if (leaks.length > 0) {
                console.log(leaks);
                throw new Error(leaks.length + " leak(s) found");
            }
        };
    });
    const promiseExecution = async () => {
        for (const promise of scenarios) {
            try {
                const message = await promise();
                console.log(message);
            } catch (error) {
                console.log(error.message);
                throw (error);
            }
        }
    };
    await promiseExecution();
})();
