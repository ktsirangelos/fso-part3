require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

// Morgan
morgan.token('req-body', function(req) {
  return JSON.stringify(req.body)
})

const decideMorgan = function(req, res, next) {
  if (req.method === 'POST') {
    return morgan(
      ':method :url :status :res[content-length] - :response-time ms :req-body',
    )(req, res, next)
  }
  return morgan('tiny')(req, res, next)
}

// Event handlers
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// Middleware
app.use(cors())
app.use(express.json())
app.use(decideMorgan)
app.use(express.static('build'))

// GET connected to DB
app.get('/api/persons', (request, response) => {
  Person.find({}).then((people) => {
    response.json(people)
  })
})

app.get('/info', (request, response) => {
  Person.find({}).then((people) => {
    response.send(
      `<p>Phonebook has info for ${people.length} people</p><p>` +
      new Date() +
      '</p>',
    )
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => next(error))
})

// POST - Connected to Database
app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (body.name === undefined) {
    return response.status(400).json({
      error: 'name missing',
    })
  }

  if (body.number === undefined) {
    return response.status(400).json({
      error: 'number missing',
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson)
    })
    .catch((error) => next(error))
})

//PUT connected to DB
app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, {
    new: true,
    runValidators: true,
  })
    .then((updatedPerson) => {
      response.json(updatedPerson)
    })
    .catch((error) => next(error))
})

//DELETE connected to DB
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch((error) => next(error))
  response.status(204).end()
})

//Last middleware
app.use(unknownEndpoint)
app.use(errorHandler)

// Port
const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
