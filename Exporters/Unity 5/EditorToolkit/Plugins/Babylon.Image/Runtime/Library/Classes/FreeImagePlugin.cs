using System;
using System.Diagnostics;

namespace FreeImageAPI.Plugins
{
	/// <summary>
	/// Class representing a FreeImage format.
	/// </summary>
	public sealed class FreeImagePlugin
	{
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private readonly FREE_IMAGE_FORMAT fif;

		/// <summary>
		/// Initializes a new instance of this class.
		/// </summary>
		/// <param name="fif">The FreeImage format to wrap.</param>
		internal FreeImagePlugin(FREE_IMAGE_FORMAT fif)
		{
			this.fif = fif;
		}

		/// <summary>
		/// Gets the format of this instance.
		/// </summary>
		public FREE_IMAGE_FORMAT FIFormat
		{
			get
			{
				return fif;
			}
		}

		/// <summary>
		/// Gets or sets whether this plugin is enabled.
		/// </summary>
		public bool Enabled
		{
			get
			{
				return (FreeImage.IsPluginEnabled(fif) == 1);
			}
			set
			{
				FreeImage.SetPluginEnabled(fif, value);
			}
		}

		/// <summary>
		/// Gets a string describing the format.
		/// </summary>
		public string Format
		{
			get
			{
				return FreeImage.GetFormatFromFIF(fif);
			}
		}

		/// <summary>
		/// Gets a comma-delimited file extension list describing the bitmap formats
		/// this plugin can read and/or write.
		/// </summary>
		public string ExtentsionList
		{
			get
			{
				return FreeImage.GetFIFExtensionList(fif);
			}
		}

		/// <summary>
		/// Gets a descriptive string that describes the bitmap formats
		/// this plugin can read and/or write.
		/// </summary>
		public string Description
		{
			get
			{
				return FreeImage.GetFIFDescription(fif);
			}
		}

		/// <summary>
		/// Returns a regular expression string that can be used by
		/// a regular expression engine to identify the bitmap.
		/// FreeImageQt makes use of this function.
		/// </summary>
		public string RegExpr
		{
			get
			{
				return FreeImage.GetFIFRegExpr(fif);
			}
		}

		/// <summary>
		/// Gets whether this plugin can load bitmaps.
		/// </summary>
		public bool SupportsReading
		{
			get
			{
				return FreeImage.FIFSupportsReading(fif);
			}
		}

		/// <summary>
		/// Gets whether this plugin can save bitmaps.
		/// </summary>
		public bool SupportsWriting
		{
			get
			{
				return FreeImage.FIFSupportsWriting(fif);
			}
		}

		/// <summary>
		/// Checks whether this plugin can save a bitmap in the desired data type.
		/// </summary>
		/// <param name="type">The desired image type.</param>
		/// <returns>True if this plugin can save bitmaps as the desired type, else false.</returns>
		public bool SupportsExportType(FREE_IMAGE_TYPE type)
		{
			return FreeImage.FIFSupportsExportType(fif, type);
		}

		/// <summary>
		/// Checks whether this plugin can save bitmaps in the desired bit depth.
		/// </summary>
		/// <param name="bpp">The desired bit depth.</param>
		/// <returns>True if this plugin can save bitmaps in the desired bit depth, else false.</returns>
		public bool SupportsExportBPP(int bpp)
		{
			return FreeImage.FIFSupportsExportBPP(fif, bpp);
		}

		/// <summary>
		/// Gets whether this plugin can load or save an ICC profile.
		/// </summary>
		public bool SupportsICCProfiles
		{
			get
			{
				return FreeImage.FIFSupportsICCProfiles(fif);
			}
		}

		/// <summary>
		/// Checks whether an extension is valid for this format.
		/// </summary>
		/// <param name="extension">The desired extension.</param>
		/// <returns>True if the extension is valid for this format, false otherwise.</returns>
		public bool ValidExtension(string extension)
		{
			return FreeImage.IsExtensionValidForFIF(fif, extension);
		}

		/// <summary>
		/// Checks whether an extension is valid for this format.
		/// </summary>
		/// <param name="extension">The desired extension.</param>
		/// <param name="comparisonType">The string comparison type.</param>
		/// <returns>True if the extension is valid for this format, false otherwise.</returns>
		public bool ValidExtension(string extension, StringComparison comparisonType)
		{
			return FreeImage.IsExtensionValidForFIF(fif, extension, comparisonType);
		}

		/// <summary>
		/// Checks whether a filename is valid for this format.
		/// </summary>
		/// <param name="filename">The desired filename.</param>
		/// <returns>True if the filename is valid for this format, false otherwise.</returns>
		public bool ValidFilename(string filename)
		{
			return FreeImage.IsFilenameValidForFIF(fif, filename);
		}

		/// <summary>
		/// Checks whether a filename is valid for this format.
		/// </summary>
		/// <param name="filename">The desired filename.</param>
		/// <param name="comparisonType">The string comparison type.</param>
		/// <returns>True if the filename is valid for this format, false otherwise.</returns>
		public bool ValidFilename(string filename, StringComparison comparisonType)
		{
			return FreeImage.IsFilenameValidForFIF(fif, filename, comparisonType);
		}

		/// <summary>
		/// Gets a descriptive string that describes the bitmap formats
		/// this plugin can read and/or write.
		/// </summary>
		/// <returns>A descriptive string that describes the bitmap formats.</returns>
		public override string ToString()
		{
			return Description;
		}
	}
}
