import { Engine } from 'babylonjs/Engines/engine';

export class DownloadManager {

    public download(engine: Engine) {
        // var zip = new JSZip();

        // var scene = engine.scenes[0];
        // var textures = scene.textures;
        // var importedFiles = scene.importedMeshesFiles;

        // document.getElementById("statusBar").innerHTML = "Creating archive... Please wait.";

        // var regex = /CreateGroundFromHeightMap\(".+", "(.+)"/g;

        // do {
        //     let match = regex.exec(this.zipCode);            

        //     if (!match) {
        //         break;
        //     }

        //     textures.push({ name: match[1] });
        // } while(true);


        // this.addContentToZip(zip,
        //     "index.html",
        //     "/zipContent/index.html",
        //     this.zipCode,
        //     false,
        //     function () {
        //         this.addTexturesToZip(zip,
        //             0,
        //             textures,
        //             null,
        //             function () {
        //                 this.addImportedFilesToZip(zip,
        //                     0,
        //                     importedFiles,
        //                     null,
        //                     function () {
        //                         var blob = zip.generate({ type: "blob" });
        //                         saveAs(blob, "sample.zip");
        //                         document.getElementById("statusBar").innerHTML = "";
        //                     }.bind(this));
        //             }.bind(this));
        //     }.bind(this));
    }
}
