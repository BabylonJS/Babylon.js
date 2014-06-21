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

        TreeNode currentNode = null;
        int currentRank = 0;

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

            treeView.Nodes.Clear();

            exporter.OnImportProgressChanged += progress =>
            {
                progressBar.Value = progress;
                Application.DoEvents();
            };

            exporter.OnWarning += (warning, rank) =>
            {
                try
                {
                    currentNode = CreateTreeNode(rank, warning, Color.Orange);
                    currentNode.EnsureVisible();
                }
                catch
                {
                }
                Application.DoEvents();
            };

            exporter.OnError += (error, rank) =>
            {
                try
                {
                    currentNode = CreateTreeNode(rank, error, Color.Red);
                    currentNode.EnsureVisible();
                }
                catch
                {
                }
                Application.DoEvents();
            };

            exporter.OnMessage += (message, color, rank, emphasis) =>
            {
                try
                {
                    currentNode = CreateTreeNode(rank, message, color);

                    if (emphasis)
                    {
                        currentNode.EnsureVisible();
                    }
                }
                catch
                {
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
                currentNode = CreateTreeNode(0, "Exportation cancelled: " + ex.Message, Color.Red);

                currentNode.EnsureVisible();
                progressBar.Value = 0;
            }

            butCancel.Enabled = false;
            butExport.Enabled = true;
        }

        private TreeNode CreateTreeNode(int rank, string text, Color color)
        {
            var newNode = new TreeNode(text) { ForeColor = color };
            if (rank == 0)
            {
                treeView.Nodes.Add(newNode);
            }
            else if (rank == currentRank + 1)
            {
                currentNode.Nodes.Add(newNode);
            }
            else
            {
                var parentNode = currentNode;
                while (currentRank != rank - 1)
                {
                    parentNode = parentNode.Parent;
                    currentRank--;
                }
                parentNode.Nodes.Add(newNode);
            }

            currentRank = rank;
            return newNode;
        }

        private void ExporterForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            exporter.IsCancelled = true;
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
