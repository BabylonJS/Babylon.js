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
// $Revision: 1.12 $
// $Date: 2011/12/22 14:54:22 $
// $Id: FreeImageBitmap.cs,v 1.12 2011/12/22 14:54:22 drolon Exp $
// ==========================================================

using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.IO.Compression;
using System.Runtime.InteropServices;
using System.Runtime.Serialization;
using System.Collections;
using System.Collections.Generic;
using FreeImageAPI.Metadata;
using System.Diagnostics;

namespace FreeImageAPI
{
	/// <summary>
	/// Encapsulates a FreeImage-bitmap.
	/// </summary>
	[Serializable, Guid("64a4c935-b757-499c-ab8c-6110316a9e51")]
	public class FreeImageBitmap : MarshalByRefObject, ICloneable, IDisposable, IEnumerable, ISerializable
	{
		#region Fields

		/// <summary>
		/// Indicates whether this instance is disposed.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private bool disposed;

		/// <summary>
		/// Tab object.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private object tag;

		/// <summary>
		/// Object used to syncronize lock methods.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private object lockObject = new object();

		/// <summary>
		/// Holds information used by SaveAdd() methods.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private SaveInformation saveInformation = new SaveInformation();

		/// <summary>
		/// The stream that this instance was loaded from or
		/// null if it has been cloned or deserialized.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private Stream stream;

		/// <summary>
		/// True if the stream must be disposed with this
		/// instance.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private bool disposeStream;

		/// <summary>
		/// The number of frames contained by a mutlipage bitmap.
		/// Default value is 1 and only changed if needed.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private int frameCount = 1;

		/// <summary>
		/// The index of the loaded frame.
		/// Default value is 0 and only changed if needed.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private int frameIndex = 0;

		/// <summary>
		/// Format of the sourceimage.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private FREE_IMAGE_FORMAT originalFormat = FREE_IMAGE_FORMAT.FIF_UNKNOWN;

		/// <summary>
		/// Handle to the encapsulated FreeImage-bitmap.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private FIBITMAP dib;

		private const string ErrorLoadingBitmap = "Unable to load bitmap.";
		private const string ErrorLoadingFrame = "Unable to load frame.";
		private const string ErrorCreatingBitmap = "Unable to create bitmap.";
		private const string ErrorUnloadBitmap = "Unable to unload bitmap.";

		#endregion

		#region Constructors and Destructor

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class.
		/// </summary>
		protected FreeImageBitmap()
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class.
		/// For internal use only.
		/// </summary>
		/// <exception cref="Exception">The operation failed.</exception>
		internal protected FreeImageBitmap(FIBITMAP dib)
		{
			if (dib.IsNull)
			{
				throw new Exception(ErrorLoadingBitmap);
			}
			this.dib = dib;
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified image.
		/// </summary>
		/// <param name="original">The original to clone from.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="original"/> is a null reference.</exception>
		public FreeImageBitmap(FreeImageBitmap original)
		{
			if (original == null)
			{
				throw new ArgumentNullException("original");
			}
			original.EnsureNotDisposed();
			dib = FreeImage.Clone(original.dib);
			if (dib.IsNull)
			{
				throw new Exception(ErrorLoadingBitmap);
			}
			originalFormat = original.originalFormat;
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified image with the specified size.
		/// </summary>
		/// <param name="original">The original to clone from.</param>
		/// <param name="newSize">The Size structure that represent the
		/// size of the new <see cref="FreeImageBitmap"/>.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="original"/> is a null reference.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="newSize.Width"/> or <paramref name="newSize.Height"/> are less or equal zero.
		/// </exception>
		public FreeImageBitmap(FreeImageBitmap original, Size newSize)
			: this(original, newSize.Width, newSize.Height)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified image with the specified size.
		/// </summary>
		/// <param name="original">The original to clone from.</param>
		/// <param name="width">Width of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">Height of the new <see cref="FreeImageBitmap"/>.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="original"/> is a null reference.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="width"/> or <paramref name="height"/> are less or equal zero.</exception>
		public FreeImageBitmap(FreeImageBitmap original, int width, int height)
		{
			if (original == null)
			{
				throw new ArgumentNullException("original");
			}
			if (width <= 0)
			{
				throw new ArgumentOutOfRangeException("width");
			}
			if (height <= 0)
			{
				throw new ArgumentOutOfRangeException("height");
			}
			original.EnsureNotDisposed();
			dib = FreeImage.Rescale(original.dib, width, height, FREE_IMAGE_FILTER.FILTER_BICUBIC);
			if (dib.IsNull)
			{
				throw new Exception(ErrorLoadingBitmap);
			}
			originalFormat = original.originalFormat;
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified image.
		/// </summary>
		/// <param name="original">The original to clone from.</param>
		/// <remarks>
		/// Although this constructor supports creating images in both formats
		/// <see cref="System.Drawing.Imaging.PixelFormat.Format32bppPArgb"/>
		/// and <see cref="System.Drawing.Imaging.PixelFormat.Format64bppPArgb"/>, bitmaps
		/// created in these formats are treated like any normal 32-bit RGBA and 64-bit RGBA
		/// images respectively. Currently, there is no  support for automatic premultiplying images in
		/// <see cref="FreeImageBitmap"/>.
		/// </remarks>
		/// <exception cref="Exception">The operation failed.</exception>
		public FreeImageBitmap(Image original)
			: this(original as Bitmap)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified image with the specified size.
		/// </summary>
		/// <param name="original">The original to clone from.</param>
		/// <param name="newSize">The Size structure that represent the
		/// size of the new <see cref="FreeImageBitmap"/>.</param>
		/// <remarks>
		/// Although this constructor supports creating images in both formats
		/// <see cref="System.Drawing.Imaging.PixelFormat.Format32bppPArgb"/>
		/// and <see cref="System.Drawing.Imaging.PixelFormat.Format64bppPArgb"/>, bitmaps
		/// created in these formats are treated like any normal 32-bit RGBA and 64-bit RGBA
		/// images respectively. Currently, there is no  support for automatic premultiplying images in
		/// <see cref="FreeImageBitmap"/>.
		/// </remarks>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="original"/> is a null reference.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="newSize.Width"/> or <paramref name="newSize.Height"/> are less or equal zero.
		/// </exception>
		public FreeImageBitmap(Image original, Size newSize)
			: this(original as Bitmap, newSize.Width, newSize.Height)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified image with the specified size.
		/// </summary>
		/// <param name="original">The original to clone from.</param>
		/// <param name="width">The width, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">The height, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <remarks>
		/// Although this constructor supports creating images in both formats
		/// <see cref="System.Drawing.Imaging.PixelFormat.Format32bppPArgb"/>
		/// and <see cref="System.Drawing.Imaging.PixelFormat.Format64bppPArgb"/>, bitmaps
		/// created in these formats are treated like any normal 32-bit RGBA and 64-bit RGBA
		/// images respectively. Currently, there is no  support for automatic premultiplying images in
		/// <see cref="FreeImageBitmap"/>.
		/// </remarks>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="original"/> is a null reference.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="width"/> or <paramref name="height"/> are less or equal zero.</exception>
		public FreeImageBitmap(Image original, int width, int height)
			: this(original as Bitmap, width, height)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified image.
		/// </summary>
		/// <param name="original">The original to clone from.</param>
		/// <remarks>
		/// Although this constructor supports creating images in both formats
		/// <see cref="System.Drawing.Imaging.PixelFormat.Format32bppPArgb"/>
		/// and <see cref="System.Drawing.Imaging.PixelFormat.Format64bppPArgb"/>, bitmaps
		/// created in these formats are treated like any normal 32-bit RGBA and 64-bit RGBA
		/// images respectively. Currently, there is no  support for automatic premultiplying images in
		/// <see cref="FreeImageBitmap"/>.
		/// </remarks>
		/// <exception cref="ArgumentNullException"><paramref name="original"/> is a null reference.</exception>
		/// <exception cref="Exception">The operation failed.</exception>
		public FreeImageBitmap(Bitmap original)
		{
			if (original == null)
			{
				throw new ArgumentNullException("original");
			}
			dib = FreeImage.CreateFromBitmap(original, true);
			if (dib.IsNull)
			{
				throw new Exception(ErrorLoadingBitmap);
			}
			originalFormat = FreeImage.GetFormat(original.RawFormat);
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified image with the specified size.
		/// </summary>
		/// <param name="original">The original to clone from.</param>
		/// <param name="newSize">The Size structure that represent the
		/// size of the new <see cref="FreeImageBitmap"/>.</param>
		/// <remarks>
		/// Although this constructor supports creating images in both formats
		/// <see cref="System.Drawing.Imaging.PixelFormat.Format32bppPArgb"/>
		/// and <see cref="System.Drawing.Imaging.PixelFormat.Format64bppPArgb"/>, bitmaps
		/// created in these formats are treated like any normal 32-bit RGBA and 64-bit RGBA
		/// images respectively. Currently, there is no  support for automatic premultiplying images in
		/// <see cref="FreeImageBitmap"/>.
		/// </remarks>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="original"/> is a null reference.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="newSize.Width"/> or <paramref name="newSize.Height"/> are less or equal zero.
		/// </exception>
		public FreeImageBitmap(Bitmap original, Size newSize)
			: this(original, newSize.Width, newSize.Height)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified image with the specified size.
		/// </summary>
		/// <param name="original">The original to clone from.</param>
		/// <param name="width">The width, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">The height, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <remarks>
		/// Although this constructor supports creating images in both formats
		/// <see cref="System.Drawing.Imaging.PixelFormat.Format32bppPArgb"/>
		/// and <see cref="System.Drawing.Imaging.PixelFormat.Format64bppPArgb"/>, bitmaps
		/// created in these formats are treated like any normal 32-bit RGBA and 64-bit RGBA
		/// images respectively. Currently, there is no  support for automatic premultiplying images in
		/// <see cref="FreeImageBitmap"/>.
		/// </remarks>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="original"/> is a null reference.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="width"/> or <paramref name="height"/> are less or equal zero.</exception>
		public FreeImageBitmap(Bitmap original, int width, int height)
		{
			if (original == null)
			{
				throw new ArgumentNullException("original");
			}
			if (width <= 0)
			{
				throw new ArgumentOutOfRangeException("width");
			}
			if (height <= 0)
			{
				throw new ArgumentOutOfRangeException("height");
			}
			FIBITMAP temp = FreeImage.CreateFromBitmap(original, true);
			if (temp.IsNull)
			{
				throw new Exception(ErrorLoadingBitmap);
			}
			dib = FreeImage.Rescale(temp, width, height, FREE_IMAGE_FILTER.FILTER_BICUBIC);
			FreeImage.Unload(temp);
			if (dib.IsNull)
			{
				throw new Exception(ErrorLoadingBitmap);
			}
			originalFormat = FreeImage.GetFormat(original.RawFormat);
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified stream.
		/// </summary>
		/// <param name="stream">Stream to read from.</param>
		/// <param name="useIcm">Ignored.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="stream"/> is a null reference.</exception>
		/// <remarks>
		/// You must keep the stream open for the lifetime of the <see cref="FreeImageBitmap"/>.
		/// </remarks>
		public FreeImageBitmap(Stream stream, bool useIcm)
			: this(stream)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified stream.
		/// </summary>
		/// <param name="stream">Stream to read from.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="stream"/> is a null reference.</exception>
		/// <remarks>
		/// You must keep the stream open for the lifetime of the <see cref="FreeImageBitmap"/>.
		/// </remarks>
		public FreeImageBitmap(Stream stream)
			: this(stream, FREE_IMAGE_FORMAT.FIF_UNKNOWN, FREE_IMAGE_LOAD_FLAGS.DEFAULT)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified stream in the specified format.
		/// </summary>
		/// <param name="stream">Stream to read from.</param>
		/// <param name="format">Format of the image.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="stream"/> is a null reference.</exception>
		/// <remarks>
		/// You must keep the stream open for the lifetime of the <see cref="FreeImageBitmap"/>.
		/// </remarks>
		public FreeImageBitmap(Stream stream, FREE_IMAGE_FORMAT format)
			: this(stream, format, FREE_IMAGE_LOAD_FLAGS.DEFAULT)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified stream with the specified loading flags.
		/// </summary>
		/// <param name="stream">Stream to read from.</param>
		/// <param name="flags">Flags to enable or disable plugin-features.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="stream"/> is a null reference.</exception>
		/// <remarks>
		/// You must keep the stream open for the lifetime of the <see cref="FreeImageBitmap"/>.
		/// </remarks>
		public FreeImageBitmap(Stream stream, FREE_IMAGE_LOAD_FLAGS flags)
			: this(stream, FREE_IMAGE_FORMAT.FIF_UNKNOWN, flags)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified stream in the specified format
		/// with the specified loading flags.
		/// </summary>
		/// <param name="stream">Stream to read from.</param>
		/// <param name="format">Format of the image.</param>
		/// <param name="flags">Flags to enable or disable plugin-features.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="stream"/> is a null reference.</exception>
		/// <remarks>
		/// You must keep the stream open for the lifetime of the <see cref="FreeImageBitmap"/>.
		/// </remarks>
		public FreeImageBitmap(Stream stream, FREE_IMAGE_FORMAT format, FREE_IMAGE_LOAD_FLAGS flags)
		{
			if (stream == null)
			{
				throw new ArgumentNullException("stream");
			}
			this.stream = stream;
			disposeStream = false;
			LoadFromStream(stream, format, flags);
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified file.
		/// </summary>
		/// <param name="filename">The complete name of the file to load.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="filename"/> is a null reference.</exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		public FreeImageBitmap(string filename)
			: this(filename, FREE_IMAGE_LOAD_FLAGS.DEFAULT)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified file.
		/// </summary>
		/// <param name="filename">The complete name of the file to load.</param>
		/// <param name="useIcm">Ignored.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="filename"/> is a null reference.</exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		public FreeImageBitmap(string filename, bool useIcm)
			: this(filename)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified file
		/// with the specified loading flags.
		/// </summary>
		/// <param name="filename">The complete name of the file to load.</param>
		/// <param name="flags">Flags to enable or disable plugin-features.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="filename"/> is a null reference.</exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		public FreeImageBitmap(string filename, FREE_IMAGE_LOAD_FLAGS flags)
			: this(filename, FREE_IMAGE_FORMAT.FIF_UNKNOWN, flags)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified file
		/// in the specified format.
		/// </summary>
		/// <param name="filename">The complete name of the file to load.</param>
		/// <param name="format">Format of the image.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="filename"/> is a null reference.</exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		public FreeImageBitmap(string filename, FREE_IMAGE_FORMAT format)
			: this(filename, format, FREE_IMAGE_LOAD_FLAGS.DEFAULT)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified file
		/// in the specified format with the specified loading flags.
		/// </summary>
		/// <param name="filename">The complete name of the file to load.</param>
		/// <param name="format">Format of the image.</param>
		/// <param name="flags">Flags to enable or disable plugin-features.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="filename"/> is a null reference.</exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		public FreeImageBitmap(string filename, FREE_IMAGE_FORMAT format, FREE_IMAGE_LOAD_FLAGS flags)
		{
			if (filename == null)
			{
				throw new ArgumentNullException("filename");
			}
			if (!File.Exists(filename))
			{
				throw new FileNotFoundException("filename");
			}

			saveInformation.filename = filename;
			stream = new FileStream(filename, FileMode.Open, FileAccess.Read, FileShare.Read);
			disposeStream = true;
			LoadFromStream(stream, format, flags);
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class
		/// bases on the specified size.
		/// </summary>
		/// <param name="width">The width, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">The height, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		public FreeImageBitmap(int width, int height)
		{
			dib = FreeImage.Allocate(
				width,
				height,
				24,
				FreeImage.FI_RGBA_RED_MASK,
				FreeImage.FI_RGBA_GREEN_MASK,
				FreeImage.FI_RGBA_BLUE_MASK);
			if (dib.IsNull)
			{
				throw new Exception(ErrorCreatingBitmap);
			}
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified resource.
		/// </summary>
		/// <param name="type">The class used to extract the resource.</param>
		/// <param name="resource">The name of the resource.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		public FreeImageBitmap(Type type, string resource)
			: this(type.Module.Assembly.GetManifestResourceStream(type, resource))
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified size
		/// and with the resolution of the specified <see cref="System.Drawing.Graphics"/> object.
		/// </summary>
		/// <param name="width">The width, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">The height, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="g">The Graphics object that specifies the resolution for the new <see cref="FreeImageBitmap"/>.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="g"/> is a null reference.</exception>
		public FreeImageBitmap(int width, int height, Graphics g)
			: this(width, height)
		{
			FreeImage.SetResolutionX(dib, (uint)g.DpiX);
			FreeImage.SetResolutionY(dib, (uint)g.DpiY);
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified size and format.
		/// </summary>
		/// <param name="width">The width, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">The height, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="format">The PixelFormat enumeration for the new <see cref="FreeImageBitmap"/>.</param>
		/// <remarks>
		/// Although this constructor supports creating images in both formats
		/// <see cref="System.Drawing.Imaging.PixelFormat.Format32bppPArgb"/>
		/// and <see cref="System.Drawing.Imaging.PixelFormat.Format64bppPArgb"/>, bitmaps
		/// created in these formats are treated like any normal 32-bit RGBA and 64-bit RGBA
		/// images respectively. Currently, there is no  support for automatic premultiplying images in
		/// <see cref="FreeImageBitmap"/>.
		/// </remarks>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentException"><paramref name="format"/> is invalid.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="width"/> or <paramref name="height"/> are less or equal zero.</exception>
		public FreeImageBitmap(int width, int height, PixelFormat format)
		{
			if (width <= 0)
			{
				throw new ArgumentOutOfRangeException("width");
			}
			if (height <= 0)
			{
				throw new ArgumentOutOfRangeException("height");
			}
			uint bpp, redMask, greenMask, blueMask;
			FREE_IMAGE_TYPE type;
			if (!FreeImage.GetFormatParameters(format, out type, out bpp, out redMask, out greenMask, out blueMask))
			{
				throw new ArgumentException("format is invalid");
			}
			dib = FreeImage.AllocateT(type, width, height, (int)bpp, redMask, greenMask, blueMask);
			if (dib.IsNull)
			{
				throw new Exception(ErrorCreatingBitmap);
			}
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified size and type.
		/// Only non standard bitmaps are supported.
		/// </summary>	
		/// <param name="width">The width, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">The height, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="type">The type of the bitmap.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="type"/> is FIT_BITMAP or FIT_UNKNOWN.</exception>
		/// <exception cref="ArgumentException"><paramref name="type"/> is invalid.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="width"/> or <paramref name="height"/> are less or equal zero.</exception>
		public FreeImageBitmap(int width, int height, FREE_IMAGE_TYPE type)
		{
			if (width <= 0)
			{
				throw new ArgumentOutOfRangeException("width");
			}
			if (height <= 0)
			{
				throw new ArgumentOutOfRangeException("height");
			}
			if ((type == FREE_IMAGE_TYPE.FIT_BITMAP) || (type == FREE_IMAGE_TYPE.FIT_UNKNOWN))
			{
				throw new ArgumentException("type is invalid.");
			}
			dib = FreeImage.AllocateT(type, width, height, 0, 0u, 0u, 0u);
			if (dib.IsNull)
			{
				throw new Exception(ErrorCreatingBitmap);
			}
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified size,
		/// pixel format and pixel data.
		/// </summary>
		/// <param name="width">The width, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">The height, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="stride">Integer that specifies the byte offset between the beginning
		/// of one scan line and the next. This is usually (but not necessarily)
		/// the number of bytes in the pixel format (for example, 2 for 16 bits per pixel)
		/// multiplied by the width of the bitmap. The value passed to this parameter must
		/// be a multiple of four..</param>
		/// <param name="format">The PixelFormat enumeration for the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="scan0">Pointer to an array of bytes that contains the pixel data.</param>
		/// <remarks>
		/// Although this constructor supports creating images in both formats
		/// <see cref="System.Drawing.Imaging.PixelFormat.Format32bppPArgb"/>
		/// and <see cref="System.Drawing.Imaging.PixelFormat.Format64bppPArgb"/>, bitmaps
		/// created in these formats are treated like any normal 32-bit RGBA and 64-bit RGBA
		/// images respectively. Currently, there is no  support for automatic premultiplying images in
		/// <see cref="FreeImageBitmap"/>.
		/// </remarks>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentException"><paramref name="format"/> is invalid.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="width"/> or <paramref name="height"/> are less or equal zero.</exception>
		public FreeImageBitmap(int width, int height, int stride, PixelFormat format, IntPtr scan0)
		{
			if (width <= 0)
			{
				throw new ArgumentOutOfRangeException("width");
			}
			if (height <= 0)
			{
				throw new ArgumentOutOfRangeException("height");
			}
			uint bpp, redMask, greenMask, blueMask;
			FREE_IMAGE_TYPE type;
			bool topDown = (stride > 0);
			stride = (stride > 0) ? stride : (stride * -1);

			if (!FreeImage.GetFormatParameters(format, out type, out bpp, out redMask, out greenMask, out blueMask))
			{
				throw new ArgumentException("format is invalid.");
			}

			dib = FreeImage.ConvertFromRawBits(
				scan0, type, width, height, stride, bpp, redMask, greenMask, blueMask, topDown);

			if (dib.IsNull)
			{
				throw new Exception(ErrorCreatingBitmap);
			}
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified size,
		/// pixel format and pixel data.
		/// </summary>
		/// <param name="width">The width, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">The height, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="stride">Integer that specifies the byte offset between the beginning
		/// of one scan line and the next. This is usually (but not necessarily)
		/// the number of bytes in the pixel format (for example, 2 for 16 bits per pixel)
		/// multiplied by the width of the bitmap. The value passed to this parameter must
		/// be a multiple of four..</param>
		/// <param name="format">The PixelFormat enumeration for the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="bits">Array of bytes containing the bitmap data.</param>
		/// <remarks>
		/// Although this constructor supports creating images in both formats
		/// <see cref="System.Drawing.Imaging.PixelFormat.Format32bppPArgb"/>
		/// and <see cref="System.Drawing.Imaging.PixelFormat.Format64bppPArgb"/>, bitmaps
		/// created in these formats are treated like any normal 32-bit RGBA and 64-bit RGBA
		/// images respectively. Currently, there is no  support for automatic premultiplying images in
		/// <see cref="FreeImageBitmap"/>.
		/// </remarks>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentException"><paramref name="format"/> is invalid.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="width"/> or <paramref name="height"/> are less or equal zero.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="bits"/> is null</exception>
		public FreeImageBitmap(int width, int height, int stride, PixelFormat format, byte[] bits)
		{
			if (width <= 0)
			{
				throw new ArgumentOutOfRangeException("width");
			}
			if (height <= 0)
			{
				throw new ArgumentOutOfRangeException("height");
			}
			if (bits == null)
			{
				throw new ArgumentNullException("bits");
			}
			uint bpp, redMask, greenMask, blueMask;
			FREE_IMAGE_TYPE type;
			bool topDown = (stride > 0);
			stride = (stride > 0) ? stride : (stride * -1);

			if (!FreeImage.GetFormatParameters(format, out type, out bpp, out redMask, out greenMask, out blueMask))
			{
				throw new ArgumentException("format is invalid.");
			}

			dib = FreeImage.ConvertFromRawBits(
				bits, type, width, height, stride, bpp, redMask, greenMask, blueMask, topDown);

			if (dib.IsNull)
			{
				throw new Exception(ErrorCreatingBitmap);
			}
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified size,
		/// pixel format and pixel data.
		/// </summary>
		/// <param name="width">The width, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">The height, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="stride">Integer that specifies the byte offset between the beginning
		/// of one scan line and the next. This is usually (but not necessarily)
		/// the number of bytes in the pixel format (for example, 2 for 16 bits per pixel)
		/// multiplied by the width of the bitmap. The value passed to this parameter must
		/// be a multiple of four..</param>
		/// <param name="bpp">The color depth of the new <see cref="FreeImageBitmap"/></param>
		/// <param name="type">The type for the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="scan0">Pointer to an array of bytes that contains the pixel data.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentException"><paramref name="format"/> is invalid.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="width"/> or <paramref name="height"/> are less or equal zero.</exception>
		public FreeImageBitmap(int width, int height, int stride, int bpp, FREE_IMAGE_TYPE type, IntPtr scan0)
		{
			if (width <= 0)
			{
				throw new ArgumentOutOfRangeException("width");
			}
			if (height <= 0)
			{
				throw new ArgumentOutOfRangeException("height");
			}
			uint redMask, greenMask, blueMask;
			bool topDown = (stride > 0);
			stride = (stride > 0) ? stride : (stride * -1);

			if (!FreeImage.GetTypeParameters(type, bpp, out redMask, out greenMask, out blueMask))
			{
				throw new ArgumentException("bpp and type are invalid or not supported.");
			}

			dib = FreeImage.ConvertFromRawBits(
				scan0, type, width, height, stride, (uint)bpp, redMask, greenMask, blueMask, topDown);

			if (dib.IsNull)
			{
				throw new Exception(ErrorCreatingBitmap);
			}
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class bases on the specified size,
		/// pixel format and pixel data.
		/// </summary>
		/// <param name="width">The width, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">The height, in pixels, of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="stride">Integer that specifies the byte offset between the beginning
		/// of one scan line and the next. This is usually (but not necessarily)
		/// the number of bytes in the pixel format (for example, 2 for 16 bits per pixel)
		/// multiplied by the width of the bitmap. The value passed to this parameter must
		/// be a multiple of four..</param>
		/// <param name="bpp">The color depth of the new <see cref="FreeImageBitmap"/></param>
		/// <param name="type">The type for the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="bits">Array of bytes containing the bitmap data.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="ArgumentException"><paramref name="format"/> is invalid.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="width"/> or <paramref name="height"/> are less or equal zero.</exception>
		/// <exception cref="ArgumentNullException"><paramref name="bits"/> is null</exception>
		public FreeImageBitmap(int width, int height, int stride, int bpp, FREE_IMAGE_TYPE type, byte[] bits)
		{
			if (width <= 0)
			{
				throw new ArgumentOutOfRangeException("width");
			}
			if (height <= 0)
			{
				throw new ArgumentOutOfRangeException("height");
			}
			if (bits == null)
			{
				throw new ArgumentNullException("bits");
			}
			uint redMask, greenMask, blueMask;
			bool topDown = (stride > 0);
			stride = (stride > 0) ? stride : (stride * -1);

			if (!FreeImage.GetTypeParameters(type, bpp, out redMask, out greenMask, out blueMask))
			{
				throw new ArgumentException("bpp and type are invalid or not supported.");
			}

			dib = FreeImage.ConvertFromRawBits(
				bits, type, width, height, stride, (uint)bpp, redMask, greenMask, blueMask, topDown);

			if (dib.IsNull)
			{
				throw new Exception(ErrorCreatingBitmap);
			}
			AddMemoryPressure();
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="FreeImageBitmap"/> class.
		/// </summary>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="SerializationException">The operation failed.</exception>
		public FreeImageBitmap(SerializationInfo info, StreamingContext context)
		{
			try
			{
				byte[] data = (byte[])info.GetValue("Bitmap Data", typeof(byte[]));
				if ((data != null) && (data.Length > 0))
				{
					MemoryStream memory = new MemoryStream(data);
					FREE_IMAGE_FORMAT format = FREE_IMAGE_FORMAT.FIF_TIFF;
					dib = FreeImage.LoadFromStream(memory, ref format);

					if (dib.IsNull)
					{
						throw new Exception(ErrorLoadingBitmap);
					}

					AddMemoryPressure();
				}
			}
			catch (Exception ex)
			{
				throw new SerializationException("Deserialization failed.", ex);
			}
		}

		/// <summary>
		/// Frees all managed and unmanaged ressources.
		/// </summary>
		~FreeImageBitmap()
		{
			Dispose(false);
		}

		#endregion

		#region Operators

		/// <summary>
		/// Converts a <see cref="FreeImageBitmap"/> instance to a <see cref="Bitmap"/> instance.
		/// </summary>
		/// <param name="value">A <see cref="FreeImageBitmap"/> instance.</param>
		/// <returns>A new instance of <see cref="Bitmap"/> initialized to <paramref name="value"/>.</returns>
		/// <remarks>
		/// The explicit conversion from <see cref="FreeImageBitmap"/> into Bitmap
		/// allows to create an instance on the fly and use it as if
		/// was a Bitmap. This way it can be directly used with a
		/// PixtureBox for example without having to call any
		/// conversion operations.
		/// </remarks>
		public static explicit operator Bitmap(FreeImageBitmap value)
		{
			return value.ToBitmap();
		}

		/// <summary>
		/// Converts a <see cref="Bitmap"/> instance to a <see cref="FreeImageBitmap"/> instance.
		/// </summary>
		/// <param name="value">A <see cref="Bitmap"/> instance.</param>
		/// <returns>A new instance of <see cref="FreeImageBitmap"/> initialized to <paramref name="value"/>.</returns>
		/// <remarks>
		/// The explicit conversion from <see cref="Bitmap"/> into <see cref="FreeImageBitmap"/>
		/// allows to create an instance on the fly to perform
		/// image processing operations and converting it back.
		/// </remarks>
		public static explicit operator FreeImageBitmap(Bitmap value)
		{
			return new FreeImageBitmap(value);
		}

		/// <summary>
		/// Determines whether two specified <see cref="FreeImageBitmap"/> objects have the same value.
		/// </summary>
		/// <param name="left">A <see cref="FreeImageBitmap"/> or a null reference (<b>Nothing</b> in Visual Basic).</param>
		/// <param name="right">A <see cref="FreeImageBitmap"/> or a null reference (<b>Nothing</b> in Visual Basic).</param>
		/// <returns>
		/// <b>true</b> if the value of left is the same as the value of right; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator ==(FreeImageBitmap left, FreeImageBitmap right)
		{
			if (object.ReferenceEquals(left, right))
			{
				return true;
			}
			else if (object.ReferenceEquals(left, null) || object.ReferenceEquals(right, null))
			{
				return false;
			}
			else
			{
				left.EnsureNotDisposed();
				right.EnsureNotDisposed();
				return FreeImage.Compare(left.dib, right.dib, FREE_IMAGE_COMPARE_FLAGS.COMPLETE);
			}
		}

		/// <summary>
		/// Determines whether two specified <see cref="FreeImageBitmap"/> objects have different values.
		/// </summary>
		/// <param name="left">A <see cref="FreeImageBitmap"/> or a null reference (<b>Nothing</b> in Visual Basic).</param>
		/// <param name="right">A <see cref="FreeImageBitmap"/> or a null reference (<b>Nothing</b> in Visual Basic).</param>
		/// <returns>
		/// true if the value of left is different from the value of right; otherwise, <b>false</b>.
		/// </returns>
		public static bool operator !=(FreeImageBitmap left, FreeImageBitmap right)
		{
			return (!(left == right));
		}

		#endregion

		#region Properties

		/// <summary>
		/// Type of the bitmap.
		/// </summary>
		public FREE_IMAGE_TYPE ImageType
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetImageType(dib);
			}
		}

		/// <summary>
		/// Number of palette entries.
		/// </summary>
		public int ColorsUsed
		{
			get
			{
				EnsureNotDisposed();
				return (int)FreeImage.GetColorsUsed(dib);
			}
		}

		/// <summary>
		/// The number of unique colors actually used by the bitmap. This might be different from
		/// what ColorsUsed returns, which actually returns the palette size for palletised images.
		/// Works for FIT_BITMAP type bitmaps only.
		/// </summary>
		public int UniqueColors
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetUniqueColors(dib);
			}
		}

		/// <summary>
		/// The size of one pixel in the bitmap in bits.
		/// </summary>
		public int ColorDepth
		{
			get
			{
				EnsureNotDisposed();
				return (int)FreeImage.GetBPP(dib);
			}
		}

		/// <summary>
		/// Width of the bitmap in pixel units.
		/// </summary>
		public int Width
		{
			get
			{
				EnsureNotDisposed();
				return (int)FreeImage.GetWidth(dib);
			}
		}

		/// <summary>
		/// Height of the bitmap in pixel units.
		/// </summary>
		public int Height
		{
			get
			{
				EnsureNotDisposed();
				return (int)FreeImage.GetHeight(dib);
			}
		}

		/// <summary>
		/// Returns the width of the bitmap in bytes, rounded to the next 32-bit boundary.
		/// </summary>
		public int Pitch
		{
			get
			{
				EnsureNotDisposed();
				return (int)FreeImage.GetPitch(dib);
			}
		}

		/// <summary>
		/// Size of the bitmap in memory.
		/// </summary>
		public int DataSize
		{
			get
			{
				EnsureNotDisposed();
				return (int)FreeImage.GetDIBSize(dib);
			}
		}

		/// <summary>
		/// Returns a structure that represents the palette of a FreeImage bitmap.
		/// </summary>
		/// <exception cref="InvalidOperationException"><see cref="HasPalette"/> is false.</exception>
		public Palette Palette
		{
			get
			{
				EnsureNotDisposed();
				if (HasPalette)
				{
					return new Palette(dib);
				}
				throw new InvalidOperationException("This bitmap does not have a palette.");
			}
		}

		/// <summary>
		/// Gets whether the bitmap is RGB 555.
		/// </summary>
		public bool IsRGB555
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.IsRGB555(dib);
			}
		}

		/// <summary>
		/// Gets whether the bitmap is RGB 565.
		/// </summary>
		public bool IsRGB565
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.IsRGB565(dib);
			}
		}

		/// <summary>
		/// Gets the horizontal resolution, in pixels per inch, of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public float HorizontalResolution
		{
			get
			{
				EnsureNotDisposed();
				return (float)FreeImage.GetResolutionX(dib);
			}
			private set
			{
				EnsureNotDisposed();
				FreeImage.SetResolutionX(dib, (uint)value);
			}
		}

		/// <summary>
		/// Gets the vertical resolution, in pixels per inch, of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public float VerticalResolution
		{
			get
			{
				EnsureNotDisposed();
				return (float)FreeImage.GetResolutionY(dib);
			}
			private set
			{
				EnsureNotDisposed();
				FreeImage.SetResolutionY(dib, (uint)value);
			}
		}

		/// <summary>
		/// Returns the <see cref="BITMAPINFOHEADER"/> structure of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public BITMAPINFOHEADER InfoHeader
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetInfoHeaderEx(dib);
			}
		}

		/// <summary>
		/// Returns the <see cref="BITMAPINFO"/> structure of a this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public BITMAPINFO Info
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetInfoEx(dib);
			}
		}

		/// <summary>
		/// Investigates the color type of this <see cref="FreeImageBitmap"/>
		/// by reading the bitmaps pixel bits and analysing them.
		/// </summary>
		public FREE_IMAGE_COLOR_TYPE ColorType
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetColorType(dib);
			}
		}

		/// <summary>
		/// Bit pattern describing the red color component of a pixel in this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public uint RedMask
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetRedMask(dib);
			}
		}

		/// <summary>
		/// Bit pattern describing the green color component of a pixel in this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public uint GreenMask
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetGreenMask(dib);
			}
		}

		/// <summary>
		/// Bit pattern describing the blue color component of a pixel in this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public uint BlueMask
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetBlueMask(dib);
			}
		}

		/// <summary>
		/// Number of transparent colors in a palletised <see cref="FreeImageBitmap"/>.
		/// </summary>
		public int TransparencyCount
		{
			get
			{
				EnsureNotDisposed();
				return (int)FreeImage.GetTransparencyCount(dib);
			}
		}

		/// <summary>
		/// Get or sets transparency table of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public byte[] TransparencyTable
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetTransparencyTableEx(dib);
			}
			set
			{
				EnsureNotDisposed();
				FreeImage.SetTransparencyTable(dib, value);
			}
		}

		/// <summary>
		/// Gets or sets whether this <see cref="FreeImageBitmap"/> is transparent.
		/// </summary>
		public bool IsTransparent
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.IsTransparent(dib);
			}
			set
			{
				EnsureNotDisposed();
				FreeImage.SetTransparent(dib, value);
			}
		}

		/// <summary>
		/// Gets whether this <see cref="FreeImageBitmap"/> has a file background color.
		/// </summary>
		public bool HasBackgroundColor
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.HasBackgroundColor(dib);
			}
		}

		/// <summary>
		/// Gets or sets the background color of this <see cref="FreeImageBitmap"/>.
		/// In case the value is null, the background color is removed.
		/// </summary>
		/// <exception cref="InvalidOperationException">Get: There is no background color available.</exception>
		/// <exception cref="Exception">Set: Setting background color failed.</exception>
		public Color? BackgroundColor
		{
			get
			{
				EnsureNotDisposed();
				if (!FreeImage.HasBackgroundColor(dib))
				{
					throw new InvalidOperationException("No background color available.");
				}
				RGBQUAD rgbq;
				FreeImage.GetBackgroundColor(dib, out rgbq);
				return rgbq.Color;
			}
			set
			{
				EnsureNotDisposed();
				if (!FreeImage.SetBackgroundColor(dib, (value.HasValue ? new RGBQUAD[] { value.Value } : null)))
				{
					throw new Exception("Setting background color failed.");
				}
			}
		}

		/// <summary>
		/// Pointer to the data-bits of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public IntPtr Bits
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetBits(dib);
			}
		}

		/// <summary>
		/// Width, in bytes, of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public int Line
		{
			get
			{
				EnsureNotDisposed();
				return (int)FreeImage.GetLine(dib);
			}
		}

		/// <summary>
		/// Pointer to the scanline of the top most pixel row of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public IntPtr Scan0
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetScanLine(dib, (int)(FreeImage.GetHeight(dib) - 1));
			}
		}

		/// <summary>
		/// Width, in bytes, of this <see cref="FreeImageBitmap"/>.
		/// In case this <see cref="FreeImageBitmap"/> is top down <b>Stride</b> will be positive, else negative.
		/// </summary>
		public int Stride
		{
			get
			{
				return -Line;
			}
		}

		/// <summary>
		/// Gets attribute flags for the pixel data of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public unsafe int Flags
		{
			get
			{
				EnsureNotDisposed();
				int result = 0;
				byte alpha;
				int cd = ColorDepth;

				if ((cd == 32) || (FreeImage.GetTransparencyCount(dib) != 0))
				{
					result += (int)ImageFlags.HasAlpha;
				}

				if (cd == 32)
				{
					uint width = FreeImage.GetWidth(dib);
					uint height = FreeImage.GetHeight(dib);
					for (int y = 0; y < height; y++)
					{
						RGBQUAD* scanline = (RGBQUAD*)FreeImage.GetScanLine(dib, y);
						for (int x = 0; x < width; x++)
						{
							alpha = scanline[x].Color.A;
							if (alpha != byte.MinValue && alpha != byte.MaxValue)
							{
								result += (int)ImageFlags.HasTranslucent;
								y = (int)height;
								break;
							}
						}
					}
				}
				else if (FreeImage.GetTransparencyCount(dib) != 0)
				{
					byte[] transTable = FreeImage.GetTransparencyTableEx(dib);
					for (int i = 0; i < transTable.Length; i++)
					{
						if (transTable[i] != byte.MinValue && transTable[i] != byte.MaxValue)
						{
							result += (int)ImageFlags.HasTranslucent;
							break;
						}
					}
				}

				if (FreeImage.GetICCProfileEx(dib).IsCMYK)
				{
					result += (int)ImageFlags.ColorSpaceCmyk;
				}
				else
				{
					result += (int)ImageFlags.ColorSpaceRgb;
				}

				if (FreeImage.GetColorType(dib) == FREE_IMAGE_COLOR_TYPE.FIC_MINISBLACK ||
					FreeImage.GetColorType(dib) == FREE_IMAGE_COLOR_TYPE.FIC_MINISWHITE)
				{
					result += (int)ImageFlags.ColorSpaceGray;
				}

				if (originalFormat == FREE_IMAGE_FORMAT.FIF_BMP ||
					originalFormat == FREE_IMAGE_FORMAT.FIF_FAXG3 ||
					originalFormat == FREE_IMAGE_FORMAT.FIF_ICO ||
					originalFormat == FREE_IMAGE_FORMAT.FIF_JPEG ||
					originalFormat == FREE_IMAGE_FORMAT.FIF_PCX ||
					originalFormat == FREE_IMAGE_FORMAT.FIF_PNG ||
					originalFormat == FREE_IMAGE_FORMAT.FIF_PSD ||
					originalFormat == FREE_IMAGE_FORMAT.FIF_TIFF)
				{
					result += (int)ImageFlags.HasRealDpi;
				}

				return result;
			}
		}

		/// <summary>
		/// Gets the width and height of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public SizeF PhysicalDimension
		{
			get
			{
				EnsureNotDisposed();
				return new SizeF((float)FreeImage.GetWidth(dib), (float)FreeImage.GetHeight(dib));
			}
		}

		/// <summary>
		/// Gets the pixel format for this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public PixelFormat PixelFormat
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetPixelFormat(dib);
			}
		}

		/// <summary>
		/// Gets IDs of the property items stored in this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public int[] PropertyIdList
		{
			get
			{
				EnsureNotDisposed();
				List<int> list = new List<int>();
				ImageMetadata metaData = new ImageMetadata(dib, true);

				foreach (MetadataModel metadataModel in metaData)
				{
					foreach (MetadataTag metadataTag in metadataModel)
					{
						list.Add(metadataTag.ID);
					}
				}

				return list.ToArray();
			}
		}

		/// <summary>
		/// Gets all the property items (pieces of metadata) stored in this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public PropertyItem[] PropertyItems
		{
			get
			{
				EnsureNotDisposed();
				List<PropertyItem> list = new List<PropertyItem>();
				ImageMetadata metaData = new ImageMetadata(dib, true);

				foreach (MetadataModel metadataModel in metaData)
				{
					foreach (MetadataTag metadataTag in metadataModel)
					{
						list.Add(metadataTag.GetPropertyItem());
					}
				}

				return list.ToArray();
			}
		}

		/// <summary>
		/// Gets the format of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public ImageFormat RawFormat
		{
			get
			{
				EnsureNotDisposed();
				Attribute guidAttribute =
					Attribute.GetCustomAttribute(
						typeof(FreeImageBitmap), typeof(System.Runtime.InteropServices.GuidAttribute)
					);
				return (guidAttribute == null) ?
					null :
					new ImageFormat(new Guid(((GuidAttribute)guidAttribute).Value));
			}
		}

		/// <summary>
		/// Gets the width and height, in pixels, of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public Size Size
		{
			get
			{
				EnsureNotDisposed();
				return new Size(Width, Height);
			}
		}

		/// <summary>
		/// Gets or sets an object that provides additional data about the <see cref="FreeImageBitmap"/>.
		/// </summary>
		public Object Tag
		{
			get
			{
				EnsureNotDisposed();
				return tag;
			}
			set
			{
				EnsureNotDisposed();
				tag = value;
			}
		}

		/// <summary>
		/// Gets whether this <see cref="FreeImageBitmap"/> has been disposed.
		/// </summary>
		public bool IsDisposed
		{
			get
			{
				return disposed;
			}
		}

		/// <summary>
		/// Gets a new instance of a metadata representing class.
		/// </summary>
		public ImageMetadata Metadata
		{
			get
			{
				EnsureNotDisposed();
				return new ImageMetadata(dib, true);
			}
		}

		/// <summary>
		/// Gets or sets the comment of this <see cref="FreeImageBitmap"/>.
		/// Supported formats are JPEG, PNG and GIF.
		/// </summary>
		public string Comment
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetImageComment(dib);
			}
			set
			{
				EnsureNotDisposed();
				FreeImage.SetImageComment(dib, value);
			}
		}

		/// <summary>
		/// Returns whether this <see cref="FreeImageBitmap"/> has a palette.
		/// </summary>
		public bool HasPalette
		{
			get
			{
				EnsureNotDisposed();
				return (FreeImage.GetPalette(dib) != IntPtr.Zero);
			}
		}

		/// <summary>
		/// Gets or sets the entry used as transparent color in this <see cref="FreeImageBitmap"/>.
		/// Only works for 1-, 4- and 8-bpp.
		/// </summary>
		public int TransparentIndex
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetTransparentIndex(dib);
			}
			set
			{
				EnsureNotDisposed();
				FreeImage.SetTransparentIndex(dib, value);
			}
		}

		/// <summary>
		/// Gets the number of frames in this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public int FrameCount
		{
			get
			{
				EnsureNotDisposed();
				return frameCount;
			}
		}

		/// <summary>
		/// Gets the ICCProfile structure of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public FIICCPROFILE ICCProfile
		{
			get
			{
				EnsureNotDisposed();
				return FreeImage.GetICCProfileEx(dib);
			}
		}

		/// <summary>
		/// Gets the format of the original image in case
		/// this <see cref="FreeImageBitmap"/> was loaded from a file or stream.
		/// </summary>
		public FREE_IMAGE_FORMAT ImageFormat
		{
			get
			{
				EnsureNotDisposed();
				return originalFormat;
			}
		}

		/// <summary>
		/// Gets the encapsulated FIBITMAP.
		/// </summary>
		internal FIBITMAP Dib
		{
			get { EnsureNotDisposed(); return dib; }
		}

		#endregion

		#region Methods

		/// <summary>
		/// Gets the bounds of this <see cref="FreeImageBitmap"/> in the specified unit.
		/// </summary>
		/// <param name="pageUnit">One of the <see cref="System.Drawing.GraphicsUnit"/> values indicating
		/// the unit of measure for the bounding rectangle.</param>
		/// <returns>The <see cref="System.Drawing.RectangleF"/> that represents the bounds of this
		/// <see cref="FreeImageBitmap"/>, in the specified unit.</returns>
		public RectangleF GetBounds(ref GraphicsUnit pageUnit)
		{
			EnsureNotDisposed();
			pageUnit = GraphicsUnit.Pixel;
			return new RectangleF(
					0f,
					0f,
					(float)FreeImage.GetWidth(dib),
					(float)FreeImage.GetHeight(dib));
		}

		/// <summary>
		/// Gets the specified property item from this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="propid">The ID of the property item to get.</param>
		/// <returns>The <see cref="PropertyItem"/> this method gets.</returns>
		public PropertyItem GetPropertyItem(int propid)
		{
			EnsureNotDisposed();
			ImageMetadata metadata = new ImageMetadata(dib, true);
			foreach (MetadataModel metadataModel in metadata)
			{
				foreach (MetadataTag tag in metadataModel)
				{
					if (tag.ID == propid)
					{
						return tag.GetPropertyItem();
					}
				}
			}
			return null;
		}

		/// <summary>
		/// Returns a thumbnail for this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="thumbWidth">The width, in pixels, of the requested thumbnail image.</param>
		/// <param name="thumbHeight">The height, in pixels, of the requested thumbnail image.</param>
		/// <param name="callback">Ignored.</param>
		/// <param name="callBackData">Ignored.</param>
		/// <returns>A <see cref="FreeImageBitmap"/> that represents the thumbnail.</returns>
		public FreeImageBitmap GetThumbnailImage(int thumbWidth, int thumbHeight,
			Image.GetThumbnailImageAbort callback, IntPtr callBackData)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.Rescale(
				dib, thumbWidth, thumbHeight, FREE_IMAGE_FILTER.FILTER_BICUBIC);
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Returns a thumbnail for this <see cref="FreeImageBitmap"/>, keeping aspect ratio.
		/// <paramref name="maxPixelSize"/> defines the maximum width or height
		/// of the thumbnail.
		/// </summary>
		/// <param name="maxPixelSize">Thumbnail square size.</param>
		/// <param name="convert">When true HDR images are transperantly
		/// converted to standard images.</param>
		/// <returns>The thumbnail in a new instance.</returns>
		public FreeImageBitmap GetThumbnailImage(int maxPixelSize, bool convert)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.MakeThumbnail(dib, maxPixelSize, convert);
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Converts this <see cref="FreeImageBitmap"/> instance to a <see cref="Bitmap"/> instance.
		/// </summary>
		/// <returns>A new instance of <see cref="Bitmap"/> initialized this instance.</returns>
		public Bitmap ToBitmap()
		{
			EnsureNotDisposed();
			return FreeImage.GetBitmap(dib, true);
		}

		/// <summary>
		/// Returns an instance of <see cref="Scanline&lt;T&gt;"/>, representing the scanline
		/// specified by <paramref name="scanline"/> of this <see cref="FreeImageBitmap"/>.
		/// Since FreeImage bitmaps are always bottum up aligned, keep in mind that scanline 0 is the
		/// bottom-most line of the image.
		/// </summary>
		/// <param name="scanline">Number of the scanline to retrieve.</param>
		/// <returns>An instance of <see cref="Scanline&lt;T&gt;"/> representing the
		/// <paramref name="scanline"/>th scanline.</returns>
		/// <remarks>
		/// List of return-types of <b>T</b>:<para/>
		/// <list type="table">
		/// <listheader><term>Color Depth / Type</term><description><see cref="Type">Result Type</see></description></listheader>
		/// <item><term>1 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI1BIT"/></description></item>
		/// <item><term>4 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI4BIT"/></description></item>
		/// <item><term>8 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="Byte"/></description></item>
		/// <item><term>16 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="UInt16"/></description></item>
		/// <item><term>16 - 555 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI16RGB555"/></description></item>
		/// <item><term>16 - 565 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI16RGB565"/></description></item>
		/// <item><term>24 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="RGBTRIPLE"/></description></item>
		/// <item><term>32 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="RGBQUAD"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_COMPLEX"/></term><description><see cref="FICOMPLEX"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_DOUBLE"/></term><description><see cref="Double"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_FLOAT"/></term><description><see cref="Single"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_INT16"/></term><description><see cref="Int16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_INT32"/></term><description><see cref="Int32"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGB16"/></term><description><see cref="FIRGB16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGBA16"/></term><description><see cref="FIRGBA16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGBAF"/></term><description><see cref="FIRGBAF"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGBF"/></term><description><see cref="FIRGBF"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_UINT16"/></term><description><see cref="UInt16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_UINT32"/></term><description><see cref="UInt32"/></description></item>
		/// </list>
		/// </remarks>
		/// <example>
		/// <code>
		/// FreeImageBitmap bitmap = new FreeImageBitmap(@"C:\Pictures\picture.bmp");
		/// if (bitmap.ColorDepth == 32)
		/// {
		/// 	Scanline&lt;RGBQUAD&gt; scanline = bitmap.GetScanline&lt;RGBQUAD&gt;(0);
		/// 	foreach (RGBQUAD pixel in scanline)
		/// 	{
		///			Console.WriteLine(pixel);
		/// 	}
		///	}
		/// </code>
		/// </example>
		/// <exception cref="ArgumentException">
		/// The bitmap's type or color depth are not supported.
		/// </exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="scanline"/> is no valid value.
		/// </exception>
		public Scanline<T> GetScanline<T>(int scanline) where T : struct
		{
			EnsureNotDisposed();
			return new Scanline<T>(dib, scanline);
		}

		/// <summary>
		/// Returns an instance of <see cref="Scanline&lt;T&gt;"/>, representing the scanline
		/// specified by <paramref name="scanline"/> of this <see cref="FreeImageBitmap"/>.
		/// Since FreeImage bitmaps are always bottum up aligned, keep in mind that scanline 0 is the
		/// bottom-most line of the image.
		/// </summary>
		/// <param name="scanline">Number of the scanline to retrieve.</param>
		/// <returns>An instance of <see cref="Scanline&lt;T&gt;"/> representing the
		/// <paramref name="scanline"/>th scanline.</returns>
		/// <remarks>
		/// List of return-types of <b>T</b>:<para/>
		/// <list type="table">
		/// <listheader><term>Color Depth / Type</term><description><see cref="Type">Result Type</see></description></listheader>
		/// <item><term>1 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI1BIT"/></description></item>
		/// <item><term>4 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI4BIT"/></description></item>
		/// <item><term>8 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="Byte"/></description></item>
		/// <item><term>16 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="UInt16"/></description></item>
		/// <item><term>16 - 555 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI16RGB555"/></description></item>
		/// <item><term>16 - 565 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI16RGB565"/></description></item>
		/// <item><term>24 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="RGBTRIPLE"/></description></item>
		/// <item><term>32 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="RGBQUAD"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_COMPLEX"/></term><description><see cref="FICOMPLEX"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_DOUBLE"/></term><description><see cref="Double"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_FLOAT"/></term><description><see cref="Single"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_INT16"/></term><description><see cref="Int16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_INT32"/></term><description><see cref="Int32"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGB16"/></term><description><see cref="FIRGB16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGBA16"/></term><description><see cref="FIRGBA16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGBAF"/></term><description><see cref="FIRGBAF"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGBF"/></term><description><see cref="FIRGBF"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_UINT16"/></term><description><see cref="UInt16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_UINT32"/></term><description><see cref="UInt32"/></description></item>
		/// </list>
		/// </remarks>
		/// <example>
		/// <code>
		/// FreeImageBitmap bitmap = new FreeImageBitmap(@"C:\Pictures\picture.bmp");
		/// if (bitmap.ColorDepth == 32)
		/// {
		/// 	Scanline&lt;RGBQUAD&gt; scanline = (Scanline&lt;RGBQUAD&gt;)bitmap.GetScanline(0);
		/// 	foreach (RGBQUAD pixel in scanline)
		/// 	{
		///			Console.WriteLine(pixel);
		/// 	}
		///	}
		/// </code>
		/// </example>
		/// <exception cref="ArgumentException">
		/// The type of the bitmap or color depth are not supported.
		/// </exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="scanline"/> is no valid value.
		/// </exception>
		public object GetScanline(int scanline)
		{
			EnsureNotDisposed();
			object result = null;
			int width = (int)FreeImage.GetWidth(dib);

			switch (FreeImage.GetImageType(dib))
			{
				case FREE_IMAGE_TYPE.FIT_BITMAP:

					switch (FreeImage.GetBPP(dib))
					{
						case 1u: result = new Scanline<FI1BIT>(dib, scanline, width); break;
						case 4u: result = new Scanline<FI4BIT>(dib, scanline, width); break;
						case 8u: result = new Scanline<Byte>(dib, scanline, width); break;
						case 16u:
							if ((RedMask == FreeImage.FI16_555_RED_MASK) &&
								(GreenMask == FreeImage.FI16_555_GREEN_MASK) &&
								(BlueMask == FreeImage.FI16_555_BLUE_MASK))
							{
								result = new Scanline<FI16RGB555>(dib, scanline, width);
							}
							else if ((RedMask == FreeImage.FI16_565_RED_MASK) &&
								(GreenMask == FreeImage.FI16_565_GREEN_MASK) &&
								(BlueMask == FreeImage.FI16_565_BLUE_MASK))
							{
								result = new Scanline<FI16RGB565>(dib, scanline, width);
							}
							else
							{
								result = new Scanline<UInt16>(dib, scanline, width);
							}
							break;
						case 24u: result = new Scanline<RGBTRIPLE>(dib, scanline, width); break;
						case 32u: result = new Scanline<RGBQUAD>(dib, scanline, width); break;
						default: throw new ArgumentException("Color depth is not supported.");
					}
					break;

				case FREE_IMAGE_TYPE.FIT_COMPLEX: result = new Scanline<FICOMPLEX>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_DOUBLE: result = new Scanline<Double>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_FLOAT: result = new Scanline<Single>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_INT16: result = new Scanline<Int16>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_INT32: result = new Scanline<Int32>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_RGB16: result = new Scanline<FIRGB16>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_RGBA16: result = new Scanline<FIRGBA16>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_RGBAF: result = new Scanline<FIRGBAF>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_RGBF: result = new Scanline<FIRGBF>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_UINT16: result = new Scanline<UInt16>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_UINT32: result = new Scanline<UInt32>(dib, scanline, width); break;
				case FREE_IMAGE_TYPE.FIT_UNKNOWN:
				default: throw new ArgumentException("Type is not supported.");
			}

			return result;
		}

		/// <summary>
		/// Returns a pointer to the specified scanline.
		/// Due to FreeImage bitmaps are bottum up,
		/// scanline 0 is the most bottom line of the image.
		/// </summary>
		/// <param name="scanline">Number of the scanline.</param>
		/// <returns>Pointer to the scanline.</returns>
		public IntPtr GetScanlinePointer(int scanline)
		{
			EnsureNotDisposed();
			return FreeImage.GetScanLine(dib, scanline);
		}

		/// <summary>
		/// Returns a list of structures, representing the scanlines of this <see cref="FreeImageBitmap"/>.
		/// Due to FreeImage bitmaps are bottum up, scanline 0 is the
		/// bottom-most line of the image.
		/// Each color depth has a different representing structure due to different memory layouts.
		/// </summary>
		/// <remarks>
		/// List of return-types of <b>T</b>:<para/>
		/// <list type="table">
		/// <listheader><term>Color Depth / Type</term><description><see cref="Type">Result Type of IEnmuerable&lt;Scanline&lt;T&gt;&gt;</see></description></listheader>
		/// <item><term>1 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI1BIT"/></description></item>
		/// <item><term>4 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI4BIT"/></description></item>
		/// <item><term>8 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="Byte"/></description></item>
		/// <item><term>16 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="UInt16"/></description></item>
		/// <item><term>16 - 555 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI16RGB555"/></description></item>
		/// <item><term>16 - 565 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="FI16RGB565"/></description></item>
		/// <item><term>24 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="RGBTRIPLE"/></description></item>
		/// <item><term>32 (<see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/>)</term><description><see cref="RGBQUAD"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_COMPLEX"/></term><description><see cref="FICOMPLEX"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_DOUBLE"/></term><description><see cref="Double"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_FLOAT"/></term><description><see cref="Single"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_INT16"/></term><description><see cref="Int16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_INT32"/></term><description><see cref="Int32"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGB16"/></term><description><see cref="FIRGB16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGBA16"/></term><description><see cref="FIRGBA16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGBAF"/></term><description><see cref="FIRGBAF"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_RGBF"/></term><description><see cref="FIRGBF"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_UINT16"/></term><description><see cref="UInt16"/></description></item>
		/// <item><term><see cref="FREE_IMAGE_TYPE.FIT_UINT32"/></term><description><see cref="UInt32"/></description></item>
		/// </list>
		/// </remarks>
		public IList GetScanlines()
		{
			EnsureNotDisposed();

			int height = (int)FreeImage.GetHeight(dib);
			IList list;

			switch (FreeImage.GetImageType(dib))
			{
				case FREE_IMAGE_TYPE.FIT_BITMAP:

					switch (FreeImage.GetBPP(dib))
					{
						case 1u: list = new List<Scanline<FI1BIT>>(height); break;
						case 4u: list = new List<Scanline<FI4BIT>>(height); break;
						case 8u: list = new List<Scanline<Byte>>(height); break;
						case 16u:
							if (FreeImage.IsRGB555(dib))
							{
								list = new List<Scanline<FI16RGB555>>(height);
							}
							else if (FreeImage.IsRGB565(dib))
							{
								list = new List<Scanline<FI16RGB565>>(height);
							}
							else
							{
								list = new List<Scanline<UInt16>>(height);
							}
							break;
						case 24u: list = new List<Scanline<RGBTRIPLE>>(height); break;
						case 32u: list = new List<Scanline<RGBQUAD>>(height); break;
						default: throw new ArgumentException("Color depth is not supported.");
					}
					break;

				case FREE_IMAGE_TYPE.FIT_COMPLEX: list = new List<Scanline<FICOMPLEX>>(height); break;
				case FREE_IMAGE_TYPE.FIT_DOUBLE: list = new List<Scanline<Double>>(height); break;
				case FREE_IMAGE_TYPE.FIT_FLOAT: list = new List<Scanline<Single>>(height); break;
				case FREE_IMAGE_TYPE.FIT_INT16: list = new List<Scanline<Int16>>(height); break;
				case FREE_IMAGE_TYPE.FIT_INT32: list = new List<Scanline<Int32>>(height); break;
				case FREE_IMAGE_TYPE.FIT_RGB16: list = new List<Scanline<FIRGB16>>(height); break;
				case FREE_IMAGE_TYPE.FIT_RGBA16: list = new List<Scanline<FIRGBA16>>(height); break;
				case FREE_IMAGE_TYPE.FIT_RGBAF: list = new List<Scanline<FIRGBAF>>(height); break;
				case FREE_IMAGE_TYPE.FIT_RGBF: list = new List<Scanline<FIRGBF>>(height); break;
				case FREE_IMAGE_TYPE.FIT_UINT16: list = new List<Scanline<UInt16>>(height); break;
				case FREE_IMAGE_TYPE.FIT_UINT32: list = new List<Scanline<UInt32>>(height); break;
				case FREE_IMAGE_TYPE.FIT_UNKNOWN:
				default: throw new ArgumentException("Type is not supported.");
			}

			for (int i = 0; i < height; i++)
			{
				list.Add(GetScanline(i));
			}

			return list;
		}

		/// <summary>
		/// Removes the specified property item from this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="propid">The ID of the property item to remove.</param>
		public void RemovePropertyItem(int propid)
		{
			EnsureNotDisposed();
			ImageMetadata mdata = new ImageMetadata(dib, true);
			foreach (MetadataModel model in mdata)
			{
				foreach (MetadataTag tag in model)
				{
					if (tag.ID == propid)
					{
						model.RemoveTag(tag.Key);
						return;
					}
				}
			}
		}

		/// <summary>
		/// This method rotates, flips, or rotates and flips this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="rotateFlipType">A RotateFlipType member
		/// that specifies the type of rotation and flip to apply to this <see cref="FreeImageBitmap"/>.</param>
		public void RotateFlip(RotateFlipType rotateFlipType)
		{
			EnsureNotDisposed();

			FIBITMAP newDib = new FIBITMAP();
			uint bpp = FreeImage.GetBPP(dib);

			switch (rotateFlipType)
			{
				case RotateFlipType.RotateNoneFlipX:

					FreeImage.FlipHorizontal(dib);
					break;

				case RotateFlipType.RotateNoneFlipY:

					FreeImage.FlipVertical(dib);
					break;

				case RotateFlipType.RotateNoneFlipXY:

					FreeImage.FlipHorizontal(dib);
					FreeImage.FlipVertical(dib);
					break;

				case RotateFlipType.Rotate90FlipNone:

					newDib = (bpp == 4u) ? FreeImage.Rotate4bit(dib, 90d) : FreeImage.Rotate(dib, 90d);
					break;

				case RotateFlipType.Rotate90FlipX:

					newDib = (bpp == 4u) ? FreeImage.Rotate4bit(dib, 90d) : FreeImage.Rotate(dib, 90d);
					FreeImage.FlipHorizontal(newDib);
					break;

				case RotateFlipType.Rotate90FlipY:

					newDib = (bpp == 4u) ? FreeImage.Rotate4bit(dib, 90d) : FreeImage.Rotate(dib, 90d);
					FreeImage.FlipVertical(newDib);
					break;

				case RotateFlipType.Rotate90FlipXY:

					newDib = (bpp == 4u) ? FreeImage.Rotate4bit(dib, 90d) : FreeImage.Rotate(dib, 90d);
					FreeImage.FlipHorizontal(newDib);
					FreeImage.FlipVertical(newDib);
					break;

				case RotateFlipType.Rotate180FlipXY:
					newDib = FreeImage.Clone(dib);
					break;
			}
			ReplaceDib(newDib);
		}

		/// <summary>
		/// Copies the metadata from another <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="bitmap">The bitmap to read the metadata from.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="bitmap"/> is a null reference.
		/// </exception>
		public void CloneMetadataFrom(FreeImageBitmap bitmap)
		{
			if (bitmap == null)
			{
				throw new ArgumentNullException("bitmap");
			}
			EnsureNotDisposed();
			bitmap.EnsureNotDisposed();
			FreeImage.CloneMetadata(dib, bitmap.dib);
		}

		/// <summary>
		/// Copies the metadata from another <see cref="FreeImageBitmap"/> using
		/// the provided options.
		/// </summary>
		/// <param name="bitmap">The bitmap to read the metadata from.</param>
		/// <param name="flags">Specifies the way the metadata is copied.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="bitmap"/> is a null reference.
		/// </exception>
		public void CloneMetadataFrom(FreeImageBitmap bitmap, FREE_IMAGE_METADATA_COPY flags)
		{
			if (bitmap == null)
			{
				throw new ArgumentNullException("bitmap");
			}
			EnsureNotDisposed();
			bitmap.EnsureNotDisposed();
			FreeImage.CloneMetadataEx(bitmap.dib, dib, flags);
		}

		/// <summary>
		/// Saves this <see cref="FreeImageBitmap"/> to the specified file.
		/// </summary>
		/// <param name="filename">A string that contains the name of the file to which
		/// to save this <see cref="FreeImageBitmap"/>.</param>
		/// <exception cref="ArgumentException"><paramref name="filename"/> is null or empty.</exception>
		/// <exception cref="Exception">Saving the image failed.</exception>
		public void Save(string filename)
		{
			Save(filename, FREE_IMAGE_FORMAT.FIF_UNKNOWN, FREE_IMAGE_SAVE_FLAGS.DEFAULT);
		}

		/// <summary>
		/// Saves this <see cref="FreeImageBitmap"/> to the specified file in the specified format.
		/// </summary>
		/// <param name="filename">A string that contains the name of the file to which
		/// to save this <see cref="FreeImageBitmap"/>.</param>
		/// <param name="format">An <see cref="FREE_IMAGE_FORMAT"/> that specifies the format of the saved image.</param>
		/// <exception cref="ArgumentException"><paramref name="filename"/> is null or empty.</exception>
		/// <exception cref="Exception">Saving the image failed.</exception>
		public void Save(string filename, FREE_IMAGE_FORMAT format)
		{
			Save(filename, format, FREE_IMAGE_SAVE_FLAGS.DEFAULT);
		}

		/// <summary>
		/// Saves this <see cref="FreeImageBitmap"/> to the specified file in the specified format
		/// using the specified saving flags.
		/// </summary>
		/// <param name="filename">A string that contains the name of the file to which
		/// to save this <see cref="FreeImageBitmap"/>.</param>
		/// <param name="format">An <see cref="FREE_IMAGE_FORMAT"/> that specifies the format of the saved image.</param>
		/// <param name="flags">Flags to enable or disable plugin-features.</param>
		/// <exception cref="ArgumentException"><paramref name="filename"/> is null or empty.</exception>
		/// <exception cref="Exception">Saving the image failed.</exception>
		public void Save(string filename, FREE_IMAGE_FORMAT format, FREE_IMAGE_SAVE_FLAGS flags)
		{
			EnsureNotDisposed();
			if (string.IsNullOrEmpty(filename))
			{
				throw new ArgumentException("filename");
			}
			if (!FreeImage.SaveEx(dib, filename, format, flags))
			{
				throw new Exception("Unable to save bitmap");
			}

			saveInformation.filename = filename;
			saveInformation.format = format;
			saveInformation.saveFlags = flags;
		}

		/// <summary>
		/// Saves this <see cref="FreeImageBitmap"/> to the specified stream in the specified format.
		/// </summary>
		/// <param name="stream">The stream where this <see cref="FreeImageBitmap"/> will be saved.</param>
		/// <param name="format">An <see cref="FREE_IMAGE_FORMAT"/> that specifies the format of the saved image.</param>
		/// <exception cref="ArgumentNullException"><paramref name="stream"/> is a null reference.</exception>
		/// <exception cref="Exception">Saving the image failed.</exception>
		public void Save(Stream stream, FREE_IMAGE_FORMAT format)
		{
			Save(stream, format, FREE_IMAGE_SAVE_FLAGS.DEFAULT);
		}

		/// <summary>
		/// Saves this <see cref="FreeImageBitmap"/> to the specified stream in the specified format
		/// using the specified saving flags.
		/// </summary>
		/// <param name="stream">The stream where this <see cref="FreeImageBitmap"/> will be saved.</param>
		/// <param name="format">An <see cref="FREE_IMAGE_FORMAT"/> that specifies the format of the saved image.</param>
		/// <param name="flags">Flags to enable or disable plugin-features.</param>
		/// <exception cref="ArgumentNullException"><paramref name="stream"/> is a null reference.</exception>
		/// <exception cref="Exception">Saving the image failed.</exception>
		public void Save(Stream stream, FREE_IMAGE_FORMAT format, FREE_IMAGE_SAVE_FLAGS flags)
		{
			EnsureNotDisposed();
			if (stream == null)
			{
				throw new ArgumentNullException("stream");
			}
			if (!FreeImage.SaveToStream(dib, stream, format, flags))
			{
				throw new Exception("Unable to save bitmap");
			}

			saveInformation.filename = null;
		}

		/// <summary>
		/// Adds a frame to the file specified in a previous call to the <see cref="Save(String)"/>
		/// method.
		/// </summary>
		/// <exception cref="InvalidOperationException">
		/// This instance has not been saved to a file using Save(...) before.</exception>
		public void SaveAdd()
		{
			SaveAdd(this);
		}

		/// <summary>
		/// Adds a frame to the file specified in a previous call to the <see cref="Save(String)"/> method.
		/// </summary>
		/// <param name="insertPosition">The position at which the frame should be inserted.</param>
		/// <exception cref="InvalidOperationException">
		/// This instance has not yet been saved to a file using the Save(...) method.</exception>
		/// <exception cref="ArgumentOutOfRangeException"><paramref name="insertPosition"/> is out of range.</exception>
		public void SaveAdd(int insertPosition)
		{
			SaveAdd(this, insertPosition);
		}

		/// <summary>
		/// Adds a frame to the file specified in a previous call to the <see cref="Save(String)"/> method.
		/// </summary>
		/// <param name="bitmap">A <see cref="FreeImageBitmap"/> that contains the frame to add.</param>
		/// <exception cref="InvalidOperationException">
		/// This instance has not yet been saved to a file using the Save(...) method.</exception>
		public void SaveAdd(FreeImageBitmap bitmap)
		{
			if (saveInformation.filename == null)
			{
				throw new InvalidOperationException("This operation requires a previous call of Save().");
			}

			SaveAdd(
				saveInformation.filename,
				bitmap,
				saveInformation.format,
				saveInformation.loadFlags,
				saveInformation.saveFlags);
		}

		/// <summary>
		/// Adds a frame to the file specified in a previous call to the <see cref="Save(String)"/> method.
		/// </summary>
		/// <param name="bitmap">A <see cref="FreeImageBitmap"/> that contains the frame to add.</param>
		/// <param name="insertPosition">The position at which the frame should be inserted.</param>
		/// <exception cref="InvalidOperationException">
		/// This instance has not yet been saved to a file using the Save(...) method.</exception>
		/// <exception cref="ArgumentOutOfRangeException"><paramref name="insertPosition"/> is out of range.</exception>
		public void SaveAdd(FreeImageBitmap bitmap, int insertPosition)
		{
			if (saveInformation.filename == null)
			{
				throw new InvalidOperationException("This operation requires a previous call of Save().");
			}

			SaveAdd(
				saveInformation.filename,
				bitmap,
				insertPosition,
				saveInformation.format,
				saveInformation.loadFlags,
				saveInformation.saveFlags);
		}

		/// <summary>
		/// Adds a frame to the file specified.
		/// </summary>
		/// <param name="filename">File to add this frame to.</param>
		/// <exception cref="ArgumentNullException"><paramref name="filename"/> is a null reference.</exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		/// <exception cref="Exception">Saving the image has failed.</exception>
		public void SaveAdd(string filename)
		{
			SaveAdd(
				filename,
				this,
				FREE_IMAGE_FORMAT.FIF_UNKNOWN,
				FREE_IMAGE_LOAD_FLAGS.DEFAULT,
				FREE_IMAGE_SAVE_FLAGS.DEFAULT);
		}

		/// <summary>
		/// Adds a frame to the file specified.
		/// </summary>
		/// <param name="filename">File to add this frame to.</param>
		/// <param name="insertPosition">The position at which the frame should be inserted.</param>
		/// <exception cref="ArgumentNullException"><paramref name="filename"/> is a null reference.</exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		/// <exception cref="Exception">Saving the image has failed.</exception>
		/// <exception cref="ArgumentOutOfRangeException"><paramref name="insertPosition"/> is out of range.</exception>
		public void SaveAdd(string filename, int insertPosition)
		{
			SaveAdd(
				filename,
				this,
				insertPosition,
				FREE_IMAGE_FORMAT.FIF_UNKNOWN,
				FREE_IMAGE_LOAD_FLAGS.DEFAULT,
				FREE_IMAGE_SAVE_FLAGS.DEFAULT);
		}

		/// <summary>
		/// Adds a frame to the file specified using the specified parameters.
		/// </summary>
		/// <param name="filename">File to add this frame to.</param>
		/// <param name="format">Format of the image.</param>
		/// <param name="loadFlags">Flags to enable or disable plugin-features.</param>
		/// <param name="saveFlags">Flags to enable or disable plugin-features.</param>
		/// <exception cref="ArgumentNullException"><paramref name="filename"/> is a null reference.</exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		/// <exception cref="Exception">Saving the image has failed.</exception>
		public void SaveAdd(
			string filename,
			FREE_IMAGE_FORMAT format,
			FREE_IMAGE_LOAD_FLAGS loadFlags,
			FREE_IMAGE_SAVE_FLAGS saveFlags)
		{
			SaveAdd(
				filename,
				this,
				format,
				loadFlags,
				saveFlags);
		}

		/// <summary>
		/// Adds a frame to the file specified using the specified parameters.
		/// </summary>
		/// <param name="filename">File to add this frame to.</param>
		/// <param name="insertPosition">The position at which the frame should be inserted.</param>
		/// <param name="format">Format of the image.</param>
		/// <param name="loadFlags">Flags to enable or disable plugin-features.</param>
		/// <param name="saveFlags">Flags to enable or disable plugin-features.</param>
		/// <exception cref="ArgumentNullException"><paramref name="filename"/> is a null reference.</exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		/// <exception cref="Exception">Saving the image has failed.</exception>
		/// <exception cref="ArgumentOutOfRangeException"><paramref name="insertPosition"/> is out of range.</exception>
		public void SaveAdd(
			string filename,
			int insertPosition,
			FREE_IMAGE_FORMAT format,
			FREE_IMAGE_LOAD_FLAGS loadFlags,
			FREE_IMAGE_SAVE_FLAGS saveFlags)
		{
			SaveAdd(
				filename,
				this,
				insertPosition,
				format,
				loadFlags,
				saveFlags);
		}

		/// <summary>
		/// Selects the frame specified by the index.
		/// </summary>
		/// <param name="frameIndex">The index of the active frame.</param>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="frameIndex"/> is out of range.</exception>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="InvalidOperationException">The source of the bitmap is not available.
		/// </exception>
		public void SelectActiveFrame(int frameIndex)
		{
			EnsureNotDisposed();
			if ((frameIndex < 0) || (frameIndex >= frameCount))
			{
				throw new ArgumentOutOfRangeException("frameIndex");
			}

			if (frameIndex != this.frameIndex)
			{
				if (stream == null)
				{
					throw new InvalidOperationException("No source available.");
				}

				FREE_IMAGE_FORMAT format = originalFormat;
				FIMULTIBITMAP mdib = FreeImage.OpenMultiBitmapFromStream(stream, ref format, saveInformation.loadFlags);
				if (mdib.IsNull)
					throw new Exception(ErrorLoadingBitmap);

				try
				{
					if (frameIndex >= FreeImage.GetPageCount(mdib))
					{
						throw new ArgumentOutOfRangeException("frameIndex");
					}

					FIBITMAP newDib = FreeImage.LockPage(mdib, frameIndex);
					if (newDib.IsNull)
					{
						throw new Exception(ErrorLoadingFrame);
					}

					try
					{
						FIBITMAP clone = FreeImage.Clone(newDib);
						if (clone.IsNull)
						{
							throw new Exception(ErrorCreatingBitmap);
						}
						ReplaceDib(clone);
					}
					finally
					{
						if (!newDib.IsNull)
						{
							FreeImage.UnlockPage(mdib, newDib, false);
						}
					}
				}
				finally
				{
					if (!FreeImage.CloseMultiBitmapEx(ref mdib))
					{
						throw new Exception(ErrorUnloadBitmap);
					}
				}

				this.frameIndex = frameIndex;
			}
		}

		/// <summary>
		/// Creates a GDI bitmap object from this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <returns>A handle to the GDI bitmap object that this method creates.</returns>
		public IntPtr GetHbitmap()
		{
			EnsureNotDisposed();
			return FreeImage.GetHbitmap(dib, IntPtr.Zero, false);
		}

		/// <summary>
		/// Creates a GDI bitmap object from this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="background">A <see cref="System.Drawing.Color"/> structure that specifies the background color.
		/// This parameter is ignored if the bitmap is totally opaque.</param>
		/// <returns>A handle to the GDI bitmap object that this method creates.</returns>
		public IntPtr GetHbitmap(Color background)
		{
			EnsureNotDisposed();
			using (FreeImageBitmap temp = new FreeImageBitmap(this))
			{
				temp.BackgroundColor = background;
				return temp.GetHbitmap();
			}
		}

		/// <summary>
		/// Returns the handle to an icon.
		/// </summary>
		/// <returns>A Windows handle to an icon with the same image as this <see cref="FreeImageBitmap"/>.</returns>
		public IntPtr GetHicon()
		{
			EnsureNotDisposed();
			using (Bitmap bitmap = FreeImage.GetBitmap(dib, true))
			{
				return bitmap.GetHicon();
			}
		}

		/// <summary>
		/// Creates a GDI bitmap object from this <see cref="FreeImageBitmap"/> with the same
		/// color depth as the primary device.
		/// </summary>
		/// <returns>A handle to the GDI bitmap object that this method creates.</returns>
		public IntPtr GetHbitmapForDevice()
		{
			EnsureNotDisposed();
			return FreeImage.GetBitmapForDevice(dib, IntPtr.Zero, false);
		}

		/// <summary>
		/// Gets the <see cref="Color"/> of the specified pixel in this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="x">The x-coordinate of the pixel to retrieve.</param>
		/// <param name="y">The y-coordinate of the pixel to retrieve.</param>
		/// <returns>A <see cref="System.Drawing.Color"/> structure that represents the color of the specified pixel.</returns>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="NotSupportedException">The type of this bitmap is not supported.</exception>
		public unsafe Color GetPixel(int x, int y)
		{
			EnsureNotDisposed();
			if (FreeImage.GetImageType(dib) == FREE_IMAGE_TYPE.FIT_BITMAP)
			{
				if (ColorDepth == 16 || ColorDepth == 24 || ColorDepth == 32)
				{
					RGBQUAD rgbq;
					if (!FreeImage.GetPixelColor(dib, (uint)x, (uint)y, out rgbq))
					{
						throw new Exception("FreeImage.GetPixelColor() failed");
					}
					return rgbq.Color;
				}
				else if (ColorDepth == 1 || ColorDepth == 4 || ColorDepth == 8)
				{
					byte index;
					if (!FreeImage.GetPixelIndex(dib, (uint)x, (uint)y, out index))
					{
						throw new Exception("FreeImage.GetPixelIndex() failed");
					}
					RGBQUAD* palette = (RGBQUAD*)FreeImage.GetPalette(dib);
					return palette[index].Color;
				}
			}
			throw new NotSupportedException("The type of the image is not supported");
		}

		/// <summary>
		/// Makes the default transparent color transparent for this <see cref="FreeImageBitmap"/>.
		/// </summary>
		public void MakeTransparent()
		{
			EnsureNotDisposed();
			MakeTransparent(Color.Transparent);
		}

		/// <summary>
		/// Makes the specified color transparent for this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="transparentColor">The <see cref="System.Drawing.Color"/> structure that represents
		/// the color to make transparent.</param>
		/// <exception cref="NotImplementedException">
		/// This method is not implemented.</exception>
		public void MakeTransparent(Color transparentColor)
		{
			EnsureNotDisposed();
			throw new System.NotImplementedException();
		}

		/// <summary>
		/// Sets the <see cref="System.Drawing.Color"/> of the specified pixel in this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="x">The x-coordinate of the pixel to set.</param>
		/// <param name="y">The y-coordinate of the pixel to set.</param>
		/// <param name="color">A <see cref="System.Drawing.Color"/> structure that represents the color
		/// to assign to the specified pixel.</param>
		/// <exception cref="Exception">The operation failed.</exception>
		/// <exception cref="NotSupportedException">The type of this bitmap is not supported.</exception>
		public unsafe void SetPixel(int x, int y, Color color)
		{
			EnsureNotDisposed();
			if (FreeImage.GetImageType(dib) == FREE_IMAGE_TYPE.FIT_BITMAP)
			{
				if (ColorDepth == 16 || ColorDepth == 24 || ColorDepth == 32)
				{
					RGBQUAD rgbq = color;
					if (!FreeImage.SetPixelColor(dib, (uint)x, (uint)y, ref rgbq))
					{
						throw new Exception("FreeImage.SetPixelColor() failed");
					}
					return;
				}
				else if (ColorDepth == 1 || ColorDepth == 4 || ColorDepth == 8)
				{
					uint colorsUsed = FreeImage.GetColorsUsed(dib);
					RGBQUAD* palette = (RGBQUAD*)FreeImage.GetPalette(dib);
					for (int i = 0; i < colorsUsed; i++)
					{
						if (palette[i].Color == color)
						{
							byte index = (byte)i;
							if (!FreeImage.SetPixelIndex(dib, (uint)x, (uint)y, ref index))
							{
								throw new Exception("FreeImage.SetPixelIndex() failed");
							}
							return;
						}
					}
					throw new ArgumentOutOfRangeException("color");
				}
			}
			throw new NotSupportedException("The type of the image is not supported");
		}

		/// <summary>
		/// Sets the resolution for this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="xDpi">The horizontal resolution, in dots per inch, of this <see cref="FreeImageBitmap"/>.</param>
		/// <param name="yDpi">The vertical resolution, in dots per inch, of this <see cref="FreeImageBitmap"/>.</param>
		public void SetResolution(float xDpi, float yDpi)
		{
			EnsureNotDisposed();
			FreeImage.SetResolutionX(dib, (uint)xDpi);
			FreeImage.SetResolutionY(dib, (uint)yDpi);
		}

		/// <summary>
		/// This function is not yet implemented.
		/// </summary>
		/// <exception cref="NotImplementedException">
		/// This method is not implemented.</exception>
		public BitmapData LockBits(Rectangle rect, ImageLockMode flags, PixelFormat format)
		{
			throw new NotImplementedException();
		}

		/// <summary>
		/// This function is not yet implemented.
		/// </summary>
		/// <exception cref="NotImplementedException">
		/// This method is not implemented.</exception>
		public BitmapData LockBits(Rectangle rect, ImageLockMode flags, PixelFormat format, BitmapData bitmapData)
		{
			throw new NotImplementedException();
		}

		/// <summary>
		/// This function is not yet implemented.
		/// </summary>
		/// <exception cref="NotImplementedException">
		/// This method is not implemented.</exception>
		public void UnlockBits(BitmapData bitmapdata)
		{
			throw new NotImplementedException();
		}

		/// <summary>
		/// Converts this <see cref="FreeImageBitmap"/> into a different color depth.
		/// The parameter <paramref name="bpp"/> specifies color depth, greyscale conversion
		/// and palette reorder.
		/// <para>Adding the <see cref="FREE_IMAGE_COLOR_DEPTH.FICD_FORCE_GREYSCALE"/> flag
		/// will first perform a convesion to greyscale. This can be done with any target
		/// color depth.</para>
		/// <para>Adding the <see cref="FREE_IMAGE_COLOR_DEPTH.FICD_REORDER_PALETTE"/> flag
		/// will allow the algorithm to reorder the palette. This operation will not be performed to
		/// non-greyscale images to prevent data loss by mistake.</para>
		/// </summary>
		/// <param name="bpp">A bitfield containing information about the conversion
		/// to perform.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool ConvertColorDepth(FREE_IMAGE_COLOR_DEPTH bpp)
		{
			EnsureNotDisposed();
			return ReplaceDib(FreeImage.ConvertColorDepth(dib, bpp, false));
		}

		/// <summary>
		/// Converts this <see cref="FreeImageBitmap"/> <see cref="FREE_IMAGE_TYPE"/> to
		/// <paramref name="type"/> initializing a new instance.
		/// In case source and destination type are the same, the operation fails.
		/// An error message can be catched using the 'Message' event.
		/// </summary>
		/// <param name="type">Destination type.</param>
		/// <param name="scaleLinear">True to scale linear, else false.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool ConvertType(FREE_IMAGE_TYPE type, bool scaleLinear)
		{
			EnsureNotDisposed();
			return (ImageType == type) ? false : ReplaceDib(FreeImage.ConvertToType(dib, type, scaleLinear));
		}

		/// <summary>
		/// Converts this <see cref="FreeImageBitmap"/> <see cref="FreeImageBitmap"/> to <paramref name="type"/>.
		/// In case source and destination type are the same, the operation fails.
		/// An error message can be catched using the 'Message' event.
		/// </summary>
		/// <param name="type">Destination type.</param>
		/// <param name="scaleLinear">True to scale linear, else false.</param>
		/// <returns>The converted instance.</returns>
		public FreeImageBitmap GetTypeConvertedInstance(FREE_IMAGE_TYPE type, bool scaleLinear)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			if (ImageType != type)
			{
				FIBITMAP newDib = FreeImage.ConvertToType(dib, type, scaleLinear);
				if (!newDib.IsNull)
				{
					result = new FreeImageBitmap(newDib);
				}
			}
			return result;
		}

		/// <summary>
		/// Converts this <see cref="FreeImageBitmap"/> into a different color depth initializing
		/// a new instance.
		/// The parameter <paramref name="bpp"/> specifies color depth, greyscale conversion
		/// and palette reorder.
		/// <para>Adding the <see cref="FREE_IMAGE_COLOR_DEPTH.FICD_FORCE_GREYSCALE"/> flag will
		/// first perform a convesion to greyscale. This can be done with any target color depth.</para>
		/// <para>Adding the <see cref="FREE_IMAGE_COLOR_DEPTH.FICD_REORDER_PALETTE"/> flag will
		/// allow the algorithm to reorder the palette. This operation will not be performed to
		/// non-greyscale images to prevent data loss by mistake.</para>
		/// </summary>
		/// <param name="bpp">A bitfield containing information about the conversion
		/// to perform.</param>
		/// <returns>The converted instance.</returns>
		public FreeImageBitmap GetColorConvertedInstance(FREE_IMAGE_COLOR_DEPTH bpp)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.ConvertColorDepth(dib, bpp, false);
			if (newDib == dib)
			{
				newDib = FreeImage.Clone(dib);
			}
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Rescales this <see cref="FreeImageBitmap"/> to the specified size using the
		/// specified filter.
		/// </summary>
		/// <param name="newSize">The Size structure that represent the
		/// size of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="filter">Filter to use for resizing.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Rescale(Size newSize, FREE_IMAGE_FILTER filter)
		{
			return Rescale(newSize.Width, newSize.Height, filter);
		}

		/// <summary>
		/// Rescales this <see cref="FreeImageBitmap"/> to the specified size using the
		/// specified filter.
		/// </summary>
		/// <param name="width">Width of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">Height of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="filter">Filter to use for resizing.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Rescale(int width, int height, FREE_IMAGE_FILTER filter)
		{
			EnsureNotDisposed();
			return ReplaceDib(FreeImage.Rescale(dib, width, height, filter));
		}

		/// <summary>
		/// Rescales this <see cref="FreeImageBitmap"/> to the specified size using the
		/// specified filter initializing a new instance.
		/// </summary>
		/// <param name="newSize">The Size structure that represent the
		/// size of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="filter">Filter to use for resizing.</param>
		/// <returns>The rescaled instance.</returns>
		public FreeImageBitmap GetScaledInstance(Size newSize, FREE_IMAGE_FILTER filter)
		{
			return GetScaledInstance(newSize.Width, newSize.Height, filter);
		}

		/// <summary>
		/// Rescales this <see cref="FreeImageBitmap"/> to the specified size using the
		/// specified filter initializing a new instance.
		/// </summary>
		/// <param name="width">Width of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="height">Height of the new <see cref="FreeImageBitmap"/>.</param>
		/// <param name="filter">Filter to use for resizing.</param>
		/// <returns>The rescaled instance.</returns>
		public FreeImageBitmap GetScaledInstance(int width, int height, FREE_IMAGE_FILTER filter)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.Rescale(dib, width, height, filter);
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Enlarges or shrinks this <see cref="FreeImageBitmap"/> selectively per side and fills
		/// newly added areas with the specified background color.
		/// See <see cref="FreeImage.EnlargeCanvas&lt;T&gt;"/> for further details.
		/// </summary>
		/// <typeparam name="T">The type of the specified color.</typeparam>
		/// <param name="left">The number of pixels, the image should be enlarged on its left side.
		/// Negative values shrink the image on its left side.</param>
		/// <param name="top">The number of pixels, the image should be enlarged on its top side.
		/// Negative values shrink the image on its top side.</param>
		/// <param name="right">The number of pixels, the image should be enlarged on its right side.
		/// Negative values shrink the image on its right side.</param>
		/// <param name="bottom">The number of pixels, the image should be enlarged on its bottom side.
		/// Negative values shrink the image on its bottom side.</param>
		/// <param name="color">The color, the enlarged sides of the image should be filled with.</param>
		/// <returns><c>true</c> on success, <c>false</c> on failure.</returns>
		public bool EnlargeCanvas<T>(int left, int top, int right, int bottom, T? color) where T : struct
		{
			return EnlargeCanvas(left, top, right, bottom, color, FREE_IMAGE_COLOR_OPTIONS.FICO_DEFAULT);
		}

		/// <summary>
		/// Enlarges or shrinks this <see cref="FreeImageBitmap"/> selectively per side and fills
		/// newly added areas with the specified background color.
		/// See <see cref="FreeImage.EnlargeCanvas&lt;T&gt;"/> for further details.
		/// </summary>
		/// <typeparam name="T">The type of the specified color.</typeparam>
		/// <param name="left">The number of pixels, the image should be enlarged on its left side.
		/// Negative values shrink the image on its left side.</param>
		/// <param name="top">The number of pixels, the image should be enlarged on its top side.
		/// Negative values shrink the image on its top side.</param>
		/// <param name="right">The number of pixels, the image should be enlarged on its right side.
		/// Negative values shrink the image on its right side.</param>
		/// <param name="bottom">The number of pixels, the image should be enlarged on its bottom side.
		/// Negative values shrink the image on its bottom side.</param>
		/// <param name="color">The color, the enlarged sides of the image should be filled with.</param>
		/// <param name="options">Options that affect the color search process for palletized images.</param>
		/// <returns><c>true</c> on success, <c>false</c> on failure.</returns>
		public bool EnlargeCanvas<T>(int left, int top, int right, int bottom,
			T? color, FREE_IMAGE_COLOR_OPTIONS options) where T : struct
		{
			EnsureNotDisposed();
			return ReplaceDib(FreeImage.EnlargeCanvas(dib, left, top, right, bottom, color, options));
		}

		/// <summary>
		/// Enlarges or shrinks this <see cref="FreeImageBitmap"/> selectively per side and fills
		/// newly added areas with the specified background color returning a new instance.
		/// See <see cref="FreeImage.EnlargeCanvas&lt;T&gt;"/> for further details.
		/// </summary>
		/// <typeparam name="T">The type of the specified color.</typeparam>
		/// <param name="left">The number of pixels, the image should be enlarged on its left side.
		/// Negative values shrink the image on its left side.</param>
		/// <param name="top">The number of pixels, the image should be enlarged on its top side.
		/// Negative values shrink the image on its top side.</param>
		/// <param name="right">The number of pixels, the image should be enlarged on its right side.
		/// Negative values shrink the image on its right side.</param>
		/// <param name="bottom">The number of pixels, the image should be enlarged on its bottom side.
		/// Negative values shrink the image on its bottom side.</param>
		/// <param name="color">The color, the enlarged sides of the image should be filled with.</param>
		/// <returns>The enlarged instance.</returns>
		public FreeImageBitmap GetEnlargedInstance<T>(int left, int top, int right, int bottom,
			T? color) where T : struct
		{
			return GetEnlargedInstance(left, top, right, bottom, color, FREE_IMAGE_COLOR_OPTIONS.FICO_DEFAULT);
		}

		/// <summary>
		/// Enlarges or shrinks this <see cref="FreeImageBitmap"/> selectively per side and fills
		/// newly added areas with the specified background color returning a new instance.
		/// See <see cref="FreeImage.EnlargeCanvas&lt;T&gt;"/> for further details.
		/// </summary>
		/// <typeparam name="T">The type of the specified color.</typeparam>
		/// <param name="left">The number of pixels, the image should be enlarged on its left side.
		/// Negative values shrink the image on its left side.</param>
		/// <param name="top">The number of pixels, the image should be enlarged on its top side.
		/// Negative values shrink the image on its top side.</param>
		/// <param name="right">The number of pixels, the image should be enlarged on its right side.
		/// Negative values shrink the image on its right side.</param>
		/// <param name="bottom">The number of pixels, the image should be enlarged on its bottom side.
		/// Negative values shrink the image on its bottom side.</param>
		/// <param name="color">The color, the enlarged sides of the image should be filled with.</param>
		/// <param name="options">Options that affect the color search process for palletized images.</param>
		/// <returns>The enlarged instance.</returns>
		public FreeImageBitmap GetEnlargedInstance<T>(int left, int top, int right, int bottom,
			T? color, FREE_IMAGE_COLOR_OPTIONS options) where T : struct
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.EnlargeCanvas(dib, left, top, right, bottom, color, options);
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Quantizes this <see cref="FreeImageBitmap"/> from 24 bit to 8bit creating a new
		/// palette with the specified <paramref name="paletteSize"/> using the specified
		/// <paramref name="algorithm"/>.
		/// </summary>
		/// <param name="algorithm">The color reduction algorithm to be used.</param>
		/// <param name="paletteSize">Size of the desired output palette.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Quantize(FREE_IMAGE_QUANTIZE algorithm, int paletteSize)
		{
			return Quantize(algorithm, paletteSize, 0, (RGBQUAD[])null);
		}

		/// <summary>
		/// Quantizes this <see cref="FreeImageBitmap"/> from 24 bit to 8bit creating a new
		/// palette with the specified <paramref name="paletteSize"/> using the specified
		/// <paramref name="algorithm"/> and the specified
		/// <paramref name="reservePalette">palette</paramref> up to the
		/// specified <paramref name="paletteSize">length</paramref>.
		/// </summary>
		/// <param name="algorithm">The color reduction algorithm to be used.</param>
		/// <param name="paletteSize">Size of the desired output palette.</param>
		/// <param name="reservePalette">The provided palette.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Quantize(FREE_IMAGE_QUANTIZE algorithm, int paletteSize, Palette reservePalette)
		{
			return Quantize(algorithm, paletteSize, reservePalette.Length, reservePalette.Data);
		}

		/// <summary>
		/// Quantizes this <see cref="FreeImageBitmap"/> from 24 bit to 8bit creating a new
		/// palette with the specified <paramref name="paletteSize"/> using the specified
		/// <paramref name="algorithm"/> and the specified
		/// <paramref name="reservePalette">palette</paramref> up to the
		/// specified <paramref name="paletteSize">length</paramref>.
		/// </summary>
		/// <param name="algorithm">The color reduction algorithm to be used.</param>
		/// <param name="paletteSize">Size of the desired output palette.</param>
		/// <param name="reserveSize">Size of the provided palette of ReservePalette.</param>
		/// <param name="reservePalette">The provided palette.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Quantize(FREE_IMAGE_QUANTIZE algorithm, int paletteSize, int reserveSize, Palette reservePalette)
		{
			return Quantize(algorithm, paletteSize, reserveSize, reservePalette.Data);
		}

		/// <summary>
		/// Quantizes this <see cref="FreeImageBitmap"/> from 24 bit to 8bit creating a new
		/// palette with the specified <paramref name="paletteSize"/> using the specified
		/// <paramref name="algorithm"/> and the specified
		/// <paramref name="reservePalette">palette</paramref> up to the
		/// specified <paramref name="paletteSize">length</paramref>.
		/// </summary>
		/// <param name="algorithm">The color reduction algorithm to be used.</param>
		/// <param name="paletteSize">Size of the desired output palette.</param>
		/// <param name="reserveSize">Size of the provided palette of ReservePalette.</param>
		/// <param name="reservePalette">The provided palette.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Quantize(FREE_IMAGE_QUANTIZE algorithm, int paletteSize, int reserveSize, RGBQUAD[] reservePalette)
		{
			EnsureNotDisposed();
			return ReplaceDib(FreeImage.ColorQuantizeEx(dib, algorithm, paletteSize, reserveSize, reservePalette));
		}

		/// <summary>
		/// Quantizes this <see cref="FreeImageBitmap"/> from 24 bit, using the specified
		/// <paramref name="algorithm"/> initializing a new 8 bit instance with the
		/// specified <paramref name="paletteSize"/>.
		/// </summary>
		/// <param name="algorithm">The color reduction algorithm to be used.</param>
		/// <param name="paletteSize">Size of the desired output palette.</param>
		/// <returns>The quantized instance.</returns>
		public FreeImageBitmap GetQuantizedInstance(FREE_IMAGE_QUANTIZE algorithm, int paletteSize)
		{
			return GetQuantizedInstance(algorithm, paletteSize, 0, (RGBQUAD[])null);
		}

		/// <summary>
		/// Quantizes this <see cref="FreeImageBitmap"/> from 24 bit, using the specified
		/// <paramref name="algorithm"/> and <paramref name="reservePalette">palette</paramref>
		/// initializing a new 8 bit instance with the specified <paramref name="paletteSize"/>.
		/// </summary>
		/// <param name="algorithm">The color reduction algorithm to be used.</param>
		/// <param name="paletteSize">Size of the desired output palette.</param>
		/// <param name="reservePalette">The provided palette.</param>
		/// <returns>The quantized instance.</returns>
		public FreeImageBitmap GetQuantizedInstance(FREE_IMAGE_QUANTIZE algorithm, int paletteSize, Palette reservePalette)
		{
			return GetQuantizedInstance(algorithm, paletteSize, reservePalette.Length, reservePalette);
		}

		/// <summary>
		/// Quantizes this <see cref="FreeImageBitmap"/> from 24 bit, using the specified
		/// <paramref name="algorithm"/> and up to <paramref name="reserveSize"/>
		/// entries from <paramref name="reservePalette">palette</paramref> initializing
		/// a new 8 bit instance with the specified <paramref name="paletteSize"/>.
		/// </summary>
		/// <param name="algorithm">The color reduction algorithm to be used.</param>
		/// <param name="paletteSize">Size of the desired output palette.</param>
		/// <param name="reserveSize">Size of the provided palette.</param>
		/// <param name="reservePalette">The provided palette.</param>
		/// <returns>The quantized instance.</returns>
		public FreeImageBitmap GetQuantizedInstance(FREE_IMAGE_QUANTIZE algorithm, int paletteSize, int reserveSize, Palette reservePalette)
		{
			return GetQuantizedInstance(algorithm, paletteSize, reserveSize, reservePalette.Data);
		}

		/// <summary>
		/// Quantizes this <see cref="FreeImageBitmap"/> from 24 bit, using the specified
		/// <paramref name="algorithm"/> and up to <paramref name="reserveSize"/>
		/// entries from <paramref name="reservePalette">palette</paramref> initializing
		/// a new 8 bit instance with the specified <paramref name="paletteSize"/>.
		/// </summary>
		/// <param name="algorithm">The color reduction algorithm to be used.</param>
		/// <param name="paletteSize">Size of the desired output palette.</param>
		/// <param name="reserveSize">Size of the provided palette.</param>
		/// <param name="reservePalette">The provided palette.</param>
		/// <returns>The quantized instance.</returns>
		public FreeImageBitmap GetQuantizedInstance(FREE_IMAGE_QUANTIZE algorithm, int paletteSize, int reserveSize, RGBQUAD[] reservePalette)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.ColorQuantizeEx(dib, algorithm, paletteSize, reserveSize, reservePalette);
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Converts a High Dynamic Range image to a 24-bit RGB image using a global
		/// operator based on logarithmic compression of luminance values, imitating
		/// the human response to light.
		/// </summary>
		/// <param name="gamma">A gamma correction that is applied after the tone mapping.
		/// A value of 1 means no correction.</param>
		/// <param name="exposure">Scale factor allowing to adjust the brightness of the output image.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool TmoDrago03(double gamma, double exposure)
		{
			EnsureNotDisposed();
			return ReplaceDib(FreeImage.TmoDrago03(dib, gamma, exposure));
		}

		/// <summary>
		/// Converts a High Dynamic Range image to a 24-bit RGB image using a global operator inspired
		/// by photoreceptor physiology of the human visual system.
		/// </summary>
		/// <param name="intensity">Controls the overall image intensity in the range [-8, 8].</param>
		/// <param name="contrast">Controls the overall image contrast in the range [0.3, 1.0[.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool TmoReinhard05(double intensity, double contrast)
		{
			EnsureNotDisposed();
			return ReplaceDib(FreeImage.TmoReinhard05(dib, intensity, contrast));
		}

		/// <summary>
		/// Apply the Gradient Domain High Dynamic Range Compression to a RGBF image and convert to 24-bit RGB.
		/// </summary>
		/// <param name="color_saturation">Color saturation (s parameter in the paper) in [0.4..0.6]</param>
		/// <param name="attenuation">Atenuation factor (beta parameter in the paper) in [0.8..0.9]</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool TmoFattal02(double color_saturation, double attenuation)
		{
			EnsureNotDisposed();
			return ReplaceDib(FreeImage.TmoFattal02(dib, color_saturation, attenuation));
		}

		/// <summary>
		/// This method rotates a 1-, 4-, 8-bit greyscale or a 24-, 32-bit color image by means of 3 shears.
		/// For 1- and 4-bit images, rotation is limited to angles whose value is an integer
		/// multiple of 90.
		/// </summary>
		/// <param name="angle">The angle of rotation.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Rotate(double angle)
		{
			EnsureNotDisposed();
			bool result = false;
			if (ColorDepth == 4)
			{
				result = ReplaceDib(FreeImage.Rotate4bit(dib, angle));
			}
			else
			{
				result = ReplaceDib(FreeImage.Rotate(dib, angle));
			}
			return result;
		}

		/// <summary>
		/// This method rotates a 1-, 4-, 8-bit greyscale or a 24-, 32-bit color image by means of 3 shears.
		/// For 1- and 4-bit images, rotation is limited to angles whose value is an integer
		/// multiple of 90.
		/// </summary>
		/// <typeparam name="T">The type of the color to use as background.</typeparam>
		/// <param name="angle">The angle of rotation.</param>
		/// <param name="backgroundColor">The color used used to fill the bitmap's background.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Rotate<T>(double angle, T? backgroundColor) where T : struct
		{
			EnsureNotDisposed();
			bool result = false;
			if (ColorDepth == 4)
			{
				result = ReplaceDib(FreeImage.Rotate4bit(dib, angle));
			}
			else
			{
				result = ReplaceDib(FreeImage.Rotate(dib, angle, backgroundColor));
			}
			return result;
		}

		/// <summary>
		/// Rotates this <see cref="FreeImageBitmap"/> by the specified angle initializing a new instance.
		/// For 1- and 4-bit images, rotation is limited to angles whose value is an integer
		/// multiple of 90.
		/// </summary>
		/// <typeparam name="T">The type of the color to use as background.</typeparam>
		/// <param name="angle">The angle of rotation.</param>
		/// <param name="backgroundColor">The color used used to fill the bitmap's background.</param>
		/// <returns>The rotated instance.</returns>
		public FreeImageBitmap GetRotatedInstance<T>(double angle, T? backgroundColor) where T : struct
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib;
			if (ColorDepth == 4)
			{
				newDib = FreeImage.Rotate4bit(dib, angle);
			}
			else
			{
				newDib = FreeImage.Rotate(dib, angle, backgroundColor);
			}
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Rotates this <see cref="FreeImageBitmap"/> by the specified angle initializing a new instance.
		/// For 1- and 4-bit images, rotation is limited to angles whose value is an integer
		/// multiple of 90.
		/// </summary>
		/// <param name="angle">The angle of rotation.</param>
		/// <returns>The rotated instance.</returns>
		public FreeImageBitmap GetRotatedInstance(double angle)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib;
			if (ColorDepth == 4)
			{
				newDib = FreeImage.Rotate4bit(dib, angle);
			}
			else
			{
				newDib = FreeImage.Rotate(dib, angle);
			}
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// This method performs a rotation and / or translation of an 8-bit greyscale,
		/// 24- or 32-bit image, using a 3rd order (cubic) B-Spline.
		/// </summary>
		/// <param name="angle">The angle of rotation.</param>
		/// <param name="xShift">Horizontal image translation.</param>
		/// <param name="yShift">Vertical image translation.</param>
		/// <param name="xOrigin">Rotation center x-coordinate.</param>
		/// <param name="yOrigin">Rotation center y-coordinate.</param>
		/// <param name="useMask">When true the irrelevant part of the image is set to a black color,
		/// otherwise, a mirroring technique is used to fill irrelevant pixels.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Rotate(double angle, double xShift, double yShift,
			double xOrigin, double yOrigin, bool useMask)
		{
			EnsureNotDisposed();
			return ReplaceDib(FreeImage.RotateEx(dib, angle, xShift, yShift, xOrigin, yOrigin, useMask));
		}

		/// <summary>
		/// This method performs a rotation and / or translation of an 8-bit greyscale,
		/// 24- or 32-bit image, using a 3rd order (cubic) B-Spline initializing a new instance.
		/// </summary>
		/// <param name="angle">The angle of rotation.</param>
		/// <param name="xShift">Horizontal image translation.</param>
		/// <param name="yShift">Vertical image translation.</param>
		/// <param name="xOrigin">Rotation center x-coordinate.</param>
		/// <param name="yOrigin">Rotation center y-coordinate.</param>
		/// <param name="useMask">When true the irrelevant part of the image is set to a black color,
		/// otherwise, a mirroring technique is used to fill irrelevant pixels.</param>
		/// <returns>The rotated instance.</returns>
		public FreeImageBitmap GetRotatedInstance(double angle, double xShift, double yShift,
			double xOrigin, double yOrigin, bool useMask)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.RotateEx(
				dib, angle, xShift, yShift, xOrigin, yOrigin, useMask);
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Perfoms an histogram transformation on a 8-, 24- or 32-bit image.
		/// </summary>
		/// <param name="lookUpTable">The lookup table (LUT).
		/// It's size is assumed to be 256 in length.</param>
		/// <param name="channel">The color channel to be transformed.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool AdjustCurve(byte[] lookUpTable, FREE_IMAGE_COLOR_CHANNEL channel)
		{
			EnsureNotDisposed();
			return FreeImage.AdjustCurve(dib, lookUpTable, channel);
		}

		/// <summary>
		/// Performs gamma correction on a 8-, 24- or 32-bit image.
		/// </summary>
		/// <param name="gamma">The parameter represents the gamma value to use (gamma > 0).
		/// A value of 1.0 leaves the image alone, less than one darkens it, and greater than one lightens it.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool AdjustGamma(double gamma)
		{
			EnsureNotDisposed();
			return FreeImage.AdjustGamma(dib, gamma);
		}

		/// <summary>
		/// Adjusts the brightness of a 8-, 24- or 32-bit image by a certain amount.
		/// </summary>
		/// <param name="percentage">A value 0 means no change,
		/// less than 0 will make the image darker and greater than 0 will make the image brighter.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool AdjustBrightness(double percentage)
		{
			EnsureNotDisposed();
			return FreeImage.AdjustBrightness(dib, percentage);
		}

		/// <summary>
		/// Adjusts the contrast of a 8-, 24- or 32-bit image by a certain amount.
		/// </summary>
		/// <param name="percentage">A value 0 means no change,
		/// less than 0 will decrease the contrast and greater than 0 will increase the contrast of the image.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool AdjustContrast(double percentage)
		{
			EnsureNotDisposed();
			return FreeImage.AdjustContrast(dib, percentage);
		}

		/// <summary>
		/// Inverts each pixel data.
		/// </summary>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Invert()
		{
			EnsureNotDisposed();
			return FreeImage.Invert(dib);
		}

		/// <summary>
		/// Computes the image histogram.
		/// </summary>
		/// <param name="channel">Channel to compute from.</param>
		/// <param name="histogram">Array of integers containing the histogram.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool GetHistogram(FREE_IMAGE_COLOR_CHANNEL channel, out int[] histogram)
		{
			EnsureNotDisposed();
			histogram = new int[256];
			return FreeImage.GetHistogram(dib, histogram, channel);
		}

		/// <summary>
		/// Retrieves the red, green, blue or alpha channel of a 24- or 32-bit image.
		/// </summary>
		/// <param name="channel">The color channel to extract.</param>
		/// <returns>The color channel in a new instance.</returns>
		public FreeImageBitmap GetChannel(FREE_IMAGE_COLOR_CHANNEL channel)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.GetChannel(dib, channel);
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Insert a 8-bit dib into a 24- or 32-bit image.
		/// Both images must have to same width and height.
		/// </summary>
		/// <param name="bitmap">The <see cref="FreeImageBitmap"/> to insert.</param>
		/// <param name="channel">The color channel to replace.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool SetChannel(FreeImageBitmap bitmap, FREE_IMAGE_COLOR_CHANNEL channel)
		{
			EnsureNotDisposed();
			bitmap.EnsureNotDisposed();
			return FreeImage.SetChannel(dib, bitmap.dib, channel);
		}

		/// <summary>
		/// Retrieves the real part, imaginary part, magnitude or phase of a complex image.
		/// </summary>
		/// <param name="channel">The color channel to extract.</param>
		/// <returns>The color channel in a new instance.</returns>
		public FreeImageBitmap GetComplexChannel(FREE_IMAGE_COLOR_CHANNEL channel)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.GetComplexChannel(dib, channel);
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Set the real or imaginary part of a complex image.
		/// Both images must have to same width and height.
		/// </summary>
		/// <param name="bitmap">The <see cref="FreeImageBitmap"/> to insert.</param>
		/// <param name="channel">The color channel to replace.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool SetComplexChannel(FreeImageBitmap bitmap, FREE_IMAGE_COLOR_CHANNEL channel)
		{
			EnsureNotDisposed();
			bitmap.EnsureNotDisposed();
			return FreeImage.SetComplexChannel(dib, bitmap.dib, channel);
		}

		/// <summary>
		/// Copy a sub part of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="rect">The subpart to copy.</param>
		/// <returns>The sub part in a new instance.</returns>
		public FreeImageBitmap Copy(Rectangle rect)
		{
			EnsureNotDisposed();
			return Copy(rect.Left, rect.Top, rect.Right, rect.Bottom);
		}

		/// <summary>
		/// Copy a sub part of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="left">Specifies the left position of the cropped rectangle.</param>
		/// <param name="top">Specifies the top position of the cropped rectangle.</param>
		/// <param name="right">Specifies the right position of the cropped rectangle.</param>
		/// <param name="bottom">Specifies the bottom position of the cropped rectangle.</param>
		/// <returns>The sub part in a new instance.</returns>
		public FreeImageBitmap Copy(int left, int top, int right, int bottom)
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.Copy(dib, left, top, right, bottom);
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Alpha blend or combine a sub part image with this <see cref="FreeImageBitmap"/>.
		/// The bit depth of <paramref name="bitmap"/> must be greater than or equal to the bit depth this instance.
		/// </summary>
		/// <param name="bitmap">The <see cref="FreeImageBitmap"/> to paste into this instance.</param>
		/// <param name="left">Specifies the left position of the sub image.</param>
		/// <param name="top">Specifies the top position of the sub image.</param>
		/// <param name="alpha">alpha blend factor.
		/// The source and destination images are alpha blended if alpha=0..255.
		/// If alpha > 255, then the source image is combined to the destination image.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Paste(FreeImageBitmap bitmap, int left, int top, int alpha)
		{
			EnsureNotDisposed();
			bitmap.EnsureNotDisposed();
			return FreeImage.Paste(dib, bitmap.dib, left, top, alpha);
		}

		/// <summary>
		/// Alpha blend or combine a sub part image with tthis <see cref="FreeImageBitmap"/>.
		/// The bit depth of <paramref name="bitmap"/> must be greater than or equal to the bit depth this instance.
		/// </summary>
		/// <param name="bitmap">The <see cref="FreeImageBitmap"/> to paste into this instance.</param>
		/// <param name="point">Specifies the position of the sub image.</param>
		/// <param name="alpha">alpha blend factor.
		/// The source and destination images are alpha blended if alpha=0..255.
		/// If alpha > 255, then the source image is combined to the destination image.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Paste(FreeImageBitmap bitmap, Point point, int alpha)
		{
			EnsureNotDisposed();
			return Paste(bitmap, point.X, point.Y, alpha);
		}

		/// <summary>
		/// This method composite a transparent foreground image against a single background color or
		/// against a background image.
		/// In case <paramref name="useBitmapBackground"/> is false and <paramref name="applicationBackground"/>
		/// and <paramref name="bitmapBackGround"/>
		/// are null, a checkerboard will be used as background.
		/// </summary>
		/// <param name="useBitmapBackground">When true the background of this instance is used
		/// if it contains one.</param>
		/// <param name="applicationBackground">Backgroundcolor used in case <paramref name="useBitmapBackground"/> is false
		/// and <paramref name="applicationBackground"/> is not null.</param>
		/// <param name="bitmapBackGround">Background used in case <paramref name="useBitmapBackground"/>
		/// is false and <paramref name="applicationBackground"/> is a null reference.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool Composite(bool useBitmapBackground, Color? applicationBackground, FreeImageBitmap bitmapBackGround)
		{
			EnsureNotDisposed();
			bitmapBackGround.EnsureNotDisposed();
			RGBQUAD? rgb = applicationBackground;
			return ReplaceDib(
				FreeImage.Composite(
					dib,
					useBitmapBackground,
					rgb.HasValue ? new RGBQUAD[] { rgb.Value } : null,
					bitmapBackGround.dib));
		}

		/// <summary>
		/// Applies the alpha value of each pixel to its color components.
		/// The aplha value stays unchanged.
		/// Only works with 32-bits color depth.
		/// </summary>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool PreMultiplyWithAlpha()
		{
			EnsureNotDisposed();
			return FreeImage.PreMultiplyWithAlpha(dib);
		}

		/// <summary>
		/// Solves a Poisson equation, remap result pixels to [0..1] and returns the solution.
		/// </summary>
		/// <param name="ncycle">Number of cycles in the multigrid algorithm (usually 2 or 3)</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool MultigridPoissonSolver(int ncycle)
		{
			EnsureNotDisposed();
			return ReplaceDib(FreeImage.MultigridPoissonSolver(dib, ncycle));
		}

		/// <summary>
		/// Adjusts an image's brightness, contrast and gamma as well as it may
		/// optionally invert the image within a single operation.
		/// </summary>
		/// <param name="brightness">Percentage brightness value where -100 &lt;= brightness &lt;= 100.
		/// <para>A value of 0 means no change, less than 0 will make the image darker and greater
		/// than 0 will make the image brighter.</para></param>
		/// <param name="contrast">Percentage contrast value where -100 &lt;= contrast &lt;= 100.
		/// <para>A value of 0 means no change, less than 0 will decrease the contrast
		/// and greater than 0 will increase the contrast of the image.</para></param>
		/// <param name="gamma">Gamma value to be used for gamma correction.
		/// <para>A value of 1.0 leaves the image alone, less than one darkens it,
		/// and greater than one lightens it.</para>
		/// This parameter must not be zero or smaller than zero.
		/// If so, it will be ignored and no gamma correction will be performed on the image.</param>
		/// <param name="invert">If set to true, the image will be inverted.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool AdjustColors(double brightness, double contrast, double gamma, bool invert)
		{
			EnsureNotDisposed();
			return FreeImage.AdjustColors(dib, brightness, contrast, gamma, invert);
		}

		/// <summary>
		/// Applies color mapping for one or several colors on a 1-, 4- or 8-bit
		/// palletized or a 16-, 24- or 32-bit high color image.
		/// </summary>
		/// <param name="srccolors">Array of colors to be used as the mapping source.</param>
		/// <param name="dstcolors">Array of colors to be used as the mapping destination.</param>
		/// <param name="ignore_alpha">If true, 32-bit images and colors are treated as 24-bit.</param>
		/// <param name="swap">If true, source and destination colors are swapped, that is,
		/// each destination color is also mapped to the corresponding source color.</param>
		/// <returns>The total number of pixels changed.</returns>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="srccolors"/> or <paramref name="dstcolors"/> is a null reference.
		/// </exception>
		/// <exception cref="ArgumentException">
		/// <paramref name="srccolors"/> has a different length than <paramref name="dstcolors"/>.
		/// </exception>
		public uint ApplyColorMapping(RGBQUAD[] srccolors, RGBQUAD[] dstcolors, bool ignore_alpha, bool swap)
		{
			EnsureNotDisposed();
			if (srccolors == null)
			{
				throw new ArgumentNullException("srccolors");
			}
			if (dstcolors == null)
			{
				throw new ArgumentNullException("dstcolors");
			}
			if (srccolors.Length != dstcolors.Length)
			{
				throw new ArgumentException("srccolors and dstcolors must have the same length.");
			}
			return FreeImage.ApplyColorMapping(dib, srccolors, dstcolors, (uint)srccolors.Length, ignore_alpha, swap);
		}

		/// <summary>
		/// Swaps two specified colors on a 1-, 4- or 8-bit palletized
		/// or a 16-, 24- or 32-bit high color image.
		/// </summary>
		/// <param name="color_a">One of the two colors to be swapped.</param>
		/// <param name="color_b">The other of the two colors to be swapped.</param>
		/// <param name="ignore_alpha">If true, 32-bit images and colors are treated as 24-bit.</param>
		/// <returns>The total number of pixels changed.</returns>
		public uint SwapColors(RGBQUAD color_a, RGBQUAD color_b, bool ignore_alpha)
		{
			EnsureNotDisposed();
			return FreeImage.SwapColors(dib, ref color_a, ref color_b, ignore_alpha);
		}

		/// <summary>
		/// Applies palette index mapping for one or several indices
		/// on a 1-, 4- or 8-bit palletized image.
		/// </summary>
		/// <param name="srcindices">Array of palette indices to be used as the mapping source.</param>
		/// <param name="dstindices">Array of palette indices to be used as the mapping destination.</param>
		/// <param name="count">The number of palette indices to be mapped. This is the size of both
		/// srcindices and dstindices</param>
		/// <param name="swap">If true, source and destination palette indices are swapped, that is,
		/// each destination index is also mapped to the corresponding source index.</param>
		/// <returns>The total number of pixels changed.</returns>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="srccolors"/> or <paramref name="dstcolors"/> is a null reference.
		/// </exception>
		/// <exception cref="ArgumentException">
		/// <paramref name="srccolors"/> has a different length than <paramref name="dstcolors"/>.
		/// </exception>
		public uint ApplyPaletteIndexMapping(byte[] srcindices, byte[] dstindices, uint count, bool swap)
		{
			EnsureNotDisposed();
			if (srcindices == null)
			{
				throw new ArgumentNullException("srcindices");
			}
			if (dstindices == null)
			{
				throw new ArgumentNullException("dstindices");
			}
			if (srcindices.Length != dstindices.Length)
			{
				throw new ArgumentException("srcindices and dstindices must have the same length.");
			}
			return FreeImage.ApplyPaletteIndexMapping(dib, srcindices, dstindices, (uint)srcindices.Length, swap);
		}

		/// <summary>
		/// Swaps two specified palette indices on a 1-, 4- or 8-bit palletized image.
		/// </summary>
		/// <param name="index_a">One of the two palette indices to be swapped.</param>
		/// <param name="index_b">The other of the two palette indices to be swapped.</param>
		/// <returns>The total number of pixels changed.</returns>
		public uint SwapPaletteIndices(byte index_a, byte index_b)
		{
			EnsureNotDisposed();
			return FreeImage.SwapPaletteIndices(dib, ref index_a, ref index_b);
		}

		/// <summary>
		/// Sets all pixels of this <see cref="FreeImageBitmap"/> to the specified color.
		/// See <see cref="FreeImage.FillBackground&lt;T&gt;"/> for further details.
		/// </summary>
		/// <typeparam name="T">The type of the specified color.</typeparam>
		/// <param name="color">The color to fill this <see cref="FreeImageBitmap"/> with.</param>
		/// <returns><c>true</c> on success, <c>false</c> on failure.</returns>
		public bool FillBackground<T>(T color) where T : struct
		{
			return FillBackground(color, FREE_IMAGE_COLOR_OPTIONS.FICO_DEFAULT);
		}

		/// <summary>
		/// Sets all pixels of this <see cref="FreeImageBitmap"/> to the specified color.
		/// See <see cref="FreeImage.FillBackground&lt;T&gt;"/> for further details.
		/// </summary>
		/// <typeparam name="T">The type of the specified color.</typeparam>
		/// <param name="color">The color to fill this <see cref="FreeImageBitmap"/> with.</param>
		/// <param name="options">Options that affect the color search process for palletized images.</param>
		/// <returns><c>true</c> on success, <c>false</c> on failure.</returns>
		public bool FillBackground<T>(T color, FREE_IMAGE_COLOR_OPTIONS options) where T : struct
		{
			EnsureNotDisposed();
			return FreeImage.FillBackground(dib, color, options);
		}

		/// <summary>
		/// Creates a new ICC-Profile.
		/// </summary>
		/// <param name="data">The data of the new ICC-Profile.</param>
		/// <returns>The new ICC-Profile of the bitmap.</returns>
		/// <exception cref="ArgumentNullException"><paramref name="data"/> is a null reference.</exception>
		public FIICCPROFILE CreateICCProfile(byte[] data)
		{
			if (data == null)
			{
				throw new ArgumentNullException("data");
			}
			return CreateICCProfile(data, data.Length);
		}

		/// <summary>
		/// Creates a new ICC-Profile.
		/// </summary>
		/// <param name="data">The data of the new ICC-Profile.</param>
		/// <param name="size">The number of bytes of <paramref name="data"/> to use.</param>
		/// <returns>The new ICC-Profile of the bitmap.</returns>
		/// <exception cref="ArgumentNullException"><paramref name="data"/> is null.</exception>
		public FIICCPROFILE CreateICCProfile(byte[] data, int size)
		{
			EnsureNotDisposed();
			if (data == null)
			{
				throw new ArgumentNullException("data");
			}
			return FreeImage.CreateICCProfileEx(dib, data, size);
		}

		/// <summary>
		/// Determines whether this and the specified instances are the same.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if this instance is the same <paramref name="obj"/>
		/// or if both are null references; otherwise, false.</returns>
		public override bool Equals(object obj)
		{
			return ReferenceEquals(this, obj);
		}

		/// <summary>
		/// Returns a hash code for this <see cref="FreeImageBitmap"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="FreeImageBitmap"/>.</returns>
		public override int GetHashCode()
		{
			return dib.GetHashCode();
		}

		#endregion

		#region Static functions

		/// <summary>
		/// Returns a value that indicates whether the pixel format for this <see cref="FreeImageBitmap"/> contains alpha information.
		/// </summary>
		/// <param name="pixfmt">The <see cref="System.Drawing.Imaging.PixelFormat"/> to test.</param>
		/// <returns><b>true</b> if pixfmt contains alpha information; otherwise, <b>false</b>.</returns>
		public static bool IsAlphaPixelFormat(PixelFormat pixfmt)
		{
			return Bitmap.IsAlphaPixelFormat(pixfmt);
		}

		/// <summary>
		/// Returns a value that indicates whether the pixel format is 32 bits per pixel.
		/// </summary>
		/// <param name="pixfmt">The <see cref="System.Drawing.Imaging.PixelFormat"/> to test.</param>
		/// <returns>true if pixfmt is canonical; otherwise, false.</returns>
		public static bool IsCanonicalPixelFormat(PixelFormat pixfmt)
		{
			return Bitmap.IsCanonicalPixelFormat(pixfmt);
		}

		/// <summary>
		/// Returns a value that indicates whether the pixel format is 64 bits per pixel.
		/// </summary>
		/// <param name="pixfmt">The <see cref="System.Drawing.Imaging.PixelFormat"/> enumeration to test.</param>
		/// <returns>true if pixfmt is extended; otherwise, false.</returns>
		public static bool IsExtendedPixelFormat(PixelFormat pixfmt)
		{
			return Bitmap.IsExtendedPixelFormat(pixfmt);
		}

		/// <summary>
		/// Creates a <see cref="FreeImageBitmap"/> from a Windows handle to an icon.
		/// </summary>
		/// <param name="hicon">A handle to an icon.</param>
		/// <returns>The <see cref="FreeImageBitmap"/> that this method creates.</returns>
		public static FreeImageBitmap FromHicon(IntPtr hicon)
		{
			using (Bitmap bitmap = Bitmap.FromHicon(hicon))
			{
				return new FreeImageBitmap(bitmap);
			}
		}

		/// <summary>
		/// Creates a <see cref="FreeImageBitmap"/> from the specified Windows resource.
		/// </summary>
		/// <param name="hinstance">A handle to an instance of the executable
		/// file that contains the resource.</param>
		/// <param name="bitmapName">A string containing the name of the resource bitmap.</param>
		/// <returns>The <see cref="FreeImageBitmap"/> that this method creates.</returns>
		public static FreeImageBitmap FromResource(IntPtr hinstance, string bitmapName)
		{
			using (Bitmap bitmap = Bitmap.FromResource(hinstance, bitmapName))
			{
				return new FreeImageBitmap(bitmap);
			}
		}

		/// <summary>
		/// Creates a <see cref="FreeImageBitmap"/> from the specified file.
		/// </summary>
		/// <param name="filename">A string that contains the name of the file
		/// from which to create the <see cref="FreeImageBitmap"/>.</param>
		/// <returns>The <see cref="FreeImageBitmap"/> this method creates.</returns>
		public static FreeImageBitmap FromFile(string filename)
		{
			return new FreeImageBitmap(filename);
		}

		/// <summary>
		/// Creates a <see cref="FreeImageBitmap"/> from the specified file
		/// using embedded color management information in that file.
		/// </summary>
		/// <param name="filename">A string that contains the
		/// name of the file from which to create the <see cref="FreeImageBitmap"/>.</param>
		/// <param name="useEmbeddedColorManagement">Ignored.</param>
		/// <returns>The <see cref="FreeImageBitmap"/> this method creates.</returns>
		public static FreeImageBitmap FromFile(string filename, bool useEmbeddedColorManagement)
		{
			return new FreeImageBitmap(filename);
		}

		/// <summary>
		/// Creates a <see cref="FreeImageBitmap"/> from a handle to a GDI bitmap.
		/// </summary>
		/// <param name="hbitmap">The GDI bitmap handle from which to create the <see cref="FreeImageBitmap"/>.</param>
		/// <returns>The <see cref="FreeImageBitmap"/> this method creates.</returns>
		public static FreeImageBitmap FromHbitmap(IntPtr hbitmap)
		{
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.CreateFromHbitmap(hbitmap, IntPtr.Zero);
			if (!newDib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
			}
			return result;
		}

		/// <summary>
		/// Creates a <see cref="FreeImageBitmap"/> from a handle to a GDI bitmap and a handle to a GDI palette.
		/// </summary>
		/// <param name="hbitmap">The GDI bitmap handle from which to create the <see cref="FreeImageBitmap"/>.</param>
		/// <param name="hpalette">Ignored.</param>
		/// <returns>The <see cref="FreeImageBitmap"/> this method creates.</returns>
		public static FreeImageBitmap FromHbitmap(IntPtr hbitmap, IntPtr hpalette)
		{
			return FromHbitmap(hbitmap);
		}

		/// <summary>
		/// Frees a bitmap handle.
		/// </summary>
		/// <param name="hbitmap">Handle to a bitmap.</param>
		/// <returns><b>true</b> on success, <b>false</b> on failure.</returns>
		public static bool FreeHbitmap(IntPtr hbitmap)
		{
			return FreeImage.FreeHbitmap(hbitmap);
		}

		/// <summary>
		/// Creates a <see cref="FreeImageBitmap"/> from the specified data stream.
		/// </summary>
		/// <param name="stream">A <see cref="Stream"/> that contains the data for this <see cref="FreeImageBitmap"/>.</param>
		/// <returns>The <see cref="FreeImageBitmap"/> this method creates.</returns>
		public static FreeImageBitmap FromStream(Stream stream)
		{
			return new FreeImageBitmap(stream);
		}

		/// <summary>
		/// Creates a <see cref="FreeImageBitmap"/> from the specified data stream.
		/// </summary>
		/// <param name="stream">A <see cref="Stream"/> that contains the data for this <see cref="FreeImageBitmap"/>.</param>
		/// <param name="useEmbeddedColorManagement">Ignored.</param>
		/// <returns>The <see cref="FreeImageBitmap"/> this method creates.</returns>
		public static FreeImageBitmap FromStream(Stream stream, bool useEmbeddedColorManagement)
		{
			return new FreeImageBitmap(stream);
		}

		/// <summary>
		/// Creates a <see cref="FreeImageBitmap"/> from the specified data stream.
		/// </summary>
		/// <param name="stream">A <see cref="Stream"/> that contains the data for this <see cref="FreeImageBitmap"/>.</param>
		/// <param name="useEmbeddedColorManagement">Ignored.</param>
		/// <param name="validateImageData">Ignored.</param>
		/// <returns>The <see cref="FreeImageBitmap"/> this method creates.</returns>
		public static FreeImageBitmap FromStream(Stream stream, bool useEmbeddedColorManagement, bool validateImageData)
		{
			return new FreeImageBitmap(stream);
		}

		/// <summary>
		/// Returns the color depth, in number of bits per pixel,
		/// of the specified pixel format.
		/// </summary>
		/// <param name="pixfmt">The <see cref="System.Drawing.Imaging.PixelFormat"/> member that specifies
		/// the format for which to find the size.</param>
		/// <returns>The color depth of the specified pixel format.</returns>
		public static int GetPixelFormatSize(PixelFormat pixfmt)
		{
			return Bitmap.GetPixelFormatSize(pixfmt);
		}

		/// <summary>
		/// Performs a lossless rotation or flipping on a JPEG file.
		/// </summary>
		/// <param name="source">Source file.</param>
		/// <param name="destination">Destination file; can be the source file; will be overwritten.</param>
		/// <param name="operation">The operation to apply.</param>
		/// <param name="perfect">To avoid lossy transformation, you can set the perfect parameter to true.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		public static bool JPEGTransform(string source, string destination, FREE_IMAGE_JPEG_OPERATION operation, bool perfect)
		{
			return FreeImage.JPEGTransform(source, destination, operation, perfect);
		}

		/// <summary>
		/// Performs a lossless crop on a JPEG file.
		/// </summary>
		/// <param name="source">Source filename.</param>
		/// <param name="destination">Destination filename.</param>
		/// <param name="rect">Specifies the cropped rectangle.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="source"/> or <paramref name="destination"/> is null.
		/// </exception>
		/// <exception cref="FileNotFoundException">
		/// <paramref name="source"/> does not exist.
		/// </exception>
		public static bool JPEGCrop(string source, string destination, Rectangle rect)
		{
			if (source == null)
			{
				throw new ArgumentNullException("source");
			}
			if (!File.Exists(source))
			{
				throw new FileNotFoundException("source");
			}
			if (destination == null)
			{
				throw new ArgumentNullException("destination");
			}
			return JPEGCrop(source, destination, rect.Left, rect.Top, rect.Right, rect.Bottom);
		}

		/// <summary>
		/// Performs a lossless crop on a JPEG file.
		/// </summary>
		/// <param name="source">Source filename.</param>
		/// <param name="destination">Destination filename.</param>
		/// <param name="left">Specifies the left position of the cropped rectangle.</param>
		/// <param name="top">Specifies the top position of the cropped rectangle.</param>
		/// <param name="right">Specifies the right position of the cropped rectangle.</param>
		/// <param name="bottom">Specifies the bottom position of the cropped rectangle.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="source"/> or <paramref name="destination"/> is null.
		/// </exception>
		/// <exception cref="FileNotFoundException">
		/// <paramref name="source"/> does not exist.
		/// </exception>
		public static bool JPEGCrop(string source, string destination, int left, int top, int right, int bottom)
		{
			if (source == null)
			{
				throw new ArgumentNullException("source");
			}
			if (!File.Exists(source))
			{
				throw new FileNotFoundException("source");
			}
			if (destination == null)
			{
				throw new ArgumentNullException("destination");
			}
			return FreeImage.JPEGCrop(source, destination, left, top, right, bottom);
		}

		/// <summary>
		/// Converts a X11 color name into a corresponding RGB value.
		/// </summary>
		/// <param name="color">Name of the color to convert.</param>
		/// <param name="red">Red component.</param>
		/// <param name="green">Green component.</param>
		/// <param name="blue">Blue component.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		/// <exception cref="ArgumentNullException"><paramref name="color"/> is null.</exception>
		public static bool LookupX11Color(string color, out byte red, out byte green, out byte blue)
		{
			if (color == null)
			{
				throw new ArgumentNullException("color");
			}
			return FreeImage.LookupX11Color(color, out red, out green, out blue);
		}

		/// <summary>
		/// Converts a SVG color name into a corresponding RGB value.
		/// </summary>
		/// <param name="color">Name of the color to convert.</param>
		/// <param name="red">Red component.</param>
		/// <param name="green">Green component.</param>
		/// <param name="blue">Blue component.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		/// <exception cref="ArgumentNullException"><paramref name="color"/> is null.</exception>
		public static bool LookupSVGColor(string color, out byte red, out byte green, out byte blue)
		{
			if (color == null)
			{
				throw new ArgumentNullException("color");
			}
			return FreeImage.LookupSVGColor(color, out red, out green, out blue);
		}

		/// <summary>
		/// Creates a lookup table to be used with AdjustCurve() which
		/// may adjusts brightness and contrast, correct gamma and invert the image with a
		/// single call to AdjustCurve().
		/// </summary>
		/// <param name="lookUpTable">Output lookup table to be used with AdjustCurve().
		/// The size of <paramref name="lookUpTable"/> is assumed to be 256.</param>
		/// <param name="brightness">Percentage brightness value where -100 &lt;= brightness &lt;= 100.
		/// <para>A value of 0 means no change, less than 0 will make the image darker and greater
		/// than 0 will make the image brighter.</para></param>
		/// <param name="contrast">Percentage contrast value where -100 &lt;= contrast &lt;= 100.
		/// <para>A value of 0 means no change, less than 0 will decrease the contrast
		/// and greater than 0 will increase the contrast of the image.</para></param>
		/// <param name="gamma">Gamma value to be used for gamma correction.
		/// <para>A value of 1.0 leaves the image alone, less than one darkens it,
		/// and greater than one lightens it.</para></param>
		/// <param name="invert">If set to true, the image will be inverted.</param>
		/// <returns>The number of adjustments applied to the resulting lookup table
		/// compared to a blind lookup table.</returns>
		/// <exception cref="ArgumentNullException"><paramref name="lookUpTable"/> is null.</exception>
		/// <exception cref="ArgumentException"><paramref name="lookUpTable.Length"/> is not 256.</exception>
		public static int GetAdjustColorsLookupTable(byte[] lookUpTable, double brightness, double contrast, double gamma, bool invert)
		{
			if (lookUpTable == null)
			{
				throw new ArgumentNullException("lookUpTable");
			}
			if (lookUpTable.Length != 256)
			{
				throw new ArgumentException("lookUpTable");
			}
			return FreeImage.GetAdjustColorsLookupTable(lookUpTable, brightness, contrast, gamma, invert);
		}

		/// <summary>
		/// Adds a specified frame to the file specified using the specified parameters.
		/// Use this method to save selected frames from an to a multiple-frame image.
		/// </summary>
		/// <param name="filename">File to add this frame to.</param>
		/// <param name="bitmap">A <see cref="FreeImageBitmap"/> that contains the frame to add.</param>
		/// <param name="format">Format of the image.</param>
		/// <param name="loadFlags">Flags to enable or disable plugin-features.</param>
		/// <param name="saveFlags">Flags to enable or disable plugin-features.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="filename"/> or <paramref name="bitmap"/> is null.
		/// </exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		/// <exception cref="Exception">Saving the image failed.</exception>
		public static void SaveAdd(
			string filename,
			FreeImageBitmap bitmap,
			FREE_IMAGE_FORMAT format,
			FREE_IMAGE_LOAD_FLAGS loadFlags,
			FREE_IMAGE_SAVE_FLAGS saveFlags)
		{
			if (filename == null)
			{
				throw new ArgumentNullException("filename");
			}
			if (!File.Exists(filename))
			{
				throw new FileNotFoundException("filename");
			}
			if (bitmap == null)
			{
				throw new ArgumentNullException("bitmap");
			}
			bitmap.EnsureNotDisposed();

			FIBITMAP dib = bitmap.dib;
			if (dib.IsNull)
				throw new ArgumentNullException("bitmap");

			FIMULTIBITMAP mpBitmap =
				FreeImage.OpenMultiBitmapEx(filename, ref format, loadFlags, false, false, true);

			if (mpBitmap.IsNull)
				throw new Exception(ErrorLoadingBitmap);

			FreeImage.AppendPage(mpBitmap, bitmap.dib);

			if (!FreeImage.CloseMultiBitmap(mpBitmap, saveFlags))
				throw new Exception(ErrorUnloadBitmap);
		}

		/// <summary>
		/// Adds a specified frame to the file specified using the specified parameters.
		/// Use this method to save selected frames from an image to a multiple-frame image.
		/// </summary>
		/// <param name="filename">File to add this frame to.</param>
		/// <param name="bitmap">A <see cref="FreeImageBitmap"/> that contains the frame to add.</param>
		/// <param name="insertPosition">The position of the inserted frame.</param>
		/// <param name="format">Format of the image.</param>
		/// <param name="loadFlags">Flags to enable or disable plugin-features.</param>
		/// <param name="saveFlags">Flags to enable or disable plugin-features.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="filename"/> or <paramref name="bitmap"/> is null.
		/// </exception>
		/// <exception cref="FileNotFoundException"><paramref name="filename"/> does not exist.</exception>
		/// <exception cref="Exception">Saving the image failed.</exception>
		/// <exception cref="ArgumentOutOfRangeException"><paramref name="insertPosition"/> is out of range.</exception>
		public static void SaveAdd(
			string filename,
			FreeImageBitmap bitmap,
			int insertPosition,
			FREE_IMAGE_FORMAT format,
			FREE_IMAGE_LOAD_FLAGS loadFlags,
			FREE_IMAGE_SAVE_FLAGS saveFlags)
		{
			if (filename == null)
			{
				throw new ArgumentNullException("filename");
			}
			if (!File.Exists(filename))
			{
				throw new FileNotFoundException("filename");
			}
			if (bitmap == null)
			{
				throw new ArgumentNullException("bitmap");
			}
			if (insertPosition < 0)
			{
				throw new ArgumentOutOfRangeException("insertPosition");
			}
			bitmap.EnsureNotDisposed();

			FIBITMAP dib = bitmap.dib;
			if (dib.IsNull)
				throw new ArgumentNullException("bitmap");

			FIMULTIBITMAP mpBitmap =
				FreeImage.OpenMultiBitmapEx(filename, ref format, loadFlags, false, false, true);

			if (mpBitmap.IsNull)
				throw new Exception(ErrorLoadingBitmap);

			int pageCount = FreeImage.GetPageCount(mpBitmap);

			if (insertPosition > pageCount)
				throw new ArgumentOutOfRangeException("insertPosition");

			if (insertPosition == pageCount)
				FreeImage.AppendPage(mpBitmap, bitmap.dib);
			else
				FreeImage.InsertPage(mpBitmap, insertPosition, bitmap.dib);

			if (!FreeImage.CloseMultiBitmap(mpBitmap, saveFlags))
				throw new Exception(ErrorUnloadBitmap);
		}

		/// <summary>
		/// Returns a new instance of the <see cref="PropertyItem"/> class which
		/// has no public accessible constructor.
		/// </summary>
		/// <returns>A new instace of <see cref="PropertyItem"/>.</returns>
		public static PropertyItem CreateNewPropertyItem()
		{
			return FreeImage.CreatePropertyItem();
		}

		#endregion

		#region Helper functions

		/// <summary>
		/// Throws an exception in case the instance has already been disposed.
		/// </summary>
		private void EnsureNotDisposed()
		{
			lock (lockObject)
			{
				if (!this.disposed)
				{
					return;
				}
			}
			throw new ObjectDisposedException(ToString());
		}

		/// <summary>
		/// Tries to replace the wrapped <see cref="FIBITMAP"/> with a new one.
		/// In case the new dib is null or the same as the already
		/// wrapped one, nothing will be changed and the result will
		/// be false.
		/// Otherwise the wrapped <see cref="FIBITMAP"/> will be unloaded and replaced.
		/// </summary>
		/// <param name="newDib">The new dib.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		private bool ReplaceDib(FIBITMAP newDib)
		{
			bool result = false;
			if ((dib != newDib) && (!newDib.IsNull))
			{
				UnloadDib();
				dib = newDib;
				AddMemoryPressure();
				result = true;
			}
			return result;
		}

		/// <summary>
		/// Unloads currently wrapped <see cref="FIBITMAP"/> or unlocks the locked page
		/// in case it came from a multipaged bitmap.
		/// </summary>
		private void UnloadDib()
		{
			if (!dib.IsNull)
			{
				long size = FreeImage.GetDIBSize(dib);
				FreeImage.UnloadEx(ref dib);
				if (size > 0L)
					GC.RemoveMemoryPressure(size);
			}
		}

		/// <summary>
		/// Informs the runtime about unmanaged allocoted memory.
		/// </summary>
		private void AddMemoryPressure()
		{
			long dataSize;
			if ((dataSize = DataSize) > 0L)
				GC.AddMemoryPressure(dataSize);
		}

		/// <summary>
		/// Opens the stream and reads the number of available pages.
		/// Then loads the first page to this instance.
		/// </summary>
		private void LoadFromStream(Stream stream, FREE_IMAGE_FORMAT format, FREE_IMAGE_LOAD_FLAGS flags)
		{
			FIMULTIBITMAP mdib = FreeImage.OpenMultiBitmapFromStream(stream, ref format, flags);
			if (mdib.IsNull)
			{
				throw new Exception(ErrorLoadingBitmap);
			}
			try
			{
				frameCount = FreeImage.GetPageCount(mdib);
			}
			finally
			{
				if (!FreeImage.CloseMultiBitmapEx(ref mdib))
				{
					throw new Exception(ErrorUnloadBitmap);
				}
			}

			dib = FreeImage.LoadFromStream(stream, flags, ref format);
			if (dib.IsNull)
			{
				throw new Exception(ErrorLoadingBitmap);
			}

			saveInformation.loadFlags = flags;
			originalFormat = format;
			AddMemoryPressure();
		}

		#endregion

		#region Interfaces

		/// <summary>
		/// Helper class to store informations for <see cref="FreeImageBitmap.SaveAdd()"/>.
		/// </summary>
		private sealed class SaveInformation : ICloneable
		{
			public string filename;
			public FREE_IMAGE_FORMAT format = FREE_IMAGE_FORMAT.FIF_UNKNOWN;
			public FREE_IMAGE_LOAD_FLAGS loadFlags = FREE_IMAGE_LOAD_FLAGS.DEFAULT;
			public FREE_IMAGE_SAVE_FLAGS saveFlags = FREE_IMAGE_SAVE_FLAGS.DEFAULT;

			public object Clone()
			{
				return base.MemberwiseClone();
			}
		}

		/// <summary>
		/// Creates a deep copy of this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <returns>A deep copy of this <see cref="FreeImageBitmap"/>.</returns>
		public object Clone()
		{
			EnsureNotDisposed();
			FreeImageBitmap result = null;
			FIBITMAP newDib = FreeImage.Clone(dib);
			if (!dib.IsNull)
			{
				result = new FreeImageBitmap(newDib);
				result.saveInformation = (SaveInformation)saveInformation.Clone();
				result.tag = tag;
				result.originalFormat = originalFormat;
			}
			return result;
		}

		/// <summary>
		/// Performs application-defined tasks associated with freeing,
		/// releasing, or resetting unmanaged resources.
		/// </summary>
		public void Dispose()
		{
			Dispose(true);
			GC.SuppressFinalize(this);
		}

		/// <summary>
		/// Performs application-defined tasks associated with freeing,
		/// releasing, or resetting unmanaged resources.
		/// </summary>
		/// <param name="disposing">If true managed ressources are released.</param>
		protected virtual void Dispose(bool disposing)
		{
			// Only clean up once
			lock (lockObject)
			{
				if (disposed)
				{
					return;
				}
				disposed = true;
			}

			// Clean up managed resources
			if (disposing)
			{
				if (stream != null)
				{
					if (disposeStream)
					{
						stream.Dispose();
					}
					stream = null;
				}
			}

			tag = null;
			saveInformation = null;

			// Clean up unmanaged resources
			UnloadDib();
		}

		/// <summary>
		/// Retrieves an object that can iterate through the individual scanlines in this <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <returns>An <see cref="IEnumerator"/> for the <see cref="FreeImageBitmap"/>.</returns>
		/// <exception cref="ArgumentException">The bitmaps's type is not supported.</exception>
		IEnumerator IEnumerable.GetEnumerator()
		{
			return GetScanlines().GetEnumerator();
		}

		void ISerializable.GetObjectData(SerializationInfo info, StreamingContext context)
		{
			EnsureNotDisposed();
			using (MemoryStream memory = new MemoryStream(DataSize))
			{
				if (!FreeImage.SaveToStream(dib, memory, FREE_IMAGE_FORMAT.FIF_TIFF, FREE_IMAGE_SAVE_FLAGS.TIFF_LZW))
				{
					throw new SerializationException();
				}
				memory.Capacity = (int)memory.Length;
				info.AddValue("Bitmap Data", memory.GetBuffer());
			}
		}

		#endregion
	}
}