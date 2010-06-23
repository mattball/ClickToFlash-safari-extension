function VimeoKiller() {
	this.sourcePatterns = ["vimeo.com"];
	this.flashVarsPatterns = ["vimeo.com"];
}

VimeoKiller.prototype.processElement = function(element, callback) {
	var clipID = element.id.replace("vimeo_clip_", "");
	
	if (!clipID) {
		callback(this, element, null, null);
		return;
	}
	
	var h264URL = "http://www.vimeo.com/play_redirect?clip_id=" + clipID + "&quality=mobile";
	var hdH264URL = "http://www.vimeo.com/play_redirect?clip_id=" + clipID + "&quality=hd";
	
	callback(this, element, h264URL, hdH264URL);
}