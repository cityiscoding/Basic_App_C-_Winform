    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    namespace CaculatorApp
    {
        public class Caculator
        {
            private int a, b;
            public Caculator(int a, int b)
            {
                this.a = a;
                this.b = b;
            }
            public static int Add(int a, int b)
            {
                return a + b;
            }
            public static int Sub(int a, int b)
            {
                return a - b;
            }
            public static int Mul(int a, int b) 
            {
                return a * b;
            }
            public static int Div(int a, int b) 
            {
                return a / b;
            }
        }
    }
