using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace BuildOurOwnBabylonJSServer.Controllers
{
    public class BabylonJSDemoController : Controller
    {
        public ActionResult Index(string demoFolderName, string demoFile)
        {
            ViewBag.DemoFolderName = demoFolderName;
            ViewBag.DemoFile = demoFile;
            
            return View();
        }
    }
}
