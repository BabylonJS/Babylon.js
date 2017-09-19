using System;
using System.Drawing;
using System.Windows.Forms;
using FreeImageAPI;
using System.Drawing.Imaging;

namespace Sample06
{
	public partial class MainForm : Form
	{
		[STAThread]
		static void Main()
		{
			Application.EnableVisualStyles();
			Application.SetCompatibleTextRenderingDefault(false);
			Application.Run(new MainForm());
		}

		public MainForm()
		{
			InitializeComponent();
		}

		private void bExample01_Click(object sender, EventArgs e)
		{
			// Load bitmap
			FIBITMAP dib = FreeImage.LoadEx("Sample.jpg");

			// Check success
			if (dib.IsNull)
			{
				MessageBox.Show("Could not load Sample.jpg", "Error");
				return;
			}

			// Check whether bitmap is 24-bit
			if (FreeImage.GetBPP(dib) != 24)
			{
				MessageBox.Show("Sample.jpg is not 24-bit.", "Error");
				FreeImage.UnloadEx(ref dib);
				return;
			}

			// Convert the 24-bit bitmap to 8-bit and forcing the result will be greyscale
			dib = FreeImage.ConvertColorDepth(dib, FREE_IMAGE_COLOR_DEPTH.FICD_08_BPP | FREE_IMAGE_COLOR_DEPTH.FICD_FORCE_GREYSCALE, true);

			if (FreeImage.GetBPP(dib) == 8)
			{
				// Convert the FreeImage-Bitmap into a .NET bitmap
				Bitmap bitmap = FreeImage.GetBitmap(dib);

				// Dispose the bitmap of the pictureBox
				if (picBox.Image != null)
				{
					picBox.Image.Dispose();
				}

				// Assign the bitmap to the picturebox
				picBox.Image = bitmap;
			}

			// Unload source bitmap
			FreeImage.UnloadEx(ref dib);
		}

		private void bOriginal_Click(object sender, EventArgs e)
		{
			// Load bitmap
			FIBITMAP dib = FreeImage.LoadEx("Sample.jpg");

			// Check success
			if (dib.IsNull)
			{
				MessageBox.Show("Could not load Sample.jpg", "Error");
				return;
			}

			// Convert the FreeImage-Bitmap into a .NET bitmap
			Bitmap bitmap = FreeImage.GetBitmap(dib);

			// Check success
			if (bitmap != null)
			{
				// Dispose old bitmap
				if (picBox.Image != null)
				{
					picBox.Image.Dispose();
				}

				// Assign new bitmap
				picBox.Image = bitmap;
			}

			// Unload bitmap
			FreeImage.UnloadEx(ref dib);
		}

		private void bExample02_Click(object sender, EventArgs e)
		{
			FIBITMAP dib = FreeImage.LoadEx("Sample.jpg");

			// Check success
			if (dib.IsNull)
			{
				MessageBox.Show("Could not load Sample.jpg", "Error");
				return;
			}

			// Convert bitmap to 8 bit
			dib = FreeImage.ConvertColorDepth(dib, FREE_IMAGE_COLOR_DEPTH.FICD_08_BPP, true);

			// Check whether conversion succeeded
			if (FreeImage.GetBPP(dib) != 8)
			{
				MessageBox.Show("Converting Sample.jpg to 8-bit failed.", "Error");
				FreeImage.UnloadEx(ref dib);
				return;
			}

			// Convert the FreeImage-Bitmap into a .NET bitmap
			Bitmap bitmap = FreeImage.GetBitmap(dib);

			// Dispose old bitmap
			if (picBox.Image != null)
			{
				picBox.Image.Dispose();
			}

			// Assign new bitmap
			picBox.Image = bitmap;

			// Unload bitmap
			FreeImage.UnloadEx(ref dib);
		}

		private void bExample03_Click(object sender, EventArgs e)
		{
			// Load bitmap
			Bitmap bitmap = (Bitmap)Bitmap.FromFile("Sample.jpg");

			// Convert the .NET bitmap into a FreeImage-Bitmap
			FIBITMAP dib = FreeImage.CreateFromBitmap(bitmap);

			// Unload bitmap
			bitmap.Dispose();

			// Rescale the bitmap
			FIBITMAP temp = FreeImage.Rescale(dib, 300, 300, FREE_IMAGE_FILTER.FILTER_BICUBIC);

			// Unload bitmap
			FreeImage.UnloadEx(ref dib);

			Random rand = new Random();

			// Rotate the bitmap
			dib = FreeImage.Rotate(temp, rand.NextDouble() * 360d);

			// Unload bitmap
			FreeImage.UnloadEx(ref temp);

			// Convert the FreeImage-Bitmap into a .NET bitmap
			bitmap = FreeImage.GetBitmap(dib);

			// Unload bitmap
			FreeImage.UnloadEx(ref dib);

			// Unload bitmap
			if (picBox.Image != null)
			{
				picBox.Image.Dispose();
			}

			// Assign new bitmap
			picBox.Image = bitmap;
		}
	}
}