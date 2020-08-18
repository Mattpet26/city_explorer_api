//======================= Packages ==================================
const express = require('express');
const cors = require('cors');
require('dotenv').config();

//====================== Global Variables =================================
const PORT = process.env.PORT || 3003; // short circuiting and chosing port if it exists, otherwise 3003
const app = express();
app.use(cors()); //enables server to talk to local things

//========================= Routes =========================================
app.get('/location', (request, response) =>{
  const jsonObject = require('./data/location.json');
  const constructedLocations = new Locations(jsonObject)

  response.send(constructedLocations)
});

app.get('/weather', sendWeatherData);
function sendWeatherData(request, response){
  const weatherObj = require('./data/weather.json');
  const arrFromJson = weatherObj.data;
  const newArr = [];

  arrFromJson.forEach(objInTheJson =>{
    const newWeather = new Weather(objInTheJson);
    newArr.push(newWeather);
  })
  response.send(newArr);
};

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
  // this.temp = weatherObj[0].data.app_max_temp;
  // this.date = weatherObj[0].data.weather.description;
}

//================= start the server =======================================
app.listen(PORT, () => console.log(`we are running on PORT : ${PORT}`));
