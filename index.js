const express = require("express");
const path = require("path");
const { Server } = require("socket.io");
const { createServer } = require("http");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  path: "/rea-time",
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use("/", express.static(path.join(__dirname, "app1")));

let users = [];
let rolesDisponibles = ["Marco", "Polo", "Polo Especial"];
let gritosdepolos = []

app.get("/users", (req, res) => {
  res.json(users);
});

app.post("/users", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: "El nombre es requerido." });
  }

  if (users.some((user) => user.name === name)) {
    return res.status(400).json({ success: false, message: "El nombre ya está en uso." });
  }

  if (rolesDisponibles.length === 0) {
    rolesDisponibles = ["Marco", "Polo", "Polo Especial"];
  }

  const assignedRoleIndex = Math.floor(Math.random() * rolesDisponibles.length);
  const assignedRole = rolesDisponibles.splice(assignedRoleIndex, 1)[0];

  const user = { id: Date.now(), name, role: assignedRole, socketId: null };
  users.push(user);

  console.log("Usuarios registrados:", users);

  res.json({ success: true, message: "Usuario registrado con éxito.", role: assignedRole });
});

io.on("connection", (socket) => {
  console.log("Nuevo usuario conectado:", socket.id);

  socket.on("registrar-socket", (userName) => {
    const user = users.find((u) => u.name === userName);
    if (user) {
      user.socketId = socket.id;
    }
    io.emit("usuarios-actualizados", users.length);
  });

  app.post("/gritar", (req, res) => {
    const { name } = req.body;
    const user = users.find((u) => u.name === name);

    if (user) {
      if (user.role === "Marco") {
        console.log(`${user.name} gritó: ¡Marco!`);
        io.emit("coordenadas", { message: `¡Marco!` });
      } else if (user.role === "Polo" || user.role === "Polo Especial") {
        console.log(`${user.name} respondió: ¡Polo!`);
        gritosdepolos.push({ role: user.role,name: user.name, message: "¡Polo!" });
        io.emit("gritos-polos-actualizados", gritosdepolos);
      }
    }

    res.json({ success: true, message: "Grito enviado." });
  });

  console.log(gritosdepolos)

  socket.on("resultado-juego", (resultado) => {
    io.emit("mostrar-resultado", resultado);
  });

  socket.on("coordenadas", (data) => {
    const user = users.find((u) => u.socketId === socket.id);

    if (user) {
      if (user.role === "Marco") {
        console.log(`${user.name} gritó: ¡Marco!`);
        io.emit("coordenadas", { message: `${user.name} gritó: ¡Marco!` });
      } else if (user.role === "Polo" || user.role === "Polo Especial") {
        console.log(`${user.name} respondió: ¡Polo!`);
        gritosdepolos.push({ name: user.name, message: "¡Polo!" });
        io.emit("coordenadas", { message: `${user.name} gritó: ¡Polo!` });
      }
    }
  });



  socket.on("notificar-a-todos", (mensaje) => {
    io.emit("notificacion", { message: mensaje });
  });

  socket.on("disconnect", () => {
    const userIndex = users.findIndex(user => user.socketId === socket.id);
    if (userIndex !== -1) {

      rolesDisponibles.push(users[userIndex].role);
      users.splice(userIndex, 1);
    }

    console.log(`Usuario desconectado: ${socket.id}`);
    io.emit("usuarios-actualizados", users.length);
  });
});

httpServer.listen(5050, () => {
  console.log("Servidor corriendo en http://localhost:5050");
});
