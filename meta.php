<?php
if (!isset($_POST['url'])) {
    exit();
}
$url = $_POST['url'];
if (!stristr($url, 'http://') and !stristr($url, 'https://')) {
    $url = 'http://' . $url;
}

// Handle all errors/warnings/exceptions with try catch.
function handleError($errno, $errstr, $errfile, $errline, array $errcontext) {
    // error was suppressed with the @-operator
    if (0 === error_reporting()) {
        return false;
    }

    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}

set_error_handler('handleError');

// Get description by URL.
function getDescription($url) {
	$description = '';
	// Gets all meta tags from site. 
	// $tags['author'];       
	// $tags['keywords'];     
	// $tags['description'];  
	// $tags['title']; 		  
	// $tags['geo_position']; 
	try {
		$tags = get_meta_tags($url);
	}
	catch (ErrorException $e) {
		
	}
	
	// At this version we only need description.
	if(isset($tags['description'])) {
		$description = $tags['description'];
	}
	return $description;
}

// Get title by URL.
function getTitle($url) {
	$title = '';
	$str = '';
	try {
		$str = file_get_contents($url);
	}
	catch(ErrorException $e) {
		$title = $url;
	}
    if(strlen($str)>0) {
        preg_match("/\<title(.*)\>(.*)\<\/title\>/",$str,$titleArray);
		if(isset($titleArray[2])) {
			$title = $titleArray[2];
		}
    }
	return $title;
}

$title = getTitle($url);
$description = getDescription($url);
$meta = (object) array('title' => $title, 'description' => $description);
print json_encode($meta);

?>