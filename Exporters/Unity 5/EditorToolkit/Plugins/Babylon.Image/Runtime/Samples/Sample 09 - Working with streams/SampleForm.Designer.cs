namespace Sample09
{
	partial class SampleForm
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
			this.picBox = new System.Windows.Forms.PictureBox();
			this.tbURL = new System.Windows.Forms.TextBox();
			this.lUrl = new System.Windows.Forms.Label();
			this.bLoadUrl = new System.Windows.Forms.Button();
			this.bSave = new System.Windows.Forms.Button();
			((System.ComponentModel.ISupportInitialize)(this.picBox)).BeginInit();
			this.SuspendLayout();
			// 
			// picBox
			// 
			this.picBox.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
			this.picBox.Location = new System.Drawing.Point(12, 12);
			this.picBox.Name = "picBox";
			this.picBox.Size = new System.Drawing.Size(536, 299);
			this.picBox.TabIndex = 0;
			this.picBox.TabStop = false;
			// 
			// tbURL
			// 
			this.tbURL.Location = new System.Drawing.Point(155, 317);
			this.tbURL.Name = "tbURL";
			this.tbURL.Size = new System.Drawing.Size(393, 20);
			this.tbURL.TabIndex = 1;
			this.tbURL.Text = "http://freeimage.sourceforge.net/images/logo.jpg";
			// 
			// lUrl
			// 
			this.lUrl.AutoSize = true;
			this.lUrl.Location = new System.Drawing.Point(9, 320);
			this.lUrl.Name = "lUrl";
			this.lUrl.Size = new System.Drawing.Size(137, 13);
			this.lUrl.TabIndex = 2;
			this.lUrl.Text = "Enter the URL of an Image:";
			// 
			// bLoadUrl
			// 
			this.bLoadUrl.Location = new System.Drawing.Point(12, 344);
			this.bLoadUrl.Name = "bLoadUrl";
			this.bLoadUrl.Size = new System.Drawing.Size(75, 23);
			this.bLoadUrl.TabIndex = 3;
			this.bLoadUrl.Text = "Load URL";
			this.bLoadUrl.UseVisualStyleBackColor = true;
			this.bLoadUrl.Click += new System.EventHandler(this.bLoadUrl_Click);
			// 
			// bSave
			// 
			this.bSave.Location = new System.Drawing.Point(93, 344);
			this.bSave.Name = "bSave";
			this.bSave.Size = new System.Drawing.Size(75, 23);
			this.bSave.TabIndex = 4;
			this.bSave.Text = "Save to disk";
			this.bSave.UseVisualStyleBackColor = true;
			this.bSave.Click += new System.EventHandler(this.bSave_Click);
			// 
			// SampleForm
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.ClientSize = new System.Drawing.Size(560, 379);
			this.Controls.Add(this.bSave);
			this.Controls.Add(this.bLoadUrl);
			this.Controls.Add(this.lUrl);
			this.Controls.Add(this.tbURL);
			this.Controls.Add(this.picBox);
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
			this.MaximizeBox = false;
			this.MinimizeBox = false;
			this.Name = "SampleForm";
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
			this.Text = "Sample09";
			((System.ComponentModel.ISupportInitialize)(this.picBox)).EndInit();
			this.ResumeLayout(false);
			this.PerformLayout();

		}

		#endregion

		private System.Windows.Forms.PictureBox picBox;
		private System.Windows.Forms.TextBox tbURL;
		private System.Windows.Forms.Label lUrl;
		private System.Windows.Forms.Button bLoadUrl;
		private System.Windows.Forms.Button bSave;
	}
}