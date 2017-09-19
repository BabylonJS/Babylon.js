using System;
using System.ComponentModel;
using System.Windows.Forms;
using FreeImageAPI;
using FreeImageAPI.Metadata;

namespace Sample11
{
	public partial class MetaDataFrame : Form
	{
		public MetaDataFrame()
		{
			InitializeComponent();
		}

		private void MetaDataFrame_Load(object sender, EventArgs e)
		{
			ImageMetadata iMetadata = this.Tag as ImageMetadata;
			if (iMetadata != null)
			{
				bool backup = iMetadata.HideEmptyModels;
				iMetadata.HideEmptyModels = false;
				try
				{
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
				// Display error message
				catch (Exception ex)
				{
					while (ex.InnerException != null)
						ex = ex.InnerException;
					MessageBox.Show(ex.ToString(), "Exception caught");
				}
				iMetadata.HideEmptyModels = backup;
			}
		}
	}
}