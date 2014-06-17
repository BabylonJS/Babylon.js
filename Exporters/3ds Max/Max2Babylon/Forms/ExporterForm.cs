using System;
using System.Threading;
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
        private CancellationTokenSource cancellationToken;

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

            exporter.OnImportProgressChanged += progress => BeginInvoke(new Action(() =>
            {
                progressBar.Value = progress;
            }));

            exporter.OnWarning += (warning, asChild) => BeginInvoke(new Action(() =>
            {
                previousNode = new TreeNode(warning) { ForeColor = Color.Orange };

                currentNode = CreateTreeNode(asChild, currentNode, previousNode);

                previousNode.EnsureVisible();
            }));

            exporter.OnError += (error, asChild) => BeginInvoke(new Action(() =>
            {
                previousNode = new TreeNode(error) { ForeColor = Color.Red };

                currentNode = CreateTreeNode(asChild, currentNode, previousNode);

                previousNode.EnsureVisible();
            }));

            exporter.OnMessage += (message, asChild, emphasis, embed, color) => BeginInvoke(new Action(() =>
            {
                var oldPrevious = previousNode;

                previousNode = new TreeNode(message);
                previousNode.ForeColor = color;

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

            butExport.Enabled = false;
            butCancel.Enabled = true;

            cancellationToken = new CancellationTokenSource();
            var token = cancellationToken.Token;

            try
            {
                await Task.Run(() => exporter.Export(txtFilename.Text, token), token);
            }
            catch
            {
                previousNode = new TreeNode("Exportation cancelled") { ForeColor = Color.Red };

                currentNode = CreateTreeNode(false, currentNode, previousNode);

                previousNode.EnsureVisible();
                progressBar.Value = 0;
            }

            butCancel.Enabled = false;
            butExport.Enabled = true;
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

        private void butCancel_Click(object sender, EventArgs e)
        {
            cancellationToken.Cancel();
        }
    }
}
