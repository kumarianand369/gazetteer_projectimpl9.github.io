<?php

    $executionStartTime = microtime(true) / 1000;
    $apiKey = "ff5347611ad247d3bdcfeaf546c60f2d";

    $url = "http://newsapi.org/v2/top-headlines?country=" . $_REQUEST['country'] . "&apiKey=" . $apiKey;

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

    curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36");
   //3.Execute the request and fetch the response.
    $result = curl_exec($ch);
     //4.Close cURL and free up the cURL handle
     curl_close($ch);
    
     //converts the JSON encoded string into a PHP variable:
     $decode = json_decode($result, true);
    
    
    //Update HTTP status messages:
    $output['status']['code'] = "200";
	$output['status']['name'] = "ok";
    $output['status']['description'] = "mission saved";
     //Show excution time:
    $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
    //store the string of results in 'data':
    $output['data'] = $decode;
    
   //Content-type specifies the media type of the underlying data:
    header('Content-Type: application/json; charset=UTF-8');

    //prints the JSON representation of output (the status message and data):
    echo json_encode($output);

?>