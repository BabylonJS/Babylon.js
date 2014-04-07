using System.Web.Mvc;
using System.IO;
using System.Text;
using System;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace BuildOurOwnBabylonJSServer.Controllers
{
    public class BuildOurOwnBabylonJSController : Controller
    {
        public const string GetFileContentActionName = "GetFileContent";
        public const string GetBabylonScenesActionName = "GetBabylonScenes";
        
        [ActionName(BuildOurOwnBabylonJSController.GetFileContentActionName)]
        public ActionResult GetFileContent(string rootPath, string relPath)
        {
            var babylonJSPath = Path.Combine(Server.MapPath("~"), rootPath);

            var absPath = Path.Combine(babylonJSPath, relPath);

            var type = "";
            var extension = "";

            if (!String.IsNullOrEmpty(relPath))
                extension = Path.GetExtension(relPath).ToLower();

            switch (extension)
            {
                case ".js":
                case ".babylon":
                case ".manifest":
                    type = "text/javascript";
                    break;

                case ".png":
                    type = "image/png";
                    break;

                case ".jpeg":
                case ".jpg":
                    type = "image/jpeg";
                    break;

                case ".bmp":
                    type = "image/bmp";
                    break;

                default:
                    type = "text/plain";
                    break;
            }

            try
            {
                return File(new FileStream(absPath, FileMode.Open), type);
            }
            catch
            {
                return new HttpNotFoundResult();
            }
        }

        [ActionName(BuildOurOwnBabylonJSController.GetBabylonScenesActionName)]
        public string GetBabylonScenes(string rootPath)
        {
            var dir = new DirectoryInfo(rootPath);
            var subDirs = dir.GetDirectories();
            var files = new List<JObject>();

            foreach (var directory in subDirs) {
                var babylonFiles = directory.GetFiles("*.babylon");
                if (babylonFiles.Length == 0) {
                    continue;
                }

                foreach (var file in babylonFiles) {
                    var linkName = directory.Name + (file.Name.Contains(".incremental.babylon") ? " - Incremental" : "");
                    files.Add(new JObject(
                        new JProperty("url", Url.Action("Index", "BabylonJSDemo", new { demoFolderName = directory.Name, demoFile = file.Name })),
                        new JProperty("linkName", linkName)
                    ));
                }
            }

            var json = new JObject(new JProperty("files", files));
            return json.ToString(Newtonsoft.Json.Formatting.None);
        }
    }
}
