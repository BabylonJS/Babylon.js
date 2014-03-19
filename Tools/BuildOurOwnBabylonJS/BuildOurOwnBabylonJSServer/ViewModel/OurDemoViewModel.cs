using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.IO;

namespace BuildOurOwnBabylonJSServer.ViewModels
{
    public class OurDemoViewModel
    {
        public string Folder { get; set; }
        public IDictionary<string, string> Dictionary { get; set; }
    }
}
