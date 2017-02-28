/**
 * ownCloud - wopiviewer
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hugo Gonzalez Labrador (CERN) <hugo.gonzalez.labrador@cern.ch>
 * @copyright Hugo Gonzalez Labrador (CERN) 2017
 */

(function ($, OC) {

	var closeDocument = function (e) {
		e.preventDefault();
		$("#office_container").remove();
		$("header div#header #office_close_button").remove();
		window.location.hash = '';
	};

	$(window).bind('popstate', closeDocument);


	var wordViewer = "https://oos.cern.ch/wv/wordviewerframe.aspx?WOPISrc=";
	var powerpointViewer = "https://oos.cern.ch/p/PowerPointFrame.aspx?WOPISrc=";
	var excelViewer = "https://oos.cern.ch/x/_layouts/xlviewerinternal.aspx?WOPISrc=";

	var template = '<div id="office_container"><span id="frameholder"></span></div>';

	var setView = function (actionURL, accessToken) {
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

		var closeButton = '<button class="" id="office_close_button" style="display: block; position: absolute; right: 50%; top: 5px">Close Office</div>';
		$("header div#header").append(closeButton);
		$("header div#header #office_close_button").click(closeDocument);
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

	var sendOpen = function (filename, data, targetURL, canedit) {
		var canedit = false;
		var permissions = data.$file.attr("data-permissions");
		if (permissions > 1) { // > 1 write permissions
			canedit = true;
		}
		filename = data.dir + "/" + filename;

		var data = {filename: filename, canedit: canedit};
		var url = "";
		// check if we are on a public page
		if (isPublicPage()) {
			var token = getSharingToken();
			url = OC.generateUrl('/apps/wopiviewer/publicopen');
			data['token'] = token;
		} else {
			url = OC.generateUrl('/apps/wopiviewer/open');
		}

		$.post(url, data).success(function (response) {
			if (response.wopi_src) {
				window.location.hash = 'office';
				var viewerURL = targetURL + encodeURI(response.wopi_src);
				setView(viewerURL, response.wopi_src);
			} else {
				alert(response.error);
			}
		});
	};

	var wopiViewer = {
		onViewWord: function (filename, data) {
			sendOpen(filename, data, wordViewer);
		},
		onViewPowerpoint: function (filename, data) {
			sendOpen(filename, data, powerpointViewer);
		},
		onViewExcel: function (filename, data) {
			sendOpen(filename, data, excelViewer);
		},
	};


	$(document).ready(function () {
		if (OCA && OCA.Files) {
			OCA.Files.fileActions.register('application/msword', 'View in Office Online', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewWord);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint', 'View in Office Online', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-excel', 'View in Office Online', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);
			OCA.Files.fileActions.register('application/msword', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewWord);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-excel', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);
			OCA.Files.fileActions.setDefault('application/msword', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-powerpoint', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-excel', 'Default View');
		}
	});

})(jQuery, OC);
