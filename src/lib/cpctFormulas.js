/**
 * CPCT Typing Speed Formulas
 * 
 * These formulas are based on the official CPCT (Computer Proficiency Certification Test) standards:
 * 
 * 1. GWPM (Gross Words per Minute) = Gross Words / Time Taken (in minutes)
 *    - Gross Words = Correct Words + Incorrect Words
 * 
 * 2. NWPM (Net Words per Minute) = Net Words / Time Taken (in minutes)
 *    - Net Words = Correct Words Typed
 * 
 * 3. Accuracy Percentage = (NWPM * 100) / GWPM
 */

/**
 * Calculate CPCT typing metrics
 * @param {number} correctWords - Number of correctly typed words
 * @param {number} incorrectWords - Number of incorrectly typed words
 * @param {number} timeInMinutes - Time taken in minutes
 * @returns {Object} Object containing GWPM, NWPM, and Accuracy
 */
export function calculateCPCTMetrics(correctWords, incorrectWords, timeInMinutes) {
  // Calculate Gross Words (Correct + Incorrect)
  const grossWords = correctWords + incorrectWords;
  
  // Calculate GWPM (Gross Words per Minute)
  const gwpm = timeInMinutes > 0 ? grossWords / timeInMinutes : 0;
  
  // Calculate NWPM (Net Words per Minute) - only correct words
  const nwpm = timeInMinutes > 0 ? correctWords / timeInMinutes : 0;
  
  // Calculate Accuracy Percentage = (NWPM * 100) / GWPM
  const accuracy = gwpm > 0 ? (nwpm * 100) / gwpm : 100;
  
  return {
    gwpm: Math.round(gwpm * 100) / 100, // Round to 2 decimal places
    nwpm: Math.round(nwpm * 100) / 100, // Round to 2 decimal places
    accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
    grossWords,
    netWords: correctWords
  };
}

/**
 * Calculate CPCT metrics from typed text and original content
 * @param {string} typedText - Text that user typed
 * @param {string} originalText - Original text to compare against
 * @param {number} timeInMinutes - Time taken in minutes
 * @returns {Object} Object containing GWPM, NWPM, Accuracy, and word counts
 */
export function calculateCPCTMetricsFromText(typedText, originalText, timeInMinutes) {
  // Split into words
  const typedWords = typedText.trim().split(/\s+/).filter(w => w.length > 0);
  const originalWords = originalText.trim().split(/\s+/).filter(w => w.length > 0);
  
  // Count correct and incorrect words
  let correctWords = 0;
  let incorrectWords = 0;
  
  // Compare word by word
  const maxLength = Math.max(typedWords.length, originalWords.length);
  for (let i = 0; i < maxLength; i++) {
    if (i < typedWords.length && i < originalWords.length) {
      if (typedWords[i] === originalWords[i]) {
        correctWords++;
      } else {
        incorrectWords++;
      }
    } else if (i < typedWords.length) {
      // Extra words typed (incorrect)
      incorrectWords++;
    }
  }
  
  // Use the CPCT formula
  return calculateCPCTMetrics(correctWords, incorrectWords, timeInMinutes);
}

