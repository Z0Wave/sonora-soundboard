
import { invoke as tauriInvoke, InvokeArgs } from "@tauri-apps/api/core";

/**
 * Wrapper central para chamadas ao Tauri.
 * Qualquer componente ou serviço deve usar essa função, e não a nativa.
 */
export async function invoke<T>(cmd: string, args?: InvokeArgs): Promise<T> {
  try {
    return await tauriInvoke<T>(cmd, args);
  } catch (error) {
    console.error(`[Tauri Error] Falha ao invocar '${cmd}':`, error);
    throw error;
  }
}