namespace Sample11
{
	partial class MetaDataFrame
	{
		/// <summary>
		/// Erforderliche Designervariable.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary>
		/// Verwendete Ressourcen bereinigen.
		/// </summary>
		/// <param name="disposing">True, wenn verwaltete Ressourcen gelöscht werden sollen; andernfalls False.</param>
		protected override void Dispose(bool disposing)
		{
			if (disposing && (components != null))
			{
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Vom Windows Form-Designer generierter Code

		/// <summary>
		/// Erforderliche Methode für die Designerunterstützung.
		/// Der Inhalt der Methode darf nicht mit dem Code-Editor geändert werden.
		/// </summary>
		private void InitializeComponent()
		{
			this.tvMetadata = new System.Windows.Forms.TreeView();
			this.SuspendLayout();
			// 
			// tvMetadata
			// 
			this.tvMetadata.Location = new System.Drawing.Point(12, 12);
			this.tvMetadata.Name = "tvMetadata";
			this.tvMetadata.Size = new System.Drawing.Size(389, 318);
			this.tvMetadata.TabIndex = 3;
			// 
			// MetaDataFrame
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.ClientSize = new System.Drawing.Size(417, 349);
			this.Controls.Add(this.tvMetadata);
			this.DoubleBuffered = true;
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
			this.MaximizeBox = false;
			this.MinimizeBox = false;
			this.Name = "MetaDataFrame";
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
			this.Text = "Metadata";
			this.Load += new System.EventHandler(this.MetaDataFrame_Load);
			this.ResumeLayout(false);

		}

		#endregion

		private System.Windows.Forms.TreeView tvMetadata;
	}
}