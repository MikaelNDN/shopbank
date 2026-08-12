package acc.br.shopbank.infrastructure.integration.payment;

final class BrazilianTaxId {

    private BrazilianTaxId() {
    }

    static String digitsOnly(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    static boolean isValidCpf(String cpf) {
        if (cpf == null || cpf.length() != 11) {
            return false;
        }

        if (cpf.chars().distinct().count() == 1 || "12345678909".equals(cpf)) {
            return false;
        }

        int firstDigit = cpfDigit(cpf, 9, 10);
        int secondDigit = cpfDigit(cpf, 10, 11);
        return Character.digit(cpf.charAt(9), 10) == firstDigit
                && Character.digit(cpf.charAt(10), 10) == secondDigit;
    }

    private static int cpfDigit(String cpf, int length, int weight) {
        int sum = 0;
        for (int i = 0; i < length; i++) {
            sum += Character.digit(cpf.charAt(i), 10) * (weight - i);
        }

        int digit = 11 - (sum % 11);
        return digit >= 10 ? 0 : digit;
    }
}
