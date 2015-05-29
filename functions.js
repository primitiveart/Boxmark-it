// Insert your Dropbox app key here:
var DROPBOX_APP_KEY = 'API_KEY';

// Exposed for easy access in the browser console.
var client = new Dropbox.Client({key: DROPBOX_APP_KEY});
var defaultDatastore;
var bookmarkTable;
var tagTable;

$(function () {
	// Insert a new bookmark record.
	function insertBookmarkRecord(title, url, description, comments, tagsIdArray) {
		var existingBookmark = [];
		existingBookmark = bookmarkTable.query({url: url});
		
		if(existingBookmark.length <= 0){
			var urlArray = url.split('/');
			var thumbnail = '';
			for(var i = 2; i < urlArray.length; i++){
				thumbnail = thumbnail + urlArray[i];
			}
			
			bookmarkTable.insert({
				title: title,
				url: url,
				description: description,
				thumbnail: 'snapshots/'+thumbnail+'.jpg',
				date: new Date(),
				comments: comments,
				tags: tagsIdArray,
				featured: false
			});
		}
		else {
			// Do something to inform the user that this site is already bookmarked.
		}
	}
	
	// Edit bookmark with given ID.
	function editBookmarkRecord(id, title, description, comments, tagsIdArray) {
		var existingBookmark = [];
		existingBookmark = bookmarkTable.get(id);
		
		if(existingBookmark !== null) {
			bookmarkTable.get(id).update({
				title: title,
				description: description,
				comments: comments,
				tags: tagsIdArray
			});
		}
		else {
			// Do something to handle error of no such record.
		}
	}
	
	// Delete bookmark record with a given ID.
	function deleteBookmarkRecord(id) {
		bookmarkTable.get(id).deleteRecord();
	}
	
	// Return a tag id (if tag record doesn't exist, add).
	function insertTagRecord(text) {
		var id = '';
		var existingTag = [];
		var newTag = {};
		existingTag = tagTable.query({tag: text});
		
		if(existingTag.length > 0){
			id = existingTag[0]._rid;
		}
		else {
			newTag = tagTable.insert({
						tag: text
					});
			
			id = newTag._rid;
		}
		
		return id;
	}
	
	// Delete tag record with a given ID.
	function deleteTagRecord(id) {
		tagTable.get(id).deleteRecord();
	}
	
	// Generate website thumbnail.
	function createThumbnail(url, width, height, clipWidth, clipHeight){
		callAjax(true, 'screenshot', {url: url, width: width, height: height, clipWidth: clipWidth, clipHeight: clipHeight}, function(obj){
			var blob = b64toBlob(obj);
			var urlArray = url.split('/');
			var thumbnail = '';
			for(var i = 2; i < urlArray.length; i++){
				thumbnail = thumbnail + urlArray[i];
			}
			
			client.writeFile('snapshots/'+thumbnail+'.jpg', blob, function () {
				// Do something to show that saving completed.
			});
		}, 'screenshotXHR');
	}
	
	// The login button will start the authentication process.
	$('#login-button').click(function (e) {
		e.preventDefault();
		// This will redirect the browser to OAuth login.
		client.authenticate();
	});

	// Try to finish OAuth authorization.
	client.authenticate({interactive:false}, function (error) {
		if (error) {
			alert('Authentication error: ' + error);
		}
	});
	
	if (client.isAuthenticated()) {
		// Client is authenticated. Display UI.
		$('#login-button').hide();
		$('#main').show();

		client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
			if (error) {
				alert('Error opening default datastore: ' + error);
				return;
			}

			$(window).bind('beforeunload', function () {
				if (datastore.getSyncStatus().uploading) {
					return "You have pending changes that haven't been synchronized to the server.";
				}
			});
			$('#status').text('Synchronized');
			var previouslyUploading = false;
			datastore.syncStatusChanged.addListener(function () {
				var uploading = datastore.getSyncStatus().uploading;
				if (previouslyUploading && !uploading) {
					$('#status').text('Last sync: ' + new Date());
				}
				previouslyUploading = uploading;
			});

			defaultDatastore = datastore;
			bookmarkTable = datastore.getTable('bookmarks');
			tagTable = datastore.getTable('tags');
			
			//createBookmark('http://insomnia.gr', 'Cancerous site', 'test,tutorial,cancer,development');
			//deleteBookmark('_180o4n741gg_js_GmOJK');
			
			// Populate the initial task list.
			updateList();

			// Ensure that future changes update the list.
			datastore.recordsChanged.addListener(updateList);
		});
	}
	
	// Create a new bookmark.
	function createBookmark(url, comments, tags) {
		// Check for tags and return ID in tagTable.
		var tagsIdArray = getTagsIdArray(tags);
		// Generate thumbnail asynchronously.
		createThumbnail(url, 1024, 768, undefined, undefined);
		// Get website description and title.
		callAjax(true, 'meta', {url: url}, function(obj){
			// Insert the bookmark in datastore.
			insertBookmarkRecord(obj.title, url, obj.description, comments, tagsIdArray);
		}, 'metaXHR');
		
		// Do something after bookmark creation.
	}
	
	// Edit a bookmark.
	function editBookmark(id, title, description, comments, tags) {
		// Check for tags and return ID in tagTable.
		var tagsIdArray = getTagsIdArray(tags);
		// Edit bookmark record.
		editBookmarkRecord(id, title, description, comments, tagsIdArray);
		
		// Do something after bookmark editing.
	}
	
	// Delete a bookmark.
	function deleteBookmark(id) {
		var existingBookmark = [];
		existingBookmark = bookmarkTable.get(id);
		
		if(existingBookmark !== null) {
			client.remove(existingBookmark.getFields().thumbnail, function() {
				deleteBookmarkRecord(id);
			});
		}
		else {
			// Do something to handle error of no such record
		}
		
		// Do something after bookmark delete.
	}
	
	// Create an array with tags IDs.
	function getTagsIdArray(tags) {
		var tagsTextArray = tags.split(',');
		var tagsIdArray = [];
		$.each(tagsTextArray, function(id, tag) {
			tagsIdArray.push(insertTagRecord(tag));
		});
		
		return tagsIdArray;
	}
	
	// Handle AJAX calls.
	function callAjax(doasync, type, ajaxdata, afunc, ajaxIDval) {
		var ajaxID = typeof ajaxIDval !== 'undefined' ? ajaxIDval : 'xhr';
		var codeUrl = {
			screenshot: 'shot.php',
			meta: 'meta.php'
		};
		window[''+ajaxID+''] = $.ajax({
								type: 'POST',
								url: codeUrl[type], 
								cache: false,
								async: doasync,
								data: ajaxdata,
								success : function (data){
									var obj = jQuery.parseJSON(data);				
									afunc(obj);
								}
							});
	}
	
	// Abort AJAX calls.
	function abortAjax(variables){
		if($.isArray(variables)){
			$.each(variables, function(index, value) {
				if(window[''+value+'']){
					window[''+value+''].abort();
				}
			});
		}
		else {
			if(window[''+variables+'']){
				window[''+variables+''].abort();
			}
		}
	}
	
	// Convert base64 to blob.
	function b64toBlob(b64Data, contentType, sliceSize) {
		contentType = contentType || '';
		sliceSize = sliceSize || 512;

		var byteCharacters = atob(b64Data);
		var byteArrays = [];

		for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			var slice = byteCharacters.slice(offset, offset + sliceSize);

			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			var byteArray = new Uint8Array(byteNumbers);

			byteArrays.push(byteArray);
		}

		var blob = new Blob(byteArrays, {type: contentType});
		return blob;
	}
	
})