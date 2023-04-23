using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CaculatorApp
{
    public partial class frmApp2 : Form
    {
        public frmApp2()
        {
            InitializeComponent();

        }

        private void frmApp2_FormClosing(object sender, FormClosingEventArgs e)
        {
            Program.ExitApplication();
        }

        private bool CheckInput()
        {
            string mauso1 = txtMauso1.Text.Trim();
            string mauso2 = txtMauso2.Text.Trim();
            string tuso1 = txtTuso1.Text.Trim();
            string tuso2 = txtTuso2.Text.Trim();
            int temp;
            if (!int.TryParse(mauso1, out temp) || !int.TryParse(mauso2, out temp)
                || !int.TryParse(tuso1, out temp) || !int.TryParse(tuso2, out temp))
            {
                MessageBox.Show("Vui lòng nhập số vào các ô", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }

            if (mauso1 == "0" || mauso2 == "0")
            {
                MessageBox.Show("Mẫu số phải khác 0", "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }

            return true;
        }

        private void btnCong_Click(object sender, EventArgs e)
        {
            if (!CheckInput()) return;

            try
            {
                PhanSo ps1 = new PhanSo(int.Parse(txtTuso1.Text), int.Parse(txtMauso1.Text));
                PhanSo ps2 = new PhanSo(int.Parse(txtTuso2.Text), int.Parse(txtMauso2.Text));

                PhanSo psKetQua = ps1.Cong(ps2);

                txtTusomoi.Text = psKetQua.Tuso.ToString();
                txtMausomoi.Text = psKetQua.Mauso.ToString();
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnTru_Click(object sender, EventArgs e)
        {
            if (!CheckInput()) return;

            try
            {
                PhanSo ps1 = new PhanSo(int.Parse(txtTuso1.Text), int.Parse(txtMauso1.Text));
                PhanSo ps2 = new PhanSo(int.Parse(txtTuso2.Text), int.Parse(txtMauso2.Text));

                PhanSo psKetQua = ps1.Tru(ps2);

                txtTusomoi.Text = psKetQua.Tuso.ToString();
                txtMausomoi.Text = psKetQua.Mauso.ToString();
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }


        private void btnNhan_Click(object sender, EventArgs e)
        {
            if (!CheckInput()) return;
            try
            {
                PhanSo ps1 = new PhanSo(int.Parse(txtTuso1.Text), int.Parse(txtMauso1.Text));
                PhanSo ps2 = new PhanSo(int.Parse(txtTuso2.Text), int.Parse(txtMauso2.Text));

                PhanSo psKetQua = ps1.Nhan(ps2);

                txtTusomoi.Text = psKetQua.Tuso.ToString();
                txtMausomoi.Text = psKetQua.Mauso.ToString();
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        private void btnChia_Click(object sender, EventArgs e)
        {
            if (!CheckInput()) return;
            try
            {
                PhanSo ps1 = new PhanSo(int.Parse(txtTuso1.Text), int.Parse(txtMauso1.Text));
                PhanSo ps2 = new PhanSo(int.Parse(txtTuso2.Text), int.Parse(txtMauso2.Text));

                PhanSo psKetQua = ps1.Chia(ps2);

                txtTusomoi.Text = psKetQua.Tuso.ToString();
                txtMausomoi.Text = psKetQua.Mauso.ToString();
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnRutGon_Click(object sender, EventArgs e)
        {
            if (!CheckInput()) return;

            try
            {
                PhanSo psKetQua = new PhanSo(int.Parse(txtTusomoi.Text), int.Parse(txtMausomoi.Text));
                psKetQua.RutGon();

                txtTusomoi.Text = psKetQua.Tuso.ToString();
                txtMausomoi.Text = psKetQua.Mauso.ToString();

                MessageBox.Show("Rút gọn thành công", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btnClear_Click(object sender, EventArgs e)
        {
            txtTuso1.Text = "";
            txtTuso2.Text = "";
            txtMauso1.Text = "";
            txtMauso2.Text = "";
            txtTusomoi.Text = "";
            txtMausomoi.Text = "";
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            frmManHinhChinh mhc = new frmManHinhChinh();
            this.Hide();
            mhc.Show();
        }
    }
}
