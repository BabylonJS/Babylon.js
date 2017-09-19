using System;
using System.IO;
using FreeImageAPI;

namespace Sample03
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

			// Add this class to the message event
			FreeImageEngine.Message += new OutputMessageFunction(FreeImage_Message);

			Sample sample = new Sample();
			sample.Example();

			// Remove this class from the message event
			FreeImageEngine.Message -= new OutputMessageFunction(FreeImage_Message);
		}

		static void FreeImage_Message(FREE_IMAGE_FORMAT fif, string message)
		{
			Console.WriteLine("Error for {0}: {1}", fif.ToString(), message);
		}
	}

	public class Sample
	{
		FIBITMAP dib = new FIBITMAP();

		public void Example()
		{
			// Allocating a new bitmap with 99x99 pixels, 16-bit color depth and an allocation of 5 bits for each color.
			dib = FreeImage.Allocate(99, 99, 16, FreeImage.FI16_555_RED_MASK, FreeImage.FI16_555_GREEN_MASK, FreeImage.FI16_555_BLUE_MASK);

			// Saving bitmap.
			if (!FreeImage.SaveEx(ref dib, "example01.bmp", true))
			{
				Console.WriteLine("Saving 'example.bmp' failed.");
				FreeImage.UnloadEx(ref dib);
			}

			// Allocation a new bitmap with 71x33 pixels, 4-bit color depth. Bitmaps below 16-bit have paletts.
			// Each pixel references an index within the palette wich contains the true color.
			// Therefor no bit-masks are needed and can be set to 0.
			dib = FreeImage.Allocate(71, 33, 4, 0, 0, 0);

			// Saving bitmap.
			if (!FreeImage.SaveEx(ref dib, "example02.tif", true))
			{
				Console.WriteLine("Saving 'example02.tif' failed.");
				FreeImage.UnloadEx(ref dib);
			}

			// Allocation a new bitmap. This time 'AllocateT' is used because 'Allocate' can only create standard bitmaps.
			// In this case a RGBF bitmap is created. Red, green and blue are represented by a float-value so no bit-masks are needed.
			dib = FreeImage.AllocateT(FREE_IMAGE_TYPE.FIT_RGBF, 50, 75, 9, 0, 0, 0);

			// Saving bitmap.
			if (!FreeImage.SaveEx(ref dib, "example03.hdr", true))
			{
				Console.WriteLine("Saving 'example03.hdr' failed.");
				FreeImage.UnloadEx(ref dib);
			}
		}
	}
}
