export function truncateContent(
  content: string,
  maxLength: number = 50,
): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
}
