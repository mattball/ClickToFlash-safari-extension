function ClickToFlash() {
	this.elementMapping = new Array();
	this.videoElementMapping = new Array();
	
	this.killers = [];
	
	this.settings = null;
	
	var _this = this;	
	this.respondToMessage = function(event) {
		if (event.name == "getSettings") {
			_this.getSettings(event);
		}
	}
	
	this.handleBeforeLoadEventTrampoline = function(event) {
		_this.handleBeforeLoadEvent(event);
	}
	
	safari.self.addEventListener("message", this.respondToMessage, false);
	document.addEventListener("beforeload", this.handleBeforeLoadEventTrampoline, true);
}

ClickToFlash.prototype.handleBeforeLoadEvent = function(event) {
	const element = event.target;
	
	if (element instanceof HTMLEmbedElement || element instanceof HTMLObjectElement) {
		if (element.allowedToLoad)
			return;
			
		element.elementID = this.elementMapping.length;
		this.settings = safari.self.tab.canLoad(event, "getSettings");
			
		event.preventDefault();
		this.processFlashElement(element);
	}
}

ClickToFlash.prototype.clickPlaceholder = function(event) {
	var clickedElement = event.target;
	
	while (clickedElement.className != "clickToFlashPlaceholder") {
		clickedElement = clickedElement.parentNode;
	}
	
	var elementID = parseInt(clickedElement.id.replace("ClickToFlashPlaceholder", ""));

	var element = this.videoElementMapping[elementID];
	if (!element) {
		element = this.elementMapping[elementID];
		element.allowedToLoad = true;
	}
	
	clickedElement.parentNode.replaceChild(element, clickedElement);
}

ClickToFlash.prototype.isSIFRText = function(element) {
	return (element.className == "sIFR-flash" || element.getAttribute("sifr"));
}

ClickToFlash.prototype.processFlashElement = function(element) {
	// Check if it's already in the mapping dictionary
	// If so, the user must have clicked it already
	if (this.elementMapping[element.elementID]) {
		return;
	}
	
	// Deal with sIFR first
	if (this.isSIFRText(element)) {
		var autoloadSIFR = this.settings["sifrReplacement"];
		if (this.settings["sifrReplacement"] == "autoload") {
			// Just stop processing. The flash movie will
			// continue being loaded
			return;
		}
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

	if (element.parentNode) {
		element.parentNode.replaceChild(placeholderElement, element);
	}
	
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
	
	// Wait until the placeholder has a width and height, then
	// check if we should minify or hide the badge
	var badgeHide = function() {
		if (placeholderElement.offsetWidth > 0 && logoElement.offsetWidth > 0 && placeholderElement.offsetHeight > 0 && logoElement.offsetHeight > 0) {
			// If the badge is too big, try displaying it at half size
			if ((placeholderElement.offsetWidth - 4) < logoElement.offsetWidth || (placeholderElement.offsetHeight - 4) < logoElement.offsetHeight) {
				logoContainer.className = "logoContainer mini";
			}

			// If it's still too big, just hide it
			if ((placeholderElement.offsetWidth - 4) < logoElement.offsetWidth || (placeholderElement.offsetHeight - 4) < logoElement.offsetHeight) {
				logoContainer.style.display = "none";
			}
		} else {
			setTimeout(badgeHide, 100);
		}
	};
	badgeHide();
	
	if (!this.settings["useH264"]) {
		return;
	}
	
	// Deal with h264 videos
	var flashvars = element.getAttribute("flashvars");
	var src = element.src;
	
	// This is hacky, but it's an easy way to convert the possibly-relative
	// src URL into an absolute one
	var tempAnchor = document.createElement("a");
	tempAnchor.href = src;
	src = tempAnchor.href;
	tempAnchor = null;
	
	for (i = 0; i < this.killers.length; i++) {
		var currentKiller = this.killers[i];
		var matches = false;
		
		for (j = 0; !matches && j < currentKiller.sourcePatterns.length; j++) {
			var currentPattern = currentKiller.sourcePatterns[j];
			if (src.match(currentPattern)) {
				matches = true;
			}
		}
		
		for (j = 0; !matches && j < currentKiller.flashVarsPatterns.length; j++) {
			var currentPattern = currentKiller.flashVarsPatterns[j];
			if (src.match(currentPattern)) {
				matches = true;
			}
		}
		
		if (matches) {
			var shouldUseHD = this.settings["useHDH264"];
			var videoMapping = this.videoElementMapping;
			var killerCallback = function(sender, element, videoURL, hdVideoURL) {
				var videoElementURL = null;
				var badgeLabel = null;
				
				if (shouldUseHD && hdVideoURL) {
					videoElementURL = hdVideoURL;
					badgeLabel = sender.hdBadgeLabel;
				}  else if (videoURL) {
					videoElementURL = videoURL;
					badgeLabel = sender.badgeLabel;
				}
				
				var elementID = element.elementID;
				
				// Create the video element
				var videoElement = document.createElement("video");
				videoElement.src = videoElementURL;
				videoElement.setAttribute("controls", "controls");
				if (getFlashVariable(flashvars, "autoplay") == "1") {
					videoElement.setAttribute("autoplay", "autoplay");
				}
				videoElement.style = placeholderElement.style;
				videoElement.style.width = placeholderElement.offsetWidth + "px";
				videoElement.style.height = placeholderElement.offsetHeight + "px";
				videoMapping[elementID] = videoElement;
				
				// Change the placeholder text
				var placeholderLogoInset = placeholderElement.firstChild.firstChild.firstChild.childNodes[0];
				placeholderLogoInset.innerHTML = badgeLabel;
				var placeholderLogo = placeholderElement.firstChild.firstChild.firstChild.childNodes[1];
				placeholderLogo.innerHTML = badgeLabel;
			};
			currentKiller.processElement(element, killerCallback);
			break;
		}
	}
}

getFlashVariable = function(flashVars, key) {
	var vars = flashVars.split("&");
	for (var i=0; i < vars.length; i++) {
		var keyValuePair = vars[i].split("=");
		if (keyValuePair[0] == key) {
			return keyValuePair[1];
		}
	}
	return null;
}

var CTF = new ClickToFlash();
CTF.killers = [new YouTubeKiller(), new DailyMotionKiller()];
