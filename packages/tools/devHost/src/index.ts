/* eslint-disable github/no-then */
/* eslint-disable no-console */
const SearchParams = new URLSearchParams(window.location.search);
const ExpQsp = SearchParams.get("exp");

// Sanitize the input to only allow certain strings
let SanitizedExp: string = "";
switch (ExpQsp) {
    case "lottie": {
        SanitizedExp = "lottie";
        break;
    }
    case "testScene": {
        SanitizedExp = "testScene";
        break;
    }
    default: {
        SanitizedExp = "testScene";
        break;
    }
}

import(`./${SanitizedExp}/main`)
    .then(async (module) => {
        console.log("Loading experience:", ExpQsp);
        await module.Main();
        console.log("Loading experience completed");
    })
    .catch((err) => {
        console.log("Error loading experience:", err);
    });
