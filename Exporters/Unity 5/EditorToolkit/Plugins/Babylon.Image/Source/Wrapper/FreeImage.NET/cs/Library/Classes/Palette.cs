using System;
using System.Collections.Generic;
using System.Text;
using System.Drawing;
using System.IO;
using FreeImageAPI.Metadata;
using System.Runtime.InteropServices;
using System.Diagnostics;

namespace FreeImageAPI
{
	/// <summary>
	/// Provides methods for working with the standard bitmap palette.
	/// </summary>
	public sealed class Palette : MemoryArray<RGBQUAD>
	{
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private GCHandle paletteHandle;

		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private RGBQUAD[] array;

		/// <summary>
		/// Initializes a new instance for the given FreeImage bitmap.
		/// </summary>
		/// <param name="dib">Handle to a FreeImage bitmap.</param>
		/// <exception cref="ArgumentNullException"><paramref name="dib"/> is null.</exception>
		/// <exception cref="ArgumentException"><paramref name="dib"/> is not
		/// <see cref="FREE_IMAGE_TYPE.FIT_BITMAP"/><para/>-or-<para/>
		/// <paramref name="dib"/> has more than 8bpp.</exception>
		public Palette(FIBITMAP dib)
			: base(FreeImage.GetPalette(dib), (int)FreeImage.GetColorsUsed(dib))
		{
			if (dib.IsNull)
			{
				throw new ArgumentNullException("dib");
			}
			if (FreeImage.GetImageType(dib) != FREE_IMAGE_TYPE.FIT_BITMAP)
			{
				throw new ArgumentException("dib");
			}
			if (FreeImage.GetBPP(dib) > 8u)
			{
				throw new ArgumentException("dib");
			}
		}

		/// <summary>
		/// Initializes a new instance for the given FITAG that contains
		/// a palette.
		/// </summary>
		/// <param name="tag">The tag containing the palette.</param>
		/// <exception cref="ArgumentNullException"><paramref name="tag"/> is null.</exception>
		/// <exception cref="ArgumentException"><paramref name="tag"/> is not
		/// <see cref="FREE_IMAGE_MDTYPE.FIDT_PALETTE"/>.</exception>
		public Palette(FITAG tag)
			: base(FreeImage.GetTagValue(tag), (int)FreeImage.GetTagCount(tag))
		{
			if (FreeImage.GetTagType(tag) != FREE_IMAGE_MDTYPE.FIDT_PALETTE)
			{
				throw new ArgumentException("tag");
			}
		}

		/// <summary>
		/// Initializes a new instance for the given MetadataTag that contains
		/// a palette.
		/// </summary>
		/// <param name="tag">The tag containing the palette.</param>
		/// <exception cref="ArgumentNullException"><paramref name="dib"/> is null.</exception>
		/// <exception cref="ArgumentException"><paramref name="tag"/> is not
		/// <see cref="FREE_IMAGE_MDTYPE.FIDT_PALETTE"/>.</exception>
		public Palette(MetadataTag tag)
			: base(FreeImage.GetTagValue(tag.tag), (int)tag.Count)
		{
			if (FreeImage.GetTagType(tag) != FREE_IMAGE_MDTYPE.FIDT_PALETTE)
			{
				throw new ArgumentException("tag");
			}
		}

		/// <summary>
		/// Initializes a new instance for the given array of <see cref="RGBQUAD"/> that contains
		/// a palette.
		/// </summary>
		/// <param name="palette">A RGBQUAD array containing the palette data to initialize this instance.</param>
		public Palette(RGBQUAD[] palette)
		{
			unsafe
			{
				this.array = (RGBQUAD[])palette.Clone();
				this.paletteHandle = GCHandle.Alloc(array, GCHandleType.Pinned);

				base.baseAddress = (byte*)this.paletteHandle.AddrOfPinnedObject();
				base.length = (int)this.array.Length;

				// Create an array containing a single element.
				// Due to the fact, that it's not possible to create pointers
				// of generic types, an array is used to obtain the memory
				// address of an element of T.
				base.buffer = new RGBQUAD[1];
				// The array is pinned immediately to prevent the GC from
				// moving it to a different position in memory.
				base.handle = GCHandle.Alloc(buffer, GCHandleType.Pinned);
				// The array and its content have beed pinned, so that its address
				// can be safely requested and stored for the whole lifetime
				// of the instace.
				base.ptr = (byte*)base.handle.AddrOfPinnedObject();
			}
		}

		/// <summary>
		/// Initializes a new instance for the given array of <see cref="Color"/> that contains
		/// a palette.
		/// </summary>
		/// <param name="palette">A Color array containing the palette data to initialize this instance.</param>
		public Palette(Color[] palette)
			: this(RGBQUAD.ToRGBQUAD(palette))
		{
		}

		/// <summary>
		/// Initializes a new instance with the specified size.
		/// </summary>
		/// <param name="size">The size of the palette.</param>
		public Palette(int size)
			: this(new RGBQUAD[size])
		{
		}

		/// <summary>
		/// Gets or sets the palette through an array of <see cref="RGBQUAD"/>.
		/// </summary>
		public RGBQUAD[] AsArray
		{
			get
			{
				return Data;
			}
			set
			{
				Data = value;
			}
		}

		/// <summary>
		/// Get an array of <see cref="System.Drawing.Color"/> that the block of memory represents.
		/// This property is used for internal palette operations.
		/// </summary>
		internal unsafe Color[] ColorData
		{
			get
			{
				EnsureNotDisposed();
				Color[] data = new Color[length];
				for (int i = 0; i < length; i++)
				{
					data[i] = Color.FromArgb((int)(((uint*)baseAddress)[i] | 0xFF000000));
				}
				return data;
			}
		}

		/// <summary>
		/// Returns the palette as an array of <see cref="RGBQUAD"/>.
		/// </summary>
		/// <returns>The palette as an array of <see cref="RGBQUAD"/>.</returns>
		public RGBQUAD[] ToArray()
		{
			return Data;
		}

		/// <summary>
		/// Creates a linear palette based on the provided <paramref name="color"/>.
		/// </summary>
		/// <param name="color">The <see cref="System.Drawing.Color"/> used to colorize the palette.</param>
		/// <remarks>
		/// Only call this method on linear palettes.
		/// </remarks>
		public void Colorize(Color color)
		{
			Colorize(color, 0.5d);
		}

		/// <summary>
		/// Creates a linear palette based on the provided <paramref name="color"/>.
		/// </summary>
		/// <param name="color">The <see cref="System.Drawing.Color"/> used to colorize the palette.</param>
		/// <param name="splitSize">The position of the color within the new palette.
		/// 0 &lt; <paramref name="splitSize"/> &lt; 1.</param>
		/// <remarks>
		/// Only call this method on linear palettes.
		/// </remarks>
		public void Colorize(Color color, double splitSize)
		{
			Colorize(color, (int)(length * splitSize));
		}

		/// <summary>
		/// Creates a linear palette based on the provided <paramref name="color"/>.
		/// </summary>
		/// <param name="color">The <see cref="System.Drawing.Color"/> used to colorize the palette.</param>
		/// <param name="splitSize">The position of the color within the new palette.
		/// 0 &lt; <paramref name="splitSize"/> &lt; <see cref="MemoryArray&lt;T&gt;.Length"/>.</param>
		/// <remarks>
		/// Only call this method on linear palettes.
		/// </remarks>
		public void Colorize(Color color, int splitSize)
		{
			EnsureNotDisposed();
			if (splitSize < 1 || splitSize >= length)
			{
				throw new ArgumentOutOfRangeException("splitSize");
			}

			RGBQUAD[] pal = new RGBQUAD[length];

			double red = color.R;
			double green = color.G;
			double blue = color.B;

			int i = 0;
			double r, g, b;

			r = red / splitSize;
			g = green / splitSize;
			b = blue / splitSize;

			for (; i <= splitSize; i++)
			{
				pal[i].rgbRed = (byte)(i * r);
				pal[i].rgbGreen = (byte)(i * g);
				pal[i].rgbBlue = (byte)(i * b);
			}

			r = (255 - red) / (length - splitSize);
			g = (255 - green) / (length - splitSize);
			b = (255 - blue) / (length - splitSize);

			for (; i < length; i++)
			{
				pal[i].rgbRed = (byte)(red + ((i - splitSize) * r));
				pal[i].rgbGreen = (byte)(green + ((i - splitSize) * g));
				pal[i].rgbBlue = (byte)(blue + ((i - splitSize) * b));
			}

			Data = pal;
		}

		/// <summary>
		/// Creates a linear grayscale palette.
		/// </summary>
		public void CreateGrayscalePalette()
		{
			Colorize(Color.White, length - 1);
		}

		/// <summary>
		/// Creates a linear grayscale palette.
		/// </summary>
		/// <param name="inverse"><b>true</b> to create an inverse grayscale palette.</param>
		public void CreateGrayscalePalette(bool inverse)
		{
			Colorize(Color.White, inverse ? 0 : length - 1);
		}

		/// <summary>
		/// Creates a linear palette with the specified <see cref="Color"/>.
		/// </summary>
		/// <remarks>
		/// A linear grayscale palette contains all shades of colors from
		/// black to white. This method creates a similar palette with the white
		/// color being replaced by the specified color.
		/// </remarks>
		/// <param name="color">The <see cref="Color"/> used to create the palette.</param>
		/// <param name="inverse"><b>true</b> to create an inverse palette.</param>
		public void CreateGrayscalePalette(Color color, bool inverse)
		{
			Colorize(color, inverse ? 0 : length - 1);
		}

		/// <summary>
		/// Reverses the palette.
		/// </summary>
		public void Reverse()
		{
			EnsureNotDisposed();
			if (array != null)
			{
				Array.Reverse(array);
			}
			else
			{
				RGBQUAD[] localArray = Data;
				Array.Reverse(localArray);
				Data = localArray;
			}
		}

		/// <summary>
		/// Copies the values from the specified <see cref="Palette"/> to this instance.
		/// </summary>
		/// <param name="palette">The palette to copy from.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="palette"/> is a null reference.</exception>
		public void CopyFrom(Palette palette)
		{
			EnsureNotDisposed();
			if (palette == null)
			{
				throw new ArgumentNullException("palette");
			}
			CopyFrom(palette.Data, 0, 0, Math.Min(palette.Length, this.Length));
		}

		/// <summary>
		/// Copies the values from the specified <see cref="Palette"/> to this instance,
		/// starting at the specified <paramref name="offset"/>.
		/// </summary>
		/// <param name="palette">The palette to copy from.</param>
		/// <param name="offset">The position in this instance where the values
		/// will be copied to.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="palette"/> is a null reference.</exception>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="offset"/> is outside the range of valid indexes.</exception>
		public void CopyFrom(Palette palette, int offset)
		{
			EnsureNotDisposed();
			CopyFrom(palette.Data, 0, offset, Math.Min(palette.Length, this.Length - offset));
		}

		/// <summary>
		/// Saves this <see cref="Palette"/> to the specified file.
		/// </summary>
		/// <param name="filename">
		/// A string that contains the name of the file to which to save this <see cref="Palette"/>.
		/// </param>
		public void Save(string filename)
		{
			using (Stream stream = new FileStream(filename, FileMode.Create, FileAccess.Write))
			{
				Save(stream);
			}
		}

		/// <summary>
		/// Saves this <see cref="Palette"/> to the specified stream.
		/// </summary>
		/// <param name="stream">
		/// The <see cref="Stream"/> where the image will be saved.
		/// </param>
		public void Save(Stream stream)
		{
			Save(new BinaryWriter(stream));
		}

		/// <summary>
		/// Saves this <see cref="Palette"/> using the specified writer.
		/// </summary>
		/// <param name="writer">
		/// The <see cref="BinaryWriter"/> used to save the image.
		/// </param>
		public void Save(BinaryWriter writer)
		{
			EnsureNotDisposed();
			writer.Write(ToByteArray());
		}

		/// <summary>
		/// Loads a palette from the specified file.
		/// </summary>
		/// <param name="filename">The name of the palette file.</param>
		public void Load(string filename)
		{
			using (Stream stream = new FileStream(filename, FileMode.Open, FileAccess.Read))
			{
				Load(stream);
			}
		}

		/// <summary>
		/// Loads a palette from the specified stream.
		/// </summary>
		/// <param name="stream">The stream to load the palette from.</param>
		public void Load(Stream stream)
		{
			Load(new BinaryReader(stream));
		}

		/// <summary>
		/// Loads a palette from the reader.
		/// </summary>
		/// <param name="reader">The reader to load the palette from.</param>
		public void Load(BinaryReader reader)
		{
			EnsureNotDisposed();
			unsafe
			{
				int size = length * sizeof(RGBQUAD);
				byte[] data = reader.ReadBytes(size);
				fixed (byte* src = data)
				{
					CopyMemory(baseAddress, src, data.Length);
				}
			}
		}

		/// <summary>
		/// Releases allocated handles associated with this instance.
		/// </summary>
		/// <param name="disposing"><b>true</b> to release managed resources.</param>
		protected override void Dispose(bool disposing)
		{
			if (paletteHandle.IsAllocated)
				paletteHandle.Free();
			array = null;

			base.Dispose(disposing);
		}
	}
}