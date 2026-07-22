/** GitHub Pages 子路径部署时给站内路径加前缀；裸 <a href> 不会自动带 basePath。 */
export function publicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!path) return base || "/";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("#")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
