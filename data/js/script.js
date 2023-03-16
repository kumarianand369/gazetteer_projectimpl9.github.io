$(window).on('load', function () {


  // initialize current country object
  const currentCountry = {};
 
  
  // || Fill dropdown with country data

  $.ajax({
    url: "libs/php/countryNames.php",
    type: 'GET',
    dataType: 'json',
    
    success: function(result) {

      if (result.status.name === "ok") {

        // if data returned, append countries to dropdown menu
        result.data.forEach(country => {
          $('#countryList').append(`<button class="dropdown-item" type="button" value="${country.iso}">${country.name}</button>`);
        })
      }
    
    },
    error: function(jqXHR, textStatus, errorThrown) {
      
      // handle errors
      console.error('There was a problem when fetching the countryNames data: ');
      console.error(textStatus, errorThrown);
      console.error(jqXHR.responseText);

    }
  });


  // || Initialize map

  const map = L.map('map').setView([51.505, -0.09], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	  maxZoom: 19,
	  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
  }).addTo(map);



  // * || Get  data from APIs 


  // || Get user location and set initial currentCountry

  // geolocation success callback - get user country (called below)
  const geoLocationSuccess = (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // get users country by calling php routine to call openCage api to reverse geocode user location
    $.ajax({
      url: "libs/php/initialCountry.php",
      type: 'POST',
      dataType: 'json',
      data: {
        lat: lat,
        lng: lng
      },
  
      success: function(result) {
  
        if (result.status.name == "ok") {
  
          // set current country properties for user's location
          currentCountry.name = result.country;
          currentCountry.iso2 = result.iso2Code;
          currentCountry.iso3 = result.iso3Code;
          
          // set dropdown value, triggering API calls
          $('#selectedCountry').html(currentCountry.name).change();

        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        
        // handle errors
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
      
      }
    });

  };

  // geolocation failure callback - set currentCountry to default (uk)
  const geoLocationFailure = () => {
    
    console.log('geolocation getPosition() failed');
    currentCountry.name = 'United Kingdom';
    currentCountry.iso2 = 'GB';
    currentCountry.iso3 = 'GBR';

    // set dropdown value, triggering API calls
    $('#selectedCountry').html(currentCountry.name).change();


  };

  // check if geolocation is available in user agent
  if('geolocation' in navigator) {
    
    // geolocation is available - get coords
    navigator.geolocation.getCurrentPosition(geoLocationSuccess, geoLocationFailure);
      
  } else {
      // geolocation IS NOT available - set currentCountry to default (uk)
      console.log('geolocation is not available');
      currentCountry.name = 'United Kingdom';
      currentCountry.iso2 = 'GB';
      currentCountry.iso3 = 'GBR';
     
      // set dropdown value, triggering API calls
      $('#selectedCountry').html(currentCountry.name).change();

  };


  // When user clicks on dropdown menu, values are stored for API calls

  $("body").on('click', '.dropdown-item', function () {

    currentCountry.iso2 = $(this).val();
    currentCountry.name = $(this).html();
    
    $('#selectedCountry').html(currentCountry.name).change();

  });



  // || get current country border coords and display country data as geoJSON layer on map
  
  // called after user location has been established, or when user selects a new country to view

  $('#selectedCountry').change(function() {

    // disable country dropdown until data has loaded and display loading spinner
    $('#selectedCountry').prop('disabled', 'true');
    $('#selectedCountry').html('<div class="fa-3x" id="loading-icon"><i class="fa-solid fa-cog fa-2xs fa-spin"></i></div>');



    // disable buttons until data has loaded
    generalInfoButton.disable();
    weatherButton.disable();
    newsButton.disable();
    covidButton.disable();
    imageButton.disable();
    wikipediaButton.disable();
    webcamButton.disable();

    // reset values
    currentCountry.capital,
    currentCountry.population,
    currentCountry.continent,
    currentCountry.area,
    currentCountry.north,
    currentCountry.east,
    currentCountry.south,
    currentCountry.west,
    currentCountry.capitalCoords,
    currentCountry.currency,
    currentCountry.weather,
    currentCountry.news,
    currentCountry.lifeExpectancy,
    currentCountry.exchangeRate,
    currentCountry.holidays = undefined;

    // ajax call to php routine which will return selected country border coordinates
    $.ajax({
      url: "libs/php/getBorders.php",
      type: 'GET',
      dataType: 'json',
      data: {
        iso: currentCountry.iso2
      },
  
      success: function(result) {

        if (result.status.name === "ok") {

          currentCountry.borderCoords = result.data.geometry.coordinates;

          // clear any existing border data from map
          if(currentCountry.borders !== undefined) {
            currentCountry.borders.clearLayers();
          }
          
          // create borders geoJSON layer and add to the map
          currentCountry.borders = L.geoJSON(result.data, {color: 'rgb(51, 101, 138)', fillColor: 'rgb(245, 184, 65)'});
          currentCountry.borders.addTo(map);
          
          // enable border toggle button
          borderButton.enable();

          // Fade out preloader
          if ($('#preloader').length) {

            $('#preloader').delay(1000).fadeOut('slow', function () {
              $(this).remove();
            });

          }

          // get general geonames data
          getGeneralInfo();

          // zoom the map to the current country
          map.fitBounds(currentCountry.borders.getBounds());
        
        }
    
      },
      error: function(jqXHR, textStatus, errorThrown) {

        // call next API
        getGeneralInfo();

        // handle errors
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
      
      }

    });

  });

  
  
  // || Get and display general information - geonames API

  // displays country name, flag, population, capital, continent, area in sq km in legend on map
  // also sets currentCountry properties for capital name for requests to other APIs
  // gets flag image from https://flagpedia.net

  const getGeneralInfo = () => {

    $.ajax({
      url: "libs/php/getGeoNamesData.php",
      type: 'GET',
      dataType: 'json',
      data: {
        name: currentCountry.name,
        iso: currentCountry.iso2
      },
  
      success: function(result) {

        if (result.status.name == "ok") {

          // store data for display and future API calls
          currentCountry.iso3 = result.data.isoAlpha3
          currentCountry.name = result.data.countryName;
          currentCountry.capital = result.data.capital;
          currentCountry.population = result.data.population; 
          currentCountry.continent = result.data.continentName;
          currentCountry.area = result.data.areaInSqKm;
        
          // store bounds for wikipedia API request
          currentCountry.north = result.data.north;
          currentCountry.east = result.data.east;
          currentCountry.south = result.data.south;
          currentCountry.west = result.data.west;
          
          // get opencage data
          getOpenCageData();

        }
      },
      error: function(jqXHR, textStatus, errorThrown) {

        // show user freindly error message
        displayAPIError('Country info');

        // handle errors
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
      
      }
    });

  }

  // || get capital city coordinates for future API requests - Open Cage API
  
  // returns the coordinates of the capital city and the country's currency
 
  const getOpenCageData = () => {

    $.ajax({
      url: "libs/php/getOpenCageData.php",
      type: 'GET',
      dataType: 'json',
      data: {
        name: encodeURIComponent(currentCountry.name),
        iso: currentCountry.iso2,
        capital: encodeURIComponent(currentCountry.capital)
      },
  
      success: function(result) {
  
        if (result.status.name == "ok") {

          // store data
          currentCountry.capitalCoords = result.coordinates.geometry.coordinates;
          currentCountry.currency = result.coordinates.properties.annotations.currency;

          // call open weather api with capital city coordinates
          getOpenWeatherData(currentCountry.capitalCoords[1], currentCountry.capitalCoords[0]);

        }
      },
      error: function(jqXHR, textStatus, errorThrown) {

        // show user freindly error message
        displayAPIError('Capital coordinates');

        // call get exchange rates
        getExchangeRates();
        
        // handle errors
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
      
      }
    });

  };


  // || Get weather data for capital city - Open Weather API

  const getOpenWeatherData = (lat, lng) => {

    $.ajax({
      url: "libs/php/getOpenWeatherData.php",
      type: 'GET',
      dataType: 'json',
      data: {
        lat: lat,
        lng: lng
      },
  
      success: function(result) {

        // if API returns 'wrong latitude' try again, with the lat and lng reversed (an issue with the openCage data)
        if (result.data.cod === "400") {
          getOpenWeatherData(lng, lat);
        } else {
          if (result.status.name == "ok") {
            currentCountry.weather = result.data;

            // enable weather button
            weatherButton.enable();

            // call get exchange rates
            getExchangeRates();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {

        // show user freindly error message
        displayAPIError('Weather forecast');

        // call get exchange rates
        getExchangeRates();
        
        // handle errors
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);      
      }
    });

  };


  
  // || Get and display exchange rates

  // returns exchange rates in USD (free open exchange rate account only allows USD base currency)

  const getExchangeRates = () => {

    currentCountry.exchangeRate = null;

    $.ajax({
      url: "libs/php/getExchangeRates.php",
      type: 'GET',
      dataType: 'json',
      data: {
        currency: currentCountry.currency.iso_code
      },
  
      success: function(result) {
  
        if (result.status.name == "ok") {
  
          // assign currency values
          const code = currentCountry.currency.iso_code;
          const rate = result.data.rates[code];
          const fixed = (Math.round(rate * 100) / 100).toFixed(2);
          currentCountry.exchangeRate = fixed;

          // call getWikipediaArticles
          getWikipediaArticles();

        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // handle errors

        // show user freindly error message
        displayAPIError('Exchange rate');

        // call getWikipediaArticles
        getWikipediaArticles();


        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
      
      }
    });
  };


  // || Get wikipedia articles

  const getWikipediaArticles = () => {

    $.ajax({
      url: "libs/php/getWikipedia.php",
      type: 'GET',
      dataType: 'json',
      data: {
        north: currentCountry.north,
        east: currentCountry.east,
        south: currentCountry.south,
        west: currentCountry.west,
      },
  
      success: function(result) {

        if (result.status.name == "ok") {

          // remove previous markers, if any
          if(currentCountry.markerGroup !== undefined) {
            currentCountry.markerGroup.clearLayers();
          }
  

          // check that valid data is returned
          //if (result

          // store data
          currentCountry.articles = result.data;

          //display articles
          displayWikipediaArticles();

          // call getNewsArticles
          getHolidays();
        }

      },
      error: function(jqXHR, textStatus, errorThrown) {
        // handle errors

        // show user freindly error message
        displayAPIError('Wikipedia articles');

        // call getHolidays
        getHolidays();

        
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
      }
    });

  };


  // || Get public holidays data

  const getHolidays = () => {

    $.ajax({
      url: "libs/php/getHolidays.php",
      type: 'GET',
      dataType: 'json',
      data: {
        iso: currentCountry.iso2
      },
      success: function(result) {
        if (result.status.name == "ok") {
          currentCountry.holidays = result.data;
          currentCountry.holidays.tableIsFilled = false;

          // enable news button
          holidaysButton.enable();

          // call getNewsArticles
          getNewsArticles(); 

        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // handle errors

        // show user freindly error message
        displayAPIError('Public Holidays');

        // call getNewsArticles
        getNewsArticles(); 

        // display detailed error in console
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
        
      }
    });
  };



  // || Get news articles for current country

  const getNewsArticles = () => {

    // get news from up to 1 day ago
    const newsDate = Date.today().addDays(-1).toString('yyyy-MM-dd');

    $.ajax({
      url: "libs/php/getNews.php",
      type: 'GET',
      dataType: 'json',
      data: {
        country: encodeURIComponent(currentCountry.name),
        date: newsDate
      },
      success: function(result) {
        if (result.status.name == "ok") {
          currentCountry.news = result.data;

          // enable news button
          newsButton.enable();

          // call getLifeExpectancy
          getLifeExpectancy();
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // handle errors

        // show user freindly error message
        displayAPIError('News articles');

        // call getLifeExpectancy
        getLifeExpectancy();

        // display detailed error in console
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
        
      }
    });
  };


  // || Get life expectancy for current country

  const getLifeExpectancy = () => {

    $.ajax({
      url: "libs/php/getLifeExpectancy.php",
      type: 'GET',
      dataType: 'json',
      data: {
        iso: currentCountry.iso2
      },
      success: function(result) {
        if (result.status.name == "ok") {

          if (result.data != undefined) {

            if (result.data.fact != undefined) {

              if (result.data.fact[0] != undefined) {
                currentCountry.lifeExpectancy = `${result.data.fact[0].Value} years`;
              } else {
                currentCountry.lifeExpectancy = 'No data available';
              }

            } else {
              currentCountry.lifeExpectancy = 'No data available';
            }
          } else {
            currentCountry.lifeExpectancy = 'No data available';
          }

          // enable general info button
          generalInfoButton.enable();

          // call getCovidData
          getCovidData();
          

        } else {
          currentCountry.lifeExpectancy = 'No data available';
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // handle errors

        // show user freindly error message
        displayAPIError('Life expectancy');

        // call getCovidData
        getCovidData();

        // display error details in console
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
       
      }
    });
  };


  // || Get covid-19 data for current country

  const getCovidData = () => {
    $.ajax({
      url: "libs/php/getCovidData.php",
      type: 'GET',
      dataType: 'json',
      data: {
        iso: currentCountry.iso2
      },
      success: function(result) {
        if (result.status.name == "ok") {
          currentCountry.covid = result.data;
          
          // enable covid button
          covidButton.enable();

          // call getUnsplashImages
          getUnsplashImages();
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // handle errors

        // show user freindly error message
        displayAPIError('Life expectancy');

        // call getUnsplashImages
        getUnsplashImages();

        //display error details in console
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
      }
    });
  };


  // || Get Unsplash images for current country

  const getUnsplashImages = () => {
    $.ajax({
      url: "libs/php/getImages.php",
      type: 'GET',
      dataType: 'json',
      data: {
        country: encodeURIComponent(currentCountry.name)
      },
      success: function(result) {
        if (result.status.name == "ok") {
          currentCountry.images = result.data;

          // enable image button
          imageButton.enable();

          // call getWebcams
          getWebcams();
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        // handle errors

        // show user freindly error message
        displayAPIError('Image slideshow');

        // call getWebcams
        getWebcams();

        // display error details in console
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
      }
    });
  };


  // || Get webcams for current country

  const getWebcams = () => {
    $.ajax({
      url: "libs/php/getWebcams.php",
      type: 'GET',
      dataType: 'json',
      data: {
        iso: currentCountry.iso2
      },
      success: function(result) {
        if (result.status.name == "ok") {

          // remove previous webcams, if any
          if(currentCountry.webcamMarkers !== undefined) {
            currentCountry.webcamMarkers.clearLayers();
          }

          currentCountry.webcams = result.data.result.webcams;

          //display webcams
          displayWebcams();

          // enable select country dropdown and display country name
          $('#selectedCountry').html(currentCountry.name);
          $('#selectedCountry').removeAttr('disabled');
            
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {

        // enable select country dropdown and display country name
        $('#selectedCountry').html(currentCountry.name);
        $('#selectedCountry').removeAttr('disabled');

        // show user freindly error message
        displayAPIError('Webcam');

        // handle errors
        console.error(errorThrown, textStatus);
        console.error(jqXHR.responseText);
      }
    });
  };




  // * || Display Data

  // || Display wikipedia articles on map as markers with popup

  const displayWikipediaArticles = () => {

    // display settings for marker cluster groups
    currentCountry.markerGroupOptions = {
      polygonOptions: {
        fillColor: 'rgb(0, 121, 145)',
        color: 'rgb(67, 37, 52)',
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.3
        }
    }

    // initialize marker group for all markers
    currentCountry.markerGroup = new L.MarkerClusterGroup(currentCountry.markerGroupOptions);

    // initialize marker group for wikipedia articles
    currentCountry.wikipediaMarkers = new L.MarkerClusterGroup(currentCountry.markerGroupOptions);
    
    // configure wikipedia marker icon
    const wikiMarker = L.ExtraMarkers.icon({
      icon: 'fa-brands fa-wikipedia-w',
      iconColor: 'black',
      markerColor: 'white',
      shape: 'square',
      prefix: 'fa',
      svg: true
    });

    currentCountry.articles.forEach(article => {

      // if article refers to current country, create marker
      if (article.countryCode === currentCountry.iso2) {

        // check if article has a thumbnail image. If so, display image in popup
        const thumbnail = article.thumbnailImg ? `<img src="${article.thumbnailImg}" alt="" class="popup-thumb">` : '';
        const coordinates = [article.lat, article.lng];

        // set up popup html
        const popup = `
          <div class="wikiPopup"> 
            <h3>${article.title}</h3>
            <hr>
            ${thumbnail}
            <p>${article.summary}</p>
            <a href="https://${article.wikipediaUrl}" target="_BLANK">Read more on Wikipedia</a>
          </div>
        `;

        currentCountry.wikipediaMarkers.addLayer(L.marker(coordinates, {icon: wikiMarker}).bindPopup(popup));
      }
    });

    
    currentCountry.markerGroup.addLayer(currentCountry.wikipediaMarkers);
    map.addLayer(currentCountry.markerGroup);

    // enable wikipedia button
    wikipediaButton.enable();

    
  };



  // || Display webcams as markers on map with popup
  const displayWebcams = () => {
    
    // display webcams as marker cluster with popups
    const webcams = currentCountry.webcams;
    currentCountry.webcamMarkers = new L.MarkerClusterGroup(currentCountry.markerGroupOptions);
    
    // configure wikipedia marker icon
    const webcamMarker = L.ExtraMarkers.icon({
      icon: 'fa-solid fa-video',
      iconColor: 'white',
      markerColor: 'rgb(31, 39, 27)',
      shape: 'square',
      prefix: 'fa',
      svg: true
    });

    webcams.forEach(webcam => {

      const coordinates = [webcam.location.latitude, webcam.location.longitude];

      // check if webcam has an available webcam feed. If so, embed webcam in popup
      let webcamFeed;
      
      if (webcam.player.live.available) {
        webcamFeed = `<embed type="video/webm" src="${webcam.player.live.embed}" class="webcam-thumb popup-thumb">`;
      } else if (webcam.player.lifetime.available) {
        webcamFeed = `<embed type="video/webm" src="${webcam.player.lifetime.embed}" class="webcam-thumb popup-thumb">`;
      } else if (webcam.player.day.available) {
        webcamFeed = `<embed type="video/webm" src="${webcam.player.day.embed}" class="webcam-thumb popup-thumb">`;
      } else if (webcam.player.month.available) {
        webcamFeed = `<embed type="video/webm" src="${webcam.player.month.embed}" class="webcam-thumb popup-thumb">`;
      } else if (webcam.player.year.available) {
        webcamFeed = `<embed type="video/webm" src="${webcam.player.year.embed}" class="webcam-thumb popup-thumb">`;
      } else if (webcam.image.current.preview) {
        webcamFeed = `<img class="webcam-thumb popup-thumb" src="${webcam.image.current.preview}" alt="">`;
      } else {
        webCamFeed = 'Webcam currently unavailable';
      }
      
      const popup = `
        <div class="webcam-popup">
          <h3>${webcam.title}</h3>
          <hr>
          ${webcamFeed}
          <hr>
        </div>
      `;

      currentCountry.webcamMarkers.addLayer(L.marker(coordinates, {icon: webcamMarker}).bindPopup(popup));
    });
    //currentCountry.wikipediaMarkers = L.MarkerClusterGroup(markerGroup).addTo(map);
    currentCountry.markerGroup.addLayer(currentCountry.webcamMarkers);

    // enable webcam button
    webcamButton.enable();

  }


  // || Add easy buttons to map and fill modal with data

  // country info button
  const generalInfoButton = L.easyButton({
    id: 'general-info-button',
    states:[
      {
        icon: 'fa-solid fa-flag',
        title: 'Country Statistics',
        onClick: function(){ 

          // style modal header
          $('.modal-header').css('background-color', 'rgb(49, 54, 56)');
          $('.modal-header').css('color', 'white');
      
          // modal heading
          $('.modal-title').html(currentCountry.name);

          const flag = `<img class="img-fluid" src="https://flagcdn.com/h40/${currentCountry.iso2.toLowerCase()}.png" alt="National Flag">`;
          $('.sub-heading').html(flag);
          
          const formatPopulation = population => {

            if (population > 1000000000) {
            return `${Math.round((population/ 1000000000) * 10) / 10} billion`;
            } else if (population > 1000000) {
              return `${Math.round((population / 1000000) * 10) / 10} million`;
            } else {
              return `${Math.round((population / 1000) * 10) / 10} thousand`;
            }
          }

          const getExchangeRate = () => {
            if (currentCountry.exchangeRate !== undefined) {
              return `${currentCountry.exchangeRate} USD`;
            } else {
              return 'awaiting results';
            }
          }


          const infoTable = `
            <table class="table table-striped">
              <tr class="align-middle">
                <td class="text-center"><i class="fa-solid fa-city"></i></td>
                <td>Capital</td>
                <td class="text-end">${currentCountry.capital}</td>
              </tr>
              <tr class="align-middle">
                <td class="text-center"><i class="fa-solid fa-users"></i></td>
                <td>Population</td>
                <td class="text-end">${formatPopulation(currentCountry.population)}</td>
              </tr>
              <tr class="align-middle">
                <td class="text-center"><i class="fa-solid fa-hourglass-start"></i></td>
                <td>Life expectancy at birth</td>
                <td class="text-end">${currentCountry.lifeExpectancy}</td>
              </tr>
              <tr class="align-middle">
                <td class="text-center"><i class="fa-solid fa-globe"></i></td>
                <td>Continent</td>
                <td class="text-end">${currentCountry.continent}</td>
              </tr>
              <tr class="align-middle">
                <td class="text-center"><i class="fa-solid fa-chart-area"></i></td>
                <td>Area</td>
                <td class="text-end">${Number(currentCountry.area).toLocaleString()} km<sup>2</sup></td>
              </tr>
              <tr class="align-middle">
                <td class="text-center"><i class="fa-solid fa-money-bill"></i></td>
                <td>Currency</td>
                <td class="text-end">${currentCountry.currency.name}</td>
              </tr>
              <tr class="align-middle">
                <td class="text-center"><i class="fa-solid fa-dollar-sign"></i></td>
                <td>Exchange Rate</td>
                <td class="text-end">${getExchangeRate()} </td>
              </tr>
            </table>
          `;

          $('.modal-body').html(infoTable);
          
          $('#info-modal').modal('show');
        }
      }
    ]

  });
  
  generalInfoButton.addTo(map);

  // disable until data has loaded
  generalInfoButton.disable();


  // weather button
  const weatherButton = L.easyButton({
    id: 'weather-button',
    states:[
      {
        icon: 'fa-solid fa-cloud-sun',
        title: 'Weather Forecast',
        onClick: function(){

          // style modal header
          $('.modal-header').css('background-color', 'white');
          $('.modal-header').css('color', 'black');

          // modal heading
          $('.modal-title').html(currentCountry.capital)
          $('.sub-heading').html('');

          // weather report table
          const weather = `
            <table class="table weather-color">
              <tr>
                <td colspan=4 id="today">Today</td>
              </tr>
              <tr class="align-middle text-center">
                <td><img src="http://openweathermap.org/img/wn/${currentCountry.weather.current.weather[0].icon}@2x.png" alt="" id="weather-icon"></td>
                <td colspan=2 class="weather-description">${currentCountry.weather.current.weather[0].description}</td>
                <td><h3 class="temperature">${Math.round(currentCountry.weather.current.temp)}&deg;c</h3></td>
              </tr>
              <tr class="align-middle text-center">
                <td>${Date.today().add(1).day().toString("ddd d")}</td>
                <td>${Date.today().add(2).day().toString("ddd d")}</td>
                <td>${Date.today().add(3).day().toString("ddd d")}</td>
                <td>${Date.today().add(4).day().toString("ddd d")}</td
              </tr>
              <tr>
                <td><img src="http://openweathermap.org/img/wn/${currentCountry.weather.daily[0].weather[0].icon}@2x.png" alt="" id="weather-icon"></td>
                <td><img src="http://openweathermap.org/img/wn/${currentCountry.weather.daily[1].weather[0].icon}@2x.png" alt="" id="weather-icon"></td>
                <td><img src="http://openweathermap.org/img/wn/${currentCountry.weather.daily[2].weather[0].icon}@2x.png" alt="" id="weather-icon"></td>
                <td><img src="http://openweathermap.org/img/wn/${currentCountry.weather.daily[3].weather[0].icon}@2x.png" alt="" id="weather-icon"></td>
              </tr>
            </table>
          `;
        
          $('.modal-body').html(weather);   

          $('#info-modal').modal('show');
        }
      }
    ]
    
  });

  weatherButton.addTo(map);

  // disable until data has loaded.
  weatherButton.disable();


  // public holidays button
  const holidaysButton = L.easyButton({
    id: 'holidays-button',
    states:[
      {
        icon: 'fa-solid fa-calendar-days',
        title: 'Public Holidays',
        onClick: function(){

          currentCountry.holidays.tableIsFilled = true;

          const holidays = currentCountry.holidays.holidays;

          // style modal header
          $('.modal-header').css('background-color', 'rgb(244, 184, 96)');
          $('.modal-header').css('color', 'white');
  
          // heading
          $('.modal-title').html(currentCountry.name);
          $('.sub-heading').html('Public Holidays');

          let holidaysTable = `
            <table class="table table-striped">
              <tr class="holidays-table-heading">
                <th scope="col">holiday</th>
                <th scope="col" class="text-end">Date</th>
              </tr>
              <tbody id="holiday-table">
              </tbody>
            </table>
          `;

          $('.modal-body').html(holidaysTable); 
          
          holidays.forEach(holiday => {

            const formattedDate = Date.parse(holiday.observed).toString('dddd dS MMMM');

            const holidayRow = `
              <tr>
                <td>${holiday.name}</td>
                <td class="text-end">${formattedDate}</td>
              </tr>
            `;

            $('#holiday-table').append(holidayRow);
          });

          $('#info-modal').modal('show');

        }
      }
    ]
  });
  
  holidaysButton.addTo(map);

  // disable until data has loaded
  holidaysButton.disable();


  // news articles button
  const newsButton = L.easyButton({
    id: 'news-button',
    states:[
      {
        icon: 'fa-solid fa-newspaper',
        title: 'News',
        onClick: function(){

          // style modal header
          $('.modal-header').css('background-color', 'rgb(141, 8, 1)');
          $('.modal-header').css('color', 'white');
  
          // heading
          $('.modal-title').html(currentCountry.name);
          $('.sub-heading').html('News');

          let newsContent = '';

          const articles = currentCountry.news.articles;

          articles.forEach(article => {

            const articleCard = `
              <div class="card" style="width: 18rem;">
                <img src="${article.urlToImage}" class="card-img-top" alt="">
                <div class="card-body">
                  <h5 class="card-title">${article.title}</h5>
                  <p class="card-text">${article.content}</p>
                  <a href="${article.url}" class="btn btn-primary">Read more</a>
                </div>
              </div>
            `;

            newsContent += (articleCard);
          });

          $('.modal-body').html(newsContent);   

          $('#info-modal').modal('show');
    
        }
      }
    ]
  });
  
  newsButton.addTo(map);

  // disable until data has loaded
  newsButton.disable();



  // Covid data button
  const covidButton = L.easyButton({
    id: 'covid-button',
    states:[
      {
        icon: 'fa-solid fa-virus',
        title: 'Covid Statistics',
        onClick: function(){

          // style modal header
          $('.modal-header').css('background-color', 'rgb(247, 135, 100)');
          $('.modal-header').css('color', 'white');

          // modal heading
          $('.modal-title').html(currentCountry.name);
          $('.sub-heading').html('Covid-19 Statistics');

          const covidContent = `
            <table class="table table-striped">
              <tr class="align-middle">
                <td><i class="fa-solid fa-virus-covid"></i></td>
                <td>Total Cases</td>
                <td class="text-end">${Number(currentCountry.covid.cases).toLocaleString()}</td>
              </tr>
              <tr class="align-middle">
                <td><i class="fa-solid fa-feather"></i></td>
                <td>Total Deaths</td>
                <td class="text-end">${Number(currentCountry.covid.deaths).toLocaleString()}</td>
              </tr>
              <tr class="align-middle">
                <td><i class="fa-solid fa-virus-covid"></i></td>
                <td>Total Cases Per Million</td>
                <td class="text-end">${Number(currentCountry.covid.casesPerOneMillion).toLocaleString()}</td>
              </tr>
              <tr class="align-middle">
                <td><i class="fa-solid fa-feather"></i></td>
                <td>Total Deaths Per Million</td>
                <td class="text-end">${Number(currentCountry.covid.deathsPerOneMillion).toLocaleString()}</td>
              </tr>
              <tr class="align-middle">
                <td><i class="fa-solid fa-virus-covid"></i></td>
                <td>New Cases Recorded Yesterday</td>
                <td class="text-end">${Number(currentCountry.covid.todayCases).toLocaleString()}</td>
              </tr>
              <tr class="align-middle">
                <td><i class="fa-solid fa-feather"></i></td>
                <td>Deaths Recorded Yesterday</td>
                <td class="text-end">${Number(currentCountry.covid.todayDeaths).toLocaleString()}</td>
              </tr>
            </table>
          `;

          $('.modal-body').html(covidContent);   

          $('#info-modal').modal('show');
        }
      }
    ]
  });
  
  covidButton.addTo(map);

  // disable until data has loaded
  covidButton.disable();



  // Unsplash images button
  const imageButton = L.easyButton({
    id: 'image-button',
    states:[
      {
        icon: 'fa-solid fa-image',
        title: 'Images',
        onClick: function(){

          // style modal header
          $('.modal-header').css('background-color', 'rgb(49, 54, 56)');
          $('.modal-header').css('color', 'white');

          // modal heading
          $('.modal-title').html(currentCountry.name);
          $('.sub-heading').html('');

          const images = currentCountry.images.results;


          // create carousel to display unsplash images
          const carouselTemplate = `
            <div id="carousel" class="carousel slide" data-bs-ride="carousel">
              <div class="carousel-indicators">
                <button type="button" data-bs-target="#carousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
                <button type="button" data-bs-target="#carousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
                <button type="button" data-bs-target="#carousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
                <button type="button" data-bs-target="#carousel" data-bs-slide-to="3" aria-label="Slide 4"></button>
                <button type="button" data-bs-target="#carousel" data-bs-slide-to="4" aria-label="Slide 5"></button>
                <button type="button" data-bs-target="#carousel" data-bs-slide-to="5" aria-label="Slide 6"></button>
                <button type="button" data-bs-target="#carousel" data-bs-slide-to="6" aria-label="Slide 7"></button>
                <button type="button" data-bs-target="#carousel" data-bs-slide-to="7" aria-label="Slide 8"></button>
                <button type="button" data-bs-target="#carousel" data-bs-slide-to="8" aria-label="Slide 9"></button>
                <button type="button" data-bs-target="#carousel" data-bs-slide-to="9" aria-label="Slide 10"></button>
              </div>
              <div class="carousel-inner"></div>
              <button class="carousel-control-prev" type="button" data-bs-target="#carousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#carousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
              </button>
            </div>
            `;

          $('.modal-body').html(carouselTemplate); 

          // add images to carousel, if image is landscape
          images.forEach(image => {

            if (image.width > image.height) {
              const slide = `
                <div class="carousel-item">
                  <img src="${image.urls.raw + '&fit=fillmax&fill=blur&w=700'}" alt="${image.description} ">
                </div>
              `;
            $('.carousel-inner').append(slide);
            }
          })

          // make the first image the active image
          $('.carousel-item').first().addClass('active');

          $('#info-modal').modal('show');
        }
      }
    ]
  });
  
  imageButton.addTo(map);

  // disable until data has loaded
  imageButton.disable();


  // wikipedia articles toggle button
  const wikipediaButton = L.easyButton({
    id: 'wikipedia-button',
    states: [{
      stateName: 'remove-markers',
      icon: 'fa-brands fa-wikipedia-w',
      title: 'Hide Wikipedia Articles',
      onClick: function(control) {
        currentCountry.markerGroup.removeLayer(currentCountry.wikipediaMarkers);
        control.state('add-markers');
      },
    }, {
      stateName: 'add-markers',
      icon: 'fa-brands fa-wikipedia-w',
      title: 'Show Wikipedia Articles',
      onClick: function(control) {
        currentCountry.markerGroup.addLayer(currentCountry.wikipediaMarkers);
        control.state('remove-markers');
      }
    }]

  });

  wikipediaButton.addTo(map);

  // disable until data has loaded
  wikipediaButton.disable();


  // webcam toggle button
  const webcamButton = L.easyButton({
    id: 'webcam-button',
    states: [{
      stateName: 'remove-markers',
      icon: 'fa-solid fa-video',
      title: 'Hide Webcams',
      onClick: function(control) {
        currentCountry.markerGroup.removeLayer(currentCountry.webcamMarkers);
        control.state('add-markers');
      } 
    }, {
      stateName: 'add-markers',
      icon: 'fa-solid fa-video',
      title: 'Show Webcams',
      onClick: function(control) {
        currentCountry.markerGroup.addLayer(currentCountry.webcamMarkers);
        control.state('remove-markers');
      }
    }]

  });
  
  webcamButton.addTo(map);

  //disable until data has loaded
  webcamButton.disable();

  // border layer toggle button
  const borderButton = L.easyButton({
    id: 'border-button',
    states: [{
      stateName: 'remove-borders',
      icon: 'fa-solid fa-map',
      title: 'Hide Borders',
      onClick: function(control) {
        map.removeLayer(currentCountry.borders);
        control.state('add-borders');
      } 
    }, {
      stateName: 'add-borders',
      icon: 'fa-solid fa-map',
      title: 'Show Borders',
      onClick: function(control) {
        map.addLayer(currentCountry.borders);
        control.state('remove-borders');
      }
    }]

  });
  
  borderButton.addTo(map);

  //disable until data has loaded
  borderButton.disable();


  // hide dropdown when modal is open
  $(window).on('shown.bs.modal', function() { 
    $('#info-modal').modal('show');
    $('.dropdown').hide();
  });

  // show dropdown when modal is closed
  $(window).on('hidden.bs.modal', function() { 
    $('#code').modal('hide');
    $('.dropdown').show();
  });

  
  // display error message to user if an API call fails
  const displayAPIError = (API) => {

    // modal heading
    $('.modal-title').html('Sorry, there was a problem.');
    $('.sub-heading').html('');

    const errorBody = `
      An error occurred when trying to access the ${API} data. <br>
      To see this information, please refresh the page and try again.
    `;

    $('.modal-body').html(errorBody);


    $('#info-modal').modal('show');
    $('.dropdown').hide();
  };

}); // end of window.on 'load' function 
