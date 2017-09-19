using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Text;
using System.Windows.Forms;
using FreeImageAPI;
using System.Net;
using System.IO;

namespace Sample09
{
	public partial class SampleForm : Form
	{
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
		}

		private void bLoadUrl_Click(object sender, EventArgs e)
		{
			// Verify url
			if (String.IsNullOrEmpty(tbURL.Text))
			{
				MessageBox.Show("Please enter a valid URL.", "Error");
				return;
			}
			FIBITMAP dib = new FIBITMAP();
			Stream sourceStream = null;
			try
			{
				// Build a stream to read from
				WebRequest request = (WebRequest)HttpWebRequest.Create(tbURL.Text);
				WebResponse response = request.GetResponse();
				sourceStream = response.GetResponseStream();
				if (sourceStream == null)
				{
					throw new Exception();
				}
				// Load the image from stream
				dib = FreeImage.LoadFromStream(sourceStream);
				// Check success
				if (dib.IsNull)
				{
					throw new Exception();
				}
				// Convert the bitmap into a .NET bitmap
				Bitmap bitmap = FreeImage.GetBitmap(dib);
				if (bitmap == null)
				{
					throw new Exception();
				}
				// Show the bitmap
				if (picBox.Image != null)
				{
					picBox.Image.Dispose();
				}
				picBox.Image = bitmap;
			}
			catch
			{
				// Error handling
				MessageBox.Show("Error loading URL.", "Error");
			}
			finally
			{
				// Clean up memory
				FreeImage.UnloadEx(ref dib);
				if (sourceStream != null) sourceStream.Dispose();
			}
		}

		private void bSave_Click(object sender, EventArgs e)
		{
			// Check if there is a loaded bitmap
			if (picBox.Image == null)
			{
				MessageBox.Show("No image loaded.", "Error");
				return;
			}
			SaveFileDialog sfd = null;
			FileStream fStream = null;
			FIBITMAP dib = new FIBITMAP();
			try
			{
				sfd = new SaveFileDialog();
				sfd.CreatePrompt = false;
				sfd.FileName = "";
				sfd.Filter = "TIF (*tif)|*.tif";
				sfd.OverwritePrompt = true;
				sfd.RestoreDirectory = true;
				if (sfd.ShowDialog() == DialogResult.OK)
				{
					// Convert the .NET bitmap into a FreeImage-Bitmap
					dib = FreeImage.CreateFromBitmap((Bitmap)picBox.Image);
					if (dib.IsNull)
					{
						throw new Exception();
					}
					// Create a filestream to write to
					fStream = new FileStream(sfd.FileName, FileMode.Create);
					if (!FreeImage.SaveToStream(
						ref dib,
						fStream,
						FREE_IMAGE_FORMAT.FIF_TIFF,
						FREE_IMAGE_SAVE_FLAGS.TIFF_LZW,
						FREE_IMAGE_COLOR_DEPTH.FICD_AUTO,
						false))
					{
						throw new Exception();
					}
					MessageBox.Show("Image saved successfully.", "Success");
				}
				else
				{
					MessageBox.Show("Operation aborted.", "Aborted");
				}
			}
			catch
			{
				MessageBox.Show("Error saving image.", "Error");
			}
			finally
			{
				// Clean up
				if (sfd != null) sfd.Dispose();
				if (fStream != null) fStream.Dispose();
				FreeImage.UnloadEx(ref dib);
			}
		}
	}
}