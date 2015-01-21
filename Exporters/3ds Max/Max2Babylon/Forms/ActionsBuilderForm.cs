using System;
using System.Collections.Generic;
using System.Windows.Forms;
using Autodesk.Max;

namespace Max2Babylon
{
    public partial class ActionsBuilderForm : Form
    {
        private IINode _node = null;

        private HtmlDocument _document;
        private string _objectName;
        private string _propertyName = "babylon_actionsbuilder";
        private string _jsonResult = "";
        private bool isRootNode;

        public ActionsBuilderForm()
        {
            InitializeComponent();
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

            string currentDirectory = System.IO.Directory.GetCurrentDirectory();
            ActionsBuilderWebView.Url = new Uri(string.Format("file:///{0}/bin/assemblies/BabylonActionsBuilder/index.html", currentDirectory), System.UriKind.Absolute);
        }

        private void ActionsBuilderWebView_DocumentCompleted(object sender, WebBrowserDocumentCompletedEventArgs e)
        {
            _document = ActionsBuilderWebView.Document;
            _document.GetElementById("ActionsBuilderObjectName").SetAttribute("value", _objectName);

            if (isRootNode)
                _document.InvokeScript("setIsScene");
            else
                _document.InvokeScript("setIsObject");

            _document.InvokeScript("updateObjectName");

            if (getProperty())
            {
                _document.GetElementById("ActionsBuilderJSON").SetAttribute("value", _jsonResult);
                _document.InvokeScript("updateGraphFromJSON");
            }
        }

        private void butOK_Click(object sender, EventArgs e)
        {
            _document.InvokeScript("updateJSONFromGraph");
            _jsonResult = _document.GetElementById("ActionsBuilderJSON").GetAttribute("value");

            setProperty();
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
    }
}
