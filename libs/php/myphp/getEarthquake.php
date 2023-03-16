<?php
//return an array of lat and lngs to be used for markers. also return the full earthquake data itself.
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true) / 1000;

$url = 'http://api.geonames.org/earthquakesJSON?north=' . $_REQUEST['north'] . '&south=' . $_REQUEST['south'] . '&east=' . $_REQUEST['east'] . '&west=' . $_REQUEST['west'] . '&username=khushi';

//create empty array
$latsAndLngs = [];

//CURL
    //1.Initalise a new cURL resource(ch= curl handle)
    $ch = curl_init();

    //2.Set options
    //set URL to send the request to:
    curl_setopt($ch, CURLOPT_URL, $url);

    //Return instead of outputting directly:
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);

    //Stop cURL from verifying the peer's certificate:
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);

    //3.Execute the request and fetch the response.
    $result = curl_exec($ch);

    //4.Close cURL and free up the cURL handle
    curl_close($ch);
    
    //converts the JSON encoded string into a PHP variable:
     $decode = json_decode($result,true);	

    //loop through the array of features and add the lat and lng data of each feature into the array
    foreach ($decode['earthquakes'] as $feature) {
        //create empty object to store the lat and lng values
        $temp = null;
        $temp['lat'] = $feature["lat"];
        $temp['lng'] = $feature["lng"];

        //add the object into the array
        array_push($latsAndLngs, $temp);
    }
//Update HTTP status messages:
$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "mission saved";
$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
$output['array'] = $latsAndLngs;
//store the string of results in 'data':
$output['data'] = $decode['earthquakes'];

    //Content-type specifies the media type of the underlying data:
    header('Content-Type: application/json; charset=UTF-8');

    //prints the JSON representation of output (the status message and data):
    echo json_encode($output);

?>
