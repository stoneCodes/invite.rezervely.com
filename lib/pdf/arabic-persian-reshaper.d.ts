declare module "arabic-persian-reshaper" {
  type ArabicShaper = { convertArabic(text: string): string };
  const reshaper: { ArabicShaper: ArabicShaper; PersianShaper: ArabicShaper };
  export default reshaper;
}
