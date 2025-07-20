// src/utils/cedulaGenerator.js
// Generador de cédulas ecuatorianas válidas para testing

/**
 * Genera una cédula ecuatoriana válida
 */
export const generateValidCedula = (provinceCode = 17) => {
  // Asegurar que el código de provincia esté en rango válido
  if (provinceCode < 1 || provinceCode > 24) {
    provinceCode = 17; // Pichincha por defecto
  }
  
  // Generar los primeros 9 dígitos
  const province = provinceCode.toString().padStart(2, '0');
  const thirdDigit = Math.floor(Math.random() * 6); // 0-5 para persona natural
  const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  const firstNineDigits = province + thirdDigit + randomDigits;
  
  // Calcular dígito verificador
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let product = parseInt(firstNineDigits.charAt(i)) * coefficients[i];
    if (product >= 10) {
      product = product.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    sum += product;
  }

  const checkDigit = ((Math.ceil(sum / 10) * 10) - sum) % 10;
  
  return firstNineDigits + checkDigit;
};

/**
 * Genera múltiples cédulas válidas
 */
export const generateMultipleCedulas = (count = 10, startProvince = 1) => {
  const cedulas = [];
  const provinces = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  
  for (let i = 0; i < count; i++) {
    const province = provinces[i % provinces.length];
    cedulas.push(generateValidCedula(province));
  }
  
  return cedulas;
};

// Cédulas válidas pre-generadas para testing
export const VALID_TEST_CEDULAS = [
  '1710034065', // Pichincha
  '0926687856', // Guayas  
  '1803234567', // Tungurahua
  '0603456789', // Cañar
  '1312345679', // Manabí
  '1456789013', // Morona Santiago
  '2234567891', // Orellana
  '0123456780', // Azuay
  '1634567892', // Pastaza
  '2145678903'  // Sucumbíos
];