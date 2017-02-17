namespace Max2Babylon
{
    partial class ScenePropertiesForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.gravityControl = new Max2Babylon.Vector3Control();
            this.label3 = new System.Windows.Forms.Label();
            this.butCancel = new System.Windows.Forms.Button();
            this.butOK = new System.Windows.Forms.Button();
            this.groupBox2 = new System.Windows.Forms.GroupBox();
            this.chkAnimations = new System.Windows.Forms.CheckBox();
            this.chkQuaternions = new System.Windows.Forms.CheckBox();
            this.groupBox3 = new System.Windows.Forms.GroupBox();
            this.nupVolume = new System.Windows.Forms.NumericUpDown();
            this.lblVolume = new System.Windows.Forms.Label();
            this.cmdBrowse = new System.Windows.Forms.Button();
            this.txtSound = new System.Windows.Forms.TextBox();
            this.chkLoop = new System.Windows.Forms.CheckBox();
            this.chkAutoPlay = new System.Windows.Forms.CheckBox();
            this.ofdOpenSound = new System.Windows.Forms.OpenFileDialog();
            this.groupBox1.SuspendLayout();
            this.groupBox2.SuspendLayout();
            this.groupBox3.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.nupVolume)).BeginInit();
            this.SuspendLayout();
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.gravityControl);
            this.groupBox1.Controls.Add(this.label3);
            this.groupBox1.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.groupBox1.Location = new System.Drawing.Point(12, 12);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(319, 87);
            this.groupBox1.TabIndex = 0;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Collisions";
            // 
            // gravityControl
            // 
            this.gravityControl.Location = new System.Drawing.Point(21, 44);
            this.gravityControl.Name = "gravityControl";
            this.gravityControl.Size = new System.Drawing.Size(294, 28);
            this.gravityControl.TabIndex = 5;
            this.gravityControl.X = 0F;
            this.gravityControl.Y = 0F;
            this.gravityControl.Z = 0F;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(18, 28);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(43, 13);
            this.label3.TabIndex = 4;
            this.label3.Text = "Gravity:";
            // 
            // butCancel
            // 
            this.butCancel.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.butCancel.DialogResult = System.Windows.Forms.DialogResult.Cancel;
            this.butCancel.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.butCancel.Location = new System.Drawing.Point(174, 351);
            this.butCancel.Name = "butCancel";
            this.butCancel.Size = new System.Drawing.Size(75, 23);
            this.butCancel.TabIndex = 4;
            this.butCancel.Text = "Cancel";
            this.butCancel.UseVisualStyleBackColor = true;
            // 
            // butOK
            // 
            this.butOK.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.butOK.DialogResult = System.Windows.Forms.DialogResult.OK;
            this.butOK.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.butOK.Location = new System.Drawing.Point(93, 351);
            this.butOK.Name = "butOK";
            this.butOK.Size = new System.Drawing.Size(75, 23);
            this.butOK.TabIndex = 3;
            this.butOK.Text = "OK";
            this.butOK.UseVisualStyleBackColor = true;
            this.butOK.Click += new System.EventHandler(this.butOK_Click);
            // 
            // groupBox2
            // 
            this.groupBox2.Controls.Add(this.chkAnimations);
            this.groupBox2.Controls.Add(this.chkQuaternions);
            this.groupBox2.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.groupBox2.Location = new System.Drawing.Point(12, 105);
            this.groupBox2.Name = "groupBox2";
            this.groupBox2.Size = new System.Drawing.Size(319, 87);
            this.groupBox2.TabIndex = 5;
            this.groupBox2.TabStop = false;
            this.groupBox2.Text = "Advanced";
            // 
            // chkAnimations
            // 
            this.chkAnimations.AutoSize = true;
            this.chkAnimations.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkAnimations.Location = new System.Drawing.Point(21, 51);
            this.chkAnimations.Name = "chkAnimations";
            this.chkAnimations.Size = new System.Drawing.Size(149, 17);
            this.chkAnimations.TabIndex = 3;
            this.chkAnimations.Text = "Do not optimize animations";
            this.chkAnimations.UseVisualStyleBackColor = true;
            // 
            // chkQuaternions
            // 
            this.chkQuaternions.AutoSize = true;
            this.chkQuaternions.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkQuaternions.Location = new System.Drawing.Point(21, 28);
            this.chkQuaternions.Name = "chkQuaternions";
            this.chkQuaternions.Size = new System.Drawing.Size(221, 17);
            this.chkQuaternions.TabIndex = 2;
            this.chkQuaternions.Text = "Export quaternions instead of Euler angles";
            this.chkQuaternions.UseVisualStyleBackColor = true;
            // 
            // groupBox3
            // 
            this.groupBox3.Controls.Add(this.nupVolume);
            this.groupBox3.Controls.Add(this.lblVolume);
            this.groupBox3.Controls.Add(this.cmdBrowse);
            this.groupBox3.Controls.Add(this.txtSound);
            this.groupBox3.Controls.Add(this.chkLoop);
            this.groupBox3.Controls.Add(this.chkAutoPlay);
            this.groupBox3.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.groupBox3.Location = new System.Drawing.Point(12, 198);
            this.groupBox3.Name = "groupBox3";
            this.groupBox3.Size = new System.Drawing.Size(319, 136);
            this.groupBox3.TabIndex = 6;
            this.groupBox3.TabStop = false;
            this.groupBox3.Text = "Sound";
            // 
            // nupVolume
            // 
            this.nupVolume.DecimalPlaces = 2;
            this.nupVolume.Increment = new decimal(new int[] {
            1,
            0,
            0,
            65536});
            this.nupVolume.Location = new System.Drawing.Point(150, 108);
            this.nupVolume.Maximum = new decimal(new int[] {
            10,
            0,
            0,
            0});
            this.nupVolume.Name = "nupVolume";
            this.nupVolume.Size = new System.Drawing.Size(120, 20);
            this.nupVolume.TabIndex = 10;
            this.nupVolume.Value = new decimal(new int[] {
            1,
            0,
            0,
            0});
            // 
            // lblVolume
            // 
            this.lblVolume.AutoSize = true;
            this.lblVolume.Location = new System.Drawing.Point(18, 110);
            this.lblVolume.Name = "lblVolume";
            this.lblVolume.Size = new System.Drawing.Size(45, 13);
            this.lblVolume.TabIndex = 9;
            this.lblVolume.Text = "Volume:";
            // 
            // cmdBrowse
            // 
            this.cmdBrowse.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.cmdBrowse.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.cmdBrowse.Location = new System.Drawing.Point(276, 28);
            this.cmdBrowse.Name = "cmdBrowse";
            this.cmdBrowse.Size = new System.Drawing.Size(37, 23);
            this.cmdBrowse.TabIndex = 6;
            this.cmdBrowse.Text = "...";
            this.cmdBrowse.UseVisualStyleBackColor = true;
            this.cmdBrowse.Click += new System.EventHandler(this.cmdBrowse_Click);
            // 
            // txtSound
            // 
            this.txtSound.Location = new System.Drawing.Point(21, 28);
            this.txtSound.Name = "txtSound";
            this.txtSound.Size = new System.Drawing.Size(249, 20);
            this.txtSound.TabIndex = 5;
            // 
            // chkLoop
            // 
            this.chkLoop.AutoSize = true;
            this.chkLoop.Checked = true;
            this.chkLoop.CheckState = System.Windows.Forms.CheckState.Checked;
            this.chkLoop.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkLoop.Location = new System.Drawing.Point(21, 77);
            this.chkLoop.Name = "chkLoop";
            this.chkLoop.Size = new System.Drawing.Size(47, 17);
            this.chkLoop.TabIndex = 4;
            this.chkLoop.Text = "Loop";
            this.chkLoop.UseVisualStyleBackColor = true;
            // 
            // chkAutoPlay
            // 
            this.chkAutoPlay.AutoSize = true;
            this.chkAutoPlay.Checked = true;
            this.chkAutoPlay.CheckState = System.Windows.Forms.CheckState.Checked;
            this.chkAutoPlay.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkAutoPlay.Location = new System.Drawing.Point(21, 54);
            this.chkAutoPlay.Name = "chkAutoPlay";
            this.chkAutoPlay.Size = new System.Drawing.Size(67, 17);
            this.chkAutoPlay.TabIndex = 3;
            this.chkAutoPlay.Text = "Auto play";
            this.chkAutoPlay.UseVisualStyleBackColor = true;
            // 
            // ofdOpenSound
            // 
            this.ofdOpenSound.Filter = "Sound files|*.wav;*.mp3";
            // 
            // ScenePropertiesForm
            // 
            this.AcceptButton = this.butOK;
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.CancelButton = this.butCancel;
            this.ClientSize = new System.Drawing.Size(343, 386);
            this.Controls.Add(this.groupBox3);
            this.Controls.Add(this.groupBox2);
            this.Controls.Add(this.butCancel);
            this.Controls.Add(this.butOK);
            this.Controls.Add(this.groupBox1);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
            this.Name = "ScenePropertiesForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Babylon.js - Scene Properties";
            this.Load += new System.EventHandler(this.ScenePropertiesForm_Load);
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            this.groupBox2.ResumeLayout(false);
            this.groupBox2.PerformLayout();
            this.groupBox3.ResumeLayout(false);
            this.groupBox3.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.nupVolume)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox groupBox1;
        private Vector3Control gravityControl;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Button butCancel;
        private System.Windows.Forms.Button butOK;
        private System.Windows.Forms.GroupBox groupBox2;
        private System.Windows.Forms.CheckBox chkQuaternions;
        private System.Windows.Forms.GroupBox groupBox3;
        private System.Windows.Forms.CheckBox chkLoop;
        private System.Windows.Forms.CheckBox chkAutoPlay;
        private System.Windows.Forms.Button cmdBrowse;
        private System.Windows.Forms.TextBox txtSound;
        private System.Windows.Forms.OpenFileDialog ofdOpenSound;
        private System.Windows.Forms.NumericUpDown nupVolume;
        private System.Windows.Forms.Label lblVolume;
        private System.Windows.Forms.CheckBox chkAnimations;
    }
}