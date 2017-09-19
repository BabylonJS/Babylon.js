namespace Sample10
{
	partial class MainForm
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
			this.bLoad = new System.Windows.Forms.Button();
			this.bQuit = new System.Windows.Forms.Button();
			this.tvMetadata = new System.Windows.Forms.TreeView();
			this.SuspendLayout();
			// 
			// bLoad
			// 
			this.bLoad.Location = new System.Drawing.Point(12, 336);
			this.bLoad.Name = "bLoad";
			this.bLoad.Size = new System.Drawing.Size(75, 23);
			this.bLoad.TabIndex = 0;
			this.bLoad.Text = "Load Image";
			this.bLoad.UseVisualStyleBackColor = true;
			this.bLoad.Click += new System.EventHandler(this.bLoad_Click);
			// 
			// bQuit
			// 
			this.bQuit.Location = new System.Drawing.Point(328, 336);
			this.bQuit.Name = "bQuit";
			this.bQuit.Size = new System.Drawing.Size(75, 23);
			this.bQuit.TabIndex = 1;
			this.bQuit.Text = "Quit";
			this.bQuit.UseVisualStyleBackColor = true;
			this.bQuit.Click += new System.EventHandler(this.bQuit_Click);
			// 
			// tvMetadata
			// 
			this.tvMetadata.Location = new System.Drawing.Point(12, 12);
			this.tvMetadata.Name = "tvMetadata";
			this.tvMetadata.Size = new System.Drawing.Size(389, 318);
			this.tvMetadata.TabIndex = 2;
			// 
			// MainForm
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.ClientSize = new System.Drawing.Size(415, 371);
			this.Controls.Add(this.tvMetadata);
			this.Controls.Add(this.bQuit);
			this.Controls.Add(this.bLoad);
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
			this.MaximizeBox = false;
			this.MinimizeBox = false;
			this.Name = "MainForm";
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
			this.Text = "MainForm";
			this.ResumeLayout(false);

		}

		#endregion

		private System.Windows.Forms.Button bLoad;
		private System.Windows.Forms.Button bQuit;
		private System.Windows.Forms.TreeView tvMetadata;
	}
}