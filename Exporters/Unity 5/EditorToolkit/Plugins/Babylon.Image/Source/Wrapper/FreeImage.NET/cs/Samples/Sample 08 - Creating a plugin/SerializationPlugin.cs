using System;
using System.Collections.Generic;
using System.Text;
using System.Runtime.InteropServices;
using System.Runtime.Serialization.Formatters.Binary;
using System.IO;
using System.IO.Compression;
using FreeImageAPI;
using FreeImageAPI.IO;
using FreeImageAPI.Plugins;

namespace Sample08
{
	public sealed class SerializationPlugin : LocalPlugin
	{
		// Header for the file
		private byte[] header = new byte[] { 0xff, 0x12, 0x0f, 0xff, 0x01, 0x00 };

		// Structure that will store all bitmap data.
		[Serializable]
		private struct SerialDib
		{
			public uint width;
			public uint height;
			public int pitch;
			public uint bpp;
			public uint red_mask;
			public uint green_mask;
			public uint blue_mask;
			public byte[] data;
		}

		// Implementation of 'GetImplementedMethods()'
		// All implemented methods are listed.
		protected override LocalPlugin.MethodFlags GetImplementedMethods()
		{
			return
				MethodFlags.DescriptionProc |
				MethodFlags.SupportsExportBPPProc |
				MethodFlags.SupportsExportTypeProc |
				MethodFlags.SupportsICCProfilesProc |
				MethodFlags.LoadProc |
				MethodFlags.SaveProc |
				MethodFlags.ValidateProc |
				MethodFlags.ExtensionListProc;
		}

		// Returns a format string.
		protected override string FormatProc()
		{
			return "Serialization";
		}

		// Returns a more specific description
		protected override string DescriptionProc()
		{
			return "Serializes bitmaps for .NET";
		}

		// Returns whether a color depth is supported.
		protected override bool SupportsExportBPPProc(int bpp)
		{
			return ((bpp == 1) ||
					(bpp == 4) ||
					(bpp == 8) ||
					(bpp == 16) ||
					(bpp == 24) ||
					(bpp == 32));
		}

		// This plugin can only export standard bitmaps
		protected override bool SupportsExportTypeProc(FREE_IMAGE_TYPE type)
		{
			return (type == FREE_IMAGE_TYPE.FIT_BITMAP);
		}

		// This plugin does not support icc profiles
		protected override bool SupportsICCProfilesProc()
		{
			return false;
		}

		// The function reads the first bytes of the file and compares it
		// with the predefined header.
		protected override bool ValidateProc(ref FreeImageIO io, fi_handle handle)
		{
			for (int i = 0; i < header.Length; i++)
				if (ReadByte(io, handle) != header[i])
					return false;
			return true;
		}

		// Loading function
		protected override FIBITMAP LoadProc(ref FreeImageIO io, fi_handle handle, int page, int flags, IntPtr data)
		{
			// Check if the data has the correct format
			if (!ValidateProc(ref io, handle))
			{
				// Create a free-image message
				FreeImage.OutputMessageProc(format, "Invalid format.");
				// return 0 (operation failed)
				return FIBITMAP.Zero;
			}

			SerialDib sdib;
			int read = 0;
			System.IO.MemoryStream stream = new System.IO.MemoryStream();
			byte[] buffer = new byte[1024];

			do
			{
				// Use the helper function 'Read' to read from the source
				read = Read(io, handle, 1, 1024, ref buffer);

				// Store the data in a temporary buffer
				stream.Write(buffer, 0, read);
			}
			while (read != 0);

			// Set the memory stream back to the beginning.
			stream.Position = 0;

			// Unzip the stream
			GZipStream zipStream = new GZipStream(stream, CompressionMode.Decompress);

			// Create a serializer
			BinaryFormatter formatter = new BinaryFormatter();

			// Deserialize the stream
			sdib = (SerialDib)formatter.Deserialize(zipStream);

			// Unload the stream
			zipStream.Dispose();

			// Use 'ConvertFromRawBits and the deserialized struct to recreate the bitmap
			// In this case the marshaller is used to create the needed IntPtr to the data
			// array.
			FIBITMAP dib = FreeImage.ConvertFromRawBits(
				Marshal.UnsafeAddrOfPinnedArrayElement(sdib.data, 0),
				(int)sdib.width, (int)sdib.height, sdib.pitch, sdib.bpp,
				sdib.red_mask, sdib.green_mask, sdib.blue_mask,
				false);

			// Unload the temporary stream
			stream.Dispose();

			// Return the created bitmap
			return dib;
		}

		// Saving function
		protected override bool SaveProc(ref FreeImageIO io, FIBITMAP dib, fi_handle handle, int page, int flags, IntPtr data)
		{
			SerialDib sdib;
			uint size = FreeImage.GetDIBSize(dib);

			// Store all data needed to recreate the bitmap
			sdib.width = FreeImage.GetWidth(dib);
			sdib.height = FreeImage.GetHeight(dib);
			sdib.pitch = (int)FreeImage.GetPitch(dib);
			sdib.bpp = FreeImage.GetBPP(dib);
			sdib.red_mask = FreeImage.GetRedMask(dib);
			sdib.green_mask = FreeImage.GetGreenMask(dib);
			sdib.blue_mask = FreeImage.GetBlueMask(dib);
			sdib.data = new byte[size];

			// Copy the bitmaps data into the structures byte-array
			// The marshaller is used to create an IntPtr for using
			// 'ConvertToRawBits'.
			FreeImage.ConvertToRawBits(Marshal.UnsafeAddrOfPinnedArrayElement(sdib.data, 0),
						  dib, sdib.pitch, sdib.bpp,
						  sdib.red_mask, sdib.green_mask, sdib.blue_mask,
						  false);

			// Use the healper function to write the header to the destination
			if (Write(io, handle, (uint)header.Length, 1, ref header) != 1)
				return false;

			// Create a serializer
			BinaryFormatter formatter = new BinaryFormatter();

			// Create a temporary stream
			MemoryStream stream = new MemoryStream();

			// Create a compression stream
			GZipStream zipStream = new GZipStream(stream, CompressionMode.Compress);

			// Serialize the structure into the compression stream
			formatter.Serialize(zipStream, sdib);

			// Unload the compression stream
			zipStream.Dispose();

			// Get the result data
			byte[] buffer = stream.GetBuffer();

			// Use the healper function 'Write' to write the data to the destination
			if (Write(io, handle, 1, (uint)buffer.Length, ref buffer) != buffer.Length)
			{
				// Unload the temporary stream
				stream.Dispose();
				return false;
			}

			// Unload the temporary stream
			stream.Dispose();
			return true;
		}

		// Return a list of supported file extensions (comma seperated)
		protected override string ExtensionListProc()
		{
			return "ser";
		}

		// Implementation of 'ToString()'
		public override string ToString()
		{
			return DescriptionProc();
		}
	}
}
