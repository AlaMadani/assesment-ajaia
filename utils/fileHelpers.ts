export function isValidFileType(fileName: string): boolean {
  if (!fileName) return false;
  const allowedExtensions = ['.txt', '.md'];
  const lowerCaseName = fileName.toLowerCase();
  return allowedExtensions.some(ext => lowerCaseName.endsWith(ext));
}