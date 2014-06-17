using Autodesk.Max;
using SharpDX;

namespace Max2Babylon
{
    public class VNormal
    {
        Vector3 norm;
        uint smooth;
        VNormal next;
        bool init;

        public VNormal()
        {
            smooth = 0;
            next = null;
            init = false;
            norm = new Vector3(0, 0, 0);
        }

        public VNormal(Vector3 n, uint s)
        {
            next = null;
            init = true;
            norm = n;
            smooth = s;
        }

        public void AddNormal(Vector3 n, uint s)
        {
            if (((s & smooth) == 0) && init)
            {
                if (next != null)
                    next.AddNormal(n, s);
                else
                {
                    next = new VNormal(n, s);
                }
            }
            else
            {
                norm += n;
                smooth |= s;
                init = true;
            }
        }

        public IPoint3 GetNormal(uint s)
        {
            if (((smooth & s) != 0) || next == null)
                return norm.ToPoint3();

            return next.GetNormal(s);
        }

        // Normalize each normal in the list
        public void Normalize()
        {
            VNormal ptr = next;
            VNormal prev = this;

            while (ptr != null)
            {
                if ((ptr.smooth & smooth) != 0)
                {
                    norm += ptr.norm;
                    prev.next = ptr.next;
                    ptr = prev.next;
                }
                else
                {
                    prev = ptr;
                    ptr = ptr.next;
                }
            }
            norm.Normalize();

            if (next != null)
            {
                next.Normalize();
            }
        }
    }
}
