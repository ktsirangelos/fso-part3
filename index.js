require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const Person = require("./models/person");

// Morgan
morgan.token("req-body", function(req) {
  return JSON.stringify(req.body);
});

const decideMorgan = function(req, res, next) {
  if (req.method === "POST") {
    return morgan(
      ":method :url :status :res[content-length] - :response-time ms :req-body",
    )(req, res, next);
  }
  return morgan("tiny")(req, res, next);
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(decideMorgan);
app.use(express.static("build"));

// GET
app.get("/", (request, response) => {
  response.send("<h1>Hello World!</h1>");
});

// Connected to Database
app.get("/api/persons", (request, response) => {
  Person.find({}).then((people) => {
    response.json(people);
  });
});

app.get("/info", (request, response) => {
  response.send(
    "<p>Phonebook has info for 2 people</p><p>" + new Date() + "</p>",
  );
});

app.get("/api/persons/:id", (request, response) => {
  const id = Number(request.params.id);
  const person = persons.find((person) => person.id === id);

  if (person) {
    response.json(person);
  } else {
    response.status(404).end();
  }
});

// DELETE
app.delete("/api/persons/:id", (request, response) => {
  const id = Number(request.params.id);
  persons = persons.filter((person) => person.id !== id);

  response.status(204).end();
});

function generateId(max) {
  return Math.floor(Math.random() * max);
}

// POST - Connected to Database
app.post("/api/persons", (request, response) => {
  const body = request.body;

  if (body.name === undefined) {
    return response.status(400).json({
      error: "name missing",
    });
  }

  const person = new Person({
    name: body.name,
    number: body.number || false,
  });

  person.save().then((savedPerson) => {
    response.json(savedPerson);
  });
});

// Port
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
