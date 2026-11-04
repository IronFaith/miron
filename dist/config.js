// Add the verified business number in international format to activate calling.
window.MIRON_CONFIG = Object.freeze({
  phone: '',
  phoneDisplay: '',
  serviceArea: '',
  buyerName: '',
  // Leave blank for preview. A configured HTTPS endpoint must accept POST JSON
  // and return {"accepted":true} only after a lead is actually saved.
  leadEndpoint: ''
});
