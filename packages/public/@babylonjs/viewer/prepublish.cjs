// The alpha version of the viewer package must have a unique package name within the context of the mono repo / npm workspace
// as long as the legacy version is still being maintained and published. Therefore, the alpha package has a unique name, but this
// is not the actual name we want to publish it under. This script copies the name and version from the legacy package.json to the
// alpha package.json, appends "-alpha" to the version, and removes the private flag, scripts, and devDependencies from the alpha,
// and finally deletes the legacy package.json. This script should be run after the alpha package has been built and before it is
// published. This script is not necessary when the legacy package is deprecated and the alpha package is published under the same
// name as the legacy package.

const fs = require("fs");
const path = require("path");

const legacyPackageJsonPath = path.resolve(__dirname, "../viewer-legacy/package.json");
const alphaPackageJsonPath = path.resolve(__dirname, "package.json");

const legacyPackageJsonContent = require(legacyPackageJsonPath);
const alphaPackageJsonContent = require(alphaPackageJsonPath);

alphaPackageJsonContent.name = legacyPackageJsonContent.name;
alphaPackageJsonContent.version = `${legacyPackageJsonContent.version}-alpha`;
delete alphaPackageJsonContent.private;
delete alphaPackageJsonContent.scripts;
delete alphaPackageJsonContent.devDependencies;

fs.unlinkSync(legacyPackageJsonPath);
fs.writeFileSync(alphaPackageJsonPath, JSON.stringify(alphaPackageJsonContent, null, 4));
