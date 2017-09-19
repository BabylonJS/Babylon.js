using System;
using FreeImageAPI;
using System.Drawing;

namespace Sample05
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

			// The example will flip the bitmap by manually accessing the
			// bitmaps scanlines and swapping them
			sample.Example01();

			// The example will access each pixel of the bitmap manually
			// and change its color intensity to 3/4 of the original value
			// which will have a darker bitmap as result.
			sample.Example02();

			// The example will access and swap the bitmaps palette from
			// 'FIC_MINISBLACK' to 'FIC_MINISWHITE'. Then it will swap each pixels
			// palette index so that each pixel is assigned to the its old value
			// so that the bitmaps "pixeldata" stays the same.
			sample.Example03();
		}
	}

	public class Sample
	{
		FIBITMAP dib = new FIBITMAP();

		public void Example01()
		{
			// Load sample file
			dib = FreeImage.LoadEx("Sample.jpg", FREE_IMAGE_LOAD_FLAGS.JPEG_ACCURATE);

			// Check whether loading succeeded
			if (dib.IsNull)
			{
				Console.WriteLine("Sample.jpg could not be loaded. Aborting.");
				return;
			}

			// Check whether the bitmap has 24 bpp color depth to ensure
			// using RGBTRIPPLE is correct.
			if (FreeImage.GetBPP(dib) != 24)
			{
				Console.WriteLine("Sample.jpg is no 24 bpp bitmap. Aborting.");
				FreeImage.UnloadEx(ref dib);
				return;
			}

			// Store height of the bitmap
			int height = (int)FreeImage.GetHeight(dib);

			// Iterate over half of the bitmaps scanlines and swap
			// line[1] with line[height], line[2] with line[height-1] etc which will
			// flip the image.
			for (int i = 0; i < (height / 2); i++)
			{
				// Get scanline from the bottom part of the bitmap
				Scanline<RGBTRIPLE> scanlineBottom = new Scanline<RGBTRIPLE>(dib, i);

				// Get scanline from the top part of the bitmap
				Scanline<RGBTRIPLE> scanlineTop = new Scanline<RGBTRIPLE>(dib, height - 1 - i);

				// Get arrays of RGBTRIPPLEs that contain the bitmaps real pixel data
				// of the two scanlines.
				RGBTRIPLE[] rgbtBottom = scanlineBottom.Data;
				RGBTRIPLE[] rgbtTop = scanlineTop.Data;

				// Restore the scanline across to switch the bitmaps lines.
				scanlineBottom.Data = rgbtTop;
				scanlineTop.Data = rgbtBottom;
			}

			// Store the bitmap to disk
			if (!FreeImage.SaveEx(ref dib, "SampleOut01.jpg", FREE_IMAGE_SAVE_FLAGS.JPEG_QUALITYGOOD, true))
			{
				Console.WriteLine("Error while saving 'SampleOut01.jpg'");
				FreeImage.UnloadEx(ref dib);
			}
		}

		public void Example02()
		{
			dib = FreeImage.LoadEx("Sample.jpg", FREE_IMAGE_LOAD_FLAGS.JPEG_ACCURATE);

			// Check whether loading succeeded
			if (dib.IsNull)
			{
				Console.WriteLine("Sample.jpg could not be loaded. Aborting.");
				return;
			}

			// Check whether the bitmap has 24 bpp color depth to ensure
			// using RGBTRIPPLE is correct.
			if (FreeImage.GetBPP(dib) != 24)
			{
				Console.WriteLine("Sample.jpg is no 24 bpp bitmap. Aborting.");
				FreeImage.UnloadEx(ref dib);
				return;
			}

			// Iterate over all scanlines
			for (int i = 0; i < FreeImage.GetHeight(dib); i++)
			{
				// Get scanline
				Scanline<RGBTRIPLE> scanline = new Scanline<RGBTRIPLE>(dib, i);

				// Get pixeldata from scanline
				RGBTRIPLE[] rgbt = scanline.Data;

				// Iterate over each pixel reducing the colors intensity to 3/4 which
				// will darken the bitmap.
				for (int j = 0; j < rgbt.Length; j++)
				{
					rgbt[j].rgbtBlue = (byte)((int)rgbt[j].rgbtBlue * 3 / 4);
					rgbt[j].rgbtGreen = (byte)((int)rgbt[j].rgbtGreen * 3 / 4);
					rgbt[j].rgbtRed = (byte)((int)rgbt[j].rgbtRed * 3 / 4);

					// In case no direct access to the data is implemented
					// the following way is equivalent:
					//
					// Color color = rgbt[j].color;
					// rgbt[j].color = Color.FromArgb(color.R * 3 / 4, color.G * 3 / 4, color.B * 3 / 4);
				}

				// Write the darkened scanline back to memory
				scanline.Data = rgbt;
			}

			// Store the bitmap to disk
			if (!FreeImage.SaveEx(ref dib, "SampleOut02.jpg", FREE_IMAGE_SAVE_FLAGS.JPEG_QUALITYGOOD, true))
			{
				Console.WriteLine("Error while saving 'SampleOut02.jpg'");
				FreeImage.UnloadEx(ref dib);
			}
		}

		public void Example03()
		{
			dib = FreeImage.LoadEx("Sample.tif");

			// Check whether loading succeeded
			if (dib.IsNull)
			{
				Console.WriteLine("Sample.tif could not be loaded. Aborting.");
				return;
			}

			// Check whether the bitmap has 4 bpp color depth to ensure
			// using FI4B is correct.
			if (FreeImage.GetBPP(dib) != 4)
			{
				Console.WriteLine("Sample.tif is no 4 bpp bitmap. Aborting.");
				FreeImage.UnloadEx(ref dib);
				return;
			}

			// Get the bitmaps palette
			Palette palette = FreeImage.GetPaletteEx(dib);

			int size = (int)palette.Length;

			// Check whether the palette has a color (is valid)
			if (size == 0)
			{
				Console.WriteLine("Sample.tif has no valid palette. Aborting.");
				FreeImage.UnloadEx(ref dib);
				return;
			}

			// Swapping the palette
			for (int i = 0; i < size / 2; i++)
			{
				RGBQUAD temp = palette[i];
				palette[i] = palette[size - 1 - i];
				palette[size - 1 - i] = temp;
			}

			// Iterate over each scanline
			for (int i = 0; i < FreeImage.GetHeight(dib); i++)
			{
				// Get scanline
				Scanline<FI4BIT> scanline = new Scanline<FI4BIT>(dib, i);

				// Iterate over all pixels swapping the palette index
				// so that the color will stay the same
				for (int j = 0; j < scanline.Length; j++)
				{
					scanline[j] = (byte)(size - 1 - scanline[j]);
				}
			}

			// Save the bitmap to disk
			if (!FreeImage.SaveEx(ref dib, "SampleOut03.tif", FREE_IMAGE_SAVE_FLAGS.TIFF_LZW, true))
			{
				Console.WriteLine("Error while saving 'SampleOut03.tif'");
				FreeImage.UnloadEx(ref dib);
			}
		}
	}
}