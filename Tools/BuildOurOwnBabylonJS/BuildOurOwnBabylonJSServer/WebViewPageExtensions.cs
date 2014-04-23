using System.Web.Mvc;
using System.IO;
using System.Text;
using System.Web;
using BuildOurOwnBabylonJSServer.Controllers;
using System;

namespace BuildOurOwnBabylonJSServer.Extensions
{
    public static class WebViewPageExtensions
    {
        public static string BabylonJSFile(this WebViewPage page,
            string relPathToBabylonJSFolder)
        {
            if (page == null)
                return null;

            // relPath must be the last one so filename can be appended to it
            var url = page.Url.Action(BuildOurOwnBabylonJSController.GetFileContentActionName,
                                      "BuildOurOwnBabylonJS",
                                      new { rootPath = page.ViewBag.BabylonJSFolder, relPath = relPathToBabylonJSFolder },
                                      page.Request.Url.Scheme);

            return url;
        }
        
        public static IHtmlString BabylonJSScript(this WebViewPage page, 
            string relPathToBabylonJSFolder)
        {
            if (page == null)
                return null;

            var type = "text/javascript";

            var src = page.BabylonJSFile(relPathToBabylonJSFolder);

            var script = new TagBuilder("script");
            script.Attributes.Add("src", src);
            script.Attributes.Add("type", type);

            return page.Html.Raw(script.ToString(TagRenderMode.Normal));
        }

        public static IHtmlString BabylonJSStyle(this WebViewPage page,
            string relPathToBabylonJSFolder) 
        {
            if (page == null)
                return null;

            var type = "text/css";

            var src = page.BabylonJSFile(relPathToBabylonJSFolder);

            var script = new TagBuilder("link");
            script.Attributes.Add("href", src);
            script.Attributes.Add("type", type);
            script.Attributes.Add("rel", "stylesheet");

            return page.Html.Raw(script.ToString(TagRenderMode.Normal));
        }

        public static string BabylonJSSamplesFile(this WebViewPage page,
            string relPathToBabylonJSSamplesFolder)
        {
            if (page == null)
                return null;

            var babylonJSSamplesDirFullPath = Environment.GetEnvironmentVariable("BabylonJSSamplesDirFullPath");

            // relPath must be the last one so filename can be appended to it
            var url = page.Url.Action(BuildOurOwnBabylonJSController.GetFileContentActionName,
                                      "BuildOurOwnBabylonJS",
                                      new { rootPath = babylonJSSamplesDirFullPath, relPath = relPathToBabylonJSSamplesFolder },
                                      page.Request.Url.Scheme);

            return url;
        }


        public static string BabylonJSSamplesFolder(this WebViewPage page)
        {
            if (page == null)
                return null;

            var babylonJSSamplesDirFullPath = Environment.GetEnvironmentVariable("BabylonJSSamplesDirFullPath") + "\\Scenes";

            var url = page.Url.Action(BuildOurOwnBabylonJSController.GetBabylonScenesActionName,
                                      "BuildOurOwnBabylonJS",
                                      new { rootPath = babylonJSSamplesDirFullPath },
                                      page.Request.Url.Scheme);
            return url;
        }
    }
}
