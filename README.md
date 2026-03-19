# Checklist de Soporte Técnico con MongoDB Atlas

Proyecto full stack con:
- **Frontend:** HTML, CSS y JavaScript puro
- **Backend:** Node.js + Express
- **Base de datos en la nube:** MongoDB Atlas

## Qué guarda y qué no guarda
- **Sí se guarda:** la lista base de actividades (en MongoDB)
- **No se guarda:** el progreso del checklist, checks marcados y textos escritos por el técnico

## Dónde cambiar las iniciales y el departamento
Abre el archivo:

```bash
public/app.js
```

En la parte superior encontrarás esto:

```js
const USER_INITIALS = 'JDG';
const DEPARTMENT_NAME = 'Soporte Técnico';
```

Ahí cambias:
- `USER_INITIALS` por las iniciales del técnico
- `DEPARTMENT_NAME` por el nombre del departamento

## Cómo levantar el proyecto

### 1) Instala dependencias
```bash
npm install
```

### 2) Crea tu archivo `.env`
Copia el archivo `.env.example` y renómbralo a `.env`

```bash
cp .env.example .env
```

Luego pega tu cadena de conexión de MongoDB Atlas en:

```env
MONGODB_URI=tu_cadena_de_mongodb_atlas
MONGODB_DB=support_checklist
PORT=3000
```

### 3) Ejecuta
```bash
npm start
```

### 4) Abre en navegador
```bash
http://localhost:3000
```

## Estructura del proyecto

```bash
support-checklist-app/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── .env.example
├── package.json
├── server.js
└── README.md
```

## Funciones incluidas
- Diseño moderno y responsivo
- Checklist operativo obligatorio
- Actividades de dos tipos:
  - **check**: solo palomita
  - **text**: requiere captura en textarea
- Estado general que indica si faltan actividades o si todo está completo
- Botón para copiar:
  - texto escrito
  - fecha con formato `19MAR26`
  - nombre del departamento
- Botón para vaciar el checklist actual
- Agregar y eliminar actividades guardadas en la nube
