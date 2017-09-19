using System;
using System.Collections.Generic;
using FreeImageAPI;

namespace Sample07
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
			// This example shows how to work with ICC-Profiles.
			sample.Example();
		}
	}

	public class Sample
	{
		public void Example()
		{
			// Load the sample bitmap.
			FIBITMAP dib = FreeImage.LoadEx("Sample.jpg");

			// Check success
			if (dib.IsNull)
			{
				Console.WriteLine("Sample.jpg could not be loaded. Aborting.");
				return;
			}

			// Get the bitmaps ICC-Profile.
			FIICCPROFILE icc = FreeImage.GetICCProfileEx(dib);

			// Print the profiles address.
			Console.WriteLine("The profiles memory-address is : 0x{0}", icc.DataPointer.ToString("X"));

			// Print the profiles size
			Console.WriteLine("The profiles size is : {0} bytes", icc.Size);

			// Create data for a new profile.
			byte[] data = new byte[256];
			for (int i = 0; i < data.Length; i++)
				data[i] = (byte)i;

			// Create the new profile
			icc = new FIICCPROFILE(dib, data);

			Console.WriteLine("The profiles memory-address is : 0x{0}", icc.DataPointer.ToString("X"));
			Console.WriteLine("The profiles size is : {0} bytes", icc.Size);

			// Create the new profile but only use the first 64 bytes
			icc = new FIICCPROFILE(dib, data, 64);

			Console.WriteLine("The profiles memory-address is : 0x{0}", icc.DataPointer.ToString("X"));
			Console.WriteLine("The profiles size is : {0} bytes", icc.Size);

			// CreateICCProfileEx(...) does the same as above
			icc = FreeImage.CreateICCProfileEx(dib, data, 16);

			Console.WriteLine("The profiles memory-address is : 0x{0}", icc.DataPointer.ToString("X"));
			Console.WriteLine("The profiles size is : {0} bytes", icc.Size);

			FreeImage.UnloadEx(ref dib);
		}
	}
}
