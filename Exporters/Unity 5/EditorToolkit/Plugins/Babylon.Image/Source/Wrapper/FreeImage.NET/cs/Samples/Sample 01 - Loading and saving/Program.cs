using System;
using System.IO;
using FreeImageAPI;
using System.Collections.Generic;
using System.Runtime.Serialization.Formatters.Binary;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

namespace Sample01
{
	class Program
	{
		static void Main(string[] args)
		{
			// Check if FreeImage.dll is available (can be in %path%).
			if (!FreeImage.IsAvailable())
			{
				Console.WriteLine("FreeImage.dll seems to be missing. Aborting.");
				return;
			}

			Sample sample = new Sample();
			// This example shows the basic loading and saving operations offered by FreeImage.
			sample.Example01();

			// This example shows a more comfortable way offered by the .NET Wrapper.
			sample.Example02();

			// This example shows the FreeImage-Errormessage-Callback
			sample.Example03();
		}
	}

	public class Sample
	{
		const string fileName = @"Sample.jpg";
		const string outFileName = @"Sample.tif";
		FIBITMAP dib = new FIBITMAP();
		string message = null;

		public void Example01()
		{
			if (!File.Exists(fileName))
			{
				Console.WriteLine(fileName + " does not exist. Aborting.");
				return;
			}

			// Try to unload the bitmap handle (in case it is not null).
			// Always assert that a handle (like dib) is unloaded before it is reused, because
			// on unmanaged side there is no garbage collector that will clean up unreferenced
			// objects.
			// The following code will produce a memory leak (in case the bitmap is loaded
			// successfully) because the handle to the first bitmap is lost:
			//   dib = FreeImage.Load(FREE_IMAGE_FORMAT.FIF_JPEG, fileName, FREE_IMAGE_LOAD_FLAGS.JPEG_ACCURATE);
			//   dib = FreeImage.Load(FREE_IMAGE_FORMAT.FIF_JPEG, fileName, FREE_IMAGE_LOAD_FLAGS.JPEG_ACCURATE);
			if (!dib.IsNull)
				FreeImage.Unload(dib);

			// Loading a sample bitmap. In this case it's a .jpg file. 'Load' requires the file
			// format or the loading process will fail. An additional flag (the default value is
			// 'DEFAULT') can be set to enable special loading options.
			dib = FreeImage.Load(FREE_IMAGE_FORMAT.FIF_JPEG, fileName, FREE_IMAGE_LOAD_FLAGS.JPEG_ACCURATE);

			// Check if the handle is null which means the bitmap could not be loaded.
			if (dib.IsNull)
			{
				Console.WriteLine("Loading bitmap failed. Aborting.");
				// Check whether there was an error message.
				return;
			}

			// Try flipping the bitmap.
			if (!FreeImage.FlipHorizontal(dib))
			{
				Console.WriteLine("Unable to flip bitmap.");
				// Check whether there was an error message.
			}

			// Store the bitmap back to disk. Again the desired format is needed. In this case the format is 'TIFF'.
			// An output filename has to be chosen (which will be overwritten without a warning).
			// A flag can be provided to enable pluginfunctions (compression is this case).
			FreeImage.Save(FREE_IMAGE_FORMAT.FIF_TIFF, dib, outFileName, FREE_IMAGE_SAVE_FLAGS.TIFF_DEFLATE);

			// The bitmap was saved to disk but is still allocated in memory, so the handle has to be freed.
			if (!dib.IsNull)
				FreeImage.Unload(dib);

			// Make sure to set the handle to null so that it is clear that the handle is not pointing to a bitmap.
			dib.SetNull();
		}

		public void Example02()
		{
			// 'UnloadEx' is a comfortable way of unloading a bitmap. The coder can call 'UnloadEx' even
			// when the handle is pointing to null (in this case nothing will happen). In case the handle
			// is valid (valid means that it is NOT pointing to null) the bitmap will be unloaded and the
			// handle will be set to null manually.
			FreeImage.UnloadEx(ref dib);

			// 'LoadEx' is a comfortable way of loading a bitmap. 'LoadEx' tries to find out the format of
			// the file and will use this to load it. It will use DEFAULT loading values.
			dib = FreeImage.LoadEx(fileName);

			// Check if the handle is null which means the bitmap could not be loaded.
			if (dib.IsNull)
			{
				Console.WriteLine("Loading bitmap failed. Aborting.");
				return;
			}

			// 'SaveEx' (like 'LoadEx') will try to save the bitmap with default values.
			// Before saving the bitmap, 'SaveEx' checks whether the extension is valid for the file type
			// and if the plugin can use the colordepth of the bitmap. If not it will automatically convert
			// the bitmap into the next best colordepth and save it.
			if (!FreeImage.SaveEx(ref dib, @"Sample.gif", false))
			{
				Console.WriteLine("Saving bitmap failed.");
			}

			// The handle is still valid.
			if (!FreeImage.SaveEx(
				ref dib,
				@"Sample",							// No extension was selected so let 'SaveEx' decide.
				FREE_IMAGE_FORMAT.FIF_PNG,			// A format is needed this time.
				FREE_IMAGE_SAVE_FLAGS.DEFAULT,		// PNG has no options so use default.
				FREE_IMAGE_COLOR_DEPTH.FICD_04_BPP,	// 4bpp as result color depth.
				true))								// We're done so unload
			{
				// SaveEx will not unload the bitmap in case saving failed.
				// This way possible operations done to the bitmaps aren't lost.
				FreeImage.UnloadEx(ref dib);
			}
		}

		public void Example03()
		{
			// Safely unload to prevent memory leak.
			FreeImage.UnloadEx(ref dib);

			// Load the example bitmap.
			dib = FreeImage.LoadEx(fileName);

			// Check whether loading succeeded.
			if (dib.IsNull)
			{
				return;
			}

			// Add this class to the callback event.
			FreeImageEngine.Message += new OutputMessageFunction(FreeImage_Message);

			// Try to save the bitmap as a gif
			if (!FreeImage.Save(FREE_IMAGE_FORMAT.FIF_GIF, dib, @"Sample_fail.gif", FREE_IMAGE_SAVE_FLAGS.DEFAULT))
			{
				// Saving failed
				// Check whether there was an error callback
				if (message != null)
				{
					// Print the message and delete it.
					Console.WriteLine("Error message recieved: {0}", message);
					message = null;
				}
			}

			// Unload bitmap.
			FreeImage.UnloadEx(ref dib);

			// Remove this class from the callback event.
			FreeImageEngine.Message -= new OutputMessageFunction(FreeImage_Message);
		}

		void FreeImage_Message(FREE_IMAGE_FORMAT fif, string message)
		{
			this.message = message;
		}
	}
}