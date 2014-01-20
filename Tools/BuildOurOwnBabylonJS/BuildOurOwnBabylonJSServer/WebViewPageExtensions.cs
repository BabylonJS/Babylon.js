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

            // relPath must be the last one so filename must be appended to it
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
    }
}
