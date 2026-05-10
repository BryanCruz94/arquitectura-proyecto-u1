
Flujo principal:

1. Gateway recibe la busqueda del usuario.
2. Cleaning Filter limpia caracteres especiales.
3. Normalization Filter normaliza el texto.
4. Tokenization Filter genera tokens y elimina stopwords.
5. Persistence Filter guarda en MySQL el texto original y los tokens generados.
6. Search TXT Filter busca coincidencias en archivos `.txt`.
7. Search PDF Filter busca coincidencias en archivos `.pdf`.
8. Gateway combina y devuelve los resultados.

## Requisitos

- Node.js instalado.
- MySQL ejecutandose en `127.0.0.1:3306`.
- Usuario MySQL: `root`.
- Password MySQL: `admin1234`.

Antes de ejecutar el proyecto, instalar dependencias:

```bash
npm install
```

El archivo `.env` debe contener la configuracion de MySQL y del filtro de
persistencia:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=admin1234
MYSQL_DATABASE=pipeline_search
PERSISTENCE_FILTER_PORT=4007
```

El filtro de persistencia crea automaticamente la base de datos
`pipeline_search` y la tabla `busquedas` si no existen.

## Opcion 1: ejecutar todo con npm

Esta es la forma recomendada, porque levanta todos los servicios necesarios en
una sola terminal usando `concurrently`.

```bash
npm run start
```

Este comando inicia:

- Cleaning Filter en `http://localhost:4001`
- Normalization Filter en `http://localhost:4002`
- Tokenization Filter en `http://localhost:4003`
- Persistence Filter en `http://localhost:4007`
- Search TXT Filter en `http://localhost:4004`
- Search PDF Filter en `http://localhost:4005`
- Gateway principal en `http://localhost:4000`
- Servicio de carga de archivos en `http://localhost:4006`

El frontend consume principalmente el Gateway `4000` para busquedas y el
servicio `4006` para subir o administrar archivos.

## Opcion 2: ejecutar cada servicio manualmente

Tambien se puede iniciar cada servicio por separado. Esta opcion es util para
explicar la arquitectura en una exposicion, porque permite mostrar que cada
filtro es un proceso independiente.

Abrir una terminal diferente para cada comando:

```bash
node filters/cleaning-filter/server.js
```

```bash
node filters/normalization-filter/server.js
```

```bash
node filters/tokenization-filter/server.js
```

```bash
node filters/persistence-filter/server.js
```

```bash
node filters/search-txt-filter/server.js
```

```bash
node filters/search-pdf-filter/server.js
```

```bash
node gateway/server.js
```

```bash
node gateway/server-upload.js
```
