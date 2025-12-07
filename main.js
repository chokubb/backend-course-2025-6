const http = require("http");
const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const { Command } = require("commander");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const program = new Command();
program
  .requiredOption("-h, --host <host>", "server host")
  .requiredOption("-p, --port <port>", "server port", v => parseInt(v, 10))
  .requiredOption("-c, --cache <dir>", "cache directory");
program.parse(process.argv);
const opts = program.opts();

if (!fs.existsSync(opts.cache)) {
  fs.mkdirSync(opts.cache, { recursive: true });
  console.log(`Створено директорію кешу: ${path.resolve(opts.cache)}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger config
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Inventory Service API",
      version: "1.0.0",
      description: "Лабораторна робота №6"
    },
    servers: [{ url: `http://${opts.host}:${opts.port}` }]
  },
  apis: ["./docs.js"]
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, opts.cache),
  filename: (req, file, cb) => {
    const safeName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safeName);
  }
});
const upload = multer({ storage });

const inventory = [];
let nextId = 1;

function makeItemDto(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    photoUrl: item.photo ? `/inventory/${item.id}/photo` : null
  };
}

function findItem(id) {
  return inventory.find(x => x.id === id);
}

// форми
app.get("/RegisterForm.html", (req, res) => {
  res.sendFile(path.join(__dirname, "RegisterForm.html"));
});

app.get("/SearchForm.html", (req, res) => {
  res.sendFile(path.join(__dirname, "SearchForm.html"));
});

// POST /register: multipart/form-data
app.post("/register", upload.single("photo"), (req, res) => {
  const name = (req.body.inventory_name || "").trim();
  const description = req.body.description || "";
  if (!name) {
    return res.status(400).send("Bad Request: inventory_name is required");
  }
  const item = {
    id: String(nextId++),
    name,
    description,
    photo: req.file ? req.file.filename : null
  };
  inventory.push(item);
  res.status(201).json(makeItemDto(item));
});

// GET /inventory: список всіх
app.get("/inventory", (req, res) => {
  res.json(inventory.map(makeItemDto));
});

// GET /inventory/:id
app.get("/inventory/:id", (req, res) => {
  const item = findItem(req.params.id);
  if (!item) return res.sendStatus(404);
  res.json(makeItemDto(item));
});

// PUT /inventory/:id: оновити name/description (JSON)
app.put("/inventory/:id", (req, res) => {
  const item = findItem(req.params.id);
  if (!item) return res.sendStatus(404);
  if (typeof req.body.inventory_name === "string") {
    item.name = req.body.inventory_name;
  }
  if (typeof req.body.description === "string") {
    item.description = req.body.description;
  }
  res.json(makeItemDto(item));
});

// GET /inventory/:id/photo
app.get("/inventory/:id/photo", (req, res) => {
  const item = findItem(req.params.id);
  if (!item || !item.photo) return res.sendStatus(404);
  const filePath = path.resolve(opts.cache, item.photo);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  res.type("jpeg");
  res.sendFile(filePath);
});

// PUT /inventory/:id/photo
app.put("/inventory/:id/photo", upload.single("photo"), (req, res) => {
  const item = findItem(req.params.id);
  if (!item) return res.sendStatus(404);
  if (!req.file) return res.status(400).send("Photo is required");
  item.photo = req.file.filename;
  res.json(makeItemDto(item));
});

// DELETE /inventory/:id
app.delete("/inventory/:id", (req, res) => {
  const idx = inventory.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.sendStatus(404);
  const [item] = inventory.splice(idx, 1);
  if (item.photo) {
    const filePath = path.join(opts.cache, item.photo);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  res.sendStatus(200);
});

// /search з HTML-форми (GET x-www-form-urlencoded)
app.get("/search", (req, res) => {
  const id = req.query.id;
  const item = findItem(id);
  if (!item) return res.sendStatus(404);
  const includePhoto = req.query.includePhoto || req.query.has_photo;
  let text = item.description || "";
  if (includePhoto && item.photo) {
    text += ` Photo: /inventory/${item.id}/photo`;
  }
  res.send(text || "No description");
});

// fallback на 405 для невідомих методів
app.use((req, res) => {
  res.status(405).send("Method Not Allowed");
});

const server = http.createServer(app);
server.listen(opts.port, opts.host, () => {
  console.log(`Yay!! Server running at http://${opts.host}:${opts.port}/`);
});