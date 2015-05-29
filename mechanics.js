var boxmark = new boxmarkit();
var tagsArray = [];
var urlAnimateIntervals = [];
var currentView = 'featured';
var previousView = '';
var currentViewTags = {
	parameters: {featured: true},
	tags: [],
	operator: 'AND'
};

$(document).ready(function(){
	
	// The login button will start the authentication process.
	$('#login-button').click(function (e) {
		e.preventDefault();
		// This will redirect the browser to OAuth login.
		boxmark.authenticate();
	});
	
	// Set what to do when boxmark it is fully connected to Dropbox.
	boxmark.ready(function() {
		loadingComplete('indexLoader');
		tagsArray = boxmark.getTags();
		var bookmarksArray = boxmark.getBookmarks();
		boxmark.recordsChanged(function() {
			tagsArray = boxmark.getTags();
			bookmarksArray = boxmark.getBookmarks();
			refreshBookmarks(currentView);
			refreshMenu();
		});
		var isSaving = false;
		
		$('#logo').after('<div id="search-wrapper"><input type="text" placeholder="Start typing to add or search boxmarks..." id="search-field"><div id="search-screen"></div><div id="search-screen-wrapper"></div></div>');
		$('#search-wrapper').show('drop', {direction: 'down'});
		$('#main').prepend('<div id="bookmarks-wrapper"></div>');
		showMenu();
		showBookmarks(currentView);
		
		$('#wrapper').on('focus', '#search-field', function() {
			$('#search-screen').show();
			$('#search-screen-wrapper').show();
			$('#search-field').addClass('focused');
			if($(this).val() === '') {
				hideMessageBox();
			}
		});
		
		$('#wrapper').on('focusout', '#search-field', function() {
			if($(this).val() === '') {
				hideMessageBox();
			}
		});
		
		$('#wrapper').on('keyup', '#search-field', function(e){
			if($(this).val() !== '') {
				if(!isSaving) {
					if($(this).val().charAt(0) === ' ') {
						$(this).val($(this).val().replace(/^\s\s*/, ''));
					}
					var search = new RegExp(escapeRegExp($(this).val()) , "gi");
					var searchTagsResult = jQuery.grep(tagsArray, function (value) {
							return search.test(value.tag);
						}
					);
					
					var searchBookmarksResult = searchInObjectsArray(bookmarksArray, $(this).val());
				
					console.log(searchTagsResult);
					console.log(searchBookmarksResult);
					
					var isURL = false;
					var urlCheck = new RegExp(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/gi);
					isURL = urlCheck.test($(this).val());
					
					if(isURL && ($(this).val().search("http://") === -1) && ($(this).val().search("https://") === -1)) {
						$(this).val('http://'+$(this).val());
					}
					
					if((searchBookmarksResult.length <= 0) && (isURL)) {
						showMessageBox($('#search-screen-wrapper'), '<p>This site is not boxmarked yet! Press "ENTER" if you like to boxmark it!</p>');
						if(e.keyCode === 13) {
							hideMessageBox();
							loadingStart($('#search-screen-wrapper'), 'saveLoader', 'Saving boxmark...', '_search');
							isSaving = true;
							var url = $(this).val();
							boxmark.createBookmark($(this).val(), '', '', function(result) {
								loadingComplete('saveLoader');
								isSaving = false;
								showSaveBox($('#search-screen-wrapper'), result);
								$('#search-field').keyup();
							}, function(thumbnail) {
								var $element = $(document.getElementById('_'+url));
								if($element[0]) {
									if(!$element.parents('.bookmark-element').children('.bookmark-thumbnail')[0]) {
										boxmark.getThumbnail(thumbnail, function(image) {
											$element.parents('.bookmark-element').prepend('<img class="bookmark-thumbnail" src="'+image+'">');
											var parentID = $element.parents('.bookmark-element').attr('id');
											$('#'+parentID+'.bookmark-element .bookmark-thumbnail').load(function() {
												$(this).show('slide', {direction: 'up'});
											});
										});
									}
								}
							});
							//TEST CODE!!!showSaveBox($('#search-screen-wrapper'), {id: 'some', data: {title: 'primitiveart', description: '', comments: '', url: 'http://primitiveart.gr', tags: ''}});
						}
					}
					else {
						hideMessageBox();
					}
				}
			}
			else {
				hideMessageBox();
			}
		});
		
		$('#wrapper').on('click', '.toggle-control', function(){
			if(!$(this).hasClass('pressed')){
				$(this).find('.toggle-circle').animate({
					marginLeft : '32px'
				},100);
				$(this).find('.toggle-x').remove();
				$(this).find('.toggle-circle').append('<i class="fa fa-check toggle-check"></i>');
				$(this).addClass('pressed');
			}
			else {
				$(this).find('.toggle-circle').animate({
					marginLeft : '2px'
				},100);
				$(this).find('.toggle-check').remove();
				$(this).find('.toggle-circle').append('<i class="fa fa-times toggle-x"></i>');
				$(this).removeClass('pressed');
			}
		});
		
		$('#wrapper').on('click', '.save-box-field-button', function() {
			var id = $(this).parents('#save-box').attr('class');
			var title = $('#save-box.'+id+'').find('#save-box-field-title').val();
			var description = $('#save-box.'+id+'').find('#save-box-field-description').val();
			var comments = $('#save-box.'+id+'').find('#save-box-field-comments').val();
			var tags = $('#save-box.'+id+'').find('#save-box-field-tags-selected').val();
			var featured = false;
			if($('#save-box.'+id+'').find('.toggle-control').hasClass('pressed')) {
				featured = true;
			}
			boxmark.editBookmark(id, title, description, comments, tags, featured);
			hideSaveBox(id);
		});
		
		$('#wrapper').on('click', '.menu-item-basic', function() {
			if(!$(this).hasClass('menu-item-selected')) {
				previousView = currentView;
				var parameters = {};
				$('.menu-item-basic.menu-item-selected p').removeClass('menu-selected');
				$('.menu-item-basic.menu-item-selected .menu-circle').remove();
				$('.menu-item-basic.menu-item-selected').removeClass('menu-item-selected');
				$(this).addClass('menu-item-selected');
				$(this).children('p').addClass('menu-selected');
				$(this).append('<i class="fa fa-circle-o menu-circle"></i>');
				if($(this).attr('id').replace('menu-','') === 'featured') {
					parameters = {featured: true};
				}
				currentViewTags.parameters = parameters;
				if($('.menu-item-tag.menu-item-selected').length > 0) {
					currentView = 'tag';
				}
				else {
					currentView = $(this).attr('id').replace('menu-','');
				}
				showBookmarks(currentView);
			}
		});
		
		$('#wrapper').on('click', '.menu-item-tag', function() {
			if(!$(this).hasClass('menu-item-selected')) {
				previousView = currentView;
				$(this).addClass('menu-item-selected');
				$(this).children('p').addClass('menu-selected');
				$(this).append('<i class="fa fa-circle-o menu-circle"></i>');
				currentView = 'tag';
				currentViewTags.tags.push($(this).attr('id').replace('menu-',''));
				showBookmarks(currentView);
			}
			else {
				$(this).children('p').removeClass('menu-selected');
				$(this).children('.menu-circle').remove();
				$(this).removeClass('menu-item-selected');
				if($('.menu-item-tag.menu-item-selected').length <= 0) {
					previousView = currentView;
					currentView = $('.menu-item-basic.menu-item-selected').attr('id').replace('menu-','');
					currentViewTags.tags = [];
				}
				else {
					var index = currentViewTags.tags.indexOf($(this).attr('id').replace('menu-',''));
					if (index > -1) {
						currentViewTags.tags.splice(index, 1);
					}
				}
				showBookmarks(currentView);
			}
		});
		
		$('#wrapper').on('mouseenter', '.bookmark-element', function() {
			var id = $(this).attr('id');
			if((typeof $('#'+id+' h2').attr('data-offset') !== typeof undefined) && ($('#'+id+' h2').attr('data-offset') !== false)) {
				if((typeof urlAnimateIntervals[id] === 'undefined') || (urlAnimateIntervals[id] === null)) {
					var widthOverflow = parseInt($('#'+id+' h2').attr('data-offset'));
					var margin = - Math.abs(widthOverflow);
					var speed = 300;
					urlAnimateIntervals[id] = setInterval(function() {
												$('#'+id+' .bookmark-caption h2').animate({
													marginLeft: margin+'px'
												}, speed);
												if(margin < 0) {
													margin = 0;
													speed = 200;
												}
												else {
													margin = - Math.abs(widthOverflow);
													speed = 300;
												}
											}, 3000);
				}
			}
		}); 
		
		$('#wrapper').on('mouseleave', '.bookmark-element', function() {
			var id = $(this).attr('id');
			if((typeof $('#'+id+' h2').attr('data-offset') !== typeof undefined) && ($('#'+id+' h2').attr('data-offset') !== false)) {
				clearInterval(urlAnimateIntervals[id]);
				$('#'+id+' h2').css('margin-left', '0');
				urlAnimateIntervals[id] = null;
			}
		});
		
		$('#wrapper').on('click', '.bookmark-element', function(e) {
			var nodeName = e.target.nodeName;
			
			if(nodeName !== 'A') {
				var id = $(this).attr('id');
				showBookmarkPage(id);
			}
		});
		
		$('#wrapper').on('click', '#single-bookmark-back', function() {
			hideBookmarkPage();
		});
		
		$('#wrapper').on('click', '#single-bookmark-comments-wrapper > p', function() {
			var content = $(this).html();
			var height = parseInt($(this).css('height')) + 12;
			$(this).remove();
			if(content === 'Enter some comments for this boxmark...') {
				content = '';
			}
			$('#single-bookmark-comments-wrapper').prepend('<textarea placeholder="Enter some comments for this boxmark...">'+content+'</textarea>');
			$('#single-bookmark-comments-wrapper textarea').css('height', height);
			$('#single-bookmark-comments-wrapper textarea').focus();
		});
		
		$('#wrapper').on('focus', '#single-bookmark-comments-wrapper > textarea', function() {
			moveCaretToEnd(this);
		});
		
		$('#wrapper').on('focusout', '#single-bookmark-comments-wrapper > textarea', function() {
			var content = $(this).val();
			var pClass = '';
			$(this).remove();
			if(content === '') {
				content = 'Enter some comments for this boxmark...';
				pClass = ' class="placeholder"';
			}
			$('#single-bookmark-comments-wrapper').prepend('<p'+pClass+'>'+content+'</p>');
		});
		
		$('#wrapper').on('keydown', '#single-bookmark-comments-wrapper > textarea', function(e) {
			var content = $(this).val();
			if(e.keyCode === 13) {
				e.preventDefault();
				var id = $(this).parents('.single-bookmark-wrapper').attr('id');
				boxmark.editBookmarkComments(id, content);
				$(this).focusout();
			}
			else if(e.keyCode === 27) {
				e.preventDefault();
				$(this).focusout();
			}
		});
		
		$('#wrapper').on('click', function(e) {
			var clickedID = e.target.id;
			
			if((clickedID === 'search-screen') || (clickedID === 'search-screen-wrapper')) {
				$('#search-screen').hide();
				$('#search-screen-wrapper').hide();
				$('#search-field').removeClass('focused');
			}
		});
		
		$(document).on('keydown', function(e) {
			var nodeName = e.target.nodeName;

			if (('INPUT' == nodeName) || ('TEXTAREA' == nodeName)) {
				return;
			}
			$('#search-field').val('').trigger('focus');
		});
	});
	
	boxmark.checkAuthenticate(function() {
		// Client is authenticated. Display UI.
		loadingStart($('body'), 'indexLoader', 'Fetching data...');
		$('#front-logo').remove();
		$('#login').remove();
		$('#front-copyright').remove();
		//$('html').css('background','none');
		$('html').animate({
			opacity: '0'
		}, function(){
			$('#top-bar').after('<div id="logo"><img class="logo-small" src="img/logo.png"/></div>');
			$('#wrapper').append('<div id="main"><p id="status">Connecting...</p></div>');
			$(this).css('background', 'none');
			$(this).animate({
				opacity: '1'
			});
		});
	});	
	
	// Display quick menu.
	function showMenu() {
		$('#bookmarks-wrapper').append('<div id="quick-menu">'+
											'<div id="menu-featured" class="menu-item menu-item-basic menu-item-selected">'+
												'<p class="menu-selected">Featured</p>'+
												'<i class="fa fa-circle-o menu-circle"></i>'+
											'</div>'+
											'<div id="menu-all" class="menu-item menu-item-basic">'+
												'<p>All</p>'+
											'</div>'+
											'<div id="menu-pin" class="menu-item-info">'+
												'<p class="menu-info">Pin tags for quick access</p>'+
												'<i class="fa fa-bell menu-bell"></i>'+
											'</div>'+
										'</div>');
		var tagsMenu = [];
		$.each(tagsArray, function(index, value) {
			if(value.menu) {
				tagsMenu.push(value);
			}
		});
		tagsMenu = tagsMenu.sort(compareTagsMenu);
		$.each(tagsMenu, function(index, value) {
			if($('#menu-pin')[0]) {
				$('#menu-pin').remove();
			}
			$('#quick-menu').append('<div id="menu-'+value.id+'" class="menu-item menu-item-tag"><p>'+value.tag+'</p></div>');
		});
		$('.menu-item').show('drop', {direction: 'up'});
	}
	
	// Refresh menu.
	function refreshMenu() {
		var tagsMenu = [];
		$.each(tagsArray, function(index, value) {
			if(value.menu) {
				tagsMenu.push(value);
			}
		});
		tagsMenu = tagsMenu.sort(compareTagsMenu);
		$.each(tagsMenu, function(index, value) {
			var exists = false;
			if($('#menu-pin')[0]) {
				$('#menu-pin').remove();
			}
			$('.menu-item-tag').each(function(id) {
				var id = $(this).attr('id').replace('menu-','');
				if(id === value.id) {
					$(this).remove();
					$('#quick-menu').append('<div id="menu-'+value.id+'" class="menu-item menu-item-tag" style="display:block;"><p>'+value.tag+'</p></div>');
					exists = true;
					return false;
				}
			});
			if(!exists) {
				$('#quick-menu').append('<div id="menu-'+value.id+'" class="menu-item menu-item-tag" style="display:block;"><p>'+value.tag+'</p></div>');
			}
		});
		$('.menu-item-tag').each(function(id) {
			var exists = false;
			var id = $(this).attr('id').replace('menu-','');
			$.each(tagsMenu, function(index, value) {
				if(id === value.id) {
					exists = true;
					return false;
				}
			});
			if(!exists) {
				$(this).remove();
			}
		});
	}
	
	// Load bookmarks.
	function showBookmarks(type) {
		var tags = currentViewTags.tags;
		var parameters = currentViewTags.parameters;
		var operator = currentViewTags.operator;
		var typeOfBookmarks = {
			featured: boxmark.getFeatured(),
			all: boxmark.getBookmarks(),
			tag: boxmark.getBookmarks(parameters, tags, operator)
		};
		var bookmarks = typeOfBookmarks[type];
		hideBookmarks(previousView, function() {
			var delay = 0;
			$('#bookmarks-wrapper').append('<ul id="'+type+'-container" class="bookmarks-container"></ul>');
			$.each(bookmarks, function(id, value) {
				$('#'+type+'-container').append('<li id="'+value.id+'" class="bookmark-element"><div class="bookmark-caption"><h2 id="_'+value.url+'"><a href="'+value.url+'" target="_blank">'+value.url+'</a></h2><p class="bookmark-title">'+value.title+'</p><p class="bookmark-description">'+value.description+'</p></div></li>');
				boxmark.getThumbnail(value.thumbnail, function(image) {
					$('#'+value.id+'.bookmark-element').prepend('<img class="bookmark-thumbnail" src="'+image+'">');
					$('#'+value.id+'.bookmark-element .bookmark-thumbnail').load(function() {
						$(this).show('slide', {direction: 'up'});
					});
				});
				$('#'+value.id+'.bookmark-element').delay(delay).show('slide', {direction: 'up'}, function() {
					if($('#'+value.id+' .bookmark-caption h2')[0].scrollWidth >  ($('#'+value.id+' .bookmark-caption h2').innerWidth() + 10)) {
						var widthOverflow = $('#'+value.id+' .bookmark-caption h2')[0].scrollWidth - $('#'+value.id+' .bookmark-caption h2').innerWidth();
						$('#'+value.id+' .bookmark-caption h2').attr('data-offset', widthOverflow);
					}
				});
				delay += 50;
			});
			if(bookmarks.length <= 0) {
				$('#'+type+'-container').append('<p class="empty-boxmarks"><i class="fa fa-exclamation-triangle"></i><br>We couldn\'t find any boxmark!<br>Sorry... :(</p>');
			}
		});
	}
	
	// Refresh bookmarks.
	function refreshBookmarks(type) {
		var tags = currentViewTags.tags;
		var parameters = currentViewTags.parameters;
		var operator = currentViewTags.operator;
		var typeOfBookmarks = {
			featured: boxmark.getFeatured(),
			all:	boxmark.getBookmarks(),
			tag: boxmark.getBookmarks(parameters, tags, operator)
		};
		var bookmarks = typeOfBookmarks[type];
		var delay = 0;
		$.each(bookmarks, function(id, value) {
			if($('.empty-boxmarks')[0]) {
				$('.empty-boxmarks').remove();
			}
			var found = false;
			$('.bookmark-element').each(function(index) {
				if($(this).attr('id') === value.id) {
					found = true;
					return false;
				}
			});
			
			if(!found) {
				$('#'+type+'-container').append('<li id="'+value.id+'" class="bookmark-element"><div class="bookmark-caption"><h2 id="_'+value.url+'"><a href="'+value.url+'"  target="_blank">'+value.url+'</a></h2><p class="bookmark-title">'+value.title+'</p><p class="bookmark-description">'+value.description+'</p></div></li>');
				boxmark.getThumbnail(value.thumbnail, function(image) {
					$('#'+value.id+'.bookmark-element').prepend('<img class="bookmark-thumbnail" src="'+image+'">');
					$('#'+value.id+'.bookmark-element .bookmark-thumbnail').load(function() {
						$(this).show('slide', {direction: 'up'});
					});
				});
				$('#'+value.id+'.bookmark-element').delay(delay).show('slide', {direction: 'up'}, function() {
					if($('#'+value.id+' .bookmark-caption h2')[0].scrollWidth >  $('#'+value.id+' .bookmark-caption h2').innerWidth() + 10) {
						var widthOverflow = $('#'+value.id+' .bookmark-caption h2')[0].scrollWidth - $('#'+value.id+' .bookmark-caption h2').innerWidth();
						$('#'+value.id+' .bookmark-caption h2').attr('data-offset', widthOverflow);
					}
				});
				delay += 50;
			}
		});
		if(bookmarks.length <= 0) {
			$('#'+type+'-container').append('<p class="empty-boxmarks"><i class="fa fa-exclamation-triangle"></i><br>We couldn\'t find any boxmark!<br>Sorry... :(</p>');
		}
	}
	
	// Hide bookmarks.
	function hideBookmarks(type, onHide) {
		var delay = 0;
		if($('#'+type+'-container')[0]) {
			/*$('#'+type+'-container').hide('slide', {direction: 'up'}, function() {
				$('#'+type+'-container').remove();
				onHide();
			});*/
			if($('li.bookmark-element')[0]) {
				$($('#'+type+'-container').find('.bookmark-element').get().reverse()).each(function(index, value) { 
					$(this).delay(delay).hide('slide', {direction: 'up'}, 200, function() {
						$(this).remove();
						if(!$('li.bookmark-element')[0]) {
							$('#'+type+'-container').remove();
							onHide();
						}
					});
					delay += 50;
				});
			}
			else {
				$('#'+type+'-container').remove();
				onHide();
			}
		}
		else {
			onHide();
		}
	}
	
	// Show bookmark page.
	function showBookmarkPage(id) {
		var bookmark = boxmark.getBookmarkByID(id);
		
		$('#bookmarks-wrapper').prepend('<div id="bookmark-overlay"></div>'+
										'<div id="bookmark-screen">'+
											'<div id="'+bookmark.id+'" class="single-bookmark-wrapper">'+
												'<div id="single-bookmark-controls">'+
													'<p id="single-bookmark-back"><i class="fa fa-th grid"></i>Back to boxmarks</p>'+
													'<p id="single-bookmark-visit"><a href="'+bookmark.url+'" target="_blank">Visit site <i class="fa fa-external-link"></i></a></p>'+
												'</div>'+
												'<div id="single-bookmark-screenshot-wrapper">'+
													'<img id="single-bookmark-screenshot" src="">'+
												'</div>'+
												'<div id="single-bookmark-caption">'+
													'<h2 id="single-bookmark-title">'+bookmark.title+'</h2>'+
													'<p id="single-bookmark-url"><a href="'+bookmark.url+'" target="_blank">'+bookmark.url+'</a></p>'+
													'<p id="single-bookmark-description">'+bookmark.description+'</p>'+
													'<h3 id="single-bookmark-comments-header">Comments</h3>'+
													'<div id="single-bookmark-comments-wrapper">'+
														'<p>'+bookmark.comments+'</p>'+
													'</div>'+
													'<ul id="single-bookmark-tags" class="input-styled single-bookmark-styled tagit ui-widget ui-widget-content ui-corner-all"></ul>'+
												'</div>'+
											'</div>'+
										'</div>');
										
		if(bookmark.comments === '') {
			$('#single-bookmark-comments-wrapper > p').html('Enter some comments for this boxmark...');
			$('#single-bookmark-comments-wrapper > p').addClass('placeholder');
		}
		
		$('#bookmark-overlay').fadeIn('fast', function() {
			$('#single-bookmark-screenshot-wrapper').show('slide', {direction: 'up'});
			$('#single-bookmark-title').show('slide', {direction: 'up'});
			$('#single-bookmark-url').show('slide', {direction: 'up'});
			$('#single-bookmark-description').show('slide', {direction: 'up'});
			$('#single-bookmark-comments-header').show('slide', {direction: 'up'});
			$('#single-bookmark-comments-wrapper').show('slide', {direction: 'up'});
						
			boxmark.getThumbnail(bookmark.thumbnail, function(image) {
				$('#'+bookmark.id+' #single-bookmark-screenshot').attr('src',image);
				$('#'+bookmark.id+' #single-bookmark-screenshot').load(function() {
					$(this).show('slide', {direction: 'up'});
				});
			});
			
			var delay = 0;
			$.each(bookmark.tags, function(index, value) {
				if(value !== '') {
					var tag = boxmark.getTagByID(value);
					$('#'+bookmark.id+' #single-bookmark-tags').append('<li class="tagit-choice ui-widget-content ui-state-default ui-corner-all tagit-choice-editable">'+
																		'<span class="tagit-label">'+tag.tag+'</span>'+
																	'</li>');
					$('#'+bookmark.id+' #single-bookmark-tags li').last().delay(delay).fadeIn();
					delay += 50;
				}
			});
		});
		
	}
	
	// Hide bookmark page.
	function hideBookmarkPage() {
		var delay = 0;
		$('#single-bookmark-screenshot-wrapper').hide('slide', {direction: 'up'}, 200, function() {
			$('#bookmark-screen').remove();
			$('#bookmark-overlay').fadeOut('fast', function() {
				$(this).remove();
			});
		});
		$($('#single-bookmark-tags li').get().reverse()).each(function() {
			$(this).delay(delay).fadeOut(200, function() {
				$(this).remove();
			});
			delay += 50;
		});
		$('#single-bookmark-title').hide('slide', {direction: 'up'}, 200);
		$('#single-bookmark-url').hide('slide', {direction: 'up'}, 200);
		$('#single-bookmark-description').hide('slide', {direction: 'up'}, 200);
		$('#single-bookmark-comments-header').hide('slide', {direction: 'up'}, 200);
		$('#single-bookmark-comments-wrapper').hide('slide', {direction: 'up'}, 200); 
	}
	
	// Show message box in search page.
	function showMessageBox($element, content) {
		if(!$element.find('#search-message')[0]) {
			$element.prepend('<div id="search-message-arrow" class="arrow-up"></div><div id="search-message">'+content+'</div>');
			$('#search-message-arrow').show('drop', {direction: 'up', easing: 'easeOutExpo'});
			$('#search-message').show('drop', {direction: 'up', easing: 'easeOutExpo'});
		}
	}
	
	// Update message box contents.
	function updateMessageBox(content, target) {
		if($('#search-message')[0]) {
			$('#search-message > p').slideUp('fast', function() {
				$('#search-message > p').remove();
				$('#search-message').append(content);
				$('#search-message > '+target+'').slideDown('fast');
			});
		}
	}
	
	// Hide message box.
	function hideMessageBox() {
		if($('#search-message')[0]) {
			$('#search-message').hide('drop', {direction: 'up', easing: 'easeOutExpo'}, function() {
				$('#search-message').remove();
			});
			$('#search-message-arrow').hide('drop', {direction: 'up', easing: 'easeOutExpo'}, function() {
				$('#search-message-arrow').remove();
			});
		}
	}
	
	// Show save box in search page.
	function showSaveBox($element, data) {
		var uniqueID = data.id;
		$element.append('<div id="save-box-arrow" class="arrow-up '+uniqueID+'"></div>'+
						'<div id="save-box" class="'+uniqueID+'">'+
							'<p id="save-box-title" class="saved">Boxmark saved!</p>'+
							'<p id="save-box-title" class="url" style="display:none;">'+data.data.url+'</p>'+
							'<i id="save-box-bookmark" class="fa fa-bookmark"></i>'+
							'<div id="save-box-divider"></div>'+
							'<div id="save-box-content">'+
								'<div id="save-box-content-wrapper">'+
									'<div class="save-box-field-wrapper">'+
										'<p class="save-box-field-label">Title</p>'+
										'<input type="text" id="save-box-field-title" class="input-styled" value="'+data.data.title+'">'+
									'</div>'+
									'<div class="save-box-field-wrapper">'+
										'<p class="save-box-field-label">Description</p>'+
										'<textarea id="save-box-field-description" class="input-styled textarea">'+data.data.description+'</textarea>'+
									'</div>'+
									'<div class="save-box-field-wrapper">'+
										'<p class="save-box-field-label">Comments</p>'+
										'<textarea id="save-box-field-comments" class="input-styled textarea">'+data.data.comments+'</textarea>'+
									'</div>'+
									'<div class="save-box-field-wrapper">'+
										'<p class="save-box-field-label">Tags</p>'+
										'<ul id="save-box-field-tags" class="input-styled"></ul>'+
										'<input type="hidden" name="save-box-field-tags-selected" id="save-box-field-tags-selected" value="">'+
									'</div>'+
									'<div class="save-box-field-wrapper toggle-wrapper">'+
										'<p class="save-box-field-label">Add to featured boxmarks</p>'+
										'<div class="toggle-control">'+
											'<div class="toggle-circle">'+
												'<i class="fa fa-times toggle-x"></i>'+
											'</div>'+
										'</div>'+
									'</div>'+
									'<div class="save-box-field-wrapper button-wrapper">'+
										'<input type="button" class="save-box-field-button" value="Complete">'+
									'</div>'+
								'</div>'+
							'</div>'+
						'</div>');
		var tagsTextArray = []
		$.each(tagsArray, function(id, value) {
			tagsTextArray.push(value.tag);
		});
		$('#save-box.'+uniqueID+'').show('drop', {direction: 'up', easing: 'easeOutExpo'});
		$('#save-box-arrow.'+uniqueID+'').slideDown();//show('drop', {direction: 'up', easing: 'easeOutExpo'});
		
		setTimeout(function(){
			$('#save-box.'+uniqueID+' > #save-box-title.saved').hide('slide', {direction: 'up', easing: 'easeOutExpo'}, function() {
				$('#save-box.'+uniqueID+' > #save-box-title.url').show('slide', {direction: 'down', easing: 'easeOutExpo'});
			});
		}, 3000);
		
		$('#save-box.'+uniqueID+'').find('#save-box-field-tags').tagit({
			availableTags: tagsTextArray,
			allowSpaces: true,
			singleField: true,
            singleFieldNode: $('#save-box.'+uniqueID+'').find('#save-box-field-tags-selected')
		});
		
		/*setTimeout(function(){
			$(window).click(function(e) {
				var clickedID = e.target.id;
				var clickedElement = $(e.target);
				
				if((clickedID !== 'save-box-arrow') && (clickedID !== 'save-box') && (!clickedElement.parents('div#save-box')[0])) {
					$(window).unbind('click');
					hideSaveBox(uniqueID);
				}
			});
		}, 50);*/
	}
	
	// Hide save box.
	function hideSaveBox(uniqueID) {
		$('#save-box.'+uniqueID+'').hide('drop', {direction: 'up', easing: 'easeOutExpo'}, function() {
			$('#save-box.'+uniqueID+'').remove();
		});
		$('#save-box-arrow.'+uniqueID+'').hide('drop', {direction: 'up', easing: 'easeOutExpo'}, function() {
			$('#save-box-arrow.'+uniqueID+'').remove();
		});
	}
	
	// Hide loading indicator.
	function loadingComplete(uniqueID) {
		if(typeof uniqueID === 'undefined'){
			$('#loader').remove();
		}
		else {
			$('.'+uniqueID+'').remove();
		}
	}
	
	// Show loading indicator.
	function loadingStart($element, uniqueID, loadingMsg, style) {
		if(typeof style === 'undefined'){
			style = '';
		}
		if(!$('.'+uniqueID)[0]){
			$element.append('<div id="loader" class="'+uniqueID+'"><img src="img/loader'+style+'.gif"></div>');
			
			if(loadingMsg !== ''){
				$('.'+uniqueID+'').prepend('<p class="'+style+'">'+loadingMsg+'</p>');
			}
		
		}
	}
	
	// Search in array of objects.
	function searchInObjectsArray(array, term){
		var search = new RegExp(escapeRegExp(term) , "gi");
		var searchResults = [];
		$.each(array, function(id, value) {
			$.each(value, function(id, property) {
				if(typeof property === 'string') {
					if(property.match(search)) {
						searchResults.push(value);
						return false;
					}
				}
			})
		});
		
		return searchResults;
	}
	
	// Escape all special characters for regexp.
	function escapeRegExp(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}
	
	// Sorting rule for most recent tags.
	function compareTagsDate(a,b) {
		if (new Date(a.date) < new Date(b.date)) {
			return -1;
		}
		if (new Date(a.date) > new Date(b.date)) {
			return 1;
		}
		return 0;
	}
	
	// Sorting rule for quick menu.
	function compareTagsMenu(a,b) {
		if (parseInt(a.menu) < parseInt(b.menu)) {
			return -1;
		}
		if (parseInt(a.menu) > parseInt(b.menu)) {
			return 1;
		}
		return 0;
	}
	
	// Move caret to end.
	function moveCaretToEnd(element) {
		if (typeof element.selectionStart == "number") {
			element.selectionStart = element.selectionEnd = element.value.length;
		} 
		else if (typeof element.createTextRange != "undefined") {
			element.focus();
			var range = element.createTextRange();
			range.collapse(false);
			range.select();
		}
	}
	
});