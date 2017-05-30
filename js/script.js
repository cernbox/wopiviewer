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

	var wordViewer = "https://oos.cern.ch/wv/wordviewerframe.aspx?WOPISrc=";
	var wordNew = "https://oos.cern.ch/we/wordeditorframe.aspx?new=1&WOPISrc=";
	var wordEditor = "https://oos.cern.ch/we/wordeditorframe.aspx?WOPISrc=";
	var powerpointViewer = "https://oos.cern.ch/p/PowerPointFrame.aspx?WOPISrc=";
	var powerpointEditor = "https://oos.cern.ch/p/PowerPointFrame.aspx?PowerPointView=EditView&WOPISrc=";
	var powerpointNew = "https://oos.cern.ch/p/PowerPointFrame.aspx?PowerPointView=EditView&New=1&WOPISrc=";
	var excelViewer = "https://oos.cern.ch/x/_layouts/xlviewerinternal.aspx?WOPISrc=";
	var excelNew = "https://oos.cern.ch/x/_layouts/xlviewerinternal.aspx?edit=1&new=1&WOPISrc=";
	var excelEditor = "https://oos.cern.ch/x/_layouts/xlviewerinternal.aspx?edit=1&WOPISrc=";

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

	var sendOpen = function (basename, data, targetURL, canedit) {
		var canedit = false;
		var permissions = data.$file.attr("data-permissions");
		if (permissions > 1) { // > 1 write permissions
			canedit = true;
		}
		filename = data.dir + "/" + basename;

		var data = {filename: filename, canedit: canedit};
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
				var closeButton = '<p class="" id="office_close_button" style="display: block; position: absolute; right: 50%; top: 5px"><b>The Office application is in beta</b></p>';
				$("header div#header").append(closeButton);
				$("header div#header #office_close_button").click(closeDocument);
			} else {
				alert(response.error);
			}
		});
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
	};


	$(document).ready(function () {
		if (OCA && OCA.Files) {
			OCA.Files.fileActions.register('application/msword', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditWord);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-excel', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditExcel);

			OCA.Files.fileActions.register('application/msword', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewWord);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-excel', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);

			OCA.Files.fileActions.setDefault('application/msword', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-powerpoint', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-excel', 'Default View');
		}
	});

})(jQuery, OC, OCA);
