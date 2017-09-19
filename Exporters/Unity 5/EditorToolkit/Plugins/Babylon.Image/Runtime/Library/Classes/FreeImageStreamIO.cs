// ==========================================================
// FreeImage 3 .NET wrapper
// Original FreeImage 3 functions and .NET compatible derived functions
//
// Design and implementation by
// - Jean-Philippe Goerke (jpgoerke@users.sourceforge.net)
// - Carsten Klein (cklein05@users.sourceforge.net)
//
// Contributors:
// - David Boland (davidboland@vodafone.ie)
//
// Main reference : MSDN Knowlede Base
//
// This file is part of FreeImage 3
//
// COVERED CODE IS PROVIDED UNDER THIS LICENSE ON AN "AS IS" BASIS, WITHOUT WARRANTY
// OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, WITHOUT LIMITATION, WARRANTIES
// THAT THE COVERED CODE IS FREE OF DEFECTS, MERCHANTABLE, FIT FOR A PARTICULAR PURPOSE
// OR NON-INFRINGING. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE COVERED
// CODE IS WITH YOU. SHOULD ANY COVERED CODE PROVE DEFECTIVE IN ANY RESPECT, YOU (NOT
// THE INITIAL DEVELOPER OR ANY OTHER CONTRIBUTOR) ASSUME THE COST OF ANY NECESSARY
// SERVICING, REPAIR OR CORRECTION. THIS DISCLAIMER OF WARRANTY CONSTITUTES AN ESSENTIAL
// PART OF THIS LICENSE. NO USE OF ANY COVERED CODE IS AUTHORIZED HEREUNDER EXCEPT UNDER
// THIS DISCLAIMER.
//
// Use at your own risk!
// ==========================================================

// ==========================================================
// CVS
// $Revision: 1.5 $
// $Date: 2009/09/15 11:47:46 $
// $Id: FreeImageStreamIO.cs,v 1.5 2009/09/15 11:47:46 cklein05 Exp $
// ==========================================================

using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Diagnostics;

namespace FreeImageAPI.IO
{
	/// <summary>
	/// Internal class wrapping stream io functions.
	/// </summary>
	/// <remarks>
	/// FreeImage can read files from a disk or a network drive but also allows the user to
	/// implement their own loading or saving functions to load them directly from an ftp or web
	/// server for example.
	/// <para/>
	/// In .NET streams are a common way to handle data. The <b>FreeImageStreamIO</b> class handles
	/// the loading and saving from and to streams. It implements the funtions FreeImage needs
	/// to load data from an an arbitrary source.
	/// <para/>
	/// The class is for internal use only.
	/// </remarks>
	internal static class FreeImageStreamIO
	{
		/// <summary>
		/// <see cref="FreeImageAPI.IO.FreeImageIO"/> structure that can be used to read from streams via
		/// <see cref="FreeImageAPI.FreeImage.LoadFromHandle(FREE_IMAGE_FORMAT, ref FreeImageIO, fi_handle, FREE_IMAGE_LOAD_FLAGS)"/>.
		/// </summary>
		public static readonly FreeImageIO io;

		/// <summary>
		/// Initializes a new instances which can be used to
		/// create a FreeImage compatible <see cref="FreeImageAPI.IO.FreeImageIO"/> structure.
		/// </summary>
		static FreeImageStreamIO()
		{
			io.readProc = new ReadProc(streamRead);
			io.writeProc = new WriteProc(streamWrite);
			io.seekProc = new SeekProc(streamSeek);
			io.tellProc = new TellProc(streamTell);
		}

		/// <summary>
		/// Reads the requested data from the stream and writes it to the given address.
		/// </summary>
		static unsafe uint streamRead(IntPtr buffer, uint size, uint count, fi_handle handle)
		{
			Stream stream = handle.GetObject() as Stream;
			if ((stream == null) || (!stream.CanRead))
			{
				return 0;
			}
			uint readCount = 0;
			byte* ptr = (byte*)buffer;
			byte[] bufferTemp = new byte[size];
			int read;
			while (readCount < count)
			{
				read = stream.Read(bufferTemp, 0, (int)size);
				if (read != (int)size)
				{
					stream.Seek(-read, SeekOrigin.Current);
					break;
				}
				for (int i = 0; i < read; i++, ptr++)
				{
					*ptr = bufferTemp[i];
				}
				readCount++;
			}
			return (uint)readCount;
		}

		/// <summary>
		/// Reads the given data and writes it into the stream.
		/// </summary>
		static unsafe uint streamWrite(IntPtr buffer, uint size, uint count, fi_handle handle)
		{
			Stream stream = handle.GetObject() as Stream;
			if ((stream == null) || (!stream.CanWrite))
			{
				return 0;
			}
			uint writeCount = 0;
			byte[] bufferTemp = new byte[size];
			byte* ptr = (byte*)buffer;
			while (writeCount < count)
			{
				for (int i = 0; i < size; i++, ptr++)
				{
					bufferTemp[i] = *ptr;
				}
				try
				{
					stream.Write(bufferTemp, 0, bufferTemp.Length);
				}
				catch
				{
					return writeCount;
				}
				writeCount++;
			}
			return writeCount;
		}

		/// <summary>
		/// Moves the streams position.
		/// </summary>
		static int streamSeek(fi_handle handle, int offset, SeekOrigin origin)
		{
			Stream stream = handle.GetObject() as Stream;
			if (stream == null)
			{
				return 1;
			}
			stream.Seek((long)offset, origin);
			return 0;
		}

		/// <summary>
		/// Returns the streams current position
		/// </summary>
		static int streamTell(fi_handle handle)
		{
			Stream stream = handle.GetObject() as Stream;
			if (stream == null)
			{
				return -1;
			}
			return (int)stream.Position;
		}
	}
}