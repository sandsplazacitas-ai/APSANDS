// Conecta el motor de la interfaz con Supabase (base de datos en línea) y la descarga de Excel.
import * as XLSX from "xlsx";
import { supabase } from "./supabase";

export function installShim() {
  window.XLSX = XLSX;
  if (window.claude) return;
  window.claude = {
    async use(name) {
      if (name === "downloads") {
        return {
          async save({ filename, data }) {
            const blob = data instanceof Blob ? data : new Blob([data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          },
        };
      }
      if (name === "db") {
        return {
          doc: () => ({
            async set(value) {
              const { data: { user } } = await supabase.auth.getUser();
              const { error } = await supabase.from("app_state").upsert({
                id: "main", data: value, updated_at: new Date().toISOString(), updated_by: user?.id,
              });
              if (error) throw error;
            },
            onSnapshot(cb, onError) {
              supabase.from("app_state").select("data").eq("id", "main").maybeSingle()
                .then(({ data, error }) => {
                  if (error) return onError && onError(error);
                  cb(data ? { exists: true, data: () => data.data } : { exists: false });
                });
              supabase.channel("app_state_main")
                .on("postgres_changes", { event: "*", schema: "public", table: "app_state" },
                  (p) => p.new && cb({ exists: true, data: () => p.new.data }))
                .subscribe();
            },
          }),
        };
      }
      return null;
    },
  };
}
