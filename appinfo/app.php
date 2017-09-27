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

$policy = new OCP\AppFramework\Http\EmptyContentSecurityPolicy();
$policy->addAllowedFrameDomain(\OC::$server->getConfig()->getSystemValue('wopi.oos','self'));
\OC::$server->getContentSecurityPolicyManager()->addDefaultPolicy($policy);

\OCP\Util::addScript('wopiviewer', 'script');
\OCP\Util::addStyle('wopiviewer', 'style');
