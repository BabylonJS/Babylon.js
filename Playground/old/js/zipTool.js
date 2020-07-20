/**
 * This JS file contains the ZIP tools
 */
class ZipTool {
    constructor(parent) {
        this.parent = parent;
        
        this.zipCode;
    }

    set ZipCode(value) {
        this.zipCode = value;
    }

     
    addContentToZip (zip, name, url, replace, buffer, then) {
        if (url.substring(0, 5) == "data:" || url.substring(0, 5) == "http:" || url.substring(0, 5) == "blob:" || url.substring(0, 6) == "https:") {
            then();
            return;
        }

        var xhr = new XMLHttpRequest();

        xhr.open('GET', url, true);

        if (buffer) {
            xhr.responseType = "arraybuffer";
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var text;
                    if (!buffer) {
                        if (replace) {
                            var splits = replace.split("\r\n");
                            for (var index = 0; index < splits.length; index++) {
                                splits[index] = "        " + splits[index];
                            }
                            replace = splits.join("\r\n");

                            text = xhr.responseText.replace("####INJECT####", replace);
                        } else {
                            text = xhr.responseText;
                        }
                    }

                    zip.file(name, buffer ? xhr.response : text);

                    then();
                }
            }
        };

        xhr.send(null);
    };
    addTexturesToZip (zip, index, textures, folder, then) {

        if (index === textures.length || !textures[index].name) {
            then();
            return;
        }

        if (textures[index].isRenderTarget || textures[index] instanceof BABYLON.DynamicTexture || textures[index].name.indexOf("data:") !== -1) {
            this.addTexturesToZip(zip, index + 1, textures, folder, then);
            return;
        }

        if (textures[index].isCube) {
            if (textures[index].name.indexOf("dds") === -1 && textures[index].name.indexOf(".env") === -1) {
                if (textures[index]._extensions) {
                    for (var i = 0; i < 6; i++) {
                        textures.push({ name: textures[index].name + textures[index]._extensions[i] });
                    }
                } else if (textures[index]._files) {
                    for (var i = 0; i < 6; i++) {
                        textures.push({ name: textures[index]._files[i] });
                    }
                }
            }
            else {
                textures.push({ name: textures[index].name });
            }
            this.addTexturesToZip(zip, index + 1, textures, folder, then);
            return;
        }


        if (folder == null) {
            folder = zip.folder("textures");
        }
        var url;

        if (textures[index].video) {
            url = textures[index].video.currentSrc;
        } else {
            // url = textures[index].name;
            url = textures[index].url ? textures[index].url : textures[index].name;
        }

        var name = textures[index].name.replace("textures/", "");
        // var name = url.substr(url.lastIndexOf("/") + 1);

        if (url != null) {
            this.addContentToZip(folder,
                name,
                url,
                null,
                true,
                function () {
                    this.addTexturesToZip(zip, index + 1, textures, folder, then);
                }.bind(this));
        }
        else {
            this.addTexturesToZip(zip, index + 1, textures, folder, then);
        }
    };
    addImportedFilesToZip (zip, index, importedFiles, folder, then) {
        if (index === importedFiles.length) {
            then();
            return;
        }

        if (!folder) {
            folder = zip.folder("scenes");
        }
        var url = importedFiles[index];

        var name = url.substr(url.lastIndexOf("/") + 1);

        this.addContentToZip(folder,
            name,
            url,
            null,
            true,
            function () {
                this.addImportedFilesToZip(zip, index + 1, importedFiles, folder, then);
            }.bind(this));
    };
    getZip (engine) {
        if (engine.scenes.length === 0) {
            return;
        }

        var zip = new JSZip();

        var scene = engine.scenes[0];
        var textures = scene.textures;
        var importedFiles = scene.importedMeshesFiles;

        document.getElementById("statusBar").innerHTML = "Creating archive... Please wait.";

        var regex = /CreateGroundFromHeightMap\(".+", "(.+)"/g;

        do {
            let match = regex.exec(this.zipCode);            

            if (!match) {
                break;
            }

            textures.push({ name: match[1] });
        } while(true);


        this.addContentToZip(zip,
            "index.html",
            "/zipContent/index.html",
            this.zipCode,
            false,
            function () {
                this.addTexturesToZip(zip,
                    0,
                    textures,
                    null,
                    function () {
                        this.addImportedFilesToZip(zip,
                            0,
                            importedFiles,
                            null,
                            function () {
                                var blob = zip.generate({ type: "blob" });
                                saveAs(blob, "sample.zip");
                                document.getElementById("statusBar").innerHTML = "";
                            }.bind(this));
                    }.bind(this));
            }.bind(this));
    };
}