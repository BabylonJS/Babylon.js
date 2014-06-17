using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;
using Autodesk.Max;
using MaxSharp;
using SharpDX;
using Color = MaxSharp.Color;

namespace Max2Babylon
{
    public static class Tools
    {
        public const float Epsilon = 0.001f;

        public static void PreparePipeline(IINode node, bool deactivate)
        {
            var obj = node.ObjectRef;

            if (obj.SuperClassID != SClass_ID.GenDerivob)
            {
                return;
            }

            var derivedObject = obj as IIDerivedObject;

            if (derivedObject == null)
            {
                return;
            }

            for (var index = 0; index < derivedObject.NumModifiers; index++)
            {
                var modifier = derivedObject.GetModifier(index);

                if (modifier.ClassID.PartA == 9815843 && modifier.ClassID.PartB == 87654) // Skin
                {
                    if (deactivate)
                    {
                        modifier.DisableMod();
                    }
                    else
                    {
                        modifier.EnableMod();
                    }
                }
            }
        }

        public static VNormal[] ComputeNormals(IMesh mesh)
        {
            var vnorms = new VNormal[mesh.NumVerts];
            var fnorms = new Vector3[mesh.NumFaces];

            for (var index = 0; index < mesh.NumVerts; index++)
            {
                vnorms[index] = new VNormal();
            }

            for (var index = 0; index < mesh.NumFaces; index++)
            {
                var face = mesh.Faces[index];
                Vector3 v0 = mesh.Verts[(int)face.V[0]].ToVector3();
                Vector3 v1 = mesh.Verts[(int)face.V[1]].ToVector3();
                Vector3 v2 = mesh.Verts[(int)face.V[2]].ToVector3();

                fnorms[index] = Vector3.Cross((v1 - v0), (v2 - v1));

                for (var j = 0; j < 3; j++)
                {
                    vnorms[(int)face.V[j]].AddNormal(fnorms[index], face.SmGroup);
                }

                fnorms[index].Normalize();
            }

            for (var index = 0; index < mesh.NumVerts; index++)
            {
                vnorms[index].Normalize();
            }

            return vnorms;
        }

        public static bool IsEqualTo(this float[] value, float[] other)
        {
            if (value.Length != other.Length)
            {
                return false;
            }

            return !value.Where((t, i) => Math.Abs(t - other[i]) > Epsilon).Any();
        }

        public static float[] ToArray(this IMatrix3 value)
        {
            var row0 = value.GetRow(0).ToArraySwitched();
            var row1 = value.GetRow(1).ToArraySwitched();
            var row2 = value.GetRow(2).ToArraySwitched();
            var row3 = value.GetRow(3).ToArraySwitched();

            return new[]
            {
                row0[0], row0[1], row0[2], 0,
                row2[0], row2[1], row2[2], 0,
                row1[0], row1[1], row1[2], 0,
                row3[0], row3[1], row3[2], 1
            };
        }

        public static IPoint3 ToPoint3(this Vector3 value)
        {
            return Loader.Global.Point3.Create(value.X, value.Y, value.Z);
        }

        public static Vector3 ToVector3(this IPoint3 value)
        {
            return new Vector3(value.X, value.Y, value.Z);
        }

        public static Quaternion ToQuat(this IQuat value)
        {
            return new Quaternion(value.X, value.Z, value.Y, value.W );
        }
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

        public static float[] ToArraySwitched(this IPoint2 value)
        {
            return new[] { value.X, 1.0f - value.Y };
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
            return from n in scene.NodeTree where n.Object != null && n._Node.EvalWorldState(0, false).Obj.SuperClassID == sid select n;
        }

        public static IEnumerable<Node> NodesListBySuperClasses(this Scene scene, SuperClassID[] sids)
        {
            return from n in scene.NodeTree where n.Object != null && sids.Any(sid => n._Node.EvalWorldState(0, false).Obj.SuperClassID == sid) select n;
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

        public static ITriObject GetMesh(this IObject obj, out bool mustBeDeleted)
        {
            mustBeDeleted = false;
            if (obj.CanConvertToType(ClassID.TriObject._IClass_ID) == 0)
                return null;

            var tri = obj.ConvertToType(0, ClassID.TriObject._IClass_ID) as ITriObject;

            mustBeDeleted = (tri != obj);

            return tri;
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
