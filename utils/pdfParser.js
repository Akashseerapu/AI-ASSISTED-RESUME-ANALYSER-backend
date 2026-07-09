const fs = require("fs");
const pdfParse = require("pdf-parse");

/**
 * Extract text from a PDF file
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromPDF = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    if (!data || !data.text) {
      throw new Error("No text content could be extracted from this PDF.");
    }

    // Clean up empty lines/extra spaces
    const cleanedText = data.text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    return cleanedText;
  } catch (error) {
    console.error("PDF Parsing Error:", error.message);
    throw new Error(`Failed to parse PDF resume: ${error.message}`);
  }
};

module.exports = {
  extractTextFromPDF
};
