using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using FreeImageAPI;
using FreeImageAPI.Metadata;

namespace Sample10
{
	public partial class MainForm : Form
	{
		[STAThread]
		static void Main()
		{
			// Check if FreeImage.dll is available
			if (!FreeImage.IsAvailable())
			{
				MessageBox.Show("FreeImage is not available. Aborting.", "Error");
			}

			// Add this class to the FreeImage-Message-Callback
			FreeImageEngine.Message += new OutputMessageFunction(FreeImage_Message);

			Application.EnableVisualStyles();
			Application.SetCompatibleTextRenderingDefault(false);
			Application.Run(new MainForm());
		}

		static void FreeImage_Message(FREE_IMAGE_FORMAT fif, string message)
		{
			// Display the data
			MessageBox.Show(
				String.Format("FreeImage-Message:\n{1}\nFormat:{0}", fif.ToString(), message),
				"FreeImage-Message");
		}

		public MainForm()
		{
			InitializeComponent();
		}

		private void bQuit_Click(object sender, EventArgs e)
		{
			Application.Exit();
		}

		private void bLoad_Click(object sender, EventArgs e)
		{
			// Create variables
			OpenFileDialog ofd = new OpenFileDialog();
			FIBITMAP dib = new FIBITMAP();
			try
			{
				// Apply settings
				ofd.CheckFileExists = true;
				ofd.CheckPathExists = true;
				ofd.FileName = "";
				ofd.Filter = "All files (*.*)|*.*";
				ofd.Multiselect = false;
				ofd.RestoreDirectory = true;
				// Get image filename
				if (ofd.ShowDialog() == DialogResult.OK)
				{
					// Load the image
					dib = FreeImage.LoadEx(ofd.FileName);
					// Check if image was loaded successfully
					if (dib.IsNull) throw new Exception("Failed to load image.");
					// Clear the treeview
					tvMetadata.Nodes.Clear();
					// Create a wrapper for all metadata the image contains
					ImageMetadata iMetadata = new ImageMetadata(dib);
					// Get each metadata model
					foreach (MetadataModel metadataModel in iMetadata)
					{
						// Create a new node for each model
						TreeNode modelNode = tvMetadata.Nodes.Add(metadataModel.ToString());
						
						// Get each metadata tag and create a subnode for it
						foreach (MetadataTag metadataTag in metadataModel)
						{
							modelNode.Nodes.Add(metadataTag.Key + ": " + metadataTag.ToString());
						}
					}
				}
				else
				{
					MessageBox.Show("Operation aborted.", "Aborted");
				}				
			}
			// Display error message
			catch (Exception ex)
			{
				while (ex.InnerException != null)
					ex = ex.InnerException;
				MessageBox.Show(ex.ToString(), "Exception caught");
			}
			// Clean up
			finally
			{
				ofd.Dispose();
				FreeImage.UnloadEx(ref dib);
			}
		}
	}
}