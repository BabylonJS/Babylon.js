using System;
using System.Diagnostics;
using System.Drawing;

namespace FreeImageAPI.Metadata
{
	/// <summary>
	/// Provides additional information specific for GIF files. This class cannot be inherited.
	/// </summary>
	public class GifInformation : MDM_ANIMATION
	{
		/// <summary>
		/// Initializes a new instance of the <see cref="GifInformation"/> class
		/// with the specified <see cref="FreeImageBitmap"/>.
		/// </summary>
		/// <param name="bitmap">A reference to a <see cref="FreeImageBitmap"/> instance.</param>
		public GifInformation(FreeImageBitmap bitmap)
			: base(bitmap.Dib)
		{
		}

		/// <summary>
		/// Gets or sets a value indicating whether this frame uses the
		/// GIF image's global palette. If set to <b>false</b>, this
		/// frame uses its local palette.
		/// </summary>
		/// <remarks>
		/// <b>Handling of null values</b><para/>
		/// A null value indicates, that the corresponding metadata tag is not
		/// present in the metadata model.
		/// Setting this property's value to a non-null reference creates the
		/// metadata tag if necessary.
		/// Setting this property's value to a null reference deletes the
		/// metadata tag from the metadata model.
		/// </remarks>
		public bool? UseGlobalPalette
		{
			get
			{
				byte? useGlobalPalette = GetTagValue<byte>("NoLocalPalette");
				return useGlobalPalette.HasValue ? (useGlobalPalette.Value != 0) : default(bool?);
			}
			set
			{
				byte? val = null;
				if (value.HasValue)
				{
					val = (byte)(value.Value ? 1 : 0);
				}
				SetTagValue("NoLocalPalette", val);
			}
		}

		/// <summary>
		/// Creates a global palette for the GIF image, intialized with all entries of the
		/// current local palette.
		/// The property <see cref="UseGlobalPalette"/> will be set to <b>true</b> when
		/// invoking this method. This effectively enables the newly created global palette.
		/// </summary>
		/// <exception cref="InvalidOperationException">
		/// The image does not have a palette.
		/// </exception>
		public void CreateGlobalPalette()
		{
			CreateGlobalPalette(new Palette(dib));
		}

		/// <summary>
		/// Creates a global palette for the GIF image with the specified size, intialized
		/// with the first <paramref name="size"/> entries of the current local palette.
		/// The property <see cref="UseGlobalPalette"/> will be set to <b>true</b> when
		/// invoking this method. This effectively enables the newly created global palette.
		/// </summary>
		/// <param name="size">The size of the newly created global palette.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="palette"/> is a null reference.</exception>
		public void CreateGlobalPalette(int size)
		{
			CreateGlobalPalette(new Palette(dib), size);
		}

		/// <summary>
		/// Creates a global palette for the GIF image, intialized with the entries
		/// of the specified palette.
		/// The property <see cref="UseGlobalPalette"/> will be set to <b>true</b> when
		/// invoking this method. This effectively enables the newly created global palette.
		/// </summary>
		/// <param name="palette">The palette that contains the initial values for
		/// the newly created global palette.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="palette"/> is a null reference.</exception>
		public void CreateGlobalPalette(Palette palette)
		{
			if (palette == null)
			{
				throw new ArgumentNullException("palette");
			}

			GlobalPalette = palette;
			UseGlobalPalette = true;
		}

		/// <summary>
		/// Creates a global palette for the GIF image with the specified size, intialized
		/// with the first <paramref name="size"/> entries of the specified palette.
		/// The property <see cref="UseGlobalPalette"/> will be set to <b>true</b> when
		/// invoking this method. This effectively enables the newly created global palette.
		/// </summary>
		/// <param name="palette">The palette that contains the initial values for
		/// the newly created global palette.</param>
		/// <param name="size">The size of the newly created global palette.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="palette"/> is a null reference.</exception>
		public void CreateGlobalPalette(Palette palette, int size)
		{
			if (palette == null)
			{
				throw new ArgumentNullException("palette");
			}
			if (size <= 0)
			{
				throw new ArgumentOutOfRangeException("size");
			}

			Palette pal = new Palette(size);
			pal.CopyFrom(palette);
			GlobalPalette = palette;
			UseGlobalPalette = true;
		}
	}
}