var elementMapping = [];

function nodeInserted(event) {
	if (event.target instanceof HTMLEmbedElement) {
		removeFlash();
	}
}

function startListening() {
	document.addEventListener ("DOMNodeInserted", nodeInserted, false);
}

function stopListening() {
	document.removeEventListener ("DOMNodeInserted", nodeInserted, false);
}

function clickPlaceholder(embedID) {
	// Temporarily disable watching the DOM
	// Otherwise, we'll trigger ourselves by adding the <embed>
	stopListening();
	
	var placeholder = document.getElementById("ClickToFlashPlaceholder" + embedID);
	var embedElement = elementMapping[embedID];
	elementMapping[embedID] = null;
	placeholder.parentNode.replaceChild(embedElement, placeholder);
	
	setTimeout(startListening, 500);
}

function removeFlash() {
	stopListening();
		
	var embedElements = document.getElementsByTagName("embed");
	for (i = 0; i < embedElements.length; i++) {
		var element = embedElements[i];
		
		// Check if it's already in the mapping dictionary
		// If so, the user must have clicked it already
		for (j = 0; j < elementMapping.length; j++) {
			if (elementMapping[j] == element) {
				continue;
			}
		}

		var placeholderElement = document.createElement("div");
		placeholderElement.style = element.style;
		placeholderElement.style.width = element.offsetWidth + "px";
		placeholderElement.style.height = element.offsetHeight + "px";
		placeholderElement.className = "clickToFlashPlaceholder";
		
		var logoElement = document.createElement("div");
		logoElement.innerHTML = "Flash";
		logoElement.className = "logo";
		placeholderElement.appendChild(logoElement);
		
		var id = elementMapping.length;
		elementMapping[id] = element;
		placeholderElement.id = "ClickToFlashPlaceholder" + id;
		placeholderElement.setAttribute("contextmenu", "ClickToFlashContextMenu");
		
		placeholderElement.onclick = function(){return clickPlaceholder(id)};

		element.parentNode.replaceChild(placeholderElement, element);
	
		// Position the logo correctly
		logoElement.style.left = (placeholderElement.offsetWidth - logoElement.offsetWidth)/2.0 + "px";
		logoElement.style.top = (placeholderElement.offsetHeight - logoElement.offsetHeight)/2.0 + "px";
		
		// Don't display the logo if the box is too small
		if (placeholderElement.offsetWidth < 100 || placeholderElement.offsetHeight < 50) {
			logoElement.style.display = "none";
		}
	}
	
	startListening();
}

removeFlash();