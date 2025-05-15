const SnippetUrl = "https://snippet.babylonjs.com/";
const PgRoot = "https://playground.babylonjs.com";
// eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-syntax
export const loadPlayground = async (playgroundId: string) => {
    const data = await fetch(SnippetUrl + playgroundId.replace(/#/g, "/"));
    const snippet = await data.json();
    let code = JSON.parse(snippet.jsonPayload).code.toString();
    code = code
        .replace(/\/textures\//g, PgRoot + "/textures/")
        .replace(/"textures\//g, '"' + PgRoot + "/textures/")
        .replace(/\/scenes\//g, PgRoot + "/scenes/")
        .replace(/"scenes\//g, '"' + PgRoot + "/scenes/")
        .replace(/"\.\.\/\.\.https/g, '"' + "https")
        .replace("http://", "https://");

    const createSceneFunction = code.indexOf("delayCreateScene") > -1 ? "delayCreateScene" : "createScene";

    const loadedScene = eval(`${code};${createSceneFunction}(engine);`);

    // eslint-disable-next-line github/no-then
    if (loadedScene.then) {
        // Handle if createScene returns a promise
        return await loadedScene;
    } else {
        return loadedScene;
    }
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const getPlaygroundId = () => {
    if (location.hash) {
        return location.hash.substring(1);
    } else {
        if (location.href.indexOf("pg=") > -1) {
            return location.href.split("pg=")[1];
        }
    }
    return "";
};
