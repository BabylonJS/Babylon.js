using System.Web.Mvc;
using System.IO;
using System.Text;
using System.Web;
using BabylonJSServer.Controllers;

namespace BabylonJSServer.Extensions
{
    public static class WebViewPageExtensions
    {
        public static IHtmlString BabylonJSScript(this WebViewPage page, 
            string relPathToBabylonJSFolder)
        {
            if (page == null)
                return null;
            
            var type = "text/javascript";
            var src = page.Url.Action(BabylonJSController.GetFileContentActionName, 
                                      "BabylonJS", 
                                      new { rootPath = page.ViewBag.BabylonJSFolder, relPath = relPathToBabylonJSFolder, type = type });

            var script = new TagBuilder("script");
            script.Attributes.Add("src", src);
            script.Attributes.Add("type", type);

            return page.Html.Raw(script.ToString(TagRenderMode.Normal));
        }
    }
}
