<?php
/**
 * ownCloud - wopiviewer
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Hugo Gonzalez Labrador (CERN) <hugo.gonzalez.labrador@cern.ch>
 * @copyright Hugo Gonzalez Labrador (CERN) 2017
 */

namespace OCA\WopiViewer\Controller;

use Guzzle\Http\Client;
use OC\Files\ObjectStore\EosProxy;
use OC\Files\ObjectStore\EosUtil;
use OCP\IRequest;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Controller;
use Punic\Data;

class PageController extends Controller {


	private $userId;
	private $wopiBaseUrl = 'http://wopiserver-test:8080';

	public function __construct($AppName, IRequest $request, $UserId) {
		parent::__construct($AppName, $request);
		$this->userId = $UserId;
	}

	/**
	 * CAUTION: the @Stuff turns off security checks; for this page no admin is
	 *          required and no CSRF check. If you don't know what CSRF is, read
	 *          it up in the docs or you might create a security hole. This is
	 *          basically the only required method to add this exemption, don't
	 *          add it to any other method if you don't exactly know what it does
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 */
	public function index() {
		$params = ['user' => $this->userId];
		return new TemplateResponse('wopiviewer', 'main', $params);  // templates/main.php
	}

	/**
	 * Simply method that posts back the payload of the request
	 *
	 * @NoAdminRequired
	 */
	public function doOpen($filename, $canEdit) {
		$username = \OC::$server->getUserSession()->getLoginName();
		$uidAndGid = EosUtil::getUidAndGid($username);
		if($uidAndGid === null) {
			return new DataResponse(['error' => 'username does not have a valid uid and gid']);
		}
		list($uid, $gid) = $uidAndGid;
		if(!$uid || !$gid) {
			return new DataResponse(['error' => 'username does not have a valid uid and gid']);
		}

		$node = \OC::$server->getUserFolder($username)->get($filename);
		$info = $node->stat();
		$eosPath = $info['eospath'];
		if ($node->isReadable()) {
			$client = new Client();
			$request = $client->createRequest("GET", sprintf("%s/cbox/open", $this->wopiBaseUrl));
			$request->addHeader("Authorization",  "Bearer cernboxsecret");
			$request->getQuery()->add("ruid", $uid);
			$request->getQuery()->add("rgid", $gid);
			$request->getQuery()->add("filename", $eosPath);
			$request->getQuery()->add("canedit", "no");

			$response = $client->send($request);
			if ($response->getStatusCode() == 200) {
				$body = $response->getBody(true);
				$body = urldecode($body);
				return new DataResponse(['wopi_src' => $body]);
			} else {
				return new DataResponse(['error' => 'error opening file in wopi server']);
			}
		}
	}
}

