# Sands Plaza Spa · Sistema de gestión

React + Vite + Supabase, listo para Netlify. Funciona en computadora (menú lateral completo) y en celular/tablet (menú lateral compacto, botones grandes). Se puede "instalar" en el teléfono desde el navegador (Agregar a pantalla de inicio).

## Qué incluye
Caja (servicios, paquetes, productos, descuentos, cupones, factura, calificación con caritas), agenda por horarios, clientes y sesiones, camillas, inventario con alertas de vencimiento y compras, cierre de caja, reportes, metas diaria/mensual, usuarios y roles, exportación a Excel (9 hojas), recordatorios y confirmaciones por WhatsApp.

## 1. Crear la base de datos en Supabase
1. Crea un proyecto en https://supabase.com.
2. Entra a **SQL Editor → New query**, pega todo `supabase/schema.sql` y presiona **Run**.
3. Ve a **Authentication → Users → Add user** y crea un usuario por persona (correo y contraseña). Desactiva "Allow new users to sign up" en Authentication → Providers → Email para que nadie más se registre.
4. Haz administrador al primer usuario (SQL Editor):
   `update profiles set role = 'Administrador' where nombre = 'correo-del-dueño@ejemplo.com';`
   Roles disponibles: `Administrador`, `Vendedor`, `Operario` (los demás usuarios quedan como Operario hasta que los cambies igual).
5. En **Project Settings → API** copia la **Project URL** y la **anon public key**.

## 2. Probar en tu computadora
```bash
cp .env.example .env      # pega ahí la URL y la anon key
npm install
npm run dev
```

## 3. Publicar en Netlify
**Opción A (recomendada):** sube esta carpeta a GitHub → Netlify → *Add new site → Import from Git*. Netlify lee `netlify.toml` (build `npm run build`, carpeta `dist`).
**Opción B:** `npm run build` y arrastra la carpeta `dist` a https://app.netlify.com/drop.

En Netlify, **Site settings → Environment variables**, agrega:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
y vuelve a desplegar. La anon key es pública por diseño; la seguridad la dan las reglas RLS del `schema.sql` y el inicio de sesión.

## Cómo se guardan los datos
Todo el estado (clientes, ventas, citas, inventario, cupones, metas) se guarda en la tabla `app_state` (fila `main`) y se sincroniza en tiempo real entre equipos. Para analizarlos hay vistas tipo tabla: `v_ventas`, `v_clientes`, `v_citas` (Table Editor o conectadas a Excel, Power BI o Looker Studio). El botón **Exportar a Excel** descarga el archivo con las hojas Ventas, Atenciones, Clientes, Sesiones, Inventario, Agenda, Compras, Obsequios, Facturas y Cierre de caja.

## Límites conocidos
- Si dos personas guardan al mismo tiempo, gana la última escritura. El siguiente paso recomendado es separar clientes, ventas, citas e inventario en tablas propias para guardar cambios por registro.
- Los roles limitan el menú y las pantallas, pero las reglas de la base de datos permiten escribir a cualquier usuario con sesión. Para blindarlo por rol hace falta la separación en tablas.
- Las fotos que se suben a servicios y productos no se guardan (solo viven en la sesión). Usa Supabase Storage para persistirlas.
- La factura es una solicitud registrada (hoja "Facturas"); no emite factura legal ni se conecta al SIN.
- WhatsApp abre el mensaje listo; la persona toca "Enviar". El envío automático requiere WhatsApp Business API.
- El motor de la interfaz (`src/legacy/app.js`) es el prototipo migrado tal cual y React lo aloja; migrarlo a componentes React es un paso posterior.
- Este paquete no se pudo compilar en el entorno donde se creó (sin internet). Si `npm run build` muestra algún error, envíamelo.
