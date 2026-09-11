"use strict";

function _all_routes_link() {
	return [
		{ name: 'main', path: 'main', langid: "", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_STATUS_NETWORK, children: [
			{ name: 'status', path: 'status', langid: "NAVIGATION_ITEM_STATUS", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_STATUS_NETWORK, children: [
				{ name: 'jioNetworkStatus', path: 'jioNetworkStatus', langid: "NAVIGATION_ITEM_STATUS_NETWORK", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_STATUS_NETWORK, children: [] },
				{ name: 'jioLanStatus', path: 'jioLanStatus', langid: "NAVIGATION_ITEM_STATUS_LAN", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_STATUS_LAN, children: [] },
				{ name: 'jioOduDevice', path: 'jioOduDevice', langid: "NAVIGATION_ITEM_STATUS_ODU", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_STATUS_ODU, children: [] },
				{ name: 'jioUtilization', path: 'jioUtilization', langid: "NAVIGATION_ITEM_STATUS_UTILIZATION", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_STATUS_UTILIZATION, children: [] }
			] },
			{ name: 'settings', path: 'settings', langid: "NAVIGATION_ITEM_SETTINGS", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_CELLULAR, children: [
				{ name: 'jioCellularSettings', path: 'jioCellularSettings', langid: "NAVIGATION_ITEM_SETTINGS_CELLULAR", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_CELLULAR, children: [] },
				{ name: 'jioEsimSettings', path: 'jioEsimSettings', langid: "NAVIGATION_ITEM_SETTINGS_ESIM", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_ESIM, children: [] },
				{ name: 'jioLan2Settings', path: 'jioLan2Settings', langid: "NAVIGATION_ITEM_SETTINGS_LAN2", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_LAN2, children: [] },
				{ name: 'jioLanSettings', path: 'jioLanSettings', langid: "NAVIGATION_ITEM_SETTINGS_LAN", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_LAN, children: [] },
				{ name: 'jioLanIPv6Settings', path: 'jioLanIPv6Settings', langid: "NAVIGATION_ITEM_SETTINGS_LAN_IPV6", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_LAN_IPV6, children: [] },
				{ name: 'jioRadvd', path: 'jioRadvd', langid: "NAVIGATION_ITEM_SETTINGS_RADVD", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_RADVD, children: [] },
//				{ name: 'jioDhcpServerSettings', path: 'jioDhcpServerSettings', langid: "NAVIGATION_ITEM_SETTINGS_DHCP_SERVER", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_DHCP_SERVER, children: [] },
//				{ name: 'jioPmipV6Settings', path: 'jioPmipV6Settings', langid: "NAVIGATION_ITEM_SETTINGS_PMIPV6", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_PMIPV6, children: [] },
//				{ name: 'jioAlgSettings', path: 'jioAlgSettings', langid: "NAVIGATION_ITEM_SETTINGS_ALG", hide: false, meta: { requiresAuthLevel: [1,2,3] }, view: PAGE_SETTINGS_ALG, children: [] },
				{ name: 'jioFirewallSettings', path: 'jioFirewallSettings', langid: "NAVIGATION_ITEM_SETTINGS_FIREWALL", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_FIREWALL, children: [] },
//				{ name: 'jioIpsecSettings', path: 'jioIpsecSettings', langid: "NAVIGATION_ITEM_SETTINGS_IPSEC", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_IPSEC, children: [] },
//				{ name: 'jioOpenvpnSettings', path: 'jioOpenvpnSettings', langid: "NAVIGATION_ITEM_SETTINGS_OPENVPN", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_OPENVPN, children: [] },
				{ name: 'jioEogreSettings', path: 'jioEogreSettings', langid: "NAVIGATION_ITEM_SETTINGS_EOGRE", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SETTINGS_EOGRE_V2, children: [] }
			] },
			{ name: 'admin', path: 'admin', langid: "NAVIGATION_ITEM_ADMIN", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_ADMIN_USER_MANAGEMENT, children: [
				{ name: 'jioUsermanagement', path: 'jioUsermanagement', langid: "NAVIGATION_ITEM_ADMIN_USER_MANAGEMENT", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_ADMIN_USER_MANAGEMENT, children: [] },
				{ name: 'jioSoftwareUpgrade', path: 'jioSoftwareUpgrade', langid: "NAVIGATION_ITEM_ADMIN_SOFTWARE_UPGRADE", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_ADMIN_SOFTWARE_UPGRADE, children: [] },
				{ name: 'jioIpAdressFilter', path: 'jioIpAdressFilter', langid: "NAVIGATION_ITEM_ADMIN_IPADDR_FILTER", hide: false, meta: { requiresAuthLevel: [1,2,3] }, view: PAGE_ADMIN_IPADDR_FILTER, children: [] },
				{ name: 'jioUrlFilter', path: 'jioUrlFilter', langid: "NAVIGATION_ITEM_ADMIN_URL_FILTER", hide: false, meta: { requiresAuthLevel: [1,2,3] }, view: PAGE_ADMIN_URL_FILTER, children: [] },
				{ name: 'jioMacAddressFilter', path: 'jioMacAddressFilter', langid: "NAVIGATION_ITEM_ADMIN_MACADDR_FILTER", hide: false, meta: { requiresAuthLevel: [1,2,3] }, view: PAGE_ADMIN_MACADDR_FILTER, children: [] },
				{ name: 'jioUpnpPortForwading', path: 'jioUpnpPortForwading', langid: "NAVIGATION_ITEM_ADMIN_UPNP_PORT_FORWADING", hide: false, meta: { requiresAuthLevel: [1,2,3] }, view: PAGE_ADMIN_UPNP_PORT_FORWADING, children: [] }
			] },
			{ name: 'help', path: 'help', langid: "NAVIGATION_ITEM_HELP", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_HELP_ABOUT, children: [
				{ name: 'jioAboutDevice', path: 'jioAboutDevice', langid: "NAVIGATION_ITEM_HELP_ABOUT", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_HELP_ABOUT, children: [] },
				{ name: 'jioLogs', path: 'jioLogs', langid: "NAVIGATION_ITEM_HELP_LOGS", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_HELP_LOGS_V1DOT6, children: [] },
				{ name: 'jioSOCLogs', path: 'jioSOCLogs', langid: "NAVIGATION_ITEM_HELP_SOC_LOGS", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_HELP_LOGS_V2DOT6, children: [] }
			] },
                        { name: "sms", path: "sms", langid: "NAVIGATION_ITEM_SMS", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SMS_INBOX, children: [ { name: "jioSmsInbox", path: "jioSmsInbox", langid: "NAVIGATION_ITEM_SMS_INBOX", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SMS_INBOX, children: [] }, { name: "jioSmsSent", path: "jioSmsSent", langid: "NAVIGATION_ITEM_SMS_SENT", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SMS_SENT, children: [] }, { name: "jioSmsContacts", path: "jioSmsContacts", langid: "NAVIGATION_ITEM_SMS_CONTACTS", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SMS_CONTACTS, children: [] }, { name: "jioSmsGroups", path: "jioSmsGroups", langid: "NAVIGATION_ITEM_SMS_GROUPS", hide: false, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_SMS_GROUPS, children: [] } ] },
			{ name: 'TechHd', path: 'TechHd', langid: "", hide: true, meta: { requiresAuthLevel: [1, 2, 3] }, view: PAGE_ACS_SETTINGS, children: [] }
		] }
	];
}
