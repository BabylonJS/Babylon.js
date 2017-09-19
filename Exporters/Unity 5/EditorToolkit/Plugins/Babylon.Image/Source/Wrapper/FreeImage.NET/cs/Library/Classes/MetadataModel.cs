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
// $Revision: 1.8 $
// $Date: 2009/02/27 16:34:31 $
// $Id: MetadataModel.cs,v 1.8 2009/02/27 16:34:31 cklein05 Exp $
// ==========================================================

using System;
using System.Collections;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Diagnostics;

namespace FreeImageAPI.Metadata
{
	/// <summary>
	/// Base class that represents a collection of all tags contained in a metadata model.
	/// </summary>
	/// <remarks>
	/// The <b>MetedataModel</b> class is an abstract base class, which is inherited by
	/// several derived classes, one for each existing metadata model.
	/// </remarks> 
	public abstract class MetadataModel : IEnumerable
	{
		/// <summary>
		/// Handle to the encapsulated FreeImage-bitmap.
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		protected readonly FIBITMAP dib;

		/// <summary>
		/// Initializes a new instance of this class.
		/// </summary>
		/// <param name="dib">Handle to a FreeImage bitmap.</param>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="dib"/> is null.</exception>
		protected MetadataModel(FIBITMAP dib)
		{
			if (dib.IsNull)
			{
				throw new ArgumentNullException("dib");
			}
			this.dib = dib;
		}

		/// <summary>
		/// Retrieves the datamodel that this instance represents.
		/// </summary>
		public abstract FREE_IMAGE_MDMODEL Model
		{
			get;
		}

		/// <summary>
		/// Adds new tag to the bitmap or updates its value in case it already exists.
		/// <see cref="FreeImageAPI.Metadata.MetadataTag.Key"/> will be used as key.
		/// </summary>
		/// <param name="tag">The tag to add or update.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="tag"/> is null.</exception>
		/// <exception cref="ArgumentException">
		/// The tags model differs from this instances model.</exception>
		public bool AddTag(MetadataTag tag)
		{
			if (tag == null)
			{
				throw new ArgumentNullException("tag");
			}
			if (tag.Model != Model)
			{
				throw new ArgumentException("tag.Model");
			}
			return tag.AddToImage(dib);
		}

		/// <summary>
		/// Adds a list of tags to the bitmap or updates their values in case they already exist.
		/// <see cref="FreeImageAPI.Metadata.MetadataTag.Key"/> will be used as key.
		/// </summary>
		/// <param name="list">A list of tags to add or update.</param>
		/// <returns>Returns the number of successfully added tags.</returns>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="list"/> is null.</exception>
		public int AddTag(IEnumerable<MetadataTag> list)
		{
			if (list == null)
			{
				throw new ArgumentNullException("list");
			}
			int count = 0;
			foreach (MetadataTag tag in list)
			{
				if (tag.Model == Model && tag.AddToImage(dib))
				{
					count++;
				}
			}
			return count;
		}

		/// <summary>
		/// Removes the specified tag from the bitmap.
		/// </summary>
		/// <param name="key">The key of the tag.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="key"/> is null.</exception>
		public bool RemoveTag(string key)
		{
			if (key == null)
			{
				throw new ArgumentNullException("key");
			}
			return FreeImage.SetMetadata(Model, dib, key, FITAG.Zero);
		}

		/// <summary>
		/// Destroys the metadata model
		/// which will remove all tags of this model from the bitmap.
		/// </summary>
		/// <returns>Returns true on success, false on failure.</returns>
		public bool DestoryModel()
		{
			return FreeImage.SetMetadata(Model, dib, null, FITAG.Zero);
		}

		/// <summary>
		/// Returns the specified metadata tag.
		/// </summary>
		/// <param name="key">The key of the tag.</param>
		/// <returns>The metadata tag.</returns>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="key"/> is null.</exception>
		public MetadataTag GetTag(string key)
		{
			if (key == null)
			{
				throw new ArgumentNullException("key");
			}
			MetadataTag tag;
			return FreeImage.GetMetadata(Model, dib, key, out tag) ? tag : null;
		}

		/// <summary>
		/// Returns whether the specified tag exists.
		/// </summary>
		/// <param name="key">The key of the tag.</param>
		/// <returns>True in case the tag exists, else false.</returns>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="key"/> is null.</exception>
		public bool TagExists(string key)
		{
			if (key == null)
			{
				throw new ArgumentNullException("key");
			}
			MetadataTag tag;
			return FreeImage.GetMetadata(Model, dib, key, out tag);
		}

		/// <summary>
		/// Returns a list of all metadata tags this instance represents.
		/// </summary>
		public List<MetadataTag> List
		{
			get
			{
				List<MetadataTag> list = new List<MetadataTag>((int)FreeImage.GetMetadataCount(Model, dib));
				MetadataTag tag;
				FIMETADATA mdHandle = FreeImage.FindFirstMetadata(Model, dib, out tag);
				if (!mdHandle.IsNull)
				{
					do
					{
						list.Add(tag);
					}
					while (FreeImage.FindNextMetadata(mdHandle, out tag));
					FreeImage.FindCloseMetadata(mdHandle);
				}
				return list;
			}
		}

		/// <summary>
		/// Returns the tag at the given index.
		/// </summary>
		/// <param name="index">Index of the tag to return.</param>
		/// <returns>The tag at the given index.</returns>
		protected MetadataTag GetTagFromIndex(int index)
		{
			if (index >= Count || index < 0)
			{
				throw new ArgumentOutOfRangeException("index");
			}
			MetadataTag tag;
			int count = 0;
			FIMETADATA mdHandle = FreeImage.FindFirstMetadata(Model, dib, out tag);
			if (!mdHandle.IsNull)
			{
				try
				{
					do
					{
						if (count++ == index)
						{
							break;
						}
					}
					while (FreeImage.FindNextMetadata(mdHandle, out tag));
				}
				finally
				{
					FreeImage.FindCloseMetadata(mdHandle);
				}
			}
			return tag;
		}

		/// <summary>
		/// Returns the metadata tag at the given index. This operation is slow when accessing all tags.
		/// </summary>
		/// <param name="index">Index of the tag.</param>
		/// <returns>The metadata tag.</returns>
		/// <exception cref="ArgumentOutOfRangeException">
		/// <paramref name="index"/> is greater or equal <b>Count</b>
		/// or index is less than zero.</exception>
		public MetadataTag this[int index]
		{
			get
			{
				return GetTagFromIndex(index);
			}
		}

		/// <summary>
		/// Retrieves an object that can iterate through the individual MetadataTags in this MetadataModel.
		/// </summary>
		/// <returns>An <see cref="IEnumerator"/> for the
		/// <see cref="FreeImageAPI.Metadata.MetadataModel"/>.</returns>
		public IEnumerator GetEnumerator()
		{
			return List.GetEnumerator();
		}

		/// <summary>
		/// Returns the number of metadata tags this instance represents.
		/// </summary>
		public int Count
		{
			get { return (int)FreeImage.GetMetadataCount(Model, dib); }
		}

		/// <summary>
		/// Returns whether this model exists in the bitmaps metadata structure.
		/// </summary>
		public bool Exists
		{
			get
			{
				return Count > 0;
			}
		}

		/// <summary>
		/// Searches for a pattern in each metadata tag and returns the result as a list.
		/// </summary>
		/// <param name="searchPattern">The regular expression to use for the search.</param>
		/// <param name="flags">A bitfield that controls which fields should be searched in.</param>
		/// <returns>A list containing all found metadata tags.</returns>
		/// <exception cref="ArgumentNullException">
		/// <typeparamref name="searchPattern"/> is null.</exception>
		/// <exception cref="ArgumentException">
		/// <typeparamref name="searchPattern"/> is empty.</exception>
		public List<MetadataTag> RegexSearch(string searchPattern, MD_SEARCH_FLAGS flags)
		{
			if (searchPattern == null)
			{
				throw new ArgumentNullException("searchString");
			}
			if (searchPattern.Length == 0)
			{
				throw new ArgumentException("searchString is empty");
			}
			List<MetadataTag> result = new List<MetadataTag>(Count);
			Regex regex = new Regex(searchPattern);
			List<MetadataTag> list = List;
			foreach (MetadataTag tag in list)
			{
				if (((flags & MD_SEARCH_FLAGS.KEY) > 0) && regex.Match(tag.Key).Success)
				{
					result.Add(tag);
					continue;
				}
				if (((flags & MD_SEARCH_FLAGS.DESCRIPTION) > 0) && regex.Match(tag.Description).Success)
				{
					result.Add(tag);
					continue;
				}
				if (((flags & MD_SEARCH_FLAGS.TOSTRING) > 0) && regex.Match(tag.ToString()).Success)
				{
					result.Add(tag);
					continue;
				}
			}
			result.Capacity = result.Count;
			return result;
		}

		/// <summary>
		/// Returns the value of the specified tag.
		/// </summary>
		/// <typeparam name="T">Type of the tag's data.</typeparam>
		/// <param name="key">The key of the tag.</param>
		/// <returns>The value of the specified tag.</returns>
		protected T? GetTagValue<T>(string key) where T : struct
		{
			if (string.IsNullOrEmpty(key))
			{
				throw new ArgumentNullException("key");
			}
			MetadataTag tag = GetTag(key);
			if (tag != null)
			{
				T[] value = tag.Value as T[];
				if ((value != null) && (value.Length != 0))
				{
					return value[0];
				}
			}
			return null;
		}

		/// <summary>
		/// Returns an array containing the data of the specified tag.
		/// </summary>
		/// <typeparam name="T">The type of the tag's data.</typeparam>
		/// <param name="key">The key of the tag.</param>
		/// <returns>An array containing the data of the specified tag.</returns>
		protected T[] GetTagArray<T>(string key) where T : struct
		{
			if (string.IsNullOrEmpty(key))
			{
				throw new ArgumentNullException("key");
			}
			MetadataTag tag = GetTag(key);
			return (tag == null) ? null : tag.Value as T[];
		}

		/// <summary>
		/// Returns the string contained by the specified tag.
		/// </summary>
		/// <param name="key">The key of the tag.</param>
		/// <returns>The string contained by the specified tag.</returns>
		protected string GetTagText(string key)
		{
			if (string.IsNullOrEmpty(key))
			{
				throw new ArgumentNullException("key");
			}
			MetadataTag tag = GetTag(key);
			return (tag == null) ? null : tag.Value as string;
		}

		/// <summary>
		/// Returns an array containg the data of the specified tag
		/// as unsigned 32bit integer.
		/// </summary>
		/// <param name="key">The key of the tag.</param>
		/// <returns>An array containg the data of the specified tag
		/// as unsigned 32bit integer.</returns>
		protected uint[] GetUInt32Array(string key)
		{
			if (string.IsNullOrEmpty(key))
			{
				throw new ArgumentNullException("key");
			}
			uint[] result = null;
			MetadataTag tag = GetTag(key);
			if (tag != null)
			{
				object value = tag.Value;
				if (value != null)
				{
					if (value is ushort[])
					{
						ushort[] array = (ushort[])value;
						result = new uint[array.Length];
						for (int i = 0, j = array.Length; i < j; i++)
						{
							result[i] = (uint)array[i];
						}
					}
					else if (value is uint[])
					{
						result = (uint[])value;
					}
				}
			}
			return result;
		}

		/// <summary>
		/// Returns the value of the tag as unsigned 32bit integer.
		/// </summary>
		/// <param name="key">The key of the tag.</param>
		/// <returns>The value of the tag as unsigned 32bit integer.</returns>
		protected uint? GetUInt32Value(string key)
		{
			uint[] value = GetUInt32Array(key);
			return value == null ? default(uint?) : value[0];
		}	

		/// <summary>
		/// Sets the value of the specified tag.
		/// </summary>
		/// <typeparam name="T">The type of the tag's data.</typeparam>
		/// <param name="key">The key of the tag.</param>
		/// <param name="value">The new value of the specified tag or null.</param>
		protected void SetTagValue<T>(string key, T? value) where T : struct
		{
			SetTagValue(key, value.HasValue ? new T[] { value.Value } : null);
		}

		/// <summary>
		/// Sets the value of the specified tag.
		/// </summary>
		/// <param name="key">The key of the tag.</param>
		/// <param name="value">The new value of the specified tag or null.</param>
		protected void SetTagValue(string key, object value)
		{
			if (string.IsNullOrEmpty(key))
			{
				throw new ArgumentNullException("key");
			}
			if (value == null)
			{
				RemoveTag(key);
			}
			else
			{
				MetadataTag tag = GetTag(key);
				if (tag == null)
				{
					tag = new MetadataTag(Model);
					tag.Key = key;
					tag.Value = value;
					AddTag(tag);
				}
				else
				{
					tag.Value = value;
				}
			}
		}

		/// <summary>
		/// Sets the value of the specified tag as undefined.
		/// </summary>
		/// <param name="key">The key of the tag.</param>
		/// <param name="value">The new value of the specified tag or null.</param>
		protected void SetTagValueUndefined(string key, byte[] value)
		{
			if (string.IsNullOrEmpty(key))
			{
				throw new ArgumentNullException("key");
			}
			if (value == null)
			{
				RemoveTag(key);
			}
			else
			{
				MetadataTag tag = GetTag(key);
				if (tag == null)
				{
					tag = new MetadataTag(Model);
					tag.Key = key;
					tag.SetValue(value, FREE_IMAGE_MDTYPE.FIDT_UNDEFINED);
					AddTag(tag);
				}
				else
				{
					tag.Value = value;
				}
			}
		}

		/// <summary>
		/// Returns the equivalent <see cref="DirectionReference"/> for the
		/// specified <see cref="String"/>.
		/// </summary>
		/// <param name="s">The string containing the <see cref="DirectionReference"/>.</param>
		/// <returns>The equivalent <see cref="DirectionReference"/> for the
		/// specified <see cref="String"/>.</returns>
		protected static DirectionReference? ToDirectionType(string s)
		{
			if (string.IsNullOrEmpty(s))
				return null;
			switch (s[0])
			{
				case 'T':
					return DirectionReference.TrueDirection;
				case 'M':
					return DirectionReference.MagneticDirection;
				default:
					return DirectionReference.Undefined;
			}
		}

		/// <summary>
		/// Returns the equivalent <see cref="String"/> for the
		/// specified <see cref="DirectionReference"/>.
		/// </summary>
		/// <param name="type">The <see cref="DirectionReference"/> to convert.</param>
		/// <returns>The equivalent <see cref="String"/> for the
		/// specified <see cref="DirectionReference"/>.</returns>
		protected static string ToString(DirectionReference? type)
		{
			if (type.HasValue)
			{
				switch (type.Value)
				{
					case DirectionReference.TrueDirection:
						return "T";
					case DirectionReference.MagneticDirection:
						return "M";
					default:
						return "\0";
				}
			}
			return null;
		}

		/// <summary>
		/// Returns the equivalent <see cref="VelocityUnit"/> for the
		/// specified <see cref="String"/>.
		/// </summary>
		/// <param name="s">The string containing the <see cref="VelocityUnit"/>.</param>
		/// <returns>The equivalent <see cref="VelocityUnit"/> for the
		/// specified <see cref="String"/>.</returns>
		protected static VelocityUnit? ToUnitType(string s)
		{
			if (string.IsNullOrEmpty(s))
				return null;
			switch (s[0])
			{
				case 'K':
					return VelocityUnit.Kilometers;
				case 'M':
					return VelocityUnit.Miles;
				case 'N':
					return VelocityUnit.Knots;
				default:
					return VelocityUnit.Undefinied;
			}
		}

		/// <summary>
		/// Returns the equivalent <see cref="String"/> for the
		/// specified <see cref="VelocityUnit"/>.
		/// </summary>
		/// <param name="type">The <see cref="VelocityUnit"/> to convert.</param>
		/// <returns>The equivalent <see cref="String"/> for the
		/// specified <see cref="VelocityUnit"/>.</returns>
		protected static string ToString(VelocityUnit? type)
		{
			if (type.HasValue)
			{
				switch (type.Value)
				{
					case VelocityUnit.Kilometers:
						return "K";
					case VelocityUnit.Miles:
						return "M";
					case VelocityUnit.Knots:
						return "N";
					default:
						return "\0";
				}
			}
			return null;
		}

		/// <summary>
		/// Returns the equivalent <see cref="LongitudeType"/> for the
		/// specified <see cref="String"/>.
		/// </summary>
		/// <param name="s">The string containing the <see cref="LongitudeType"/>.</param>
		/// <returns>The equivalent <see cref="LongitudeType"/> for the
		/// specified <see cref="String"/>.</returns>
		protected static LongitudeType? ToLongitudeType(string s)
		{
			if (string.IsNullOrEmpty(s))
				return null;
			switch (s[0])
			{
				case 'E':
					return LongitudeType.East;
				case 'W':
					return LongitudeType.West;
				default:
					return LongitudeType.Undefined;
			}
		}

		/// <summary>
		/// Returns the equivalent <see cref="String"/> for the
		/// specified <see cref="LongitudeType"/>.
		/// </summary>
		/// <param name="type">The <see cref="LongitudeType"/> to convert.</param>
		/// <returns>The equivalent <see cref="String"/> for the
		/// specified <see cref="LongitudeType"/>.</returns>
		protected static string ToString(LongitudeType? type)
		{
			if (type.HasValue)
			{
				switch (type.Value)
				{
					case LongitudeType.East:
						return "E";
					case LongitudeType.West:
						return "W";
					default:
						return "\0";
				}
			}
			return null;
		}

		/// <summary>
		/// Returns the equivalent <see cref="LatitudeType"/> for the
		/// specified <see cref="String"/>.
		/// </summary>
		/// <param name="s">The string containing the <see cref="LatitudeType"/>.</param>
		/// <returns>The equivalent <see cref="LatitudeType"/> for the
		/// specified <see cref="String"/>.</returns>
		protected static LatitudeType? ToLatitudeType(string s)
		{
			if (string.IsNullOrEmpty(s))
				return null;
			switch (s[0])
			{
				case 'N':
					return LatitudeType.North;
				case 'S':
					return LatitudeType.South;
				default:
					return LatitudeType.Undefined;
			}
		}

		/// <summary>
		/// Returns the equivalent <see cref="String"/> for the
		/// specified <see cref="LatitudeType"/>.
		/// </summary>
		/// <param name="type">The <see cref="LatitudeType"/> to convert.</param>
		/// <returns>The equivalent <see cref="String"/> for the
		/// specified <see cref="LatitudeType"/>.</returns>
		protected static string ToString(LatitudeType? type)
		{
			if (type.HasValue)
			{
				switch (type.Value)
				{
					case LatitudeType.North:
						return "N";
					case LatitudeType.South:
						return "S";
					default:
						return "\0";
				}
			}
			return null;
		}

		/// <summary>
		/// Returns the equivalent <see cref="InteroperabilityMode"/> for the
		/// specified <see cref="String"/>.
		/// </summary>
		/// <param name="s">The string containing the <see cref="InteroperabilityMode"/>.</param>
		/// <returns>The equivalent <see cref="InteroperabilityMode"/> for the
		/// specified <see cref="String"/>.</returns>
		protected static InteroperabilityMode? ToInteroperabilityType(string s)
		{
			if (string.IsNullOrEmpty(s))
				return null;
			if (s.StartsWith("R98"))
				return InteroperabilityMode.R98;
			if (s.StartsWith("THM"))
				return InteroperabilityMode.THM;
			return InteroperabilityMode.Undefined;
		}

		/// <summary>
		/// Returns the equivalent <see cref="String"/> for the
		/// specified <see cref="InteroperabilityMode"/>.
		/// </summary>
		/// <param name="type">The <see cref="InteroperabilityMode"/> to convert.</param>
		/// <returns>The equivalent <see cref="String"/> for the
		/// specified <see cref="InteroperabilityMode"/>.</returns>
		protected static string ToString(InteroperabilityMode? type)
		{
			if (type.HasValue)
			{
				switch (type.Value)
				{
					case InteroperabilityMode.R98:
						return "R98";
					case InteroperabilityMode.THM:
						return "THM";
					default:
						return "\0\0\0";
				}
			}
			return null;
		}

		/// <summary>
		/// Specified different unit types.
		/// </summary>
		public enum VelocityUnit
		{
			/// <summary>
			/// No or unknown type.
			/// </summary>
			Undefinied,

			/// <summary>
			/// Kilometers per hour.
			/// </summary>
			Kilometers,

			/// <summary>
			/// Miles per hour.
			/// </summary>
			Miles,

			/// <summary>
			/// Knots.
			/// </summary>
			Knots,
		}

		/// <summary>
		/// Specifies different direction types.
		/// </summary>
		public enum DirectionReference
		{
			/// <summary>
			/// No or unknown direction type.
			/// </summary>
			Undefined,

			/// <summary>
			/// True direction.
			/// </summary>
			TrueDirection,

			/// <summary>
			/// Magnatic direction.
			/// </summary>
			MagneticDirection,
		}

		/// <summary>
		/// Specifies the type of a latitude value.
		/// </summary>
		public enum LatitudeType
		{
			/// <summary>
			/// No or unknown type.
			/// </summary>
			Undefined,

			/// <summary>
			/// North.
			/// </summary>
			North,

			/// <summary>
			/// South.
			/// </summary>
			South,
		}

		/// <summary>
		/// Specifies the type of a longitude value.
		/// </summary>
		public enum LongitudeType
		{
			/// <summary>
			/// No or unknown type.
			/// </summary>
			Undefined,

			/// <summary>
			/// East.
			/// </summary>
			East,

			/// <summary>
			/// West.
			/// </summary>
			West,
		}

		/// <summary>
		/// Specifies different altitude types.
		/// </summary>
		public enum AltitudeType
		{
			/// <summary>
			/// No or unknown type.
			/// </summary>
			Undefined,

			/// <summary>
			/// East.
			/// </summary>
			AboveSeaLevel,

			/// <summary>
			/// West.
			/// </summary>
			BelowSeaLevel,
		}

		/// <summary>
		/// Specifies interoperability types.
		/// </summary>
		public enum InteroperabilityMode
		{
			/// <summary>
			/// No or unknown type.
			/// </summary>
			Undefined,

			/// <summary>
			/// Indicates a file conforming to R98 file specification of Recommended
			/// Exif Interoperability Rules (ExifR98) or to DCF basic file stipulated
			/// by Design Rule for Camera File System.
			/// </summary>
			R98,

			/// <summary>
			/// Indicates a file conforming to DCF thumbnail file stipulated by Design
			/// rule for Camera File System. 
			/// </summary>
			THM,
		}

		/// <summary>
		/// Specifies orientation of images.
		/// </summary>
		public enum ExifImageOrientation : ushort
		{
			/// <summary>
			/// Undefinied orientation.
			/// </summary>
			Undefined,

			/// <summary>
			/// TopLeft.
			/// </summary>
			TopLeft = 1,

			/// <summary>
			/// TopRight.
			/// </summary>
			TopRight,

			/// <summary>
			/// BottomRight.
			/// </summary>
			BottomRight,

			/// <summary>
			/// BottomLeft.
			/// </summary>
			BottomLeft,

			/// <summary>
			/// LeftTop.
			/// </summary>
			LeftTop,

			/// <summary>
			/// RightTop.
			/// </summary>
			RightTop,

			/// <summary>
			/// RightBottom.
			/// </summary>
			RightBottom,

			/// <summary>
			/// LeftBottom.
			/// </summary>
			LeftBottom,
		}

		/// <summary>
		/// Converts the model of the MetadataModel object to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return Model.ToString();
		}
	}
}