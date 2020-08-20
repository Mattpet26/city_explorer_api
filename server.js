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

const app = express();
app.use(cors()); //enables server to talk to local things

const client = new pg.Client(DATABASE_URL);
client.on('error', (error) => console.error(error))
//========================= Routes =========================================
app.get('/location', sendLocationData)
function sendLocationData(request, response){
  const SQLStatement = 'SELECT * FROM locations;';
    client.query(SQLStatement)
      .then(resultFromSQL =>{
        if(resultFromSQL.rowCount > 0){
          response.send(resultFromSQL.rows)
        }else{
          const thingToSearchFor = request.query.city;
          const urlToSearch = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${thingToSearchFor}&format=json`;
        
          superagent.get(urlToSearch)
            .then(whateverComesBack => {
              const superagentResultArray = whateverComesBack.body;
              const constructedLocations = new Locations(superagentResultArray)
              //do another client query that does an insert
              const queryString = 'INSERT INTO locations(thingToSearchFor) VALUES ($1)';
              const valueArray = [thingToSearchFor];
              client.query(queryString, valueArray)
                .then(()=>{
                  response.status(201).send('successfully added to database?')
                })
                response.send(constructedLocations)
            })
            .catch(error => {
              console.log(error);
              response.status(500).send(error.message);
          });
        }
      });
  }

app.get('/weather', sendWeatherData);
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
    console.log(error);
    response.status(500).send(error.message);
  });
}

app.get('/trails', sendTrailData);
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
    console.log(error);
    response.status(500).send(error.message);
  });
}

//=========================== Function =====================================
function Locations(jsonObject){
  this.latitude = jsonObject[0].lat;
  this.longitude = jsonObject[0].lon;
  this.formatted_query = jsonObject[0].display_name;
  this.search_query = jsonObject[0].icon;
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

//================= start the server =======================================
client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`We are running on ${PORT}`));
  });
