namespace CaculatorApp
{
    partial class frmApp1
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
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frmApp1));
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.txtSo1 = new System.Windows.Forms.TextBox();
            this.txtSo2 = new System.Windows.Forms.TextBox();
            this.label3 = new System.Windows.Forms.Label();
            this.txtKq = new System.Windows.Forms.TextBox();
            this.label4 = new System.Windows.Forms.Label();
            this.btnCong = new System.Windows.Forms.Button();
            this.btnTru = new System.Windows.Forms.Button();
            this.btnNhan = new System.Windows.Forms.Button();
            this.btnChia = new System.Windows.Forms.Button();
            this.btnBack = new System.Windows.Forms.Button();
            this.btnClear = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // label1
            // 
            this.label1.Dock = System.Windows.Forms.DockStyle.Top;
            this.label1.Font = new System.Drawing.Font("MV Boli", 34.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.ForeColor = System.Drawing.Color.Blue;
            this.label1.Location = new System.Drawing.Point(0, 0);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(982, 104);
            this.label1.TabIndex = 0;
            this.label1.Text = "Cộng trừ nhân chia 2 số\r\n";
            this.label1.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // label2
            // 
            this.label2.Font = new System.Drawing.Font("Microsoft YaHei", 13.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.ForeColor = System.Drawing.Color.Red;
            this.label2.Location = new System.Drawing.Point(167, 193);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(251, 37);
            this.label2.TabIndex = 1;
            this.label2.Text = "Nhập số thứ nhất:";
            // 
            // txtSo1
            // 
            this.txtSo1.Font = new System.Drawing.Font("Microsoft Sans Serif", 15F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtSo1.Location = new System.Drawing.Point(436, 193);
            this.txtSo1.Multiline = true;
            this.txtSo1.Name = "txtSo1";
            this.txtSo1.Size = new System.Drawing.Size(347, 37);
            this.txtSo1.TabIndex = 1;
            // 
            // txtSo2
            // 
            this.txtSo2.Font = new System.Drawing.Font("Microsoft Sans Serif", 15F, System.Drawing.FontStyle.Bold);
            this.txtSo2.Location = new System.Drawing.Point(436, 243);
            this.txtSo2.Multiline = true;
            this.txtSo2.Name = "txtSo2";
            this.txtSo2.Size = new System.Drawing.Size(347, 37);
            this.txtSo2.TabIndex = 2;
            // 
            // label3
            // 
            this.label3.Font = new System.Drawing.Font("Microsoft YaHei", 13.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label3.ForeColor = System.Drawing.Color.Red;
            this.label3.Location = new System.Drawing.Point(167, 249);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(251, 37);
            this.label3.TabIndex = 3;
            this.label3.Text = "Nhập số thứ hai:";
            // 
            // txtKq
            // 
            this.txtKq.Font = new System.Drawing.Font("Microsoft Sans Serif", 15F, System.Drawing.FontStyle.Bold);
            this.txtKq.Location = new System.Drawing.Point(436, 295);
            this.txtKq.Multiline = true;
            this.txtKq.Name = "txtKq";
            this.txtKq.ReadOnly = true;
            this.txtKq.Size = new System.Drawing.Size(347, 37);
            this.txtKq.TabIndex = 0;
            this.txtKq.TabStop = false;
            // 
            // label4
            // 
            this.label4.Font = new System.Drawing.Font("Microsoft YaHei", 13.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label4.ForeColor = System.Drawing.Color.Red;
            this.label4.Location = new System.Drawing.Point(167, 308);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(251, 37);
            this.label4.TabIndex = 5;
            this.label4.Text = "Kết quả:";
            // 
            // btnCong
            // 
            this.btnCong.Font = new System.Drawing.Font("MV Boli", 13.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnCong.ForeColor = System.Drawing.SystemColors.HotTrack;
            this.btnCong.Location = new System.Drawing.Point(381, 386);
            this.btnCong.Name = "btnCong";
            this.btnCong.Size = new System.Drawing.Size(100, 50);
            this.btnCong.TabIndex = 4;
            this.btnCong.Text = "Cộng";
            this.btnCong.UseVisualStyleBackColor = true;
            this.btnCong.Click += new System.EventHandler(this.button1_Click);
            // 
            // btnTru
            // 
            this.btnTru.Font = new System.Drawing.Font("MV Boli", 13.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnTru.ForeColor = System.Drawing.SystemColors.HotTrack;
            this.btnTru.Location = new System.Drawing.Point(501, 386);
            this.btnTru.Name = "btnTru";
            this.btnTru.Size = new System.Drawing.Size(100, 50);
            this.btnTru.TabIndex = 5;
            this.btnTru.Text = "Trừ";
            this.btnTru.UseVisualStyleBackColor = true;
            this.btnTru.Click += new System.EventHandler(this.btnTru_Click);
            // 
            // btnNhan
            // 
            this.btnNhan.Font = new System.Drawing.Font("MV Boli", 13.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnNhan.ForeColor = System.Drawing.SystemColors.HotTrack;
            this.btnNhan.Location = new System.Drawing.Point(627, 386);
            this.btnNhan.Name = "btnNhan";
            this.btnNhan.Size = new System.Drawing.Size(100, 50);
            this.btnNhan.TabIndex = 6;
            this.btnNhan.Text = "Nhân";
            this.btnNhan.UseVisualStyleBackColor = true;
            this.btnNhan.Click += new System.EventHandler(this.btnNhan_Click);
            // 
            // btnChia
            // 
            this.btnChia.Font = new System.Drawing.Font("MV Boli", 13.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnChia.ForeColor = System.Drawing.SystemColors.HotTrack;
            this.btnChia.Location = new System.Drawing.Point(755, 386);
            this.btnChia.Name = "btnChia";
            this.btnChia.Size = new System.Drawing.Size(100, 50);
            this.btnChia.TabIndex = 7;
            this.btnChia.Text = "Chia";
            this.btnChia.UseVisualStyleBackColor = true;
            this.btnChia.Click += new System.EventHandler(this.btnChia_Click);
            // 
            // btnBack
            // 
            this.btnBack.Font = new System.Drawing.Font("MV Boli", 13.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnBack.ForeColor = System.Drawing.SystemColors.HotTrack;
            this.btnBack.Location = new System.Drawing.Point(13, 107);
            this.btnBack.Name = "btnBack";
            this.btnBack.Size = new System.Drawing.Size(136, 38);
            this.btnBack.TabIndex = 0;
            this.btnBack.TabStop = false;
            this.btnBack.Text = "Trở Lại";
            this.btnBack.UseVisualStyleBackColor = true;
            this.btnBack.Click += new System.EventHandler(this.btnBack_Click);
            // 
            // btnClear
            // 
            this.btnClear.Font = new System.Drawing.Font("MV Boli", 13.8F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnClear.ForeColor = System.Drawing.SystemColors.HotTrack;
            this.btnClear.Location = new System.Drawing.Point(557, 451);
            this.btnClear.Name = "btnClear";
            this.btnClear.Size = new System.Drawing.Size(100, 50);
            this.btnClear.TabIndex = 8;
            this.btnClear.Text = "Clear";
            this.btnClear.UseVisualStyleBackColor = true;
            this.btnClear.Click += new System.EventHandler(this.btnClear_Click);
            // 
            // frmApp1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(982, 653);
            this.Controls.Add(this.btnClear);
            this.Controls.Add(this.btnBack);
            this.Controls.Add(this.btnChia);
            this.Controls.Add(this.btnNhan);
            this.Controls.Add(this.btnTru);
            this.Controls.Add(this.btnCong);
            this.Controls.Add(this.txtKq);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.txtSo2);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.txtSo1);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Icon = ((System.Drawing.Icon)(resources.GetObject("$this.Icon")));
            this.MaximizeBox = false;
            this.Name = "frmApp1";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Tính toán cơ bản";
            this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.frmApp1_FormClosing);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txtSo1;
        private System.Windows.Forms.TextBox txtSo2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox txtKq;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Button btnCong;
        private System.Windows.Forms.Button btnTru;
        private System.Windows.Forms.Button btnNhan;
        private System.Windows.Forms.Button btnChia;
        private System.Windows.Forms.Button btnBack;
        private System.Windows.Forms.Button btnClear;
    }
}

