/**
 * Обложка плейлиста: обрезаем картинку по центру в квадрат и ужимаем до 320×320 JPEG.
 * Результат — data URL ~20–35 КБ, его можно хранить прямо в localStorage вместе с плейлистом
 * (там всего ~5 МБ на сайт, поэтому крупнее не делаем).
 */
export async function fileToCover(file: File, size = 320): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Это не картинка");
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Браузер не умеет рисовать картинки");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}
