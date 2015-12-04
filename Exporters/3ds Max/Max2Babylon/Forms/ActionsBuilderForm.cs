using System;
using System.IO;
using System.Collections.Generic;
using System.Windows.Forms;
using Autodesk.Max;
using System.Runtime.InteropServices;

namespace Max2Babylon
{

    public partial class ActionsBuilderForm : Form
    {
        private readonly BabylonActionsBuilderActionItem _babylonActionsBuilderAction;
        private IINode _node = null;

        private HtmlDocument _document;
        private string _objectName;
        private string _propertyName = "babylon_actionsbuilder";
        private string _jsonResult = "";
        private bool isRootNode;

        public ActionsBuilderForm(BabylonActionsBuilderActionItem babylonActionsBuilderAction)
        {
            InitializeComponent();

            // Finish
            _babylonActionsBuilderAction = babylonActionsBuilderAction;
        }
        
        private void ActionsBuilderForm_Load(object sender, EventArgs e)
        {
            if (Loader.Core.SelNodeCount > 0)
            {
                isRootNode = false;
                _node = Loader.Core.GetSelNode(0);
            }
            else
            {
                isRootNode = true;
                _node = Loader.Core.RootNode;
            }
            _objectName = _node.Name;

            // Set url (webview)
            string assemblyPath = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().CodeBase);
            ActionsBuilderWebView.Url = new Uri(string.Format("{0}/BabylonActionsBuilder/index.html", assemblyPath), System.UriKind.Absolute);
        }

        private void ActionsBuilderForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            _babylonActionsBuilderAction.Close();
        }

        private void fillObjectsList(ITab<IIGameNode> list, string scriptName)
        {
            object[] names = new object[list.Count];
            for (int i = 0; i < list.Count; i++)
            {
                var indexer = new IntPtr(i);
                var node = list[indexer];
                names[i] = node.MaxNode.Name;
            }
            _document.InvokeScript(scriptName, names);
        }

        private void fillSoundsList(ITab<IIGameNode> list, string scriptName)
        {
            object[] names = new object[list.Count];
            for (int i = 0; i < list.Count; i++)
            {
                var indexer = new IntPtr(i);
                var node = list[indexer].MaxNode;
                string soundFile = "";

                soundFile = Tools.GetStringProperty(node, "babylonjs_sound_filename", soundFile);
                names[i] = Path.GetFileName(soundFile);
            }
            _document.InvokeScript(scriptName, names);
        }

        private void ActionsBuilderWebView_DocumentCompleted(object sender, WebBrowserDocumentCompletedEventArgs e)
        {
            // Set common properties (name, is scene or object, etc.)
            _document = ActionsBuilderWebView.Document;

            // Update screen
            _document.InvokeScript("hideButtons");

            // Set object name
            _document.GetElementById("ActionsBuilderObjectName").SetAttribute("value", _objectName);
            _document.InvokeScript("updateObjectName");

            if (isRootNode)
                _document.InvokeScript("setIsScene");
            else
                _document.InvokeScript("setIsObject");

            //_document.InvokeScript("updateObjectName");

            if (getProperty())
            {
                _document.GetElementById("ActionsBuilderJSON").SetAttribute("value", _jsonResult);
                _document.InvokeScript("loadFromJSON");
            }

            // Set lists of meshes, lights, cameras etc.
            var gameScene = Loader.Global.IGameInterface;
            gameScene.InitialiseIGame(false);

            var meshes = gameScene.GetIGameNodeByType(Autodesk.Max.IGameObject.ObjectTypes.Mesh);
            fillObjectsList(meshes, "setMeshesNames");

            var lights = gameScene.GetIGameNodeByType(Autodesk.Max.IGameObject.ObjectTypes.Light);
            fillObjectsList(lights, "setLightsNames");

            var cameras = gameScene.GetIGameNodeByType(Autodesk.Max.IGameObject.ObjectTypes.Camera);
            fillObjectsList(cameras, "setCamerasNames");

            fillSoundsList(meshes, "setSoundsNames");

            // Finish
            _document.InvokeScript("resetList");

            // Need to subclass this, then allow 3ds Max usage 
            //Win32.SubClass(this.ActionsBuilderWebView.Handle);
        }

        private void butOK_Click(object sender, EventArgs e)
        {
            _document.InvokeScript("createJSON");
            _jsonResult = _document.GetElementById("ActionsBuilderJSON").GetAttribute("value");

            setProperty();

            _babylonActionsBuilderAction.Close();
        }

        private void ActionsBuilderForm_Activated(object sender, EventArgs e)
        {
            Loader.Global.DisableAccelerators();
        }

        private void ActionsBuilderForm_Deactivate(object sender, EventArgs e)
        {
            Loader.Global.EnableAccelerators();
        }

        private void setProperty()
        {
            if (_node != null)
                Tools.SetStringProperty(_node, _propertyName, _jsonResult);
        }

        private bool getProperty()
        {
            if (_node != null)
                _jsonResult = Tools.GetStringProperty(_node, _propertyName, _jsonResult);
            else
                return false;

            return true;
        }

        private void butCancel_Click(object sender, EventArgs e)
        {
            _babylonActionsBuilderAction.Close();
        }
    }

}
