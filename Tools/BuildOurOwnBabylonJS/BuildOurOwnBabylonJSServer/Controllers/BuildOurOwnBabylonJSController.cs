using System.Web.Mvc;
using System.IO;
using System.Text;
using System;

namespace BuildOurOwnBabylonJSServer.Controllers
{
    public class BuildOurOwnBabylonJSController : Controller
    {
        public const string GetFileContentActionName = "GetFileContent";
        
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

            return File(new FileStream(absPath, FileMode.Open), type);
        }
    }
}
