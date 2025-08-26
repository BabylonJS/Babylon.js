/* eslint-disable github/no-then */
/* eslint-disable no-console */
const SearchParams = new URLSearchParams(window.location.search);
const ExpQsp = SearchParams.get("exp");

// Sanitize the input to only allow certain strings
let ImportPromise: Promise<any> | undefined = undefined;
switch (ExpQsp) {
    case "lottie": {
        ImportPromise = import("./lottie/main");
        break;
    }
    case "testScene":
    default: {
        ImportPromise = import("./testScene/main");
        break;
    }
}

ImportPromise.then(async (module) => {
    console.log("Loading experience:", ExpQsp);
    await module.Main();
    console.log("Loading experience completed");
}).catch((err) => {
    console.log("Error loading experience:", err);
});
