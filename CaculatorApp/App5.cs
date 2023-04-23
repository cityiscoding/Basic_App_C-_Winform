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
    public partial class frmApp5 : Form
    {
        public frmApp5()
        {
            InitializeComponent();
        }

        private void frmApp5_FormClosing(object sender, FormClosingEventArgs e)
        {
            Program.ExitApplication();
        }

        private void pictureBox3_Click(object sender, EventArgs e)
        {

        }
    }
}
