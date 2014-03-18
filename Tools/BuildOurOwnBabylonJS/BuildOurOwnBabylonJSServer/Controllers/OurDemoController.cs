using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.IO;
using BuildOurOwnBabylonJSServer.ViewModels;

namespace BuildOurOwnBabylonJSServer.Controllers
{
    public class OurDemoController : Controller
    {
        public ActionResult Show(string viewName, 
            string folder = "")
        {
            var form = Request.Form;
            var queryString = Request.QueryString;
            var dictionary = new Dictionary<string, string>(form.Count + queryString.Count);

            var keys = form.AllKeys;
            
            foreach(var k in keys)
            {
                if (k == "viewName" || k == "folder")
                    continue;
                dictionary.Add(k, form.GetValues(k).First());
            }

            keys = queryString.AllKeys;

            foreach (var k in keys)
            {
                if (k == "viewName" || k == "folder")
                    continue;
                dictionary.Add(k, queryString.GetValues(k).First());
            }

            return View(Path.Combine(folder, viewName),
                new OurDemoViewModel { Folder = folder, Dictionary = dictionary });
        }
    }
}
