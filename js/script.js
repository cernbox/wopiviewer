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

        var wordViewer = "/wv/wordviewerframe.aspx?WOPISrc=";
        var wordNew = "/we/wordeditorframe.aspx?new=1&WOPISrc=";
        var wordEditor = "/we/wordeditorframe.aspx?WOPISrc=";
        var powerpointViewer = "/p/PowerPointFrame.aspx?WOPISrc=";
        var powerpointEditor = "/p/PowerPointFrame.aspx?PowerPointView=EditView&WOPISrc=";
        var powerpointNew = "/p/PowerPointFrame.aspx?PowerPointView=EditView&New=1&WOPISrc=";
        var excelViewer = "/x/_layouts/xlviewerinternal.aspx?WOPISrc=";
        var excelNew = "/x/_layouts/xlviewerinternal.aspx?edit=1&new=1&WOPISrc=";
        var excelEditor = "/x/_layouts/xlviewerinternal.aspx?edit=1&WOPISrc=";
	var onenoteViewer = "/o/OneNoteFrame.aspx?edit=0&WOPISrc=";
	var onenoteNew = "/o/OneNoteFrame.aspx?edit=1&new=1&WOPISrc=";
	var onenoteEditor = "/o/OneNoteFrame.aspx?edit=1&WOPISrc=";

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
				var viewerURL = response.oos + targetURL + encodeURI(response.wopi_src);
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
		onViewOnenote: function (filename, data) {
			// if file size is 0 we ask office online
			// to create an empty docx file
			var filesize = parseInt(data.$file.attr("data-size"));
			if(filesize === 0) {
				sendOpen(filename, data, onenoteNew);
			} else {
				sendOpen(filename, data, onenoteViewer);
			}
		},
		onEditOnenote: function (filename, data) {
			// if file size is 0 we ask office online
			// to create an empty docx file
			var filesize = parseInt(data.$file.attr("data-size"));
			if(filesize === 0) {
				sendOpen(filename, data, onenoteNew);
			} else {
				sendOpen(filename, data, onenoteEditor);
			}
		},
	};


	$(document).ready(function () {
		if (OCA && OCA.Files) {
			OCA.Files.fileActions.register('application/msword', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditWord);
			OCA.Files.fileActions.register('application/vnd.ms-word.document.macroEnabled.12', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditWord);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditWord);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.wordprocessingml.template', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditWord);
			//OCA.Files.fileActions.register('application/vnd.oasis.opendocument.text', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditWord);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint.addin.macroEnabled.12', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint.presentation.macroEnabled.12', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint.slideshow.macroEnabled.12', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint.template.macroEnabled.12', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditPowerpoint);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.presentationml.presentation', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditPowerpoint);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.presentationml.template', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditPowerpoint);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.presentationml.slideshow', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditPowerpoint);
			//OCA.Files.fileActions.register('application/vnd.oasis.opendocument.presentation', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-excel', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditExcel);
			OCA.Files.fileActions.register('application/vnd.ms-excel.addin.macroEnabled.12', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditExcel);
			OCA.Files.fileActions.register('application/vnd.ms-excel.sheet.binary.macroEnabled.12', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditExcel);
			OCA.Files.fileActions.register('application/vnd.ms-excel.sheet.macroEnabled.12', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditExcel);
			OCA.Files.fileActions.register('application/vnd.ms-excel.template.macroEnabled.12', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditExcel);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditExcel);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.spreadsheetml.template', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditExcel);
			//OCA.Files.fileActions.register('application/vnd.oasis.opendocument.spreadsheet', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditExcel);
			//OCA.Files.fileActions.register('application/msonenote', 'Edit in Office Online', OC.PERMISSION_UPDATE, OC.imagePath('core', 'actions/play'), wopiViewer.onEditOnenote);


			OCA.Files.fileActions.register('application/msword', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewWord);
			OCA.Files.fileActions.register('application/vnd.ms-word.document.macroEnabled.12', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewWord); 
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewWord);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.wordprocessingml.template', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewWord); 
			//OCA.Files.fileActions.register('application/vnd.oasis.opendocument.text', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewWord);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint.addin.macroEnabled.12', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint.presentation.macroEnabled.12', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint.slideshow.macroEnabled.12', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-powerpoint.template.macroEnabled.12', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.presentationml.presentation', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.presentationml.template', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.presentationml.slideshow', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			//OCA.Files.fileActions.register('application/vnd.oasis.opendocument.presentation', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewPowerpoint);
			OCA.Files.fileActions.register('application/vnd.ms-excel', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);
			OCA.Files.fileActions.register('application/vnd.ms-excel.addin.macroEnabled.12', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);
			OCA.Files.fileActions.register('application/vnd.ms-excel.sheet.binary.macroEnabled.12', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);
			OCA.Files.fileActions.register('application/vnd.ms-excel.sheet.macroEnabled.12', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);
			OCA.Files.fileActions.register('application/vnd.ms-excel.template.macroEnabled.12', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);
			OCA.Files.fileActions.register('application/vnd.openxmlformats-officedocument.spreadsheetml.template', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);
			//OCA.Files.fileActions.register('application/vnd.oasis.opendocument.spreadsheet', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewExcel);
			//OCA.Files.fileActions.register('application/msonenote', 'Default View', OC.PERMISSION_READ, OC.imagePath('core', 'actions/play'), wopiViewer.onViewOnenote);


			OCA.Files.fileActions.setDefault('application/msword', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-word.document.macroEnabled.12', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.openxmlformats-officedocument.wordprocessingml.template', 'Default View');
			//OCA.Files.fileActions.setDefault('application/vnd.oasis.opendocument.text', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-powerpoint', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-powerpoint.addin.macroEnabled.12', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-powerpoint.presentation.macroEnabled.12', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-powerpoint.slideshow.macroEnabled.12', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-powerpoint.template.macroEnabled.12', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.openxmlformats-officedocument.presentationml.presentation', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.openxmlformats-officedocument.presentationml.template', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.openxmlformats-officedocument.presentationml.slideshow', 'Default View');
			//OCA.Files.fileActions.setDefault('application/vnd.oasis.opendocument.presentation', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-excel', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-excel.addin.macroEnabled.12', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-excel.sheet.binary.macroEnabled.12', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-excel.sheet.macroEnabled.12', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.ms-excel.template.macroEnabled.12', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Default View');
			OCA.Files.fileActions.setDefault('application/vnd.openxmlformats-officedocument.spreadsheetml.template', 'Default View');
			//OCA.Files.fileActions.setDefault('application/vnd.oasis.opendocument.spreadsheet', 'Default View');
			//OCA.Files.fileActions.setDefault('application/msonenote', 'Default View');
		}
	});

})(jQuery, OC, OCA);
