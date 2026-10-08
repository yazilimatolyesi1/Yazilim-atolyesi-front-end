import "react";

// Next.js App Router sunucu bileşenlerinde React'in `cache` fonksiyonunu sağlar;
// projedeki @types/react 18 sürümü bunu bildirmediği için yalnızca tip eklenir.
declare module "react" {
  export function cache<T extends (...args: never[]) => unknown>(fn: T): T;
}
