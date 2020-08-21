//======================= Packages ==================================
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config();
const pg = require('pg');
const { response } = require('express');
const request = require('superagent');

//====================== Global Variables =================================
const PORT = process.env.PORT || 3003; // short circuiting and chosing port if it exists, otherwise 3003
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;

const app = express();
app.use(cors()); //enables server to talk to local things

const client = new pg.Client(DATABASE_URL);
client.on('error', (error) => console.error(error))

//========================= Routes =========================================================================================
app.get('/location', sendLocationData)
app.get('/weather', sendWeatherData);
app.get('/trails', sendTrailData);
app.get('/movies', sendMoviesData);
app.get('/yelp', sendYelpData);

//========================= Route Handlers =====================================================================================
function sendLocationData(request, response){
  const thingToSearchFor = request.query.city;
  const urlToSearch = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${thingToSearchFor}&format=json`;

  client.query( 'SELECT * FROM locations WHERE search_query=$1', [thingToSearchFor])
    .then(resultFromSQL =>{
      if(resultFromSQL.rowCount === 1){
        response.send(resultFromSQL.rows[0])
      }else{
        superagent.get(urlToSearch)
          .then(whateverComesBack => {
            const superagentResultArray = whateverComesBack.body;
            const constructedLocations = new Locations(superagentResultArray, thingToSearchFor)

            const queryString = 'INSERT INTO locations(search_query, latitude, longitude, formatted_query) VALUES ($1, $2, $3, $4)';
            const valueArray = [constructedLocations.search_query, constructedLocations.latitude, constructedLocations.longitude, constructedLocations.formatted_query];
            client.query(queryString, valueArray)
              .then(()=>{
                response.status(201).send(constructedLocations)
              })
          })
          .catch(error => {
            console.log(error);
            response.status(500).send(error.message);
        });
      }
    });
  }

  
function sendWeatherData(request, response){
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
  const urlToSearchWeather = `https://api.weatherbit.io/v2.0/forecast/daily?&lat=${latitude}&lon=${longitude}&key=${WEATHER_API_KEY}`;

  superagent.get(urlToSearchWeather)
  .then(weatherComingBack => {
    const weatherPass = weatherComingBack.body.data;
    const weatherArr = weatherPass.map(index => new Weather(index));
    response.send(weatherArr)
  })
  .catch(error => {
    console.log(error.message);
    response.status(500).send(error.message);
  });
}


function sendTrailData(request, response){
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
  const urlToTrails = `https://www.hikingproject.com/data/get-trails?&lat=${latitude}&lon=${longitude}&maxDistance=10&key=${TRAIL_API_KEY}`;

  superagent.get(urlToTrails)
  .then(trailsComingBack => {
    const trailsPass = trailsComingBack.body.trails;
    const trailsArr = trailsPass.map(index => new Trails(index));
    response.send(trailsArr)
  })
  .catch(error => {
    console.log(error.message);
    response.status(500).send(error.message);
  });
}


function sendMoviesData(request, response){
  const thingToSearchFor = request.query.search_query;
  //store in search query
  const urlToMovies = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&query=${thingToSearchFor}`;

  superagent.get(urlToMovies)
  .then(moviesComingBack => {
    const moviePass = moviesComingBack.body.results;
    const moviesArr = moviePass.map(index => new Movies(index));
    response.send(moviesArr)
  })
  .catch(error => {
    console.log(error.message);
    response.status(500).send(error.message);
  });
}


function sendYelpData(request, response){
  // const thingToSearchFor = request.query.search_query;
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
  const urlToYelp = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${latitude}&longitude=${longitude}&start=${request.query.page *5}`;

  superagent.get(urlToYelp)
  .set('Authorization', `Bearer ${YELP_API_KEY}`)
  .then(yelpComingBack => {
    console.log(yelpComingBack.body)
    const yelpPass = yelpComingBack.body.businesses;
    const yelpArr = yelpPass.map(index => new Yelp(index));
    response.send(yelpArr)
  })
  .catch(error => {
    console.log(error.message);
    response.status(500).send(error.message);
  });
}

//================================================================ Function =============================================================
function Locations(jsonObject, query){
  this.latitude = jsonObject[0].lat;
  this.longitude = jsonObject[0].lon;
  this.formatted_query = jsonObject[0].display_name;
  this.search_query = query;
}

function Weather(weatherObj){
  this.forecast = weatherObj.weather.description;
  this.time = weatherObj.valid_date;
}

function Trails(jsonObject){
  this.name = jsonObject.name;
  this.length = jsonObject.length;
  this.summary = jsonObject.summary;
}

function Movies(jsonObject){
  this.title = jsonObject.title;
  this.overview = jsonObject.overview;
  this.average_votes = jsonObject.vote_average;
  this.total_votes = jsonObject.vote_count;
  // this.image_url = jsonObject.image_url;
  this.popularity = jsonObject.popularity;
  this.released_on = jsonObject.release_date;
}


function Yelp(jsonObject){
  this.name = jsonObject.name;
  this.image_url = jsonObject.image_url;
  this.price = jsonObject.price;
  this.rating = jsonObject.rating;
  this.url = jsonObject.url;
}

//=============================================================== start the server ======================================================================
client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`We are running on ${PORT}`));
  });
