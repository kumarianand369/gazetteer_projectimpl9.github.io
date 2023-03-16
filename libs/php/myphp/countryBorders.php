<?php

    $executionStartTime = microtime(true);
    //decoding the file using json_decode gives an array of features
    //to read the contents of a file into a string
    $countryData = json_decode(file_get_contents("countryBorders.geo.json"), true);
    // to collect data after submitting an HTML form
    $countryCode = $_REQUEST['code'];
    //create empty array
    $border = [];
 //loop through the array of features and return the one feature that matches the country code (iso_a2).
    foreach ($countryData['features'] as $feature) {
        if($countryCode == $feature["properties"]['iso_a2']){
            $border = $feature;
        }   
    }

    //store the string of results in 'data':border
    $output['data'] = $border;
     //Content-type specifies the media type of the underlying data:
    header('Content-Type: application/json; charset=UTF-8');
     //prints the JSON representation of output (the status message and data):
    echo json_encode($output);

?>
