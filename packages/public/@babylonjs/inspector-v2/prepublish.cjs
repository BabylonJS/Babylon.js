// The preview version of the inspector package must have a unique package name within the context of the mono repo / npm workspace
// as long as the legacy version is still being maintained and published. Therefore, the preview package has a unique name, but this
// is not the actual name we want to publish it under. This script copies the name and version from the legacy package.json to the
// preview package.json, appends "-preview" to the version, and removes the private flag, scripts, and devDependencies from the preview,
// and finally deletes the legacy package.json. This script should be run after the preview package has been built and before it is
// published. This script is not necessary when the legacy package is deprecated and the preview package is published under the same
// name as the legacy package.

const fs = require("fs");
const path = require("path");

const legacyPackageJsonPath = path.resolve(__dirname, "../inspector/package.json");
const previewPackageJsonPath = path.resolve(__dirname, "package.json");

const legacyPackageJsonContent = require(legacyPackageJsonPath);
const previewPackageJsonContent = require(previewPackageJsonPath);

previewPackageJsonContent.name = legacyPackageJsonContent.name;
previewPackageJsonContent.version = `${legacyPackageJsonContent.version}-preview`;
delete previewPackageJsonContent.private;
delete previewPackageJsonContent.scripts;
delete previewPackageJsonContent.devDependencies;

fs.unlinkSync(legacyPackageJsonPath);
fs.writeFileSync(previewPackageJsonPath, JSON.stringify(previewPackageJsonContent, null, 4));
