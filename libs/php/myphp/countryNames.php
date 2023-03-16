
<?php

    $executionStartTime = microtime(true);
    //decoding the file using json_decode gives an array of features
    //to read the contents of a file into a string
    $countryData = json_decode(file_get_contents("countryBorders.geo.json"), true);
   //create empty array
    $country = [];
   //loop through the array of features and return the one feature that matches the country code (iso_a2).
    foreach ($countryData['features'] as $feature) {
        //create empty object to store the lat and lng values
        $temp = null;
        $temp['code'] = $feature["properties"]['iso_a2'];
        $temp['name'] = $feature["properties"]['name'];
         //add the object into the array
        array_push($country, $temp);
        
    }
    //The usort() function in PHP sorts a given array by using a user-defined comparison function
    usort($country, function ($item1, $item2) {
        return $item1['name'] <=> $item2['name'];

    });
    //Update HTTP status messages:
    $output['status']['code'] = "200";
     $output['status']['name'] = "ok";
    $output['status']['description'] = "success";
     //Show excution time:
    $output['status']['executedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
    $output['data'] = $country;
     //Content-type specifies the media type of the underlying data:
    header('Content-Type: application/json; charset=UTF-8');
    //prints the JSON representation of output (the status message and data):
    echo json_encode($output);

?>
