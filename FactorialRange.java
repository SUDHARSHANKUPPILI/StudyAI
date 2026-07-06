import java.math.BigInteger;
import java.util.Scanner;

public class FactorialRange {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter start of range: ");
        int start = scanner.nextInt();
        System.out.print("Enter end of range: ");
        int end = scanner.nextInt();

        if (start < 0) {
            System.out.println("Factorial is not defined for negative numbers.");
            return;
        }

        if (start > end) {
            System.out.println("Start should be less than or equal to end.");
            return;
        }

        // Calculate factorial of start first
        BigInteger fact = factorial(start);
        System.out.println("Factorial of " + start + " : " + fact);

        // Calculate subsequent factorials efficiently
        for (int i = start + 1; i <= end; i++) {
            fact = fact.multiply(BigInteger.valueOf(i));
            System.out.println("Factorial of " + i + " : " + fact);
        }
        scanner.close();
    }

    // Helper method to calculate factorial of a single number
    public static BigInteger factorial(int n) {
        BigInteger result = BigInteger.ONE;
        for (int i = 2; i <= n; i++) {
            result = result.multiply(BigInteger.valueOf(i));
        }
        return result;
    }
}
