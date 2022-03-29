const snippetUrl = "https://snippet.babylonjs.com/";
const pgRoot = "https://playground.babylonjs.com";
export const loadPlayground = async (playgroundId: string) => {
    const data = await fetch(snippetUrl + playgroundId.replace(/#/g, "/"));
    const snippet = await data.json();
    let code = JSON.parse(snippet.jsonPayload).code.toString();
    code = code
        .replace(/\/textures\//g, pgRoot + "/textures/")
        .replace(/"textures\//g, '"' + pgRoot + "/textures/")
        .replace(/\/scenes\//g, pgRoot + "/scenes/")
        .replace(/"scenes\//g, '"' + pgRoot + "/scenes/")
        .replace(/"\.\.\/\.\.https/g, '"' + "https")
        .replace("http://", "https://");

    const createSceneFunction = code.indexOf("delayCreateScene") > -1 ? "delayCreateScene" : "createScene";

    const loadedScene = eval(`${code};${createSceneFunction}(engine);`);

    if (loadedScene.then) {
        // Handle if createScene returns a promise
        return await loadedScene;
    } else {
        return loadedScene;
    }
};

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
