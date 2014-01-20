using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace BuildOurOwnBabylonJSServer.Controllers
{
    public class OurDemoController : Controller
    {
        public ActionResult Show(string demo)
        {
            return View(demo);
        }
    }
}
