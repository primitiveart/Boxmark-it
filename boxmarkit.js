//$(function () {
	
	var boxmarkit = function(){
		// Insert your Dropbox app key here:
		var DROPBOX_APP_KEY = 'API_KEY';

		var boxmarkit = this;	
		
		// Exposed for easy access in the browser console.
		this.client = new Dropbox.Client({key: DROPBOX_APP_KEY});
		this.defaultDatastore;
		this.bookmarkTable;
		this.tagTable;


		// Insert a new bookmark record.
		function insertBookmarkRecord(title, url, description, comments, tagsIdArray) {
			var returnObject = {
				existed: false,
				id: ''
			};
			var newBookmark = {};
			var existingBookmark = [];
			existingBookmark = boxmarkit.bookmarkTable.query({url: url});
			
			if(existingBookmark.length <= 0){
				var urlArray = url.split('/');
				var thumbnail = '';
				for(var i = 2; i < urlArray.length; i++){
					thumbnail = thumbnail + urlArray[i];
				}
				
				newBookmark = boxmarkit.bookmarkTable.insert({
					title: title,
					url: url,
					description: description,
					thumbnail: 'snapshots/'+thumbnail+'.jpg',
					date: new Date(),
					comments: comments,
					tags: tagsIdArray,
					featured: false
				});
				
				returnObject = {
					existed: false,
					id: newBookmark._rid,
					data: newBookmark.getFields()
				};
			}
			else {
				returnObject = {
					existed: true,
					id: existingBookmark._rid
				};
			}
			
			return returnObject;
		}
		
		// Edit bookmark with given ID.
		function editBookmarkRecord(id, title, description, comments, tagsIdArray, featured) {
			var existingBookmark = [];
			existingBookmark = boxmarkit.bookmarkTable.get(id);
			
			if(existingBookmark !== null) {
				boxmarkit.bookmarkTable.get(id).update({
					title: title,
					description: description,
					comments: comments,
					tags: tagsIdArray,
					featured: featured
				});
			}
			else {
				// Do something to handle error of no such record.
			}
		}
		
		// Edit bookmark comments with given ID.
		function editBookmarkRecordComments(id, comments) {
			var existingBookmark = [];
			existingBookmark = boxmarkit.bookmarkTable.get(id);
			
			if(existingBookmark !== null) {
				boxmarkit.bookmarkTable.get(id).update({
					comments: comments
				});
			}
			else {
				// Do something to handle error of no such record.
			}
		}
		
		// Delete bookmark record with a given ID.
		function deleteBookmarkRecord(id) {
			boxmarkit.bookmarkTable.get(id).deleteRecord();
		}
		
		// Delete all bookmark records.
		function emptyBookmarkRecords() {
			$.each(boxmarkit.bookmarkTable.query(), function(id, value) {
				value.deleteRecord();
			});
		}
		
		// Fetch bookmarks based on given parameters - if no parameter then return all bookmarks.
		function fetchBookmarkRecords(parameters, tags, operator) {
			if(typeof parameters === 'undefined') {
				parameters = {};
			}
			if(typeof tags === 'undefined') {
				tags = [];
			}
			if(typeof operator === 'undefined') {
				operator = 'AND';
			}
			var bookmarksArray = [];
			var bookmarksProtoArray = [];
			bookmarksProtoArray = boxmarkit.bookmarkTable.query(parameters);
			$.each(bookmarksProtoArray, function(id, value) {
				var recordObject = value.getFields();
				if(recordObject.hasOwnProperty('tags')) {
					recordObject.tags = recordObject.tags.toArray();
				}
				recordObject.id = value._rid;
				bookmarksArray.push(recordObject);
			});
			if(tags.length > 0) {
				if(operator === 'AND') {
					$.each(tags, function(index, val) {
						bookmarksProtoArray = $.extend(true, [], bookmarksArray);
						bookmarksArray = [];
						$.each(bookmarksProtoArray, function(id, value) {
							$.each(value.tags, function(tagId, tagValue) {
								if(tagValue === val) {
									bookmarksArray.push(value);
									return false;
								}
							});
						});
					});
				}
				else if(operator === 'OR') {
					bookmarksProtoArray = $.extend(true, [], bookmarksArray);
					bookmarksArray = [];
					$.each(bookmarksProtoArray, function(id, value) {
						$.each(value.tags, function(tagId, tagValue) {
							if($.inArray(tagValue, tags) > -1) {
								bookmarksArray.push(value);
								return false;
							}
						});
					});
				}
			}
			
			return bookmarksArray;
		}
		
		// Return a bookmark by id.
		function fetchBookmarkRecordByID(id) {
			var bookmark = null;
			var existingBookmark = [];
			existingBookmark = boxmarkit.bookmarkTable.get(id);
			
			if(existingBookmark !== null) {
				bookmark = existingBookmark.getFields();
				bookmark.id = id;
				if(bookmark.hasOwnProperty('tags')) {
					bookmark.tags = bookmark.tags.toArray();
				}
			}
			
			return bookmark;
		}
		
		// Return a tag id (if tag record doesn't exist, add).
		function insertTagRecord(text) {
			var id = '';
			var existingTag = [];
			var newTag = {};
			existingTag = boxmarkit.tagTable.query({tag: text});
			
			if(existingTag.length > 0){
				id = existingTag[0]._rid;
			}
			else {
				if(text !== '') { 
					newTag = boxmarkit.tagTable.insert({
								tag: text,
								date: new Date(),
								menu: false
							});
					
					id = newTag._rid;
				}
			}
			
			return id;
		}
		
		// Edit tag with given ID.
		function editTagRecord(id, menu) {
			var existingTag = [];
			existingTag = boxmarkit.tagTable.get(id);
			
			if(existingTag !== null) {
				boxmarkit.tagTable.get(id).update({
					menu: menu
				});
			}
			else {
				// Do something to handle error of no such record.
			}
		}
		
		// Delete tag record with a given ID.
		function deleteTagRecord(id) {
			boxmarkit.tagTable.get(id).deleteRecord();
		}
		
		// Delete all tag records.
		function emptyTagRecords() {
			$.each(boxmarkit.tagTable.query(), function(id, value) {
				value.deleteRecord();
			});
		}
		
		// Fetch tags based on given parameters - if no parameter then return all tags.
		function fetchTagRecords(parameters) {
			if(typeof parameters === 'undefined') {
				parameters = {};
			}
			var tagsArray = [];
			var tagsProtoArray = [];
			tagsProtoArray = boxmarkit.tagTable.query(parameters);
			
			$.each(tagsProtoArray, function(id, value){
				var recordObject = value.getFields();
				recordObject.id = value._rid;
				tagsArray.push(recordObject);
			});
			
			return tagsArray;
		}
		
		// Return a tag by id.
		function fetchTagRecordByID(id) {
			var tag = null;
			var existingTag = [];
			existingTag = boxmarkit.tagTable.get(id);
			
			if(existingTag !== null) {
				tag = existingTag.getFields();
				tag.id = id;
			}
			
			return tag;
		}
		
		// Generate website thumbnail.
		function createThumbnail(url, width, height, clipWidth, clipHeight, onThumbnail) {
			callAjax(true, 'screenshot', {url: url, width: width, height: height, clipWidth: clipWidth, clipHeight: clipHeight}, function(obj){
				var blob = b64toBlob(obj);
				var urlArray = url.split('/');
				var thumbnail = '';
				for(var i = 2; i < urlArray.length; i++){
					thumbnail = thumbnail + urlArray[i];
				}
				
				boxmarkit.client.writeFile('snapshots/'+thumbnail+'.jpg', blob, function () {
					onThumbnail('snapshots/'+thumbnail+'.jpg');
				});
			}, 'screenshotXHR');
		}
		
		// Fetch website thumbnail.
		function fetchThumbnail(thumbnail, onRetrieve) {
			boxmark.client.makeUrl(thumbnail, {download: true}, function(error, file) {
				if(error === null) {
					onRetrieve(file.url);
				}
			});
		}
		
		// Search for given tag.
		function searchTagsRecord(tag) {
			var tagsProtoArray = [];
			var tagsArray = [];
			tagsProtoArray = boxmarkit.tagTable.query({
				tag: tag
			});
			
			$.each(tagsProtoArray, function(id, value){
				tagsArray.push({id: value._rid, tag: value.get('tag')});
			});
			
			triggerListener('onFind', tagsArray);
		}
		
		this.authenticate = function() {
			this.client.authenticate();
		}
		
		this.checkAuthenticate = function(onAuth) {
			// Try to finish OAuth authorization.
			this.client.authenticate({interactive:false}, function (error) {
				if (error) {
					alert('Authentication error: ' + error);
				}
			});
			
			if (this.client.isAuthenticated()) {
				onAuth();
				
				this.client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
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
					$('#status').addClass('synched');
					var statusTimeOut = setTimeout(function() {
						$('#status').fadeOut();
						statusTimeOut = null;
					}, 3000);
					var previouslyUploading = false;
					datastore.syncStatusChanged.addListener(function () {
						var uploading = datastore.getSyncStatus().uploading;
						if (previouslyUploading && !uploading) {
							$('#status').text('Last sync: ' + new Date());
							if(statusTimeOut !== null) {
								clearTimeout(statusTimeOut);
							}
							else {
								$('#status').fadeIn();
							}
							statusTimeOut = setTimeout(function() {
								$('#status').fadeOut();
								statusTimeOut = null;
							}, 3000);	
						}
						previouslyUploading = uploading;
					});

					boxmarkit.defaultDatastore = datastore;
					boxmarkit.bookmarkTable = datastore.getTable('bookmarks');
					boxmarkit.tagTable = datastore.getTable('tags');
					
					triggerListener('onReady');
					//getTagsIdArray('test,some more,tags,wow,look');
					//emptyBookmarkRecords();
					//emptyTagRecords();
					
					// Populate the initial task list.
					//updateList();

					// Ensure that future changes update the list.
					//datastore.recordsChanged.addListener(updateList);
				});
			}
		}
		
		// Set functions to run when ready
		this.ready = function(onReady) {
			this.listenerFunctions.onReady = onReady;
		}
		
		// Create a new bookmark.
		this.createBookmark = function(url, comments, tags, onSave, onThumbnail) {
			// Check for tags and return ID in tagTable.
			var tagsIdArray = getTagsIdArray(tags);
			// Generate thumbnail asynchronously.
			createThumbnail(url, 1024, 768, 1024, 768, onThumbnail);
			// Get website description and title.
			callAjax(true, 'meta', {url: url}, function(obj){
				var retValue;
				// Insert the bookmark in datastore.
				retValue = insertBookmarkRecord(obj.title, url, obj.description, comments, tagsIdArray);
				onSave(retValue);
			}, 'metaXHR');
		}
		
		// Edit a bookmark.
		this.editBookmark = function(id, title, description, comments, tags, featured) {
			// Check for tags and return ID in tagTable.
			var tagsIdArray = getTagsIdArray(tags);
			// Edit bookmark record.
			editBookmarkRecord(id, title, description, comments, tagsIdArray, featured);
		}
		
		// Update bookmark comments.
		this.editBookmarkComments = function(id, comments) {
			editBookmarkRecordComments(id, comments);
		}
		
		// Delete a bookmark.
		this.deleteBookmark = function(id) {
			var existingBookmark = [];
			existingBookmark = this.bookmarkTable.get(id);
			
			if(existingBookmark !== null) {
				this.client.remove(existingBookmark.getFields().thumbnail, function() {
					deleteBookmarkRecord(id);
				});
			}
			else {
				// Do something to handle error of no such record.
			}
			
			// Do something after bookmark delete.
		}
		
		// Edit a tag.
		this.editTag = function(id, menu) {
			editTagRecord(id, menu);
		}
		
		// Get thumbnail as blob.
		this.getThumbnail = function(thumbnail, onRetrieve) {
			fetchThumbnail(thumbnail, onRetrieve);
		}
		
		// Listener for everytime records change.
		this.recordsChanged = function(onRecordsChange) {
			this.defaultDatastore.recordsChanged.addListener(onRecordsChange);
		}
		
		// Search for tags.
		this.searchTags = function(tag, onFind) {
			this.listenerFunctions.onFind = onFind;
			
			searchTagsRecord(tag);
		}
		
		// Get bookmarks based on given parameters.
		this.getBookmarks = function(parameters, tags, operator) {
			return fetchBookmarkRecords(parameters, tags, operator);
		}
		
		// Get featured bookmarks.
		this.getFeatured = function() {
			return fetchBookmarkRecords({featured: true});
		}
		
		// Get single bookmark by id.
		this.getBookmarkByID = function(id) {
			return fetchBookmarkRecordByID(id);
		}
		
		// Get tags based on given parameters.
		this.getTags = function(parameters) {
			return fetchTagRecords(parameters);
		}
		
		// Get single tag by id.
		this.getTagByID = function(id) {
			return fetchTagRecordByID(id);
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
		
		this.listenerFunctions = {
			'onAuthenticate': 'none',
			'onReady': 'none',
			'onFind' : 'none'
		};
		
		// Runs the function on trigger
		function triggerListener(event, values) {
			if((boxmarkit.listenerFunctions.hasOwnProperty(event)) && isFunction(boxmarkit.listenerFunctions[event])){
				if(typeof values === 'undefined') {
					boxmarkit.listenerFunctions[event]();
				}
				else {
					boxmarkit.listenerFunctions[event](values);
				}
			}
		}
		
		// Check if given variable is function
		function isFunction(functionToCheck) {
			var getType = {};
			return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
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
	
	}
	
//})