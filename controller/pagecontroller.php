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
	private $wopiBaseUrl;
	private $wopiSecret;

	public function __construct($AppName, IRequest $request, $UserId) {
		parent::__construct($AppName, $request);
		$this->userId = $UserId;
		$this->wopiSecret = \OC::$server->getConfig()->getSystemValue("wopi.secret", "please change me");
		$this->wopiBaseUrl = \OC::$server->getConfig()->getSystemValue("wopi.baseurl", "http://wopiserver-test:8080");
		$this->wopiCABundle = \OC::$server->getConfig()->getSystemValue("wopi.cabundle", true);
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
	public function doOpen($filename) {
		$username = \OC::$server->getUserSession()->getLoginName();
		$uidAndGid = EosUtil::getUidAndGid($username);
		if($uidAndGid === null) {
			return new DataResponse(['error' => 'username does not have a valid uid and gid']); }
		list($uid, $gid) = $uidAndGid;
		if(!$uid || !$gid) {
			return new DataResponse(['error' => 'username does not have a valid uid and gid']);
		}

		$node = \OC::$server->getUserFolder($username)->get($filename);
		$info = $node->stat();
		$eosPath = $info['eospath'];
		$canedit = "false"; // we send boolean as strings to wopi
		if ($node->isReadable()) {
			if($node->isUpdateable()) {
				$canedit = "true";
			}
			$client = new Client();
			$request = $client->createRequest("GET", sprintf("%s/cbox/open", $this->wopiBaseUrl), null, null, ['verify' => $this->wopiCABundle]);
			$request->addHeader("Authorization",  "Bearer " . $this->wopiSecret);
			$request->getQuery()->add("ruid", $uid);
			$request->getQuery()->add("rgid", $gid);
			$request->getQuery()->add("filename", $eosPath);
			$request->getQuery()->add("canedit", $canedit);
			$request->getQuery()->add("foldername", dirname($filename));

			$displayName = "Guest";
			$user = \OC::$server->getUserSession()->getUser();
			if($user) {
				$displayName = $user->getDisplayName();
			}
			$request->getQuery()->add("username", $displayName);

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

	/**
	 * Simply method that posts back the payload of the request
	 *
	 * @PublicPage
	 */
	public function doPublicOpen($filename, $canedit, $token) {
		$filename = trim($filename, "/");
		$token = trim($token);
		if(!$token) {
			return new DataResponse(['error' => 'invalid token']);
		}

		$query = \OC_DB::prepare('SELECT * FROM oc_share WHERE  share_type = 3 AND token = ?');
		$result = $query->execute([$token]);

		$row = $result->fetchRow();
		if(!$row) {
			return new DataResponse(['error' => 'invalid token']);
		}

		$owner = $row['uid_owner'];
		$fileID = $row['item_source'];
		$uidAndGid = EosUtil::getUidAndGid($owner);
		if($uidAndGid === null) {
			return new DataResponse(['error' => 'username does not have a valid uid and gid']);
		}
		list($uid, $gid) = $uidAndGid;
		if(!$uid || !$gid) {
			return new DataResponse(['error' => 'username does not have a valid uid and gid']);
		}

		\OC_Util::setupFS($owner);
		$node = \OC::$server->getUserFolder($owner)->getById($fileID)[0];
		$filename = $node->getInternalPath() . "/" . $filename;
		$info = $node->getStorage()->stat($filename);
		$eosPath = $info['eospath'];
		if ($node->isReadable()) {
			$client = new Client();
			$request = $client->createRequest("GET", sprintf("%s/cbox/open", $this->wopiBaseUrl), null, null, ['verify' => $this->wopiCABundle]);
			$request->addHeader("Authorization",  "Bearer " . $this->wopiSecret);
			$request->getQuery()->add("ruid", $uid);
			$request->getQuery()->add("rgid", $gid);
			$request->getQuery()->add("filename", $eosPath);
			$request->getQuery()->add("canedit", $canedit);
			$request->getQuery()->add("foldername", dirname($filename));
			$request->getQuery()->add("username", "Guest");

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

