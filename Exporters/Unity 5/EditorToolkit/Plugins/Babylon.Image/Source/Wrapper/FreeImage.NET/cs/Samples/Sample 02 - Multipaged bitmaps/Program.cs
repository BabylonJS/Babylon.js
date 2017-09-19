using System;
using System.IO;
using FreeImageAPI;

namespace Sample02
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
			sample.Example();
		}
	}

	public class Sample
	{
		const string fileName = @"multipaged.tif";
		FIMULTIBITMAP dib = new FIMULTIBITMAP();
		Random rand = new Random();

		public void Example()
		{
			if (!File.Exists(fileName))
			{
				Console.WriteLine("File not found. Aborting.");
				return;
			}

			// Load the multipaged bitmap.
			// 'OpenMultiBitmapEx' tries to find the correct file format, loads the bitmap
			// with default options, with write support and does not use caching.
			dib = FreeImage.OpenMultiBitmapEx(fileName);

			// Check whether loading succeeded.
			if (dib.IsNull)
			{
				Console.WriteLine("File could not be loaded. Aborting.");
				return;
			}

			// Get the number of bitmaps the multipaged bitmap contains.
			int count = FreeImage.GetPageCount(dib);

			// Multipaged bitmaps consist of multiple single FIBITMAPs
			FIBITMAP page = new FIBITMAP();

			// There are bitmaps we can work with.
			if (count > 0)
			{
				// Lock a random bitmap to work with.
				page = FreeImage.LockPage(dib, rand.Next(0, count));
			}

			// Check whether locking succeeded.
			if (page.IsNull)
			{
				// Locking failed. Unload the bitmap and return.
				FreeImage.CloseMultiBitmapEx(ref dib);
				return;
			}

			// Get a list of locked pages. This can be usefull to check whether a page has already been locked.
			int[] lockedPages = FreeImage.GetLockedPages(dib);

			// Lets modify the page.
			if (FreeImage.AdjustGamma(page, 2d))
			{
				Console.WriteLine("Successfully changed gamma of page {0}.", lockedPages[0]);
			}
			else
			{
				Console.WriteLine("Failed to adjust gamma ...");
			}

			// Print out the list of locked pages
			foreach (int i in lockedPages)
				Console.WriteLine("Page {0} is locked.", i);

			// Use 'UnlockPage' instead of 'Unload' to free the page. Set the third parameter to 'true'
			// so that FreeImage can store the changed page within the multipaged bitmap.
			FreeImage.UnlockPage(dib, page, true);

			// Retieve the list again to see whether unlocking succeeded.
			lockedPages = FreeImage.GetLockedPages(dib);

			// No output should be produced here.
			foreach (int i in lockedPages)
				Console.WriteLine("Page {0} is still locked.", i);

			// If there are more than one page we can swap them
			if (count > 1)
			{
				if (!FreeImage.MovePage(dib, 1, 0))
				{
					Console.WriteLine("Swapping pages failed.");
				}
			}

			if (count > 2)
			{
				// Lock page 2
				page = FreeImage.LockPage(dib, 2);
				if (!page.IsNull)
				{
					// Clone the page for later appending
					FIBITMAP temp = FreeImage.Clone(page);

					// Unlock the page again
					FreeImage.UnlockPage(dib, page, false);

					// Delete the page form the multipaged bitmap
					FreeImage.DeletePage(dib, 2);

					// Append the clone again
					FreeImage.AppendPage(dib, temp);

					// Check whether the number of pages is still the same
					Console.WriteLine("Pages before: {0}. Pages after: {1}", count, FreeImage.GetPageCount(dib));

					// Unload clone to prevent memory leak
					FreeImage.UnloadEx(ref temp);
				}
			}

			// We are done and close the multipaged bitmap.
			if (!FreeImage.CloseMultiBitmapEx(ref dib))
			{
				Console.WriteLine("Closing bitmap failed!");
			}
		}
	}
}
