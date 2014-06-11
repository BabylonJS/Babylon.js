using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;
using Autodesk.Max;
using Autodesk.Max.IMXSDebugger;
using MaxSharp;

namespace Max2Babylon
{
    public static class Tools
    {
        public static float[] ToArray(this IQuat value)
        {
            return new[] { value.X, value.Z, value.Y, value.W };
        }

        public static float[] Scale(this Color value, float scale)
        {
            return new[] { value.r * scale, value.g * scale, value.b * scale };
        }
        public static float[] ToArray(this Color value)
        {
            return new[] { value.r, value.g, value.b };
        }

        public static float[] ToArray(this IPoint3 value)
        {
            return new[] { value.X, value.Y, value.Z };
        }

        public static float[] ToArray(this IPoint2 value)
        {
            return new[] { value.X, value.Y };
        }

        public static float[] ToArraySwitched(this IPoint3 value)
        {
            return new[] { value.X, value.Z, value.Y };
        }

        public static float[] ToArray(this IColor value)
        {
            return new[] { value.R, value.G, value.B };
        }

        public static IEnumerable<Node> NodesListBySuperClass(this Scene scene, SuperClassID sid)
        {
            return from n in scene.NodeTree where n.Object != null && n.Object.SuperClassID == sid select n;
        }

        public static float ConvertFov(float fov)
        {
            return (float)(2.0f * Math.Atan(Math.Tan(fov / 2.0f) / Loader.Core.ImageAspRatio));
        }

        public static bool HasParent(this Node node)
        {
            return node.Parent != null && node.Parent.Object != null;
        }

        public static Guid GetGuid(this Animatable node)
        {
            var appData = node.GetAppData(new ClassID(Loader.Class_ID), SuperClassID.BaseNode);

            var uidData = appData.GetChunk(0);
            Guid uid;

            if (uidData != null)
            {
                uid = new Guid(uidData);
            }
            else
            {
                uid = Guid.NewGuid();
                appData.AddChunk(0, uid.ToByteArray());
            }

            return uid;
        }

        public static Guid GetGuid(this IINode node)
        {
            return GetGuid(Animatable.CreateWrapper<Node>(node));
        }

        public static string GetLocalData(this Node node)
        {
            var appData = node.GetAppData(new ClassID(Loader.Class_ID), SuperClassID.BaseNode);

            var uidData = appData.GetChunk(1);

            if (uidData != null)
            {
                return System.Text.Encoding.UTF8.GetString(uidData);
            }

            return "";
        }

        public static void SetLocalData(this Node node, string value)
        {
            var appData = node.GetAppData(new ClassID(Loader.Class_ID), SuperClassID.BaseNode);

            var uidData = appData.GetChunk(1);

            if (uidData != null)
            {
                appData.RemoveChunk(1);
            }

            appData.AddChunk(1, System.Text.Encoding.UTF8.GetBytes(value));
        }

        public static IMatrix3 GetWorldMatrix(this Node node, TimeValue t, bool parent)
        {
            var innerNode = node._Node;

            var tm = innerNode.GetNodeTM(t, Interval.Forever._IInterval);
            var ptm = innerNode.ParentNode.GetNodeTM(t, Interval.Forever._IInterval);

            if (!parent)
                return tm;

            if (innerNode.ParentNode.SuperClassID == SuperClassID.Camera)
            {
                var r = ptm.GetRow(3);
                ptm.IdentityMatrix();
                ptm.SetRow(3, r);
            }

            ptm.Invert();
            return tm.Multiply(ptm);
        }

        public static IMesh GetMesh(this IObject obj)
        {
            if (obj.CanConvertToType(ClassID.TriObject._IClass_ID) == 0)
                return null;

            var tri = obj.ConvertToType(0, ClassID.TriObject._IClass_ID) as ITriObject;
            return tri == null ? null : tri.Mesh;
        }

        public static bool IsAlmostEqualTo(this IPoint3 current, IPoint3 other, float epsilon)
        {
            if (Math.Abs(current.X - other.X) > epsilon)
            {
                return false;
            }

            if (Math.Abs(current.Y - other.Y) > epsilon)
            {
                return false;
            }

            if (Math.Abs(current.Z - other.Z) > epsilon)
            {
                return false;
            }

            return true;
        }

        public static bool IsAlmostEqualTo(this IPoint2 current, IPoint2 other, float epsilon)
        {
            if (Math.Abs(current.X - other.X) > epsilon)
            {
                return false;
            }

            if (Math.Abs(current.Y - other.Y) > epsilon)
            {
                return false;
            }

            return true;
        }

        public static bool GetBoolProperty(this IINode node, string propertyName, int defaultState = 0)
        {
            int state = defaultState;
            node.GetUserPropBool(ref propertyName, ref state);

            return state == 1;
        }

        public static float GetFloatProperty(this IINode node, string propertyName, float defaultState = 0)
        {
            float state = defaultState;
            node.GetUserPropFloat(ref propertyName, ref state);

            return state;
        }

        public static float[] GetVector3Property(this IINode node, string propertyName)
        {
            float state0 = 0;
            string name = propertyName + "_x";
            node.GetUserPropFloat(ref name, ref state0);

            float state1 = 0;
            name = propertyName + "_y";
            node.GetUserPropFloat(ref name, ref state1);

            float state2 = 0;
            name = propertyName + "_z";
            node.GetUserPropFloat(ref name, ref state2);

            return new[] { state0, state1, state2 };
        }

        public static void PrepareCheckBox(CheckBox checkBox, List<IINode> nodes, string propertyName, int defaultState = 0)
        {
            checkBox.CheckState = CheckState.Indeterminate;
            foreach (var node in nodes)
            {
                var state = node.GetBoolProperty(propertyName, defaultState);

                if (checkBox.CheckState == CheckState.Indeterminate)
                {
                    checkBox.CheckState = state ? CheckState.Checked : CheckState.Unchecked;
                }
                else
                {
                    if (!state && checkBox.CheckState == CheckState.Checked ||
                        state && checkBox.CheckState == CheckState.Unchecked)
                    {
                        checkBox.CheckState = CheckState.Indeterminate;
                        break;
                    }
                }
            }
        }

        public static void UpdateCheckBox(CheckBox checkBox, List<IINode> nodes, string propertyName)
        {
            foreach (var node in nodes)
            {
                if (checkBox.CheckState != CheckState.Indeterminate)
                {
                    node.SetUserPropBool(ref propertyName, checkBox.CheckState == CheckState.Checked);
                }
            }
        }

        public static void PrepareNumericUpDown(NumericUpDown nup, List<IINode> nodes, string propertyName, float defaultState = 0)
        {
            nup.Value = (decimal)nodes[0].GetFloatProperty(propertyName, defaultState);
        }

        public static void UpdateNumericUpDown(NumericUpDown nup, List<IINode> nodes, string propertyName)
        {
            foreach (var node in nodes)
            {
                node.SetUserPropFloat(ref propertyName, (float)nup.Value);
            }
        }

        public static void PrepareVector3Control(Vector3Control vector3Control, IINode node, string propertyName, float defaultX = 0, float defaultY = 0, float defaultZ = 0)
        {
            vector3Control.X = node.GetFloatProperty(propertyName + "_x", defaultX);
            vector3Control.Y = node.GetFloatProperty(propertyName + "_y", defaultY);
            vector3Control.Z = node.GetFloatProperty(propertyName + "_z", defaultZ);
        }

        public static void UpdateVector3Control(Vector3Control vector3Control, IINode node, string propertyName)
        {
            string name = propertyName + "_x";
            node.SetUserPropFloat(ref name, vector3Control.X);

            name = propertyName + "_y";
            node.SetUserPropFloat(ref name, vector3Control.Y);

            name = propertyName + "_z";
            node.SetUserPropFloat(ref name, vector3Control.Z);
        }

        public static void UpdateVector3Control(Vector3Control vector3Control, List<IINode> nodes, string propertyName)
        {
            foreach (var node in nodes)
            {
                UpdateVector3Control(vector3Control, node, propertyName);
            }
        }
    }
}
