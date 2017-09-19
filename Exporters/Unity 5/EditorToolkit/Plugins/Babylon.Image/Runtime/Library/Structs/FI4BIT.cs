using System;
using System.Collections.Generic;
using System.Text;
using System.Diagnostics;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>FI4BIT</b> structure represents the half of a <see cref="Byte"/>.
	/// It's valuerange is between <i>0</i> and <i>15</i>.
	/// </summary>
	[DebuggerDisplay("{value}"),
	Serializable]
	public struct FI4BIT
	{
		/// <summary>
		/// Represents the largest possible value of <see cref="FI4BIT"/>. This field is constant.
		/// </summary>
		public const byte MaxValue = 0x0F;

		/// <summary>
		/// Represents the smallest possible value of <see cref="FI4BIT"/>. This field is constant.
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
		private FI4BIT(byte value)
		{
			this.value = (byte)(value & MaxValue);
		}

		/// <summary>
		/// Converts the value of a <see cref="FI4BIT"/> structure to a <see cref="Byte"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FI4BIT"/> structure.</param>
		/// <returns>A new instance of <see cref="FI4BIT"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator byte(FI4BIT value)
		{
			return value.value;
		}

		/// <summary>
		/// Converts the value of a <see cref="Byte"/> structure to a <see cref="FI4BIT"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Byte"/> structure.</param>
		/// <returns>A new instance of <see cref="FI4BIT"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FI4BIT(byte value)
		{
			return new FI4BIT(value);
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="FI4BIT"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return value.ToString();
		}
	}
}