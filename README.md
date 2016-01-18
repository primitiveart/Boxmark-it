#Boxmark it!#

A cloud based bookmarking tool.

Boxmark it! saves all your bookmarks (**boxmarks**) on your Dropbox account by utilizing the (now deprecated) Datastores API and JavaScript SDK.

Boxmark it! is a personal project I started as a way to familiarize myself with the Dropbox Datastores API and since it's deprecated now, Boxmark it! will never be anything more than just a concept.

**Technologies: HTML5, CSS3, JavaScript, jQuery, jQuery UI, AJAX, PHP, PhantomJS, Datastores API**

Behance URL: [https://www.behance.net/gallery/30583597/Boxmark-it](https://www.behance.net/gallery/30583597/Boxmark-it)

Video: [https://youtu.be/r8HeF8M9ak0](https://youtu.be/r8HeF8M9ak0)

- - - -

## Boxmark it! features ##
* No need to register just link Boxmark it! with your dropbox account
* Boxmark a site easily by typing or pasting the URL
* Boxmark it! can recognize when you type a URL (no need for http or www – just the name and the suffix are enough)
* Boxmark it! will  automatically grab a Screenshot, the Title and the Description of the boxmarked website but you can edit these information (along with Tags and Comments) either on the review screen or on the focus screen 
* Support for Tags and Comments 
* Display boxmarks as a grid 
* Filter boxmarks based on Tags or Featured option 
* View boxmark details on mouse over without living the grid view
* Click on a boxmark to open the focus screen for a more detailed view
* Live search support (Title, Description, URL, Comments and Tags) – the UI for the live search is not implemented yet
* Delightful and self-explanatory interface (with non-intrusive informative pop-ups when needed)

- - - -

### boxmarkit.js ###
A javascript object that handles the connection to Dropbox (through Datastores API and JavaScript SDK) and also the core functionality of Boxmark it!. 

### functions.js ###
Used to contain both the code that handles the connection to Dropbox and the code that handles the UI/UX. It's not being used anymore.

### mechanics.js ###
Handles the frontend functionality. 

### meta.php ###
Handles the extraction of the boxmarked site's meta data (Title and Description). boxmarkit.js makes an AJAX call to meta.php with the boxmarked site's URL as data (POST) and receives a JSON object with the requested meta data (Title and Description).

### shot.php ###
Captures a screenshot of the boxmarked site by utilizing PhantomJS. boxmarkit.js makes an AJAX call to shot.php with the boxmarked site's URL and rendering and clipping dimensions (width and height) as data (POST) and receives a JSON object with the image encoded in base64. 

The way Boxmark it! handles screenshots is a bit unconventional due to some restrictions. The step-by-step procedure is:

1. Create the PhantomJS file that captures the screenshot (shot.php)
2. Run the PhantomJS file (shot.php)
3. Render the boxmarked website (PhantomJS)
4. Capture/Save screenshot (PhantomJS)
5. Read screenshot file (shot.php)
6. Convert screenshot to base64 (shot.php)
7. Delete screenshot and PhantomJS files created in steps 1 and 4 (shot.php)
8. Convert base64 to BLOB (boxmarkit.js)
9. Generate a filename for the screenshot (boxmarkit.js)
10. Save/Upload the screenshot to Dropbox account (boxmarkit.js)