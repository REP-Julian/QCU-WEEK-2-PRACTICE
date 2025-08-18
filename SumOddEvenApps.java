import java.util.Scanner;

public class SumOddEvenApps {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter your First Number:");
        int a = sc.nextInt();
        System.out.println("Enter your Second Number:");
        int b = sc.nextInt();
        int sum = a + b;
        System.out.println("The sum of " + a + " and " + b + " is: " + sum);

        if (sum % 2 == 0) {
            System.out.println(a + " is an even number.");
        } else {
            System.out.println(a + " is an odd number.");
        }

        sc.close();
    }
}
