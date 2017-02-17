using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using UnityEngine;

namespace Unity3D2Babylon
{
    public static class WebServer
    {
        private static readonly HttpListener listener;

        const string HtmlResponseText = @"
<!doctype html>
<html>

<head>
    <title>Babylon.js</title>
    <script type='text/javascript' src='http://www.babylonjs.com/oimo.js'></script>
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

        #debugLayerButton {
            position: absolute;
            border: white solid 1px;
            background: rgba(128, 128, 128, 0.3);
            color: white;
            left: 50%;
            width: 100px;
            margin-left:-50px;
            bottom: 10px;
        }
    </style>
</head>

<body>
    <canvas id='canvas'></canvas>
    <button id='debugLayerButton'>Debug layer</button>
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

            document.getElementById('debugLayerButton').addEventListener('click', function () {
                if (newScene.debugLayer.isVisible()) {
                    newScene.debugLayer.hide();
                } else {
                    newScene.debugLayer.show();
                }
            });
        });
    </script>
</body>
</html>";

        public const int Port = 45478;

        public static bool IsSupported { get; private set; }

        static WebServer()
        {
            try
            {
                listener = new HttpListener();

                if (!HttpListener.IsSupported)
                {
                    IsSupported = false;
                    return;
                }

                listener.Prefixes.Add("http://localhost:" + Port + "/");
                listener.Start();

                ThreadPool.QueueUserWorkItem(Listen);

                IsSupported = true;
            }
            catch
            {
                IsSupported = false;
            }
        }

        public static string SceneFilename { get; set; }
        public static string SceneFolder { get; set; }
        static System.Random r = new System.Random();
        static void Listen(object state)
        {
            try
            {
                while (listener.IsListening)
                {
                    var context = listener.GetContext();
                    var request = context.Request;
                    var url = request.Url;

                    context.Response.AddHeader("Cache-Control", "no-cache");
                    if (string.IsNullOrEmpty(url.LocalPath) || url.LocalPath == "/")
                    {

                        var responseText = HtmlResponseText.Replace("###SCENE###", SceneFilename+"?once="+r.Next());
                        WriteResponse(context, responseText);
                    }
                    else
                    {
                        try
                        {
                            var path = Path.Combine(SceneFolder, WWW.UnEscapeURL(url.PathAndQuery.Substring(1)));
                            var questionMarkIndex = path.IndexOf("?");
                            if (questionMarkIndex != -1)
                            {
                                path = path.Substring(0, questionMarkIndex);
                            }
                            var hashIndex = path.IndexOf("#");
                            if (hashIndex != -1)
                            {
                                path = path.Substring(0, hashIndex);
                            }
                            var buffer = File.ReadAllBytes(path);
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
