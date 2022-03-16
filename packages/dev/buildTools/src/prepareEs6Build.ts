import * as mv from "mv";
import * as path from "path";

export const prepareES6Build = () => {
    // this script copies all files from dist to ../
    const baseDir = path.resolve(".");
    mv(baseDir + "/dist", baseDir, { mkdirp: false, clobber: false }, (err) => {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Successfully moved files");
        }
    });
};
