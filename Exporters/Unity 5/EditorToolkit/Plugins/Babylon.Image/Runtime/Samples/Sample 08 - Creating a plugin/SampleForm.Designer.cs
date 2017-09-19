namespace Sample08
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
			this.pictureBox = new System.Windows.Forms.PictureBox();
			this.bLoad = new System.Windows.Forms.Button();
			this.SaveToSer = new System.Windows.Forms.Button();
			this.LoadSerBitmap = new System.Windows.Forms.Button();
			this.bClearBitmap = new System.Windows.Forms.Button();
			((System.ComponentModel.ISupportInitialize)(this.pictureBox)).BeginInit();
			this.SuspendLayout();
			// 
			// pictureBox
			// 
			this.pictureBox.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
			this.pictureBox.Location = new System.Drawing.Point(12, 12);
			this.pictureBox.Name = "pictureBox";
			this.pictureBox.Size = new System.Drawing.Size(600, 400);
			this.pictureBox.TabIndex = 0;
			this.pictureBox.TabStop = false;
			// 
			// bLoad
			// 
			this.bLoad.Location = new System.Drawing.Point(12, 418);
			this.bLoad.Name = "bLoad";
			this.bLoad.Size = new System.Drawing.Size(98, 23);
			this.bLoad.TabIndex = 1;
			this.bLoad.Text = "Load any bitmap";
			this.bLoad.UseVisualStyleBackColor = true;
			this.bLoad.Click += new System.EventHandler(this.bLoad_Click);
			// 
			// SaveToSer
			// 
			this.SaveToSer.Location = new System.Drawing.Point(324, 418);
			this.SaveToSer.Name = "SaveToSer";
			this.SaveToSer.Size = new System.Drawing.Size(98, 23);
			this.SaveToSer.TabIndex = 2;
			this.SaveToSer.Text = "Save as .ser";
			this.SaveToSer.UseVisualStyleBackColor = true;
			this.SaveToSer.Click += new System.EventHandler(this.SaveToSer_Click);
			// 
			// LoadSerBitmap
			// 
			this.LoadSerBitmap.Location = new System.Drawing.Point(220, 418);
			this.LoadSerBitmap.Name = "LoadSerBitmap";
			this.LoadSerBitmap.Size = new System.Drawing.Size(98, 23);
			this.LoadSerBitmap.TabIndex = 3;
			this.LoadSerBitmap.Text = "Load .ser bitmap";
			this.LoadSerBitmap.UseVisualStyleBackColor = true;
			this.LoadSerBitmap.Click += new System.EventHandler(this.LoadSerBitmap_Click);
			// 
			// bClearBitmap
			// 
			this.bClearBitmap.Location = new System.Drawing.Point(116, 418);
			this.bClearBitmap.Name = "bClearBitmap";
			this.bClearBitmap.Size = new System.Drawing.Size(98, 23);
			this.bClearBitmap.TabIndex = 4;
			this.bClearBitmap.Text = "Clear screen";
			this.bClearBitmap.UseVisualStyleBackColor = true;
			this.bClearBitmap.Click += new System.EventHandler(this.bClearBitmap_Click);
			// 
			// SampleForm
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.ClientSize = new System.Drawing.Size(627, 448);
			this.Controls.Add(this.bClearBitmap);
			this.Controls.Add(this.LoadSerBitmap);
			this.Controls.Add(this.SaveToSer);
			this.Controls.Add(this.bLoad);
			this.Controls.Add(this.pictureBox);
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
			this.MaximizeBox = false;
			this.MinimizeBox = false;
			this.Name = "SampleForm";
			this.ShowIcon = false;
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
			this.Text = "Sample 08";
			((System.ComponentModel.ISupportInitialize)(this.pictureBox)).EndInit();
			this.ResumeLayout(false);

		}

		#endregion

		private System.Windows.Forms.PictureBox pictureBox;
		private System.Windows.Forms.Button bLoad;
		private System.Windows.Forms.Button SaveToSer;
		private System.Windows.Forms.Button LoadSerBitmap;
		private System.Windows.Forms.Button bClearBitmap;
	}
}

