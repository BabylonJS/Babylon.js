using System;
using System.Collections.Generic;
using System.Text;

namespace FreeImageAPI.Metadata
{
	/// <summary>
	/// Specifies how a single frame will be handled after being displayed.
	/// </summary>
	public enum DisposalMethodType : byte
	{
		/// <summary>
		/// Same behavior as <see cref="DisposalMethodType.Leave"/> but should not be used.
		/// </summary>
		Unspecified,

		/// <summary>
		/// The image is left in place and will be overdrawn by the next image.
		/// </summary>
		Leave,

		/// <summary>
		/// The area of the image will be blanked out by its background.
		/// </summary>
		Background,

		/// <summary>
		/// Restores the the area of the image to the state it was before it
		/// has been dawn.
		/// </summary>
		Previous,
	}
}
