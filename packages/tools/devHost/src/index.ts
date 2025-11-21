/* eslint-disable github/no-then */
/* eslint-disable no-console */

// Lowercase only the parameter names (keys), keep values untouched. Later entries overwrite earlier ones.
const RawParams = new URLSearchParams(window.location.search);
const SearchParams = new URLSearchParams();
RawParams.forEach((value, key) => SearchParams.set(key.toLowerCase(), value));

const ExpQsp = SearchParams.get("exp");

// Sanitize the input to only allow certain strings
let ImportPromise: Promise<any> | undefined = undefined;
switch (ExpQsp) {
    case "lottie": {
        ImportPromise = import("./lottie/main");
        break;
    }
    case "testscene":
    default: {
        ImportPromise = import("./testScene/main");
        break;
    }
}

ImportPromise.then(async (module) => {
    console.log("Loading experience:", ExpQsp);
    await module.Main(SearchParams);
    console.log("Loading experience completed");
}).catch((err) => {
    console.log("Error loading experience:", err);
});
