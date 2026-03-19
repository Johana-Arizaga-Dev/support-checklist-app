require('dotenv').config();
const path = require('path');
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'support_checklist';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let collection;

async function connectMongo() {
  if (!MONGODB_URI) {
    throw new Error('Falta la variable MONGODB_URI en el archivo .env');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  collection = db.collection('activities');

  await collection.createIndex({ createdAt: 1 });
}

app.get('/api/activities', async (_req, res) => {
  try {
    const items = await collection.find({}).sort({ createdAt: 1 }).toArray();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'No se pudieron obtener las actividades.' });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const { label, type } = req.body;

    if (!label || typeof label !== 'string' || !label.trim()) {
      return res.status(400).json({ message: 'La actividad es obligatoria.' });
    }

    if (!['check', 'text'].includes(type)) {
      return res.status(400).json({ message: 'El tipo debe ser check o text.' });
    }

    const newItem = {
      label: label.trim(),
      type,
      createdAt: new Date()
    };

    const result = await collection.insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo guardar la actividad.' });
  }
});

app.delete('/api/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Actividad no encontrada.' });
    }

    res.json({ message: 'Actividad eliminada.' });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo eliminar la actividad.' });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor listo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al conectar con MongoDB:', error.message);
    process.exit(1);
  });
