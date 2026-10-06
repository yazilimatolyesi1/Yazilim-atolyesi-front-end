import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Uçtan uca testlerinin veritabanına doğrudan erişmesi varsayılan olarak KAPALI
 * tutulur. Sebep: bu komutlar `docker compose exec psql` ile geliştiricinin
 * günlük veritabanına bağlanır ve `DELETE` çalıştırır. Yanlış projeye
 * bağlanıldığında paylaşılan veri silinir.
 *
 * Serbest bırakmak için bilinçli olarak şunlar ayarlanır:
 *
 *   E2E_ALLOW_SQL=1                 → ham SQL çalışır (varsayılan: KAPALI)
 *   E2E_COMPOSE_PROJECT=<proje>     → yalnızca bu tek kullanımlık stack'e bağlan
 *
 * E2E_COMPOSE_PROJECT verilmezse calisan postgres konteyneri etiketlerden bulunur.
 * E2E_ALLOW_SQL'i yalnızca veritabanının silinebilir olduğundan emin olduğunuzda
 * açın. Açıldığında hedef komut `sqlTarget` ile rapor çıktısına yazılır.
 */
export const sqlEnabled = process.env.E2E_ALLOW_SQL === "1";
export const sqlSkipReason = "E2E_ALLOW_SQL=1 verilmedigi icin veritabani dogrulamasi calistirilmadi.";
const composeFile = ["..", "../..", "../../..", "../../../.."]
  .map(rel => path.resolve(__dirname, rel, "compose.local.yaml"))
  .concat([
    path.resolve(process.env.LOCALAPPDATA || "", "compose.local.yaml"),
    path.resolve("C:/compose.local.yaml"),
    path.resolve("C:/yazilim_atolyesi_websitesi-main/compose.yaml"),
    path.resolve(__dirname, "../../../yazilim_atolyesi_websitesi-main/compose.yaml"),
    path.resolve(__dirname, "../../yazilim_atolyesi_websitesi-main/compose.yaml"),
  ])
  .find(file => existsSync(file));

/**
 * Calisan postgres konteynerini compose proje adindan bagimsiz olarak bulur.
 * Proje adi, konteyner `up` edildigi andaki dizin adina gore degisir
 * (`yazilim_atolyesi_websitesi-main` gibi). `docker compose exec -p` ile
 * yanlis ad verildiginde "service postgres is not running" hatasi verir ve
 * temizlik sessizce yapilmaz; bu yuzden konteyner adini etiketlerden okuyoruz.
 *
 * E2E_COMPOSE_PROJECT verilirse yalnizca o projeye ait konteynere dokunulur.
 */
function runningPostgres(): string | null {
  try {
    const names = execFileSync("docker", ["ps", "--filter", "label=com.docker.compose.service=postgres",
      "--format", "{{.Names}}\t{{.Label \"com.docker.compose.project\"}}"], { encoding: "utf8" })
      .split("\n").map(line => line.trim()).filter(Boolean)
      .map(line => line.split("\t"));
    const expected = process.env.E2E_COMPOSE_PROJECT;
    const match = (expected ? names.filter(([, project]) => project === expected) : names)[0];
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

const container = runningPostgres();

export const sqlTarget = container
  ? `docker exec -i ${container} psql -U yazilim_atolyesi -d yazilim_atolyesi`
  : "docker ps (calisan postgres konteyneri bulunamadi)";

/** Verilen SQL sorgusunu calistirir. `sqlEnabled` false ise hicbir sey calismaz. */
export function sql(query: string): string {
  if (!sqlEnabled) throw new Error(sqlSkipReason);
  if (!container) throw new Error("Calisan postgres konteyneri bulunamadi; once `docker compose up -d postgres` calistirin.");
  return execFileSync("docker", ["exec", "-i", container,
    "psql", "-U", "yazilim_atolyesi", "-d", "yazilim_atolyesi", "-tAc", query], { encoding: "utf8" }).trim();
}

/** Sentetik kayitlari temizler; SQL kapaliysa uyari basarak hangi satirlarin kaldigini bildirir. */
export function cleanupSql(accounts: string[], extra: string[] = []) {
  if (!sqlEnabled) {
    console.warn(
      `\n  [E2E] Veritabani temizligi ATLANDI (${sqlSkipReason})\n` +
      `        Bu test kosudan kalan sentetik hesaplar:\n` +
      accounts.map(email => `          - ${email}`).join("\n") +
      (extra.length ? `\n        Ayrica sunu silebilirsiniz:\n${extra.map(line => `          ${line}`).join("\n")}\n` : "\n") +
      `        Ya da testi tekrar calistirin: set E2E_ALLOW_SQL=1 (Windows)\n`,
    );
    return;
  }
  if (accounts.length) sql(`DELETE FROM app_users WHERE email IN (${accounts.map(e => `'${e}'`).join(", ")});`);
}
