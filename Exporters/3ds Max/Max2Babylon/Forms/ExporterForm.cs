using System;
using System.Windows.Forms;
using MaxCustomControls;
using MaxSharp;
using Color = System.Drawing.Color;

namespace Max2Babylon
{
    public partial class ExporterForm : MaxForm
    {
        private readonly BabylonExportActionItem babylonExportAction;
        private BabylonExporter exporter;

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

        private void butExport_Click(object sender, EventArgs e)
        {
            Kernel.Scene.RootNode.SetLocalData(txtFilename.Text);

            exporter = new BabylonExporter();
            TreeNode currentNode = null;
            TreeNode previousNode = null;

            treeView.Nodes.Clear();

            exporter.OnImportProgressChanged += progress => 
            {
                progressBar.Value = progress;
                Application.DoEvents();
            };

            exporter.OnWarning += (warning, asChild) => 
            {
                previousNode = new TreeNode(warning) { ForeColor = Color.Orange };

                currentNode = CreateTreeNode(asChild, currentNode, previousNode);

                previousNode.EnsureVisible();
                Application.DoEvents();
            };

            exporter.OnError += (error, asChild) =>
            {
                previousNode = new TreeNode(error) { ForeColor = Color.Red };

                currentNode = CreateTreeNode(asChild, currentNode, previousNode);

                previousNode.EnsureVisible();
                Application.DoEvents();
            };

            exporter.OnMessage += (message, asChild, emphasis, embed, color) => 
            {
                var oldPrevious = previousNode;

                previousNode = new TreeNode(message) {ForeColor = color};

                if (emphasis)
                {
                    previousNode.ForeColor = Color.Green;
                }

                currentNode = CreateTreeNode(asChild || embed, embed ? oldPrevious : currentNode, previousNode);

                if (emphasis)
                {
                    previousNode.EnsureVisible();
                }
                Application.DoEvents();
            };

            butExport.Enabled = false;
            butCancel.Enabled = true;

            try
            {
                exporter.Export(txtFilename.Text);
            }
            catch (OperationCanceledException)
            {
                progressBar.Value = 0;                
            }
            catch (Exception ex)
            {
                previousNode = new TreeNode("Exportation cancelled: " + ex.Message) { ForeColor = Color.Red };

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
            exporter.IsCancelled = true;
        }
    }
}
