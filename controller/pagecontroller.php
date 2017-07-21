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

class PageController extends Controller {


	private $userId;
	private $wopiBaseUrl;
	private $wopiSecret;
	private $shareManager;
	private $eosUtil;

	public function __construct($AppName, IRequest $request, $UserId) {
		parent::__construct($AppName, $request);
		$this->userId = $UserId;
		$this->wopiSecret = \OC::$server->getConfig()->getSystemValue("cbox.wopi.secret", "please change me");
		$this->wopiBaseUrl = \OC::$server->getConfig()->getSystemValue("cbox.wopi.baseurl", "http://wopiserver-test:8080");
		$this->wopiCABundle = \OC::$server->getConfig()->getSystemValue("cbox.wopi.cabundle", true); $this->shareManager = \OC::$server->getShareManager();
		$this->eosUtil = \OC::$server->getCernBoxEosUtil();
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
	 * @PublicPage
	 */
	public function doConfig() {
			$client = new Client();
			$request = $client->createRequest("GET", sprintf("%s/cbox/endpoints", $this->wopiBaseUrl), null, null, ['verify' => $this->wopiCABundle]);
			$request->addHeader("Authorization",  "Bearer " . $this->wopiSecret);
			$response = $client->send($request);
			if ($response->getStatusCode() == 200) {
				$body = $response->json();
				return new DataResponse($body);
			} else {
				return new DataResponse(['error' => 'error opening file in wopi server']);
			}
		return new DataResponse(['wopiserver' => $this->wopiBaseUrl]);
	}

	/**
	 * Simply method that posts back the payload of the request
	 *
	 * @NoAdminRequired
	 */
	public function doOpen($filename, $folderurl) {
		if(!$this->userId) {
			return new DataResponse(['error' => 'user is not logged in']);
		}

		list($uid, $gid) = $this->eosUtil->getUidAndGidForUsername($this->userId);
		if(!$uid || !$gid) {
			return new DataResponse(['error' => 'user does not have valid uid/gid']);
		}

		$node = \OC::$server->getUserFolder($this->userId)->get($filename);
		if(!$node) {
			return new DataResponse(['error' => 'file does not exists']);
		}
		$canEdit = "false"; // we send boolean as strings to wopi
		if ($node->isReadable()) {
			if($node->isUpdateable()) {
				$canEdit = "true";
			}
			$eosPath = $node->stat()['eos.file'];
			$client = new Client();
			$request = $client->createRequest("GET", sprintf("%s/cbox/open", $this->wopiBaseUrl), null, null, ['verify' => $this->wopiCABundle]);
			$request->addHeader("Authorization",  "Bearer " . $this->wopiSecret);
			$request->getQuery()->add("ruid", $uid);
			$request->getQuery()->add("rgid", $gid);
			$request->getQuery()->add("filename", $eosPath);
			$request->getQuery()->add("canedit", $canEdit);
			$request->getQuery()->add("folderurl", $folderurl);

			$user = \OC::$server->getUserSession()->getUser();
			if($user) {
				$displayName = $user->getDisplayName();
				$request->getQuery()->add("username", $displayName);
			}

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
	public function doPublicOpen($filename, $canedit, $token, $folderurl) {
		$filename = trim($filename, "/");
		$token = trim($token);
		if(!$token) {
			return new DataResponse(['error' => 'invalid token']);
		}

		$share = $this->shareManager->getShareByToken($token);
		if(!$share) {
			return new DataResponse(['error' => 'invalid token']);
		}

		$owner = $share->getShareOwner();
		$fileID = $share->getNodeId();

		list($uid, $gid) = $this->eosUtil->getUidAndGidForUsername($owner);
		if(!$uid || !$gid) {
			return new DataResponse(['error' => 'user does not have valid uid/gid']);
		}

		$canEdit="false";
		if($share->getPermissions()) {
			$canEdit="true";
		}

		\OC_Util::setupFS($owner);
		$node = \OC::$server->getUserFolder($owner)->getById($fileID)[0];
		if($node->getType() === \OCP\Files\FileInfo::TYPE_FILE) {
		       $filename = $node->getInternalPath();
		       $canEdit = "false";
		} else {
		       $filename = $node->getInternalPath() . "/" . $filename;
		}

		$info = $node->getStorage()->stat($filename);
		$eosPath = $info['eos.file'];
		if ($node->isReadable()) {
			$client = new Client();
			$request = $client->createRequest("GET", sprintf("%s/cbox/open", $this->wopiBaseUrl), null, null, ['verify' => $this->wopiCABundle]);
			$request->addHeader("Authorization",  "Bearer " . $this->wopiSecret);
			$request->getQuery()->add("ruid", $uid);
			$request->getQuery()->add("rgid", $gid);
			$request->getQuery()->add("filename", $eosPath);
			$request->getQuery()->add("canedit", $canEdit);
			$request->getQuery()->add("folderurl", $folderurl);

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

