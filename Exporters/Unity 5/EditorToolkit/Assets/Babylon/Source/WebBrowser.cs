using System;
using UnityEditor;
using UnityEngine;
using System.Reflection;

namespace Unity3D2Babylon
{

    public sealed class WebBrowser : ScriptableObject
    {
        public static Type WebViewType = Tools.GetTypeFromAllAssemblies("WebView");
        public static Type WebScriptObjectType = Tools.GetTypeFromAllAssemblies("WebScriptObject");

        private ScriptableObject internalWebView;

        private MethodInfo dockedGetterMethod;

        private EditorWindow parentWin;

        private object hostView;

        public WebBrowser()
        {
            this.hostView = null;
            this.parentWin = null;
            this.internalWebView = null;
            this.dockedGetterMethod = null;
        }

        public bool CreateView(EditorWindow parent)
        {
            return AttachView(parent, ScriptableObject.CreateInstance(WebBrowser.WebViewType), true);
        }

        public bool AttachView(EditorWindow parent, ScriptableObject webView, bool initialize = false)
        {
            this.parentWin = parent;
            this.internalWebView = webView;
            if (this.internalWebView != null)
            {
                this.hostView = Tools.GetReflectionField<object>(parent, "m_Parent");
                this.dockedGetterMethod = this.parentWin.GetType().GetProperty("docked", Tools.FullBinding).GetGetMethod(true);
                if (this.hostView != null && dockedGetterMethod != null)
                {
                    if (initialize)
                    {
                        Rect initViewRect = new Rect(0, 20, this.parentWin.position.width, this.parentWin.position.height - ((this.IsDocked()) ? 20 : 40));
                        this.InitWebView(this.hostView, (int)initViewRect.x, (int)initViewRect.y, (int)initViewRect.width, (int)initViewRect.height, false);
                        this.SetHideFlags(HideFlags.HideAndDontSave);
                        this.AllowRightClickMenu(true);
                    }
                }
                else
                {
                    throw new Exception("Failed to get parent window or docked property");
                }
            }
            return (this.internalWebView != null);
        }

        public bool IsValid()
        {
            return (this.internalWebView != null);
        }

        public bool IsDocked()
        {
            return (this.parentWin != null && dockedGetterMethod != null) ? (bool)(dockedGetterMethod.Invoke(this.parentWin, null)) : false;
        }

        public bool HasFocus()
        {
            return (this.parentWin != null) ? Tools.GetReflectionProperty<bool>(this.parentWin, "hasFocus") : false;
        }

        public ScriptableObject GetWebView()
        {
            return this.internalWebView;
        }

        public object GetHostView()
        {
            return this.hostView;
        }

        public Type GetViewType()
        {
            return this.internalWebView.GetType();
        }

        public void OnDestroy()
        {
            UnityEngine.Object.DestroyImmediate(this.internalWebView, true);
        }

        public void SetHideFlags(HideFlags flags)
        {
            this.internalWebView.hideFlags = flags;
        }

        public void DestroyWebView()
        {
            Tools.CallReflectionMethod(this.internalWebView, "DestroyWebView");
        }

        public void InitWebView(object host, int x, int y, int width, int height, bool showResizeHandle)
        {
            Tools.CallReflectionMethod(this.internalWebView, "InitWebView", host, x, y, width, height, showResizeHandle);
        }

        public void ExecuteJavascript(string scriptCode)
        {
            Tools.CallReflectionMethod(this.internalWebView, "ExecuteJavascript", scriptCode);
        }

        public void LoadURL(string url)
        {
            Tools.CallReflectionMethod(this.internalWebView, "LoadURL", url);
        }

        public void LoadFile(string path)
        {
            Tools.CallReflectionMethod(this.internalWebView, "LoadFile", path);
        }

        public bool DefineScriptObject(string path, ScriptableObject obj)
        {
            return Tools.CallReflectionMethod<bool>(this.internalWebView, "DefineScriptObject", path, obj);
        }

        public void SetDelegateObject(ScriptableObject value)
        {
            Tools.CallReflectionMethod(this.internalWebView, "SetDelegateObject", value);
        }

        public void SetHostView(object view)
        {
            Tools.CallReflectionMethod(this.internalWebView, "SetHostView", view);
        }

        public void SetSizeAndPosition(int x, int y, int width, int height)
        {
            Tools.CallReflectionMethod(this.internalWebView, "SetSizeAndPosition", x, y, width, height);
        }

        public void SetFocus(bool value)
        {
            Tools.CallReflectionMethod(this.internalWebView, "SetFocus", value);
        }

        public bool HasApplicationFocus()
        {
            return Tools.CallReflectionMethod<bool>(this.internalWebView, "HasApplicationFocus");
        }

        public void SetApplicationFocus(bool applicationFocus)
        {
            Tools.CallReflectionMethod(this.internalWebView, "SetApplicationFocus", applicationFocus);
        }

        public void Show()
        {
            Tools.CallReflectionMethod(this.internalWebView, "Show");
        }

        public void Hide()
        {
            Tools.CallReflectionMethod(this.internalWebView, "Hide");
        }

        public void Back()
        {
            Tools.CallReflectionMethod(this.internalWebView, "Back");
        }

        public void Forward()
        {
            Tools.CallReflectionMethod(this.internalWebView, "Forward");
        }

        public void SendOnEvent(string jsonStr)
        {
            Tools.CallReflectionMethod(this.internalWebView, "SendOnEvent", jsonStr);
        }

        public void Reload()
        {
            Tools.CallReflectionMethod(this.internalWebView, "Reload");
        }

        public void AllowRightClickMenu(bool allowRightClickMenu)
        {
            Tools.CallReflectionMethod(this.internalWebView, "AllowRightClickMenu", allowRightClickMenu);
        }

        public void ShowDevTools()
        {
            Tools.CallReflectionMethod(this.internalWebView, "ShowDevTools");
        }

        public void ToggleMaximize()
        {
            Tools.CallReflectionMethod(this.internalWebView, "ToggleMaximize");
        }

        public static void OnDomainReload()
        {
            Tools.CallStaticReflectionMethod(WebBrowser.WebViewType, "OnDomainReload");
        }
    }
}
