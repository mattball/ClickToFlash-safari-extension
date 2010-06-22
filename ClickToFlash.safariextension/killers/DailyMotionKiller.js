function DailyMotionKiller() {
	this.sourcePatterns = ["dailymotion.com"];
	this.flashVarsPatterns = ["dailymotion.com"];
	this.badgeLabel = "DailyMotion";
	this.hdBadgeLabel = "DailyMotion HD";
}

DailyMotionKiller.prototype.processElement = function(element, callback) {
	var elementID = element.elementID;
	var flashvars = element.getAttribute("flashvars");
	var placeholderElement = document.getElementById("ClickToFlashPlaceholder" + elementID);

	var h264URL = null;
	var hqH264URL = null;

	var sequence = unescape(getFlashVariable(flashvars, "sequence"));
	var vars = sequence.split("\",\"");
	for (i = 0; i < vars.length; i++) {
		if (vars[i].indexOf("hqURL") != -1) {
			var keyValuePair = vars[i].split("\":\"");
			h264URL = keyValuePair[1].split("\"")[0];
			while (h264URL.indexOf("\\/") != -1) {
				h264URL = h264URL.replace("\\/", "/");
			}
		} else if (vars[i].indexOf("hdURL") != -1) {
			var keyValuePair = vars[i].split("\":\"");
			hqH264URL = keyValuePair[1].split("\"")[0];
			while (hqH264URL.indexOf("\\/") != -1) {
				hqH264URL = hqH264URL.replace("\\/", "/");
			}
		}
	}
	
	callback(this, element, h264URL, hqH264URL);
}