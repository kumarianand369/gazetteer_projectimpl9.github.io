// Preloader Script
$(window).on('load', function () {
    if ($('#preloader').length) {
    $('#preloader').delay(100).fadeOut('slow', function () {
        $(this).remove();
    });
    }
});

// Global Variables
let currentLat, currentLng, currentLon,currentCountry, userCountryName;

//ClusterGroups:switch them in a Layers Control
var capitalClusterGroup = L.markerClusterGroup();
var museumsClusterGroup =  L.markerClusterGroup();
var universitiesClusterGroup = L.markerClusterGroup();
var citiesClusterGroup = L.markerClusterGroup();
var shopsClusterGroup = L.markerClusterGroup();
var earthquakeClusterGroup = L.markerClusterGroup();

//featureGroups:Extended LayerGroup
var capitalFeatureGroup = L.featureGroup();
var museumsFeatureGroup = L.featureGroup();
var universitiesFeatureGroup = L.featureGroup();
var citiesFeatureGroup = L.featureGroup();
var shopsFeatureGroup = L.featureGroup();
var earthquakeFeatureGroup = L.featureGroup();

//combines all the feature groups into one layer so we can add or remove them from the map at once.
var capital = L.layerGroup([capitalFeatureGroup]);
var museums = L.layerGroup([museumsFeatureGroup]);
var universities = L.layerGroup([universitiesFeatureGroup]);
var cities = L.layerGroup([citiesFeatureGroup]);
var nearbyShops = L.layerGroup([shopsFeatureGroup]);
var earthquakes = L.layerGroup([earthquakeFeatureGroup]);

//initialise the map and get user location
var map = L.map('map').setView([51.509, -0.11], 13);
    map.locate({
    setView: true,

});
//toner labels
var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{ maxZoom: 20,subdomains:['mt0','mt1','mt2','mt3']});
let sunny = L.tileLayer('https://tile.jawg.io/jawg-sunny/{z}/{x}/{y}.png?access-token=JVg3LrVoy8EKxwL0gQrT16EFQLE87bgaOeatKm1iKyHZcUKuTevrzBQdBH1Fvdp2', {
    attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
var tonerMap = L.tileLayer.provider('Stamen.Toner', {id: 'map', maxZoom: 18, attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
var googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
    maxZoom: 20,subdomains:['mt0','mt1','mt2','mt3']
}).addTo(map);

//create base layers and add the default one to the map:
//add the base maps
var baseMaps = {
    "Google Satellite": googleSat,
    "sunny": sunny,
    "tonerMap": tonerMap,  
    "Google Street": googleStreets, 
    
};

//add the layer groups
var overlayMaps = {
    "Capital": capital,
    "Museums" : museums,
    "Universities": universities,
    "Cities": cities,
    "Shops": nearbyShops,
    "Earthquakes": earthquakes,
};
L.control.layers(baseMaps, overlayMaps).addTo(map);

//icons
var capitalIcon = L.ExtraMarkers.icon({
    icon: 'fa fa-building',
    markerColor: 'orange',
    shape: 'star',
    prefix: 'fa',
});

var museumsIcon = L.ExtraMarkers.icon({
    icon: 'fa-monument',
    markerColor: 'green',
    shape: 'circle',
    prefix: 'fa',
});

var universitiesIcon = L.ExtraMarkers.icon({
    icon: 'fas fa-university',
    markerColor: 'red',
    shape: 'square',
    prefix: 'fa',
  
});

var citiesIcon = L.ExtraMarkers.icon({
    icon: 'fa fa-city',
    markerColor: 'blue',
    shape: 'penta',
    prefix: 'fa',
});
var shopIcon = L.ExtraMarkers.icon({
    icon: 'fa fa-shop',
    markerColor: 'purple',
    shape: 'circle',
    prefix: 'fa',
});
var earthquakeIcon = L.ExtraMarkers.icon({
    icon: 'fa fa-globe',
    markerColor: 'violet',
    shape: 'star',
    prefix: 'fa',
});
//============= Country Object Definition========================================
function Country(name, iso_a2, iso_a3, iso_n3, geoType, coordinates){
    this.name = name;
    this.iso_a2 = iso_a2;
    this.iso_a3 = iso_a3;
    this.iso_n3 = iso_n3;
    this.coordinates = coordinates;
    this.geoType = geoType;
    this.lat;
    this.lng;
    this.lon;
}
////Populate the select with country names and country codes.
// Main AJAX & jQuery Code
$(document).ready(() => {

    // Get the country information
    $.ajax({
        url: "libs/php/myphp/countryBorders.geo.json",
        type: 'GET',
        data: {},
        dataType: 'json',
        success: function(data) {

            // ---------------- Generate Country Objects ----------------
            const results = data["features"]      
            for(let i=0; i < results.length; i++){
                
                let name = results[i]['properties']['name'];
                let iso_a2 = results[i]['properties']['iso_a2'];
                let iso_a3 = results[i]['properties']['iso_a3'];
                let iso_n3 = results[i]['properties']['iso_n3'];
                let geoType = results[i]['geometry']['type'];
                let coordinates = results[i]['geometry']['coordinates'];;

              noSpaceName = name.replace(/\s+/g, '');
              window[noSpaceName] = new Country(name, iso_a2, iso_a3, iso_n3, geoType, coordinates)
              
            }
            
           
              //Fill countries-
              $.ajax({
                  url: "libs/php/myphp/countryNames.php",
                  type: 'GET',
                  dataType: 'json',

                  success: function(result) {
                    //console.log(result);

                     if (result.status.name == "ok") {
                         //loop through the result object and populate the select tag
                       for (var i = 0; i < result.data.length; i++) {
                           $('#country').append("<option value=" + result['data'][i]['code'] + ">" + result['data'][i]['name'] + "</option>");
                        }
                   }
    
                   },
               });
           
          // ---------------- Find The Users Location And Set Map using HTML Geolocation API-----------
          //it is used to get the geographical position of a user
          // //the lat and long coordinates of the selected country
            function geoSuccess(position) {
                currentLat = position.coords.latitude;
                currentLng = position.coords.longitude;
                currentLon = position.coords.longitude;
                getCurrentCountry(currentLat, currentLng);
                getCurrentCountryWeather(currentLat, currentLon);
                
            }
            function geoError(err) {
            }
            // getCurrentPosition() method is used to return the user's position(latitude and longitude)
            //and it returns a coordinates object to the function specified in the parameter (geoSuccess)
              navigator.geolocation.getCurrentPosition(geoSuccess, geoError); 
              
              
        }
    });
});

//-------- Get User Current Country Info From GeoNames ------------------------
// Geonames API username
function getCurrentCountry(lat,lng){

    // API Call to GeoNames to get users country info
     $.ajax({
       url: "libs/php/myphp/getCountryCode.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: lat,
            lng: lng,
        },
        success: function(result) {
            //console.log(JSON.stringify(result));
            if (result.status.name == "ok") {
                userCountryName = result['data']['countryName'];
                var userCountrySpaces = userCountryName 
                var userCountryNoSpaces = userCountrySpaces.replace(/\s+/g, '');
                currentCountry = window[userCountryNoSpaces];
            }
            $('#country').val(currentCountry.iso_a2).change(); 
          
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(JSON.stringify(errorThrown));
        }
    });  
}
// ===================================================================
////run each time a country is selected from the dropdown
 //Select country
 $("#country").change(function(){
	//Apply border
	$.ajax({
		url: "libs/php/myphp/countryBorders.php",
		type: "POST",
		dataType: "json",
		data: {
			code: $("#country").val(),
		},

		success: function(result) {
			// alert("hi");
			// console.log(result); 
            // to clear the old marker each time new markers are created
            //clear any previous markers and layers

            capitalClusterGroup.clearLayers();
            museumsClusterGroup.clearLayers();
            universitiesClusterGroup.clearLayers();
            citiesClusterGroup.clearLayers();
            earthquakeClusterGroup.clearLayers();
            shopsClusterGroup.clearLayers();

            	var bounds = result.data;
				var borderStyle =  {
					color: "blue",
					weight: 4,
                    opacity: 0.7,
                    fillOpacity: 0.0 
				};
                //GeoJSON object or an array of GeoJSON objects. 
                //it allows you to parse GeoJSON data and display it on the map.
                //setView([51.509, -0.11], 13);

				var border = L.geoJSON(bounds,borderStyle).addTo(map);
				//set fitBounds for sets of markers so that the map can zoom in or out to fit the set of markers on the map
				
                map.fitBounds(border.getBounds(), {
					padding: [10, 10],
					animate: true,
					duration: 5,
				});          
            },
            error: function(jqXHR, textStatus, errorThrown) {
            }
        }); //apply border ends
//=========================CountryInfo=========================================
 //ajax call to return the CountryInfo url and  name
//getCountryInfo-
$.ajax({
    url: "libs/php/myphp/getCountryInfo.php",
    type: 'POST',
    dataType: 'json',
    data: {
        country: $('#country').val(),
    },
    success: function(result) {
        // console.log(result);
    //	console.log(JSON.stringify(result));
        if (result.status.name == "ok") {
             $("#continent").html(result['data'][0]['continent']);
            $("#countryName").html(result['data'][0]['countryName']);
            $('#capital1').html(result['data'][0]['capital']);
            $('#area').html(result['data'][0]['areaInSqKm'] + " km<sup>2</sup>");
            $('#population').html(result['data'][0]['population']);
        }
    },
    error: function(jqXHR, textStatus, errorThrown) {
        // your error code
    }
});
//get wikipedia using GeoNames API
//wikiApi-
$.ajax({
    url: "libs/php/myphp/getWikiApi.php",
    type: 'POST',
    dataType: 'json',
    data: {
        country: $('#country option:selected').text(),
    },
    success: function(result) {            
    // console.log(result);
        if (result.status.name == "ok") {
            $("#sumTitle").empty();
            $("#sumTitle").append(result['data']['0']['title']);
            $("#summary").html(result['data']['0']['summary']);
            $("#wikipediaUrl").attr('href', result['data']['0']['wikipediaUrl']);
            $("#wikipediaUrl").html(result['data']['0']['wikipediaUrl']);                
        }
    },
    error: function(jqXHR, textStatus, errorThrown) {
        // your error code
    }
}); 
//============================Images=================================== 
// //get Images using GeoNames API      
  //Location Images:
  $.ajax({
    url: "libs/php/myphp/getLocationImages.php",
    type: 'POST',
    dataType: 'json',
    data: {
    query: $('#country option:selected').text(),
    },
    success: function(result) {

        // console.log(result);
        $("#countryImages").empty();
        if (result.status.name == "ok") {
            for(var i = 0; i<result['data']['results'].length; i++){
                $("#countryImages").append("<img src='' alt='' id='image" + i +"'class='countryImages img-fluid'><br><br>");
                $("#image" + i).attr('src', result['data']['results'][i]['urls']['regular']);
            }
        }
    },
    error: function(jqXHR, textStatus, errorThrown) {	
    }
});    
//=======================covid=========================================
//covid
 $.ajax({
    url: "libs/php/myphp/getCovid.php",
    type: 'POST',
    dataType: 'json',
    data: {
        country: $('#country option:selected').val(),
    },
    success: function(result) {
    
       //  console.log(result.Global);
    //   console.log(JSON.stringify(result));
        if (result.status.name == "ok") {
            $("#countryCovid").empty();
            $("#countryCovid").append($('#country option:selected').text());
            $("#countriesTotalConfirmed").html(result['data']['Countries']['0']['TotalConfirmed']);
            $("#countriesTotalDeaths").html(result['data']['Countries']['0']['TotalDeaths']);
            $("#countriesTotalRecovered").html(result['data']['Countries']['0']['TotalRecovered']);
            $("#countriesNewConfirmed").html(result['data']['Countries']['0']['NewConfirmed']);
            $("#countriesNewDeaths").html(result['data']['Countries']['0']['NewDeaths']);
            $("#countriesNewRecovered").html(result['data']['Countries']['0']['NewRecovered']);
        }
       
    },
    error: function(jqXHR, textStatus, errorThrown) {
       
    }
    });
//=======================news=========================================
 //News:
 $.ajax({
    url: "libs/php/myphp/getNewsData.php",
    type: 'POST',
    dataType: 'json',
    data: {
        country: $('#country option:selected').val(),
    },
    success: function(result) {
        //  console.log(result);
     //   console.log(JSON.stringify(result));
        
        if (result.status.name == "ok" && result['data']['articles']['0'] !== undefined) {
            $("#newsCountry").empty();
            $("#newsCountry").append($('#country option:selected').text());
            $("#articleTitle").html(result['data']['articles']['0']['title']);
            $("#articleSource").html(result['data']['articles']['0']['source']['Id']);
            $("#articleAuthor").html(result['data']['articles']['0']['author']);
            var date = result['data']['articles']['0']['publishedAt'];
            //formatting dates
            $("#publishedAt").html(moment(date).format('DD-MM-YYYY'));
        }
        var i = 0;
        $("#nextArticle").on('click', function() {
            if (result.status.name == "ok" && result['data']['articles'][i] !== undefined && i<(result['data']['articles'].length-1)) {
                i++
                // console.log(i)
                $("#articleTitle").html(result['data']['articles'][i]['title']);
                $("#articleSource").html(result['data']['articles'][i]['source']['Id']);
                $("#articleAuthor").html(result['data']['articles'][i]['author']);
                var date = result['data']['articles'][i]['publishedAt'];
                //formatting dates
                $("#publishedAt").html(moment(date).format('DD-MM-YYYY'));
               
            }
        }); 
    },
    error: function(jqXHR, textStatus, errorThrown) {
    }
});

//cities             
$.ajax({
    url: 'libs/php/mapMarkers/getMapCities.php',
    type: 'GET',
    dataType: 'json',
    data: {
        country: $('#country').val()
    },
    success: function(result) {

        if(result.status.name == "ok"){
          //  console.log("cities");
          //  console.log(result);

            // //put the data on the map as markers with popups
            for (var i = 0; i < result.data.geonames.length; ++i) {
                var popup = "<table class='table table-hover table-striped table-sm table-responsive' style='color: green;'>" +
                "<tr><td class='left-align'>Population</td><td class='right-align'>" + (result.data.geonames[i].population / 1000000).toFixed(1) + "</td></tr>" +
                "<tr><td class='left-align'>Name</td><td class='right-align'>" + result.data.geonames[i].name + "</td></tr>" + "</table>";
              
                var cities = L.marker([result.data.geonames[i].lat, result.data.geonames[i].lng], 
                                        {icon: citiesIcon, title: "cities"}).bindPopup(popup);

                citiesClusterGroup.addLayer(cities);

            } 
            citiesFeatureGroup.addLayer(citiesClusterGroup);
            map.addLayer(citiesFeatureGroup);
        }
    },
    error: function(xhr, status, error){      
    }
});            
//capital
$.ajax({
    url: 'libs/php/mapMarkers/getMapCapital.php',
    type: 'GET',
    dataType: 'json',
    data: {
        country: $('#country').val()
    },

    success: function(result) {

        if(result.status.name == "ok"){
          //  console.log("capital");
          //  console.log(result);
            // //put the data on the map as markers with popups
            for (var i = 0; i < result.data.geonames.length; ++i) { 
                var popup = "<table class='table table-hover table-striped table-sm table-responsive' style='color: red;'>" +
                "<tr><td class='left-align'>Name</td><td class='right-align'>" + result.data.geonames[i].name + "</td></tr>" +
                "<tr><td class='left-align'>Population</td><td class='right-align'>" + (result.data.geonames[i].population / 1000000).toFixed(1) + "</td></tr>" + "</table>";
              
                var capital = L.marker( [result.data.geonames[i].lat, result.data.geonames[i].lng], 
                                        {icon: capitalIcon, title: "capital"} ).bindPopup(popup);

                capitalClusterGroup.addLayer(capital);
            }
            capitalFeatureGroup.addLayer(capitalClusterGroup);
           
        }
    },
    error: function(xhr, status, error){        
    }
});            
 //museums
 $.ajax({
    url: 'libs/php/mapMarkers/getMapMuseums.php',
    type: 'GET',
    dataType: 'json',
    data: {
        country: $('#country').val()
    },

    success: function(result) {

        if(result.status.name == "ok"){
           // console.log("museums");
          //  console.log(result);
            //put the data on the map as markers with popups
            for (var i = 0; i < result.data.geonames.length; ++i) { 
                var popup = "<table class='table table-hover table-striped table-sm table-responsive' style='color: blue;'>" +
                "<tr><td class='right-align'>" + result.data.geonames[i].name + "</td></tr>" + "</table>";

                var museums = L.marker( [result.data.geonames[i].lat, result.data.geonames[i].lng], 
                                        {icon: museumsIcon, title: "museums"} ).bindPopup(popup);

                museumsClusterGroup.addLayer(museums);
            }
            museumsFeatureGroup.addLayer(museumsClusterGroup);
            map.addLayer(museumsFeatureGroup);
        }
    },
    error: function(xhr, status, error){
       
    }

}); 

//universities
$.ajax({
    url: 'libs/php/mapMarkers/getMapUniversities.php',
    type: 'GET',
    dataType: 'json',
    data: {
        country: $('#country').val()
    },

    success: function(result) {

        if(result.status.name == "ok"){
           // console.log("universities");
           // console.log(result);
            // //put the data on the map as markers with popups
            for (var i = 0; i < result.data.geonames.length; ++i) { 
                var popup = "<table class='table table-hover table-striped table-sm table-responsive' style='color: orange;'>" +
                "<tr><td class='right-align'>" + result.data.geonames[i].name + "</td></tr>" + "</table>";

                var universities = L.marker( [result.data.geonames[i].lat, result.data.geonames[i].lng], 
                                        {icon: universitiesIcon, title: "universities"} ).bindPopup(popup);

                universitiesClusterGroup.addLayer(universities);
            }
            universitiesFeatureGroup.addLayer(universitiesClusterGroup);
            map.addLayer(universitiesFeatureGroup);
        }
    },
    error: function(xhr, status, error){        
    }
}); 
//get shop and earthquake activity using GeoNames API
   $.ajax({
    url: 'libs/php/myphp/getGeoData.php',
    type: 'GET',
    dataType: 'json',
    data: {
        code: $("#country").val(),   
    },
    success: function(result) {
        if(result.status.name == "ok"){
          //  console.log("Geo data");
          //  console.log(result);
            window.north = result.data.north;
            window.south = result.data.south;
            window.east = result.data.east;
            window.west = result.data.west;
        }

//shops
       $.ajax({
        url: 'libs/php/myphp/getShops.php',
        type: 'GET',
        dataType: 'json',
        data: {
            north: window.north,
            south: window.south,
            east: window.east,
            west: window.west,
            countrySet: $('#country').val()
        },

        success: function(result) {

            if(result.status.name == "ok"){
               // console.log("shops");
              //  console.log(response);
                //put the data on the map as markers with popups
                for (var i = 0; i < result.data.length; ++i) {
                    var popup = "<table class='table table-hover table-striped table-sm table-responsive' style='color: green;'>" +
                    "<tr><td class='left-align'>Name</td><td class='right-align'>" + result.data[i].poi.name + "</td></tr>" +
                    "<tr><td class='left-align'>Category</td><td class='right-align'>" + result.data[i].poi.categories[0] + "</td></tr>" +
                    "<tr><td class='left-align'>Address</td><td class='right-align'>" + result.data[i].address.freeformAddress + "</td></tr>" +
                    "<tr><td class='left-align'>City</td><td class='right-align'>" + result.data[i].address.localName + "</td></tr>" + "</table>";

                    var shops = L.marker( [result.array[i].lat, result.array[i].lng], {icon: shopIcon, title: "Shop"} )
                        .bindPopup(popup);

                    shopsClusterGroup.addLayer(shops);
                }
                shopsFeatureGroup.addLayer(shopsClusterGroup);
            }
        },
        error: function(xhr, status, error){           
        }
    });  // end of shop

// earthquake
    $.ajax({
        url: 'libs/php/myphp/getEarthquake.php',
        type: 'GET',
        dataType: 'json',
        data: {
            north: result.data.north,
            south: result.data.south,
            east: result.data.east,
            west: result.data.west
        },
        success: function(result) {
            if(result.status.name == "ok"){
               // console.log("earthquake ");
              //  console.log(response);
        
                //put the data on the map as markers with popups
                for (var i = 0; i < result.data.length; ++i) {
                    var popup = "<table class='table table-hover table-striped table-sm table-responsive' style='color: purple;'>" +
                    "<tr><td class='left-align'>Magnitude</td><td class='right-align'>" + result.data[i].magnitude + "</td></tr>" +
                    "<tr><td class='left-align'>Depth</td><td class='right-align'>" + result.data[i].depth + "</td></tr>" + "</table>";
        
                    var earthquakeActivity = L.marker( [result.array[i].lat, result.array[i].lng], {icon: earthquakeIcon, title: "Earthquake Activity"} )
                        .bindPopup(popup);
        
                        earthquakeClusterGroup.addLayer(earthquakeActivity);
                }
                earthquakeFeatureGroup.addLayer(earthquakeClusterGroup);
                map.addLayer(earthquakeFeatureGroup);
            }
        
        },
        
        error: function(errorThrown){
            console.log("error with earthquake" + errorThrown);
        }

        }); // End of earthquake
},
error: function(errorThrown){
console.log("Not supported " + errorThrown);
}

}); //end geodata ajax cal  

});// end of select country
//======================Weather========================================
// Geonames API Weather
 function getCurrentCountryWeather(lat,lon){
    //Weather:
     $.ajax({
        url: "libs/php/myphp/getOpenWeather.php",
        type: 'POST',
        dataType: 'json',
        data: {
                lat: lat,
                lon:lon,
        },
        success: function(result) {
            //console.log(result);
            if (result.status.name == "ok" && result['data']['current'] != undefined) {
    
                //Onload:
                $('.weatherHide').show();
                $("#temp").empty();
                $("#currentWeather").empty();
                $("#wind").empty();
                $("#sunrise").empty();
                $("#sunset").empty();
                $("#humidity").empty();
                $('#temp').html(result['data']['current']['temp']+" ℃");
                var icon = result['data']['current']['weather']['0']['icon'];
                $('#currentWeather').append("<img id='weatherIcon' alt='weather icon' src=''></img>" + result['data']['current']['weather']['0']['description']);
                var weatherUrl = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
                $('#weatherIcon').attr("src", weatherUrl);
                //formatting dates                       
                var sunrise = moment(result['data']['current']['sunrise']*1000).format("HH:mm");
                $('#sunrise').html(sunrise);
                //formatting dates
                var sunset = moment(result['data']['current']['sunset']*1000).format("HH:mm");
                $('#sunset').html(sunset);
                $('#humidity').html(result['data']['current']['humidity'] + ' %');
           
                //First Day
                $("#day1").on('click', function(){
                    $('.weatherHide').hide();
                    $("#temp").empty();
                    $("#currentWeather").empty();
                    $("#wind").empty();
                    $("#sunrise").empty();
                    $("#sunset").empty();
                    $("#humidity").empty();
                    $('#temp').html(result['data']['current']['temp']+" ℃");
                    var icon = result['data']['current']['weather']['0']['icon'];
                    $('#currentWeather').append("<img id='weatherIcon' alt='weather icon' src=''></img>" + result['data']['current']['weather']['0']['description']);
                    var weatherUrl = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
                    $('#weatherIcon').attr("src", weatherUrl);
                    //formatting dates                       
                    var sunrise = moment(result['data']['current']['sunrise']*1000).format("HH:mm");
                    $('#sunrise').html(sunrise);
                    //formatting dates
                    var sunset = moment(result['data']['current']['sunset']*1000).format("HH:mm");
                    $('#sunset').html(sunset);
                    $('#humidity').html(result['data']['current']['humidity'] + ' %');
      
                });
                //Second Day
                $("#day2").on('click', function(){
                    $("#currentWeather").empty();
                    $('.weatherHide').hide();
                    $('#temp').html("Max: " + result['data']['daily'][1]['temp']['max'] +" ℃ \n" + "Min: "  + result['data']['daily'][1]['temp']['min'] + " ℃");
                    var icon = result['data']['daily'][1]['weather']['0']['icon'];
                    $('#currentWeather').append("<img id='weatherIcon' alt='weather icon' src=''></img>" + result['data']['daily'][1]['weather']['0']['description']);
                    var weatherUrl = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
                    $('#weatherIcon').attr("src", weatherUrl);
                    $('#sunrise').html(sunrise);
                    //formatting dates
                    var sunset = moment(result['data']['daily'][1]['sunset']*1000).format("HH:mm");
                    $('#sunset').html(sunset);
                    $('#humidity').html(result['data']['daily'][1]['humidity'] + ' %');
                });
                 //Third Day
                 $("#day3").on('click', function(){
                    $("#currentWeather").empty();
                    $('.weatherHide').hide();
                    $('#temp').html("Max: " + result['data']['daily'][2]['temp']['max'] +" ℃ \n" + "Min: "  + result['data']['daily'][2]['temp']['min'] + " ℃");
                    var icon = result['data']['daily'][2]['weather']['0']['icon'];
                    $('#currentWeather').append("<img id='weatherIcon' alt='weather icon' src=''></img>" + result['data']['daily'][2]['weather']['0']['description']);
                    var weatherUrl = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
                    $('#weatherIcon').attr("src", weatherUrl);
                    $('#sunrise').html(sunrise);
                    //moment:formatting dates
                    var sunset = moment(result['data']['daily'][2]['sunset']*1000).format("HH:mm");
                    $('#sunset').html(sunset);
                    $('#humidity').html(result['data']['daily'][2]['humidity'] + ' %');
                });
    
                //Fourth Day
                $("#day4").on('click', function(){
                    $("#currentWeather").empty();
                    $('.weatherHide').hide();
                    $('#temp').html("Max: " + result['data']['daily'][3]['temp']['max'] +" ℃ \n" + "Min: "  + result['data']['daily'][3]['temp']['min'] + " ℃");
                    var icon = result['data']['daily'][3]['weather']['0']['icon'];
                    $('#currentWeather').append("<img id='weatherIcon' alt='weather icon' src=''></img>" + result['data']['daily'][3]['weather']['0']['description']);
                    var weatherUrl = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
                    $('#weatherIcon').attr("src", weatherUrl);
                    $('#sunrise').html(sunrise);
                    //formatting dates
                    var sunset = moment(result['data']['daily'][3]['sunset']*1000).format("HH:mm");
                    $('#sunset').html(sunset);
                    $('#humidity').html(result['data']['daily'][3]['humidity'] + ' %');
                });                  
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(jqXHR + " There has been an error! " + errorThrown)
        }
    });     
}
//======================================================================================
//Days:
//formatting dates
var thirdDay = moment().add(2, 'days').format('dddd');  
var fourthDay = moment().add(3, 'days').format('dddd');   ;
$("#day3").html(thirdDay);
$("#day4").html(fourthDay);

//============================================Buttons================================
//Info-
 infoButton = L.easyButton({
    states:[{
      onClick: function(button, map){
        $("#infoModalScrollable").modal();
      },
      title: 'show country information',
      icon: "fa-info"
    }]
  })
map.addControl(infoButton);	
//Images-
imageButton = L.easyButton({
    states:[{
      onClick: function(button, map){
        $("#imagesModalScrollable").modal();
      },
      title: 'show Contry Image',
      icon: "fa fa-picture-o orange-color"
    }]
  })
map.addControl(imageButton);	
// Weather-
weatherButton = L.easyButton({
    states:[{
      stateName: 'show-weather',
      onClick: function(button, map){
        $("#weatherModalScrollable").modal();
      },
      title: 'show the weather',
      icon: "fa-cloud-sun "
    }]
  })
map.addControl(weatherButton);


 //covid-
 covidButton = L.easyButton({
    states:[{
      stateName: 'show-info',
      onClick: function(button, map){
        $("#covidModalScrollable").modal();
      },
      title: 'show covid information',
      icon: "fa fa-ambulance red-color"
    }]
  })
map.addControl(covidButton);

//News-
newsButton = L.easyButton({
    states:[{
      onClick: function(button, map){
        $("#newsModalScrollable").modal();
      },
      title: 'show country news',
      icon: "fa fa-newspaper-o red-color"
    }]
  });
 map.addControl(newsButton);