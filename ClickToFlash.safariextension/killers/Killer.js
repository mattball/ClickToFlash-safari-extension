function Killer() {
	this.sourcePatterns = [];
	this.flashVarsPatterns = [];
}

/**
 * @param   callback    The function to call once the element has
 *                      been processed. It must take the following
 *                      arguments:
 *                        - sender      The killer which processed the element
 *                        - element     The element which was processed
 *                        - videoURL    The URL of the h264 video for the element, or null if there isn't one
 *                        - hdVideoURL  The URL of the HD h264 video for the element, or null if there isn't one
 */
Killer.prototype.processElement = function(element, callback) {
	// Do nothing
	var videoURL = null;
	var hdVideoURL = null;
	callback(this, element, videoURL, hdVideoURL);
}