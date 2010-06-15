function ClickToFlash() {
	this.elementMapping = new Array();
	
	this.videoElementMapping = new Array();
	this.largeVideoElementMapping = new Array();
	
	this.settings = null;
	
	var _this = this;
	this.nodeInsertedTrampoline = function(event) {
		_this.nodeInserted(event);
	}
	
	this.respondToMessage = function(event) {
		if (event.name == "getURLExists") {
			_this.getURLExists(event);
		} else if (event.name == "getSettings") {
			_this.getSettings(event);
		}
	}
	
	safari.self.addEventListener("message", this.respondToMessage, false);
}

ClickToFlash.prototype.nodeInserted = function(event) {
	if (event.target instanceof HTMLEmbedElement) {
		this.removeFlash();
	}
}

ClickToFlash.prototype.startListening = function() {
	document.addEventListener("DOMNodeInserted", this.nodeInsertedTrampoline, false);
}

ClickToFlash.prototype.stopListening = function() {
	document.removeEventListener("DOMNodeInserted", this.nodeInsertedTrampoline, false);
}

ClickToFlash.prototype.clickPlaceholder = function(event) {
	// Temporarily disable watching the DOM
	// Otherwise, we'll trigger ourselves by adding the <embed>
	this.stopListening();
	
	var clickedElement = event.target;
	
	while (clickedElement.className != "clickToFlashPlaceholder") {
		clickedElement = clickedElement.parentNode;
	}
	
	var elementID = parseInt(clickedElement.id.replace("ClickToFlashPlaceholder", ""));

	var element = this.largeVideoElementMapping[elementID];
	if (!element) {
		element = this.videoElementMapping[elementID];
	}
	if (!element) {
		element = this.elementMapping[elementID];
	}
	
	clickedElement.parentNode.replaceChild(element, clickedElement);

	setTimeout(this.startListening, 500);
}

ClickToFlash.prototype.getFlashVariable = function(flashVars, key) {
	var vars = flashVars.split("&");
	for (var i=0; i < vars.length; i++) {
		var keyValuePair = vars[i].split("=");
		if (keyValuePair[0] == key) {
			return keyValuePair[1];
		}
	}
	return null;
}

ClickToFlash.prototype.processYouTubeElement = function(element) {
	if (!this.settings["useH264"]) {
		return;
	}
	
	var flashvars = element.getAttribute("flashvars");
	var videoID = this.getFlashVariable(flashvars, "video_id");
	var videoHash = this.getFlashVariable(flashvars, "t");

	// Check if there's an h264 version available
	var h264URL = "http://www.youtube.com/get_video?fmt=18&video_id=" + videoID + "&t=" + videoHash;
	var h264exists = true;
	
	var urlCheckArgs = new Object();
	urlCheckArgs.elementID = element.elementID;
	urlCheckArgs.url = h264URL;
	urlCheckArgs.urlType = "normal";
	
	safari.self.tab.dispatchMessage("checkIfURLExists", urlCheckArgs);
}

ClickToFlash.prototype.processFlashElement = function(element) {
	// Check if it's already in the mapping dictionary
	// If so, the user must have clicked it already
	if (this.elementMapping[element.elementID]) {
		return;
	}

	var placeholderElement = document.createElement("div");
	placeholderElement.style = element.style;
	placeholderElement.style.width = element.offsetWidth + "px";
	placeholderElement.style.height = element.offsetHeight + "px";
	placeholderElement.className = "clickToFlashPlaceholder";

	var id = element.elementID;
	this.elementMapping[id] = element;
	placeholderElement.id = "ClickToFlashPlaceholder" + id;

	var clickHandler = this;
	placeholderElement.onclick = function(event){clickHandler.clickPlaceholder(event)};

	element.parentNode.replaceChild(placeholderElement, element);
	
	// Don't display the logo if the box is too small
	if (placeholderElement.offsetWidth > 100 && placeholderElement.offsetHeight > 50) {
		var verticalPositionElement = document.createElement("div");
		verticalPositionElement.className = "logoVerticalPosition";
		placeholderElement.appendChild(verticalPositionElement);

		var horizontalPositionElement = document.createElement("div");
		horizontalPositionElement.className = "logoHorizontalPosition";
		verticalPositionElement.appendChild(horizontalPositionElement);

		var logoContainer = document.createElement("div");
		logoContainer.className = "logoContainer";
		horizontalPositionElement.appendChild(logoContainer);
		
		var logoElement = document.createElement("div");
		logoElement.innerHTML = "Flash";
		logoElement.className = "logo";
		logoContainer.appendChild(logoElement);
		
		var logoInsetElement = document.createElement("div");
		logoInsetElement.innerHTML = "Flash";
		logoInsetElement.className = "logo inset";
		logoContainer.appendChild(logoInsetElement);
		
		
	}
}

ClickToFlash.prototype.removeFlash = function() {
	this.stopListening();
	
	var embedElements = document.getElementsByTagName("embed");
	var objectElements = document.getElementsByTagName("object");
	var flashElements = [];
	for (i = 0; i < objectElements.length; i++) {
		flashElements[flashElements.length] = objectElements[i];
	}
	for (i = 0; i < embedElements.length; i++) {
		flashElements[flashElements.length] = embedElements[i];
	}
	
	for (i = 0; i < flashElements.length; i++) {
		if (!this.settings) {
			safari.self.tab.dispatchMessage("getSettings", null);
			return;
		}
		
		var element = flashElements[i];
		element.elementID = this.elementMapping.length;
		this.processFlashElement(element);
		
		// Deal with h264 YouTube videos
		var youTubeShouldUseH264 = true;
		if (youTubeShouldUseH264) {
			var flashvars = element.getAttribute("flashvars");
			var src = element.src;
			var fromYouTube = (src && src.indexOf("youtube.com") != -1) ||
			                  (src && src.indexOf("youtube-nocookie.com") != -1) ||
			                  (src && src.indexOf("ytimg.com") != -1) ||
			                  (flashvars && flashvars.indexOf("youtube.com") != -1) ||
			                  (flashvars && flashvars.indexOf("youtube-nocookie.com") != -1) ||
			                  (flashvars && flashvars.indexOf("ytimg.com") != -1);

			if (fromYouTube) {
				this.processYouTubeElement(element);
				return;
			}
		}
	}

	this.startListening();
}

ClickToFlash.prototype.getURLExists = function(event) {
	// If there's no elementMapping, then "this" isn't ClickToFlash
	if (!this.elementMapping) {
		return;
	}
	
	var elementID = event.message.elementID;
	var element = this.elementMapping[elementID];
	if (!element)
		return;
		
	var placeholderElement = document.getElementById("ClickToFlashPlaceholder" + elementID);
		
	if (event.message.exists) {
		if (!this.videoElementMapping[elementID] && event.message.urlType == "normal") {
			var flashvars = element.getAttribute("flashvars");

			var videoElement = document.createElement("video");
			videoElement.src = event.message.url;
			videoElement.setAttribute("controls", "controls");
			if (this.getFlashVariable(flashvars, "autoplay") == "1") {
				videoElement.setAttribute("autoplay", "autoplay");
			}
			videoElement.style = placeholderElement.style;
			videoElement.style.width = placeholderElement.offsetWidth + "px";
			videoElement.style.height = placeholderElement.offsetHeight + "px";
			this.videoElementMapping[elementID] = videoElement;
			
			// Change the placeholder text to "YouTube"
			var placeholder = document.getElementById("ClickToFlashPlaceholder" + elementID);
			var placeholderLogoInset = placeholder.firstChild.firstChild.firstChild.childNodes[0];
			placeholderLogoInset.innerHTML = "YouTube";
			var placeholderLogo = placeholder.firstChild.firstChild.firstChild.childNodes[1];
			placeholderLogo.innerHTML = "YouTube";

			if (this.settings["useLargeH264"]) {
				var videoID = this.getFlashVariable(flashvars, "video_id");
				var videoHash = this.getFlashVariable(flashvars, "t");

				// Check if there's an h264 version available
				var HDH264URL = "http://www.youtube.com/get_video?fmt=22&video_id=" + videoID + "&t=" + videoHash;

				var urlCheckArgs = new Object();
				urlCheckArgs.elementID = element.elementID;
				urlCheckArgs.url = HDH264URL;
				urlCheckArgs.urlType = "large";

				safari.self.tab.dispatchMessage("checkIfURLExists", urlCheckArgs);
			} else {
				element.parentNode.replaceChild(videoElement, element);
			}
		} else if (!this.largeVideoElementMapping[elementID] && event.message.urlType == "large") {
			var flashvars = element.getAttribute("flashvars");
			
			var videoElement = document.createElement("video");
			videoElement.src = event.message.url;
			videoElement.setAttribute("controls", "controls");
			if (this.getFlashVariable(flashvars, "autoplay") == "1") {
				videoElement.setAttribute("autoplay", "autoplay");
			}
			videoElement.style = placeholderElement.style;
			videoElement.style.width = placeholderElement.offsetWidth + "px";
			videoElement.style.height = placeholderElement.offsetHeight + "px";
			this.largeVideoElementMapping[elementID] = videoElement;
			
			// Change the placeholder text to "YouTube"
			var placeholder = document.getElementById("ClickToFlashPlaceholder" + elementID);
			var placeholderLogoInset = placeholder.firstChild.firstChild.firstChild.childNodes[0];
			placeholderLogoInset.innerHTML = "YouTube HD";
			var placeholderLogo = placeholder.firstChild.firstChild.firstChild.childNodes[1];
			placeholderLogo.innerHTML = "YouTube HD";
		}
	}
}

ClickToFlash.prototype.getSettings = function(event) {
	this.settings = [];
	this.settings["useH264"] = event.message.useH264;
	this.settings["useLargeH264"] = event.message.useLargeH264;
	
	this.removeFlash();
}
