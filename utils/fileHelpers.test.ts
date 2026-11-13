import { isValidFileType } from './fileHelpers';

describe('File Upload Validation', () => {
  it('should accept .txt files', () => {
    expect(isValidFileType('notes.txt')).toBe(true);
  });

  it('should accept .md files', () => {
    expect(isValidFileType('README.md')).toBe(true);
  });

  it('should reject .docx files based on our deliberate scope cut', () => {
    expect(isValidFileType('report.docx')).toBe(false);
  });

  it('should reject files with no extension', () => {
    expect(isValidFileType('document')).toBe(false);
  });
});