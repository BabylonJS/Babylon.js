using System;
using System.Windows.Forms;
using FreeImageAPI;

namespace Sample04
{
	public partial class MainForm : Form
	{
		string message = null;

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
			FreeImageEngine.Message += new OutputMessageFunction(FreeImage_Message);
		}

		~MainForm()
		{
			FreeImageEngine.Message -= new OutputMessageFunction(FreeImage_Message);
		}

		void FreeImage_Message(FREE_IMAGE_FORMAT fif, string message)
		{
			if (this.message == null)
			{
				this.message = message;
			}
			else
			{
				this.message += "\n" + message;
			}
		}

		private void bOpenFile_Click(object sender, EventArgs e)
		{
			// Resetting filename
			ofd.FileName = "";

			// Was a file selected
			if (ofd.ShowDialog() == DialogResult.OK)
			{
				// Format is stored in 'format' on successfull load.
				FREE_IMAGE_FORMAT format = FREE_IMAGE_FORMAT.FIF_UNKNOWN;

				// Try loading the file
				FIBITMAP dib = FreeImage.LoadEx(ofd.FileName, ref format);

				try
				{
					// Error handling
					if (dib.IsNull)
					{
						// Chech whether FreeImage generated an error messe
						if (message != null)
						{
							MessageBox.Show("File could not be loaded!\nError:{0}", message);
						}
						else
						{
							MessageBox.Show("File could not be loaded!", message);
						}
						return;
					}
					
					// Read width
					lWidth.Text = String.Format("Width: {0}", FreeImage.GetWidth(dib));
					
					// Read height
					lHeight.Text = String.Format("Height: {0}", FreeImage.GetHeight(dib));
					
					// Read color depth
					lBPP.Text = String.Format("Color Depth: {0}", FreeImage.GetBPP(dib));
					
					// Read red bitmask (16 - 32 bpp)
					lRedMask.Text = String.Format("Red Mask: 0x{0:X8}", FreeImage.GetRedMask(dib));

					// Read green bitmask (16 - 32 bpp)
					lBlueMask.Text = String.Format("Green Mask: 0x{0:X8}", FreeImage.GetGreenMask(dib));

					// Read blue bitmask (16 - 32 bpp)
					lGreenMask.Text = String.Format("Blue Mask: 0x{0:X8}", FreeImage.GetBlueMask(dib));

					// Read image type (FI_BITMAP, FIT_RGB16, FIT_COMPLEX ect)
					lImageType.Text = String.Format("Image Type: {0}", FreeImage.GetImageType(dib));
					
					// Read x-axis dpi
					lDPIX.Text = String.Format("DPI X: {0}", FreeImage.GetResolutionX(dib));
					
					// Read y-axis dpi
					lDPIY.Text = String.Format("DPI Y: {0}", FreeImage.GetResolutionY(dib));
					
					// Read file format
					lFormat.Text = String.Format("File Format: {0}", FreeImage.GetFormatFromFIF(format));
				}
				catch
				{
				}
				
				// Always unload bitmap
				FreeImage.UnloadEx(ref dib);
				
				// Reset the error massage buffer
				message = null;
			}
			// No file was selected
			else
			{
				MessageBox.Show("No file loaded.", "Error");
			}
		}
	}
}