using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace Max2Babylon
{
    public static class WebServer
    {
        private static readonly HttpListener listener;
        private static Task runningTask;

        const string HtmlResponseText = @"
<!doctype html>
<html>

<head>
    <title>Babylon.js</title>
    <script type='text/javascript' src='http://www.babylonjs.com/cannon.js'></script>
    <script type='text/javascript' src='http://www.babylonjs.com/babylon.js'></script>
    <style type='text/css'>
        html, body, div, canvas {
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            overflow: hidden;
        }

        #waitLabel {
            position: absolute;
            width: 100%;
            height: 100%;
            font-size: 40px;
            text-align: center;
            top: 50%;
            margin-top: -20px;
            font-family: Arial;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <canvas id='canvas'></canvas>
    <div id='waitLabel'>loading....please wait</div>
    <script type='text/javascript'>
        var canvas = document.getElementById('canvas');
        var engine = new BABYLON.Engine(canvas, true);

        BABYLON.SceneLoader.Load('', '###SCENE###', engine, function (newScene) {
            newScene.activeCamera.attachControl(canvas);

            engine.runRenderLoop(function() {
                newScene.render();
            });

            window.addEventListener('resize', function () {
                engine.resize();
            });

            document.getElementById('waitLabel').style.display = 'none';
        });
    </script>
</body>
</html>";

        public const int Port = 45478;

        public static bool IsSupported { get; private set; }

        static WebServer()
        {
            listener = new HttpListener();

            if (!HttpListener.IsSupported)
            {
                IsSupported = false;
                return;
            }

            try
            {
                listener.Prefixes.Add("http://localhost:" + Port + "/");
                listener.Start();
            }
            catch 
            {
                IsSupported = false;
                return;
            }

            runningTask = Task.Run(() => Listen());

            IsSupported = true;
        }

        public static string SceneFilename { get; set; }
        public static string SceneFolder { get; set; }

        static void Listen()
        {
            try
            {
                while (listener.IsListening)
                {
                    var context = listener.GetContext();
                    var request = context.Request;
                    var url = request.Url;

                    if (string.IsNullOrEmpty(url.PathAndQuery) || url.PathAndQuery == "/")
                    {
                        var responseText = HtmlResponseText.Replace("###SCENE###", SceneFilename);
                        WriteResponse(context, responseText);
                    }
                    else
                    {
                        try
                        {
                            var buffer = File.ReadAllBytes(Path.Combine(SceneFolder, HttpUtility.UrlDecode(url.PathAndQuery.Substring(1))));
                            WriteResponse(context, buffer);
                        }
                        catch
                        {
                            context.Response.StatusCode = 404;
                            context.Response.Close();
                        }
                    }

                }
            }
            catch
            {
            }
        }

        static void WriteResponse(HttpListenerContext context, string s)
        {
            WriteResponse(context.Response, s);
        }

        static void WriteResponse(HttpListenerContext context, byte[] buffer)
        {
            WriteResponse(context.Response, buffer);
        }

        static void WriteResponse(HttpListenerResponse response, string s)
        {
            byte[] buffer = Encoding.UTF8.GetBytes(s);
            WriteResponse(response, buffer);
        }

        static void WriteResponse(HttpListenerResponse response, byte[] buffer)
        {
            response.ContentLength64 = buffer.Length;
            Stream output = response.OutputStream;
            output.Write(buffer, 0, buffer.Length);
            output.Close();
        }
    }
}
