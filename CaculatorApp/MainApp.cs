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
    public partial class frmManHinhChinh : Form
    {
        public frmManHinhChinh()
        {
            InitializeComponent();
        }

        private void btnApp1_Click(object sender, EventArgs e)
        {
            frmApp1 App1 = new frmApp1 ();
            App1.Show ();
            this.Hide();
        }
        private void btnPhanSo_Click(object sender, EventArgs e)
        {
            frmApp2 App2 = new frmApp2();
            App2.Show();
            this.Hide();
        }
        private void frmManHinhChinh_FormClosing(object sender, FormClosingEventArgs e)
        {
            Program.ExitApplication();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            frmApp3 App3 = new frmApp3();
            App3.Show();
            this.Hide();
        }

        private void btnTamgiac_Click(object sender, EventArgs e)
        {
            frmApp4 App4 = new frmApp4 ();
            this.Hide ();
            App4.Show();
        }

        private void btnDangXuat_Click(object sender, EventArgs e)
        {
            frmDangNhap frmDangNhap = new frmDangNhap ();
            frmDangNhap.Show();
            this.Hide();
        }
    }
}
