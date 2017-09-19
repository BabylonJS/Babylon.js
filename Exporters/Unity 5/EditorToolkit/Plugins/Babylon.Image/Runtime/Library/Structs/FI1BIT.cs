using System;
using System.Collections.Generic;
using System.Text;
using System.Diagnostics;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>FI1BIT</b> structure represents a single bit.
	/// It's value can be <i>0</i> or <i>1</i>.
	/// </summary>
	[DebuggerDisplay("{value}"),
	Serializable]
	public struct FI1BIT
	{
		/// <summary>
		/// Represents the largest possible value of <see cref="FI1BIT"/>. This field is constant.
		/// </summary>
		public const byte MaxValue = 0x01;

		/// <summary>
		/// Represents the smallest possible value of <see cref="FI1BIT"/>. This field is constant.
		/// </summary>
		public const byte MinValue = 0x00;

		/// <summary>
		/// The value of the structure.
		/// </summary>
		private byte value;

		/// <summary>
		/// Initializes a new instance based on the specified value.
		/// </summary>
		/// <param name="value">The value to initialize with.</param>
		private FI1BIT(byte value)
		{
			this.value = (byte)(value & MaxValue);
		}

		/// <summary>
		/// Converts the value of a <see cref="FI1BIT"/> structure to a <see cref="Byte"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FI1BIT"/> structure.</param>
		/// <returns>A new instance of <see cref="FI1BIT"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator byte(FI1BIT value)
		{
			return value.value;
		}

		/// <summary>
		/// Converts the value of a <see cref="Byte"/> structure to a <see cref="FI1BIT"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Byte"/> structure.</param>
		/// <returns>A new instance of <see cref="FI1BIT"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FI1BIT(byte value)
		{
			return new FI1BIT(value);
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="FI1BIT"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return value.ToString();
		}
	}
}
