using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Text;
using System.Windows.Forms;
using FreeImageAPI;
using System.Runtime.InteropServices;
using System.Security.Permissions;

namespace Sample08
{
	public partial class SampleForm : Form
	{
		SerializationPlugin serialPlugin;

		[STAThread]
		static void Main()
		{
			// Check if FreeImage is available
			if (!FreeImage.IsAvailable())
			{
				throw new Exception("FreeImage is not available!");
			}

			Application.EnableVisualStyles();
			Application.SetCompatibleTextRenderingDefault(false);
			Application.Run(new SampleForm());
		}

		public SampleForm()
		{
			InitializeComponent();
			FreeImageEngine.Message += new OutputMessageFunction(FreeImage_Message);

			// Creating a new instance of the plugin will register it automatically.
			serialPlugin = new SerializationPlugin();
		}

		void FreeImage_Message(FREE_IMAGE_FORMAT fif, string message)
		{
			// Show the message
			MessageBox.Show(String.Format("Format: {0}\nMessage: {1}", fif, message), "FreeImage Message");
		}

		private void bLoad_Click(object sender, EventArgs e)
		{
			// Create a new dialog instance
			OpenFileDialog ofd = new OpenFileDialog();
			try
			{
				// Apply settings
				ofd.CheckPathExists = true;
				ofd.CheckFileExists = true;
				ofd.RestoreDirectory = true;
				ofd.Filter = "All files (*.*)|*.*";
				
				// Get filename
				if (ofd.ShowDialog(this) == DialogResult.OK)
				{
					Bitmap bitmap = null;
					try
					{
						// Try loading the selected file
						// a ser-file will create an exception
						bitmap = (Bitmap)Bitmap.FromFile(ofd.FileName);
					}
					catch
					{
						MessageBox.Show("Unable to load bitmap from file.", "Error");
						return;
					}

					// Unload old bitmap
					if (pictureBox.Image != null)
					{
						pictureBox.Image.Dispose();
					}

					// Set new bitmap
					pictureBox.Image = bitmap;
					MessageBox.Show("Bitmap loaded successfully", "Success");
				}
				else
				{
					MessageBox.Show("Action aborted.");
				}
			}
			finally
			{
				// Unload dialog
				ofd.Dispose();
			}
		}

		private void LoadSerBitmap_Click(object sender, EventArgs e)
		{
			// Creat a new dialog
			OpenFileDialog ofd = new OpenFileDialog();

			FIBITMAP dib = new FIBITMAP();
			try
			{
				// Apply settings
				ofd.CheckPathExists = true;
				ofd.CheckFileExists = true;
				ofd.RestoreDirectory = true;
				ofd.Filter = "Serialized bitmap (*.ser)|*.ser";
				
				// Get filename
				if (ofd.ShowDialog() == DialogResult.OK)
				{
					// Try loading the file forcing the new format
					dib = FreeImage.Load(serialPlugin.Format, ofd.FileName, FREE_IMAGE_LOAD_FLAGS.DEFAULT);
					if (dib.IsNull)
					{
						MessageBox.Show("Loading bitmap failed", "Error");
						return;
					}

					// Convert the loaded bitmap into a .NET bitmap
					Bitmap bitmap = FreeImage.GetBitmap(dib);
					if (bitmap == null)
					{
						MessageBox.Show("Converting bitmap failed.", "Error");
						return;
					}

					// Unload the picturebox
					if (pictureBox.Image != null)
					{
						pictureBox.Image.Dispose();
					}

					// Apply the loaded bitmap
					pictureBox.Image = bitmap;
					MessageBox.Show("Bitmap loaded successfully", "Success");
				}
				else
				{
					MessageBox.Show("Action aborted.");
				}
			}
			finally
			{
				// Unload bitmap
				FreeImage.UnloadEx(ref dib);

				// Unload dialog
				ofd.Dispose();
			}
		}

		private void SaveToSer_Click(object sender, EventArgs e)
		{
			// Create a new dialog
			SaveFileDialog sfd = new SaveFileDialog();

			FIBITMAP dib = new FIBITMAP();
			try
			{
				// Check if the picture box contains a bitmap that can be saved.
				if (pictureBox.Image == null)
				{
					MessageBox.Show("No bitmap loaded.", "Error");
					return;
				}

				// Convert the picture-boxes bitmap into a FreeImage bitmap.
				dib = FreeImage.CreateFromBitmap((Bitmap)pictureBox.Image);
				if (dib.IsNull)
				{
					MessageBox.Show("Unable to convert bitmap to FIBITMAP.", "Error");
					return;
				}

				// Apply settings
				sfd.Filter = "Serialized bitmap (*.ser)|*.ser";
				sfd.FileName = "Bitmap.ser";
				sfd.OverwritePrompt = true;
				sfd.RestoreDirectory = true;
				
				// Get filename
				if (sfd.ShowDialog() == DialogResult.OK)
				{
					// Save bitmap in the new format
					if (FreeImage.SaveEx(dib, sfd.FileName, serialPlugin.Format))
						MessageBox.Show("Bitmap saved successfully.", "Success");
					else
						MessageBox.Show("Saving bitmap failed.", "Failure");
				}
				else
				{
					MessageBox.Show("Action aborted.");
				}
			}
			finally
			{
				// Unload bitmap
				FreeImage.UnloadEx(ref dib);

				// Unload dialog
				sfd.Dispose();
			}
		}

		private void bClearBitmap_Click(object sender, EventArgs e)
		{
			// Unload the picture-box
			if (pictureBox.Image != null)
			{
				pictureBox.Image.Dispose();
				pictureBox.Image = null;
			}
		}
	}
}