/**
 * ownCloud - wopiviewer
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hugo Gonzalez Labrador (CERN) <hugo.gonzalez.labrador@cern.ch>
 * @copyright Hugo Gonzalez Labrador (CERN) 2017
 */

(function ($, OC, OCA) {	// just put WOPIViewer in global namespace so 

	// just put WOPIViewer in global namespace so 
	// the hack for owncloud 8 for having the new file menu entry can work.
	OCA.WOPIViewer = {};

	var wordViewer;
	var wordNew;
	var wordEditor;
	var powerpointViewer; 
	var powerpointEditor;
	var powerpointNew; 
	var excelViewer;
	var excelNew;
	var excelEditor;

	var wordMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	var excelMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
	var powertpointMime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

	var loadConfig = function() {
		var url = OC.generateUrl('/apps/wopiviewer/config');
		$.get(url).success(function (response) {
			OCA.WOPIViewer.endPoints = response;
			wordViewer = response['.docx'].view + "&WOPISrc=";
			wordEditor = response['.docx'].edit + "&WOPISrc=";
			wordNew = response['.docx']['new'] + "&WOPISrc=";
			powerpointViewer = response['.pptx'].view + "&WOPISrc=";
			powerpointEditor = response['.pptx'].edit + "&WOPISrc=";
			powerpointNew = response['.pptx']['new'] + "&WOPISrc=";
			excelViewer = response['.xlsx'].view + "&WOPISrc=";
			excelEditor = response['.xlsx'].edit + "&WOPISrc=";
			excelNew = response['.xlsx']['new'] + "&WOPISrc=";
		}); 
	}

	var closeDocument = function (e) {
		e.preventDefault();
		$("#office_container").remove();
		//$("header div#header #office_close_button").remove();
		window.location.hash = '';
		$(window).unbind('popstate', closeDocument);
	};


	var template = '<div id="office_container"><span id="frameholder"></span></div>';

	var setView = function (actionURL, accessToken, filename) {
		var view = template.replace("<OFFICE_ONLINE_ACTION_URL", actionURL);
		view = view.replace("<ACCESS_TOKEN_VALUE>", accessToken);

		$('#content').append(view);

		var frameholder = document.getElementById('frameholder');
		var office_frame = document.createElement('iframe');
		office_frame.name = 'office_frame';
		office_frame.id = 'office_frame';
		// The title should be set for accessibility
		office_frame.title = 'CERNBox Office Online Frame';
		// This attribute allows true fullscreen mode in slideshow view
		// when using PowerPoint Online's 'view' action.
		office_frame.setAttribute('allowfullscreen', 'true');
		office_frame.src = actionURL;
		frameholder.appendChild(office_frame);
	};


	var isPublicPage = function () {

		if ($("input#isPublic") && $("input#isPublic").val() === "1") {
			return true;
		} else {
			return false;
		}
	};

	var getSharingToken = function () {
		if ($("input#sharingToken") && $("input#sharingToken").val()) {
			return $("input#sharingToken").val();
		} else {
			return null;
		}
	};

	var sendOpen = function (basename, data, targetURL) {
		var canedit = false;
		var permissions = data.$file.attr("data-permissions");
		if (permissions > 1) { // > 1 write permissions
			canedit = true;
		}
		filename = data.dir + "/" + basename;

		var data = {filename: filename};
		var url = "";
		// check if we are on a public page
		if (isPublicPage()) {
			var token = getSharingToken();
			url = OC.generateUrl('/apps/wopiviewer/publicopen');
			data['token'] = token;
			data['folderurl'] = parent.location.protocol+'//'+location.host+OC.generateUrl('/s/')+token+'?path='+OC.dirname(data.filename);
		} else {
			url = OC.generateUrl('/apps/wopiviewer/open');
			data['folderurl'] = parent.location.protocol+'//'+location.host+OC.generateUrl('/apps/files/?dir=' + OC.dirname(data.filename));
		}

		$.post(url, data).success(function (response) {
			if (response.wopi_src) {
				window.location.hash = 'office';
				var viewerURL = targetURL + encodeURI(response.wopi_src);
				setView(viewerURL, response.wopi_src, basename);
				//var closeButton = '<p class="" id="office_close_button" style="display: block; position: absolute; right: 50%; top: 5px"><b>The Office application is in beta</b></p>';
				//$("header div#header").append(closeButton);
				//$("header div#header #office_close_button").click(closeDocument);
			} else {
				console.error(response.error);
			}
		});
	};

	var getUrlParameter = function getUrlParameter (sParam) {
		var sPageURL = decodeURIComponent(window.location.search.substring(1)),
			sURLVariables = sPageURL.split('&'),
			sParameterName,
			i;
		for (i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split('=');

			if (sParameterName[0] === sParam) {
				return sParameterName[1] === undefined ? true : sParameterName[1];
			}
		}
	};


	var wopiViewer = {
		onViewWord: function (filename, data) {
			// if file size is 0 we ask office online
			// to create an empty docx file
			var filesize = parseInt(data.$file.attr("data-size"));
			if(filesize === 0) {
				sendOpen(filename, data, wordNew);
			} else {
				sendOpen(filename, data, wordViewer);
			}
		},

		onEditWord: function (filename, data) {
			// if file size is 0 we ask office online
			// to create an empty docx file
			var filesize = parseInt(data.$file.attr("data-size"));
			if(filesize === 0) {
				sendOpen(filename, data, wordNew);
			} else {
				sendOpen(filename, data, wordEditor);
			}
		},

		onViewWordInPublicSingleFile: function (token) {
			var token = getSharingToken();
			url = OC.generateUrl('/apps/wopiviewer/publicopen');
			var data = {filename: null};
			data['token'] = token;
			if (getUrlParameter('closed') === '1') {
				return;
			}
			data['folderurl'] = parent.location.protocol + '//' + location.host + OC.generateUrl('/s/') + token + "?closed=1";
			$.post(url, data).success(function (response) {
				if (response.wopi_src) {
					window.location.hash = 'office';
					var viewerURL = wordViewer + encodeURI(response.wopi_src);
					setView(viewerURL, response.wopi_src, token);
				} else {
					console.error(response.error);
				}
			});
		},



		onViewPowerpoint: function (filename, data) {
			// if file size is 0 we ask office online
			// to create an empty docx file
			var filesize = parseInt(data.$file.attr("data-size"));
			if(filesize === 0) {
				sendOpen(filename, data, powerpointNew);
			} else {
				sendOpen(filename, data, powerpointViewer);
			}
		},
		onEditPowerpoint: function (filename, data) {
			// if file size is 0 we ask office online
			// to create an empty docx file
			var filesize = parseInt(data.$file.attr("data-size"));
			if(filesize === 0) {
				sendOpen(filename, data, powerpointNew);
			} else {
				sendOpen(filename, data, powerpointEditor);
			}
		},

		onViewPowerpointInPublicSingleFile: function (token) {
			var token = getSharingToken();
			url = OC.generateUrl('/apps/wopiviewer/publicopen');
			var data = {filename: null};
			data['token'] = token;
			if (getUrlParameter('closed') === '1') {
				return;
			}
			data['folderurl'] = parent.location.protocol + '//' + location.host + OC.generateUrl('/s/') + token + "?closed=1";
			$.post(url, data).success(function (response) {
				if (response.wopi_src) {
					window.location.hash = 'office';
					var viewerURL = powerpointViewer + encodeURI(response.wopi_src);
					setView(viewerURL, response.wopi_src, token);
				} else {
					console.error(response.error);
				}
			});
		},


		onViewExcel: function (filename, data) {
			// if file size is 0 we ask office online
			// to create an empty docx file
			var filesize = parseInt(data.$file.attr("data-size"));
			if(filesize === 0) {
				sendOpen(filename, data, excelNew);
			} else {
				sendOpen(filename, data, excelViewer);
			}
		},

		onEditExcel: function (filename, data) {
			// if file size is 0 we ask office online
			// to create an empty docx file
			var filesize = parseInt(data.$file.attr("data-size"));
			if(filesize === 0) {
				sendOpen(filename, data, excelNew);
			} else {
				sendOpen(filename, data, excelEditor);
			}
		},

		onViewExcelInPublicSingleFile: function (token) {
			var token = getSharingToken();
			url = OC.generateUrl('/apps/wopiviewer/publicopen');
			var data = {filename: null};
			data['token'] = token;
			if (getUrlParameter('closed') === '1') {
				return;
			}
			data['folderurl'] = parent.location.protocol + '//' + location.host + OC.generateUrl('/s/') + token + "?closed=1";
			$.post(url, data).success(function (response) {
				if (response.wopi_src) {
					window.location.hash = 'office';
					var viewerURL = excelViewer + encodeURI(response.wopi_src);
					setView(viewerURL, response.wopi_src, token);
				} else {
					console.error(response.error);
				}
			});
		},
	};


	$(document).ready(function () {
		loadConfig();

		if (OCA.Files != null) {
			// OCA.Files.fileActions.register(wordMime, 'Open in MS Office Online', OC.PERMISSION_READ, OC.imagePath('wopiviewer', 'msoffice_logo.svg'), wopiViewer.onViewWord);
			// OCA.Files.fileActions.register(powertpointMime, 'Open in MS Office Online', OC.PERMISSION_READ, OC.imagePath('wopiviewer', 'msoffice_logo.svg'), wopiViewer.onViewPowerpoint);
			// OCA.Files.fileActions.register(excelMime, 'Open in MS Office Online', OC.PERMISSION_READ, OC.imagePath('wopiviewer', 'msoffice_logo.svg'), wopiViewer.onViewExcel);

			OCA.Files.fileActions.register(wordMime, 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('wopiviewer', 'msoffice_logo.svg'), wopiViewer.onEditWord);
			OCA.Files.fileActions.register(powertpointMime, 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('wopiviewer', 'msoffice_logo.svg'), wopiViewer.onEditPowerpoint);
			OCA.Files.fileActions.register(excelMime, 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('wopiviewer', 'msoffice_logo.svg'), wopiViewer.onEditExcel);

			OCA.Files.fileActions.register(wordMime, 'Default View', OC.PERMISSION_READ, OC.imagePath('wopiviewer', 'msoffice_logo.svg'), wopiViewer.onViewWord);
			OCA.Files.fileActions.register(powertpointMime, 'Default View', OC.PERMISSION_READ, OC.imagePath('wopiviewer', 'msoffice_logo.svg'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register(excelMime, 'Default View', OC.PERMISSION_READ, OC.imagePath('wopiviewer', 'msoffice_logo.svg'), wopiViewer.onViewExcel);

			OCA.Files.fileActions.setDefault(wordMime, 'Default View');
			OCA.Files.fileActions.setDefault(powertpointMime, 'Default View');
			OCA.Files.fileActions.setDefault(excelMime, 'Default View');
		}

		
		  // disable right click on main file listing ONLY.
		  $("#filestable").bind("contextmenu", function(e) {
		    return false;
		  });

		// !! Do not add MS Office to the "new" button to prevent users from creating files using it !!
		var myFileMenuPlugin = {
			attach: function (menu) {
				var fileList = menu.fileList;
				menu.addMenuEntry({
					id: 'wopi-new-powerpoint',
					displayName: 'Powerpoint',
					templateName: 'New presentation.pptx',
					iconClass: 'icon-powerpoint',
					fileType: 'file',
					actionHandler: function (name) {
						var dir = fileList.getCurrentDirectory();
						// first create the file
						fileList.createFile(name).then(function() {
							// once the file got successfully created,
							// open the editor
							var selector = 'tr[data-file="'+ name +'"]';
							fileList.$container.find(selector).find("span.nametext").click();
						});
					}
				});
				menu.addMenuEntry({
					id: 'wopi-new-word',
					displayName: 'Word',
					templateName: 'New document.docx',
					iconClass: 'icon-word',
					fileType: 'file',
					actionHandler: function (name) {
						var dir = fileList.getCurrentDirectory();
						// first create the file
						fileList.createFile(name).then(function() {
							// once the file got successfully created,
							// open the editor
							var selector = 'tr[data-file="'+ name +'"]';
							fileList.$container.find(selector).find("span.nametext").click();
						});
					}
				});
				menu.addMenuEntry({
					id: 'wopi-new-excel',
					displayName: 'Excel',
					templateName: 'New spreadsheet.xlsx',
					iconClass: 'icon-excel',
					fileType: 'file',
					actionHandler: function (name) {
						var dir = fileList.getCurrentDirectory();
						// first create the file
						fileList.createFile(name).then(function() {
							// once the file got successfully created,
							// open the editor
							var selector = 'tr[data-file="'+ name +'"]';
							fileList.$container.find(selector).find("span.nametext").click();
						});
					}
				});
			}
		};
		OC.Plugins.register('OCA.Files.NewFileMenu', myFileMenuPlugin);

		// !! Do not use MS Office in public links !!
		// Doesn't work with IE below 9
		if (!$.browser.msie || ($.browser.msie && $.browser.version >= 9)) {
				if ($('#isPublic').val()) {
					var sharingToken = $('#sharingToken').val();
					mime = $('#mimetype').val();
					switch (mime) {
						case wordMime:
							wopiViewer.onViewWordInPublicSingleFile(sharingToken);
							break;
						case excelMime: wopiViewer.onViewExcelInPublicSingleFile(sharingToken);
							break;
						case powertpointMime:
							wopiViewer.onViewPowerpointInPublicSingleFile(sharingToken);
							break;
					}
				}
		}
	});

})(jQuery, OC, OCA);
