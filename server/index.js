require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const gradosRoutes = require('./routes/grados');
const alumnosRoutes = require('./routes/alumnos');
const restriccionesRoutes = require('./routes/restricciones');
const sorteoRoutes = require('./routes/sorteo');

const app = express();

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-cambia-esto',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
    },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/grados', gradosRoutes);
app.use('/api', alumnosRoutes);
app.use('/api', restriccionesRoutes);
app.use('/api', sorteoRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor escuchando en http://localhost:${process.env.PORT || 3000}`);
});
