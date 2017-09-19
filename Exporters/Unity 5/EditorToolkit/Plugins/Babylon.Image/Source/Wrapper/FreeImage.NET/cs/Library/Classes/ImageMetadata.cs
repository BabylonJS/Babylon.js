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
// $Revision: 1.7 $
// $Date: 2009/02/27 16:34:59 $
// $Id: ImageMetadata.cs,v 1.7 2009/02/27 16:34:59 cklein05 Exp $
// ==========================================================

using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Diagnostics;

namespace FreeImageAPI.Metadata
{
	/// <summary>
	/// Class handling metadata of a FreeImage bitmap.
	/// </summary>
	public class ImageMetadata : IEnumerable, IComparable, IComparable<ImageMetadata>
	{
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private readonly List<MetadataModel> data;
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private readonly FIBITMAP dib;
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private bool hideEmptyModels;

		/// <summary>
		/// Initializes a new instance based on the specified <see cref="FIBITMAP"/>,
		/// showing all known models.
		/// </summary>
		/// <param name="dib">Handle to a FreeImage bitmap.</param>
		public ImageMetadata(FIBITMAP dib) : this(dib, false) { }

		/// <summary>
		/// Initializes a new instance based on the specified <see cref="FIBITMAP"/>,
		/// showing or hiding empry models.
		/// </summary>
		/// <param name="dib">Handle to a FreeImage bitmap.</param>
		/// <param name="hideEmptyModels">When <b>true</b>, empty metadata models
		/// will be hidden until a tag to this model is added.</param>
		public ImageMetadata(FIBITMAP dib, bool hideEmptyModels)
		{
			if (dib.IsNull) throw new ArgumentNullException("dib");
			data = new List<MetadataModel>(FreeImage.FREE_IMAGE_MDMODELS.Length);
			this.dib = dib;
			this.hideEmptyModels = hideEmptyModels;

			data.Add(new MDM_ANIMATION(dib));
			data.Add(new MDM_COMMENTS(dib));
			data.Add(new MDM_CUSTOM(dib));
			data.Add(new MDM_EXIF_EXIF(dib));
			data.Add(new MDM_EXIF_GPS(dib));
			data.Add(new MDM_INTEROP(dib));
			data.Add(new MDM_EXIF_MAIN(dib));
			data.Add(new MDM_MAKERNOTE(dib));
			data.Add(new MDM_GEOTIFF(dib));
			data.Add(new MDM_IPTC(dib));
			data.Add(new MDM_NODATA(dib));
			data.Add(new MDM_XMP(dib));
		}

		/// <summary>
		/// Gets or sets the <see cref="MetadataModel"/> of the specified type.
		/// <para>In case the getter returns <c>null</c> the model is not contained
		/// by the list.</para>
		/// <para><c>null</c> can be used calling the setter to destroy the model.</para>
		/// </summary>
		/// <param name="model">Type of the model.</param>
		/// <returns>The <see cref="FreeImageAPI.Metadata.MetadataModel"/> object of the specified type.</returns>
		public MetadataModel this[FREE_IMAGE_MDMODEL model]
		{
			get
			{
				for (int i = 0; i < data.Count; i++)
				{
					if (data[i].Model == model)
					{
						if (!data[i].Exists && hideEmptyModels)
						{
							return null;
						}
						return data[i];
					}
				}
				return null;
			}
		}

		/// <summary>
		/// Gets or sets the <see cref="FreeImageAPI.Metadata.MetadataModel"/> at the specified index.
		/// <para>In case the getter returns <c>null</c> the model is not contained
		/// by the list.</para>
		/// <para><c>null</c> can be used calling the setter to destroy the model.</para>
		/// </summary>
		/// <param name="index">Index of the <see cref="FreeImageAPI.Metadata.MetadataModel"/> within
		/// this instance.</param>
		/// <returns>The <see cref="FreeImageAPI.Metadata.MetadataModel"/>
		/// object at the specified index.</returns>
		public MetadataModel this[int index]
		{
			get
			{
				if (index < 0 || index >= data.Count)
				{
					throw new ArgumentOutOfRangeException("index");
				}
				return (hideEmptyModels && !data[index].Exists) ? null : data[index];
			}
		}

		/// <summary>
		/// Returns a list of all visible
		/// <see cref="FreeImageAPI.Metadata.MetadataModel">MetadataModels</see>.
		/// </summary>
		public List<MetadataModel> List
		{
			get
			{
				if (hideEmptyModels)
				{
					List<MetadataModel> result = new List<MetadataModel>();
					for (int i = 0; i < data.Count; i++)
					{
						if (data[i].Exists)
						{
							result.Add(data[i]);
						}
					}
					return result;
				}
				else
				{
					return data;
				}
			}
		}

		/// <summary>
		/// Adds new tag to the bitmap or updates its value in case it already exists.
		/// <see cref="FreeImageAPI.Metadata.MetadataTag.Key"/> will be used as key.
		/// </summary>
		/// <param name="tag">The tag to add or update.</param>
		/// <returns>Returns true on success, false on failure.</returns>
		/// <exception cref="ArgumentNullException">
		/// <paramref name="tag"/> is null.</exception>
		public bool AddTag(MetadataTag tag)
		{
			for (int i = 0; i < data.Count; i++)
			{
				if (tag.Model == data[i].Model)
				{
					return data[i].AddTag(tag);
				}
			}
			return false;
		}

		/// <summary>
		/// Returns the number of visible
		/// <see cref="FreeImageAPI.Metadata.MetadataModel">MetadataModels</see>.
		/// </summary>
		public int Count
		{
			get
			{
				if (hideEmptyModels)
				{
					int count = 0;
					for (int i = 0; i < data.Count; i++)
					{
						if (data[i].Exists)
						{
							count++;
						}
					}
					return count;
				}
				else
				{
					return data.Count;
				}
			}
		}

		/// <summary>
		/// Gets or sets whether empty
		/// <see cref="FreeImageAPI.Metadata.MetadataModel">MetadataModels</see> are hidden.
		/// </summary>
		public bool HideEmptyModels
		{
			get
			{
				return hideEmptyModels;
			}
			set
			{
				hideEmptyModels = value;
			}
		}

		/// <summary>
		/// Retrieves an object that can iterate through the individual
		/// <see cref="FreeImageAPI.Metadata.MetadataModel">MetadataModels</see>
		/// in this <see cref="ImageMetadata"/>.
		/// </summary>
		/// <returns>An <see cref="IEnumerator"/> for this <see cref="ImageMetadata"/>.</returns>
		public IEnumerator GetEnumerator()
		{
			if (hideEmptyModels)
			{
				List<MetadataModel> tempList = new List<MetadataModel>(data.Count);
				for (int i = 0; i < data.Count; i++)
				{
					if (data[i].Exists)
					{
						tempList.Add(data[i]);
					}
				}
				return tempList.GetEnumerator();
			}
			else
			{
				return data.GetEnumerator();
			}
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">An object to compare with this instance.</param>
		/// <returns>A 32-bit signed integer indicating the lexical relationship between the two comparands.</returns>
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="ImageMetadata"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is ImageMetadata))
			{
				throw new ArgumentException("obj");
			}
			return CompareTo((ImageMetadata)obj);
		}

		/// <summary>
		/// Compares this instance with a specified <see cref="ImageMetadata"/> object.
		/// </summary>
		/// <param name="other">A <see cref="ImageMetadata"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(ImageMetadata other)
		{
			return this.dib.CompareTo(other.dib);
		}
	}
}