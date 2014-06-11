using System.Windows.Forms;

namespace Max2Babylon
{
    public partial class Vector3Control : UserControl
    {
        public Vector3Control()
        {
            InitializeComponent();
        }

        public float X
        {
            get { return (float)nupX.Value; }
            set { nupX.Value = (decimal)value; }
        }

        public float Y
        {
            get { return (float)nupY.Value; }
            set { nupY.Value = (decimal)value; }
        }

        public float Z
        {
            get { return (float)nupZ.Value; }
            set { nupZ.Value = (decimal)value; }
        }
    }
}
