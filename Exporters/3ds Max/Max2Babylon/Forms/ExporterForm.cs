using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using MaxCustomControls;
using MaxSharp;
using Color = System.Drawing.Color;

namespace Max2Babylon
{
    public partial class ExporterForm : MaxForm
    {
        private readonly BabylonExportActionItem babylonExportAction;

        public ExporterForm(BabylonExportActionItem babylonExportAction)
        {
            InitializeComponent();

            this.babylonExportAction = babylonExportAction;
        }

        private void ExporterForm_Load(object sender, EventArgs e)
        {
            txtFilename.Text = Kernel.Scene.RootNode.GetLocalData();
        }

        private void butBrowse_Click(object sender, EventArgs e)
        {
            if (saveFileDialog.ShowDialog(this) == DialogResult.OK)
            {
                txtFilename.Text = saveFileDialog.FileName;
            }
        }

        private async void butExport_Click(object sender, EventArgs e)
        {
            Kernel.Scene.RootNode.SetLocalData(txtFilename.Text);

            var exporter = new BabylonExporter();
            TreeNode currentNode = null;
            TreeNode previousNode = null;

            treeView.Nodes.Clear();

            exporter.OnImportProgressChanged += progress => Invoke(new Action(() =>
            {
                progressBar.Value = progress;
            }));

            exporter.OnWarning += (warning, asChild) => Invoke(new Action(() =>
            {
                previousNode = new TreeNode(warning) { ForeColor = Color.Orange };

                currentNode = CreateTreeNode(asChild, currentNode, previousNode);

                previousNode.EnsureVisible();
            }));

            exporter.OnError += (error, asChild) => Invoke(new Action(() =>
            {
                previousNode = new TreeNode(error) { ForeColor = Color.Red };

                currentNode = CreateTreeNode(asChild, currentNode, previousNode);

                previousNode.EnsureVisible();
            }));

            exporter.OnMessage += (message, asChild, emphasis, embed) => Invoke(new Action(() =>
            {
                var oldPrevious = previousNode;

                previousNode = new TreeNode(message);

                if (emphasis)
                {
                    previousNode.ForeColor = Color.Green;
                }

                currentNode = CreateTreeNode(asChild || embed, embed ? oldPrevious : currentNode, previousNode);

                if (emphasis)
                {
                    previousNode.EnsureVisible();
                }
            }));

            await Task.Run(() => exporter.Export(txtFilename.Text));
        }

        private TreeNode CreateTreeNode(bool asChild, TreeNode currentNode, TreeNode treeNode)
        {
            if (asChild)
            {
                currentNode.Nodes.Add(treeNode);
            }
            else
            {
                treeView.Nodes.Add(treeNode);
            }

            if (!asChild)
            {
                currentNode = treeNode;
            }
            return currentNode;
        }

        private void ExporterForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            babylonExportAction.Close();
        }

        private void txtFilename_TextChanged(object sender, EventArgs e)
        {
            butExport.Enabled = !string.IsNullOrEmpty(txtFilename.Text.Trim());
        }
    }
}
