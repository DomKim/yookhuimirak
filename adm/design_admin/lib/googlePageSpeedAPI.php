<?php
/**
* Get Google Page Speed Screenshot
*
* Uses Google's Page Speed API to generate a screenshot of a website.
* Returns the image as  a base64 jpeg image tag
*
* Usage Example:
* echo getGooglePageSpeedScreenshot("http://ghost.org", 'class="thumbnail"');
*
*
* @author jaseclamp <https://gist.github.com/jaseclamp>
* @author <andrew@nomstock.com>
* @link https://gist.github.com/simpliwp/e6b69e3eb5a3bc1dc081#file-get-webpage-thumbnails-from-google
* @link https://gist.github.com/jaseclamp/d4ac6205db352e822ff6
* #ref: http://stackoverflow.com/a/22342840/3306354
*
*
* @param string $site The url of the site you want to capture
* @param string $img_tag_attributes The img tag attributes to add
* @return string A base64 coded jpg img tag. Simply echo it out wherever you want the image.
*/
function getGooglePageSpeedScreenshot($site, $img_tag_attributes = "border='1'") {
    #initialize
    $use_cache = false;
    $apc_is_loaded = extension_loaded('apc');

    #set $use_cache
    if($apc_is_loaded) {
        apc_fetch("thumbnail:".$site, $use_cache);
    }

    if(!$use_cache) {
        $image = file_get_contents("https://www.googleapis.com/pagespeedonline/v1/runPagespeed?url=$site&screenshot=true");
        $image = json_decode($image, true);
        $image = $image['screenshot']['data'];
        if($apc_is_loaded) {
            apc_add("thumbnail:".$site, $image, 2400);
        }
    }

    $image = str_replace(array('_', '-'), array('/', '+'), $image);
    return "<img src=\"data:image/jpeg;base64,".$image."\" $img_tag_attributes />";
}

//echo getGooglePageSpeedScreenshot($_GET['url'], 'class="thumbnail"');
?>
