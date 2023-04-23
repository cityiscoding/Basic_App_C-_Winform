using System;
    
namespace CaculatorApp
{
    public class PhanSo
    {

        private int tuso;
        private int mauso;

        public PhanSo(int tuso, int mauso)
        {
            this.tuso = tuso;
            this.mauso = mauso;
        }

        public int Tuso
        {
            get { return tuso; }
            set { tuso = value; }
        }

        public int Mauso
        {
            get { return mauso; }
            set { mauso = value; }
        }

        public PhanSo Cong(PhanSo ps2)
        {
            int tusoMoi = this.tuso * ps2.mauso + ps2.tuso * this.mauso;
            int mausoMoi = this.mauso * ps2.mauso;

            return new PhanSo(tusoMoi, mausoMoi);
        }
        public PhanSo Tru(PhanSo ps2)
        {
            int tusoMoi = this.tuso * ps2.mauso - ps2.tuso * this.mauso;
            int mausoMoi = this.mauso * ps2.mauso;

            return new PhanSo(tusoMoi, mausoMoi);
        }

        public PhanSo Nhan(PhanSo ps2)
        {
            int tusoMoi = this.tuso * ps2.tuso;
            int mausoMoi = this.mauso * ps2.mauso;

            return new PhanSo(tusoMoi, mausoMoi);
        }

        public PhanSo Chia(PhanSo ps2)
        {
            int tusoMoi = this.tuso * ps2.mauso;
            int mausoMoi = this.mauso * ps2.tuso;

            return new PhanSo(tusoMoi, mausoMoi);
        }

        public void RutGon()
        {
            int ucln = UCLN(this.tuso, this.mauso);
            this.tuso /= ucln;
            this.mauso /= ucln;
        }
        private int UCLN(int a, int b)
        {
            if (b == 0)
            {
                return a;
            }
            return UCLN(b, a % b);
        }
        public override string ToString()
        {
            return tuso + "/" + mauso;
        }
    }

}