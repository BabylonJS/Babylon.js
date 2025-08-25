/* eslint-disable github/no-then */
/* eslint-disable no-console */
const SearchParams = new URLSearchParams(window.location.search);
const Experience = SearchParams.get("exp") || "es6";
import(`./${Experience}/main`)
    .then(async (module) => {
        console.log("Loading experience:", Experience);
        await module.Main();
        console.log("Loading experience completed");
    })
    .catch((err) => {
        console.log("Error loading experience:", err);
    });
