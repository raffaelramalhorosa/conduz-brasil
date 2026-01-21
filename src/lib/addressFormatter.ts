/**
 * Formats an address string to a simplified format: "Rua, Bairro - Cidade"
 * Removes excessive geographic information like region, state, country, CEP
 */
export function formatSimpleAddress(fullAddress: string): string {
  if (!fullAddress) return '';
  
  // Split by comma and filter out unwanted parts
  const parts = fullAddress.split(',').map(p => p.trim());
  
  // Keywords to exclude from the address
  const excludeKeywords = [
    'Brasil', 'Brazil',
    'Região Geográfica', 'Região Imediata', 'Região Metropolitana',
    'Microrregião', 'Mesorregião',
    'América do Sul', 'South America'
  ];
  
  // Regex patterns to exclude
  const excludePatterns = [
    /^\d{5}-?\d{3}$/, // CEP format (e.g., 01310-100 or 01310100)
    /^[A-Z]{2}$/,     // State abbreviation (e.g., SP, RJ)
    /^São Paulo$/i,   // State name (when it's the state, not the city)
    /^Rio de Janeiro$/i,
    /^Minas Gerais$/i,
    /^Paraná$/i,
    /^Santa Catarina$/i,
    /^Rio Grande do Sul$/i,
    /^Bahia$/i,
    /^Pernambuco$/i,
    /^Ceará$/i,
    /^Goiás$/i,
  ];
  
  const filteredParts = parts.filter((part, index) => {
    // Check for exclude keywords
    if (excludeKeywords.some(kw => part.toLowerCase().includes(kw.toLowerCase()))) {
      return false;
    }
    
    // Check for exclude patterns
    if (excludePatterns.some(pattern => pattern.test(part))) {
      return false;
    }
    
    // Keep first 3-4 meaningful parts (street, number, neighborhood, city)
    return index < 4;
  });
  
  if (filteredParts.length === 0) return fullAddress;
  
  // Format: If we have at least 3 parts, format as "Rua, Número, Bairro - Cidade"
  if (filteredParts.length >= 3) {
    const streetAndNumber = filteredParts.slice(0, 2).join(', ');
    const neighborhoodAndCity = filteredParts.slice(2, 4).join(' - ');
    return `${streetAndNumber}, ${neighborhoodAndCity}`;
  }
  
  // If fewer parts, just join them
  return filteredParts.join(', ');
}

/**
 * Formats a date for display, handling timezone issues properly
 * Takes a date string in 'yyyy-MM-dd' format and returns a formatted display string
 */
export function formatBookingDate(dateString: string): Date {
  // Parse the date string as local date (not UTC)
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a Date object to 'yyyy-MM-dd' string for database storage
 * Ensures the date is stored as the local date, not shifted by timezone
 */
export function formatDateForStorage(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
