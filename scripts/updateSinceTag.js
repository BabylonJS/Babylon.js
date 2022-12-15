const path = require("path");
const fs = require("fs");
const glob = require("glob");

const baseDirectory = path.resolve(".");

const getNewVersion = () => {
    // get @dev/core package.json
    const rawdata = fs.readFileSync(path.join(baseDirectory, "packages", "public", "umd", "babylonjs", "package.json"), "utf-8");
    const packageJson = JSON.parse(rawdata);
    const version = packageJson.version;
    return version;
};

const updateSinceTag = (version) => {
    // get all typescript files in the dev folder
    const files = glob.sync(path.join(baseDirectory, "packages", "dev", "**", "*.ts"));
    files.forEach((file) => {
        try {
            // check if file contains @since\n
            const data = fs.readFileSync(file, "utf-8").replace(/\r/gm, "");
            if (file.indexOf("engine.ts") !== -1) {
                console.log(data.indexOf("* @since\n"));
            }
            if (data.indexOf("* @since\n") !== -1) {
                console.log(`Updating @since tag in ${file} to ${version}`);
                // replace @since with @since version
                const newData = data.replace(
                    /\* @since\n/gm,
                    `* @since ${version}
`
                );

                // write file
                fs.writeFileSync(file, newData);
            }
        } catch (e) {
            console.log(e);
        }
    });
};

const version = getNewVersion();
updateSinceTag(version);
