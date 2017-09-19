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
// $Revision: 1.6 $
// $Date: 2009/02/23 12:28:56 $
// $Id: StreamWrapper.cs,v 1.6 2009/02/23 12:28:56 cklein05 Exp $
// ==========================================================

using System;
using System.IO;
using System.Diagnostics;

namespace FreeImageAPI.IO
{
	/// <summary>
	/// Class wrapping streams, implementing a buffer for read data,
	/// so that seek operations can be made.
	/// </summary>
	/// <remarks>
	/// FreeImage can load bitmaps from arbitrary sources.
	/// .NET works with different streams like File- or NetConnection-strams.
	/// NetConnection streams, which are used to load files from web servers,
	/// for example cannot seek.
	/// But FreeImage frequently uses the seek operation when loading bitmaps.
	/// <b>StreamWrapper</b> wrapps a stream and makes it seekable by caching all read
	/// data into an internal MemoryStream to jump back- and forward.
	/// StreamWapper is for internal use and only for loading from streams.
	/// </remarks>
	internal class StreamWrapper : Stream
	{
		/// <summary>
		/// The stream to wrap
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private readonly Stream stream;

		/// <summary>
		/// The caching stream
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private MemoryStream memoryStream = new MemoryStream();

		/// <summary>
		/// Indicates if the wrapped stream reached its end
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private bool eos = false;

		/// <summary>
		/// Tells the wrapper to block readings or not
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private bool blocking = false;

		/// <summary>
		/// Indicates if the wrapped stream is disposed or not
		/// </summary>
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private bool disposed = false;

		/// <summary>
		/// Initializes a new instance based on the specified <see cref="Stream"/>.
		/// </summary>
		/// <param name="stream">The stream to wrap.</param>
		/// <param name="blocking">When true the wrapper always tries to read the requested
		/// amount of data from the wrapped stream.</param>
		public StreamWrapper(Stream stream, bool blocking)
		{
			if (!stream.CanRead)
			{
				throw new ArgumentException("stream is not capable of reading.");
			}
			this.stream = stream;
			this.blocking = blocking;
		}

		/// <summary>
		/// Releases all resources used by the instance.
		/// </summary>
		~StreamWrapper()
		{
			Dispose(false);
		}

		// The wrapper only accepts readable streams
		public override bool CanRead
		{
			get { checkDisposed(); return true; }
		}

		// We implement that feature
		public override bool CanSeek
		{
			get { checkDisposed(); return true; }
		}

		// The wrapper is readonly
		public override bool CanWrite
		{
			get { checkDisposed(); return false; }
		}

		// Just forward it
		public override void Flush()
		{
			checkDisposed();
			stream.Flush();
		}

		// Calling this property will cause the wrapper to read the stream
		// to its end and cache it completely.
		public override long Length
		{
			get
			{
				checkDisposed();
				if (!eos)
				{
					Fill();
				}
				return memoryStream.Length;
			}
		}

		// Gets or sets the current position
		public override long Position
		{
			get
			{
				checkDisposed();
				return memoryStream.Position;
			}
			set
			{
				checkDisposed();
				Seek(value, SeekOrigin.Begin);
			}
		}

		// Implements the reading feature
		public override int Read(byte[] buffer, int offset, int count)
		{
			checkDisposed();
			// total bytes read from memory-stream
			int memoryBytes = 0;
			// total bytes read from the original stream
			int streamBytes = 0;
			memoryBytes = memoryStream.Read(buffer, offset, count);
			if ((count > memoryBytes) && (!eos))
			{
				// read the rest from the original stream (can be 0 bytes)
				do
				{
					int read = stream.Read(
						buffer,
						offset + memoryBytes + streamBytes,
						count - memoryBytes - streamBytes);
					streamBytes += read;
					if (read == 0)
					{
						eos = true;
						break;
					}
					if (!blocking)
					{
						break;
					}
				} while ((memoryBytes + streamBytes) < count);
				// copy the bytes from the original stream into the memory stream
				// if 0 bytes were read we write 0 so the memory-stream is not changed
				memoryStream.Write(buffer, offset + memoryBytes, streamBytes);
			}
			return memoryBytes + streamBytes;
		}

		// Implements the seeking feature
		public override long Seek(long offset, SeekOrigin origin)
		{
			checkDisposed();
			long newPosition = 0L;
			// get new position
			switch (origin)
			{
				case SeekOrigin.Begin:
					newPosition = offset;
					break;
				case SeekOrigin.Current:
					newPosition = memoryStream.Position + offset;
					break;
				case SeekOrigin.End:
					// to seek from the end have have to read to the end first
					if (!eos)
					{
						Fill();
					}
					newPosition = memoryStream.Length + offset;
					break;
				default:
					throw new ArgumentOutOfRangeException("origin");
			}
			// in case the new position is beyond the memory-streams end
			// and the original streams end hasn't been reached
			// the original stream is read until either the stream ends or
			// enough bytes have been read
			if ((newPosition > memoryStream.Length) && (!eos))
			{
				memoryStream.Position = memoryStream.Length;
				int bytesToRead = (int)(newPosition - memoryStream.Length);
				byte[] buffer = new byte[1024];
				do
				{
					bytesToRead -= Read(buffer, 0, (bytesToRead >= buffer.Length) ? buffer.Length : bytesToRead);
				} while ((bytesToRead > 0) && (!eos));
			}
			memoryStream.Position = (newPosition <= memoryStream.Length) ? newPosition : memoryStream.Length;
			return 0;
		}

		// No write-support
		public override void SetLength(long value)
		{
			throw new Exception("The method or operation is not implemented.");
		}

		// No write-support
		public override void Write(byte[] buffer, int offset, int count)
		{
			throw new Exception("The method or operation is not implemented.");
		}

		public void Reset()
		{
			checkDisposed();
			Position = 0;
		}

		// Reads the wrapped stream until its end.
		private void Fill()
		{
			if (!eos)
			{
				memoryStream.Position = memoryStream.Length;
				int bytesRead = 0;
				byte[] buffer = new byte[1024];
				do
				{
					bytesRead = stream.Read(buffer, 0, buffer.Length);
					memoryStream.Write(buffer, 0, bytesRead);
				} while (bytesRead != 0);
				eos = true;
			}
		}

		public new void Dispose()
		{
			Dispose(true);
			GC.SuppressFinalize(this);
		}

		private new void Dispose(bool disposing)
		{
			if (!disposed)
			{
				disposed = true;
				if (disposing)
				{
					if (memoryStream != null)
					{
						memoryStream.Dispose();
					}
				}
			}
		}

		public bool Disposed
		{
			get { return disposed; }
		}

		private void checkDisposed()
		{
			if (disposed) throw new ObjectDisposedException("StreamWrapper");
		}
	}
}