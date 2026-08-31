# Módulo Dispensario

Sistema de control de pacientes, recetas, producción y stock, con la web
instalable como PWA. Vive en `/admin/dispensario` y solo lo ve el correo
configurado en `ADMIN_EMAIL`.

## Estado de la configuración

Ya hecho y verificado contra el proyecto de Supabase:

- **Tablas creadas** — las siete tablas, la vista `batch_stock` y las políticas
  RLS ya están aplicadas. Se comprobó que la clave anónima no puede leer
  ninguna: los datos clínicos solo son accesibles con la service role key,
  que vive en el servidor.
- **Restricciones de integridad aplicadas** (`supabase/dispensario-hardening.sql`).
  Si reinstalas en otra base, ejecuta ese archivo **después** de
  `dispensario.sql`. Añade: prohibición de borrar un paciente con historial,
  obligación de indicar lote en toda entrada o salida, concordancia entre el
  signo de un movimiento y su tipo, rangos válidos en la posología, y copia del
  RUT y el folio dentro de cada movimiento para que la trazabilidad sobreviva a
  cualquier borrado.
- **Bucket `recetas`** — creado como privado, con límite de 10 MB y limitado a
  PDF, JPG, PNG, WEBP y HEIC. El bucket `productos` que ya existía es público y
  no sirve para esto: los documentos traen RUT, diagnóstico y domicilio. El
  acceso pasa siempre por `/api/admin/recetas/documento`, que valida sesión de
  admin y devuelve una URL firmada que vence en 5 minutos.
- **`CRON_SECRET`** — generado y guardado en `.env.local`.
- **Claves VAPID** — generadas y guardadas en `.env.local`
  (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- **`vercel.json`** — cron diario a las 12:00 UTC (08:00 en Chile).

### Lo único pendiente: variables en Vercel

Las cuatro variables nuevas están en `.env.local` pero **no** en el proyecto de
Vercel, porque la sesión local de la CLI pertenece a otra cuenta y no tiene
acceso al proyecto `comunidadFungi/web`.

Con la cuenta correcta:

```bash
vercel login
vercel link
./scripts/sync-vercel-env.sh production
vercel --prod
```

El script lee los valores de `.env.local` y los sube, para no copiar secretos a
mano. Alternativa: añadirlas desde el panel de Vercel → Settings → Environment
Variables.

Vercel Cron envía por su cuenta la cabecera `Authorization: Bearer $CRON_SECRET`
cuando esa variable existe en el proyecto, que es justo lo que valida el
endpoint. Sin la variable, el endpoint responde 401 a todo: queda cerrado, no
abierto.

## Cómo se registra una posología

El cálculo de consumo es el núcleo del módulo (`src/lib/posology.ts`). Cubre
los cuatro formatos de receta que llegan al dispensario:

| Esquema | Cuándo usarlo | Ejemplo real |
|---|---|---|
| **Todos los días** | Sin descansos | «1 cápsula cada 24 horas» |
| **N días por semana** | Descanso semanal fijo | «5 cápsulas al día, 6 veces a la semana» |
| **Ciclo** | Días de toma y de descanso | «un día sí, un día no» (1 y 1); «tomar 4 días y suspender 3» (4 y 3) |
| **Cuota mensual** | La receta fija un total al mes | «dosis mensual: 10.000 mg» |

A partir de eso el sistema calcula consumo diario, semanal, mensual y total
del tratamiento, en gramos y en unidades, y lo suma entre todos los pacientes
para obtener el requerimiento de producción.

Los meses usan 30,436875 días (365,2425 ÷ 12) en vez de 30, para que un
tratamiento de un año no acumule días de deriva.

### Total declarado vs. calculado

Muchas recetas escriben su propio total («= 60 cápsulas», «equivalentes a 180
cápsulas anuales»). Ese número es el tope legalmente dispensable y no siempre
coincide con el cálculo teórico.

El campo **Total declarado** guarda lo que dice la receta. Si se aleja más de
un 10% del cálculo, el panel lo marca como discrepancia. Para dispensar manda
siempre lo declarado.

Ejemplo real: una receta de 0,1 g cada 24 h, 4 días de toma y 3 de descanso
por 3 meses da 52 cápsulas calculadas, pero la receta declara 60.

## Stock

El saldo es la suma de los movimientos, no un campo editable. Guardar un lote
de producción **no** genera stock: hay que registrar un movimiento de tipo
*Entrada de producción* desde la sección Stock.

Las entradas y devoluciones suman; las dispensaciones y mermas restan (el
signo lo aplica el servidor). El *ajuste* es el único tipo que admite signo
libre, para correcciones de inventario, y el único que puede ir sin lote.

Tres reglas que el sistema hace cumplir, no solo muestra:

- **Todo movimiento de existencias indica un lote.** Sin él quedaría fuera del
  saldo: se dispensaría producto y el inventario no bajaría.
- **No se puede dispensar más de lo que autoriza la receta.** Se comprueba lo
  ya entregado —convirtiendo gramos a unidades y descontando devoluciones—
  antes de escribir.
- **Un lote no puede quedar en negativo.** La salida se rechaza si excede el
  saldo disponible.

Los movimientos no se borran, se **anulan** con otro de signo contrario: un
libro de inventario editable a posteriori no sirve ante una fiscalización.

## Zona horaria

El servidor de Vercel corre en UTC y el dispensario opera en Chile. Todo el
cálculo de vencimientos deriva «hoy» explícitamente en `America/Santiago`
(`todayKey()` en `src/lib/posology.ts`). Sin eso, entre las 20:00 y la
medianoche chilena toda receta que vence hoy se leía como vencida ayer, y el
cron llegaba a escribirlo en la base.

## PWA

El manifiesto (`src/app/manifest.ts`) arranca en `/admin/dispensario` y la app
se instala desde el aviso que aparece en el panel. En iOS hay que usar
Compartir → «Agregar a inicio»; Safari no admite instalación automática.

El service worker (`public/sw.js`) **no cachea las páginas del dispensario**:
mostrar stock o dosis desactualizados sería peor que mostrar un aviso de sin
conexión. Solo precachea la página `/offline` y los iconos, y gestiona las
notificaciones push.

## Alertas de vencimiento

El cron diario (`/api/cron/alertas-recetas`) hace tres cosas:

1. Marca como vencidas las recetas vigentes cuya fecha ya pasó.
2. Registra los avisos de 30, 15, 7 y 0 días en `prescription_alerts`, sin
   repetir los ya emitidos.
3. Envía una notificación push con el resumen del día a los dispositivos
   suscritos, y devuelve el detalle en la respuesta.

En el panel hay un interruptor para activar los avisos en cada dispositivo,
con un botón de prueba. Las suscripciones muertas (el navegador responde 404 o
410 cuando alguien desinstala la app) se borran solas.

Las notificaciones **solo funcionan en el sitio publicado**: en desarrollo el
service worker está desactivado a propósito porque interfiere con la recarga en
caliente, y el panel lo indica en vez de fallar en silencio.

Hoy los avisos llegan a Carolina. Para avisar también al paciente hace falta un
canal hacia él (correo o WhatsApp): el sistema ya guarda su contacto y el cron
lo devuelve en el campo `contacto` de cada aviso, listo para engancharlo.
