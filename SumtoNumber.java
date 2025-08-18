import java.util.Scanner;

public class SumtoNumber {
    public static void main(String[] args) {
        System.out.print("Julian Agustino");
        System.out.println(" 18");

        Scanner sc = new Scanner(System.in);
        System.out.println("Enter your First Number:");
        int a = sc.nextInt();
        System.out.println("Enter your Second Number:");
        int b = sc.nextInt();
        int sum = a + b;
        System.out.println("The sum of " + a + " and " + b + " is: " + sum);

        sc.close();
    }
    
}
