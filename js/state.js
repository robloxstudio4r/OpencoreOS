var ST = {
  windows: [], z: 100, counter: 0, bootTime: Date.now(),
  wifiOn: LS.getItem('oc_wifi') === 'true',
  btOn: LS.getItem('oc_bt') === 'true',
  btDevice: null,
  screensaverActive: false,
  idleTimeout: 60000,
  lastActivity: Date.now()
};
