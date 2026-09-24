# Proxy de GitHub API para Action Log

Este Worker mantiene la credencial de GitHub en el servidor y reenvía las operaciones de la app. Conserva los archivos JSON actuales y las fotos de mantenimiento.

## Configuración en Cloudflare

1. Creá un Worker llamado action-log-scz1-api y pegá el contenido de index.js.
2. Creá un token Fine-grained de GitHub limitado al repositorio svcescobar/action-log-scz1, con permiso Contents: Read and write. No reutilices el token que quedó expuesto en el HTML.
3. En Cloudflare, guardalo como secret del Worker con nombre GITHUB_TOKEN. No lo guardes en GitHub ni en el frontend.
4. Desplegá el Worker y copiá su URL workers.dev.
5. En index.html, reemplazá el valor de CONFIG.API_URL por esa URL. Revisá que el dominio de GitHub Pages coincida con ALLOWED_ORIGIN en index.js.
6. Recién entonces integrá la rama. La app necesita el Worker disponible para leer y guardar.

## Alcance y acceso

El Worker solo permite leer o actualizar data.json y data-<SVC>.json, y leer, cargar o borrar fotos bajo img/mant/. CORS restringe llamadas desde navegadores al origen de GitHub Pages, pero no autentica a las personas: cualquier cliente puede llamar al endpoint directamente. Se conserva el acceso actual sin autenticación por pedido del propietario; el endpoint puede modificar esos archivos si se publica.

La rotación de la credencial expuesta es independiente de este cambio: revocá el token viejo en GitHub. Eliminarlo de la versión actual no lo borra del historial del repositorio.
