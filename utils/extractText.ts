import mammoth from 'mammoth';

// Declare the global pdfjsLib variable loaded via CDN script in index.html
declare const pdfjsLib: any;

export const extractText = async (file: File): Promise<string> => {
  const fileType = file.name.split('.').pop()?.toLowerCase();

  try {
    if (fileType === 'txt') {
      return await readTextFile(file);
    } else if (fileType === 'docx') {
      return await readDocxFile(file);
    } else if (fileType === 'pdf') {
      return await readPdfFile(file);
    } else {
      throw new Error(`Unsupported file type: .${fileType}`);
    }
  } catch (error) {
    console.error("Text extraction failed", error);
    throw new Error("Failed to extract text. File might be corrupted or a scanned image.");
  }
};

const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const readDocxFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
};

const readPdfFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Using the window.pdfjsLib loaded from CDN
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  const trimmed = fullText.trim();
  if (trimmed.length === 0) {
    throw new Error("PDF text is empty. It might be a scanned image.");
  }
  return trimmed;
};
