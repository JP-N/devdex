var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var app = express();

const db = require('./db');

app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to handle the database connection
const dbMiddleware = (req, res, next) => {

  // Creating a new pool
  if (!req.dbClient) {
    req.dbClient = db.createPool();
  }

  next();

};

// Middleware to time requests
const timingMiddleware = (req, res, next) => {

  const start = Date.now();

  res.on('finish', () => {

    const end = Date.now();
    const duration = end - start;
    console.log(`Request to ${req.path} took ${duration} ms`);

  });

  next();

};

// Middleware to track the page load time
const pageLoadTimingMiddleware = (req, res, next) => {

  const start = Date.now();

  res.on('finish', () => {

    const end = Date.now();
    const duration = end - start;
    console.log(`Page ${req.path} loaded in ${duration} ms`);

  });

  next();

};

// Main page load
app.get('/', dbMiddleware, timingMiddleware, pageLoadTimingMiddleware, async (req, res) => {

  try {

    const result = await req.dbClient.query('SELECT * FROM maindevdex ORDER BY visits DESC LIMIT 8');
    const maindevdex = result.rows || [];

    res.render('index', { maindevdex });

  } catch (err) {

    console.error('Error fetching data from the database:', err);
    res.status(500).send('Error fetching data from the database.');

  }

});

// Update visit stats for featured
app.post('/increment-value/:entryId', dbMiddleware, async (req, res) => {

  const entryId = req.params.entryId;

  try {

    console.log('Attempting to update database.');
    await req.dbClient.query('UPDATE maindevdex SET visits = visits + 1 WHERE id = $1', [entryId]);
    console.log('Database updated successfully.');
    res.sendStatus(200);

  } catch (err) {

    console.error('Error updating database:', err);
    res.status(500).send('Error updating database.');

  }

});

app.post('/search', dbMiddleware, async (req, res) => {
  const searchQuery = req.body.searchQuery;

  try {
    const searchResults = await req.dbClient.query(
        `SELECT * FROM maindevdex WHERE
      name ILIKE $1 OR stack ILIKE $1 OR category ILIKE $1
      ORDER BY visits DESC LIMIT 8`,
        [`%${searchQuery}%`]
    );

    res.render('searchResults', { searchResults: searchResults.rows });
  } catch (err) {
    console.error('Error searching the database:', err);
    res.status(500).send('Error searching the database.');
  }
});


// Error handling middleware
app.use((err, req, res, next) => {

  console.error('Internal Server Error:', err);
  res.status(500).send('Internal Server Error');

});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
