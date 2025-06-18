function loadJSON(url, callback) {
    if (typeof fetch === 'function') {
        fetch(url)
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    return null;
                }
            })
            .then(data => callback(data))
            .catch(() => callback(null));
    } else {
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', url, true);

        xobj.onreadystatechange = function () {
            if (xobj.readyState === 4) {
                if (xobj.status === 200) {
                    callback(xobj.responseText);
                } else {
                    callback(null);
                }
            }
        };

        xobj.send();
    }
}

function loadVersions(response) {
    const version_select = document.getElementById("version-select");
    var versions = JSON.parse(response);
    version_select.innerHTML = "";
    addOptions(version_select, versions.releases, versions.default, versions.github);
    addOptions(version_select, { "custom": "" }, versions.default);
    addOptions(version_select, versions.versions, versions.default);
    version_select.addEventListener("change", () => {
        localStorage.setItem("version", version_select[version_select.selectedIndex].textContent);
        setCDNPath(version_select[version_select.selectedIndex].value);
    });
}

function setCDNPath(option) {
    console.log("Setting CDN path to:", option);
    if (option === "custom") {
        console.log("Using custom path");
        window.cdn = localStorage.getItem("custom_cdn") || "https://cdn.emulatorjs.org/stable/data/";
    } else {
        window.cdn = "https://cdn.emulatorjs.org/" + option + "data/";
    }
}

function detectAdBlock(url) {
    let adBlockEnabled = false;
    try {
        const adframe = document.querySelector('iframe[src="' + window.EJS_AdUrl + '"]');
        var adpage = adframe.contentWindow.document;
        window.EJS_AdUrl = adframe.src;
        if (!adpage) {
            adBlockEnabled = true;
        }
    } catch (e) {
        adBlockEnabled = true;
    }
    if (adBlockEnabled) {
        window.EJS_adBlocked(url);
    }
}

function addOptions(select, options, default_option, github) {
    for (const version in options) {
        const option = document.createElement("option");
        option.value = options[version];
        if (version == "stable") {
            option.textContent = "stable (" + github + ")";
        } else {
            option.textContent = version;
        }
        if (version === "custom") {
            option.id = "custom-version";
            if (localStorage.getItem("custom_cdn")) {
                option.value = localStorage.getItem("custom_cdn");
            } else {
                option.disabled = true;
            }
        } 
        if ((localStorage.getItem("version") && localStorage.getItem("version") === version) || version.includes(default_option)) {
            if (version !== "custom" || (version === "custom" && localStorage.getItem("custom_cdn"))) {
                option.selected = true;
                setCDNPath(options[version]);
            }
        }
        select.appendChild(option);
    }
}

function openSettings() {
    document.getElementById("popup-settings").classList.add("show");
    if (localStorage.getItem("pwa") == "false") {
        checkinstall();
    }
}

function closeSettings() {
    document.getElementById("popup-settings").classList.remove("show");
}

function checkinstall(overide) {
    console.log("Checking install");
    if (navigator.userAgent.includes("Firefox") || (navigator.userAgent.includes("OPR") && !navigator.userAgent.includes("Mobile"))) {
        installButton.style.display = "none";
        installBoxText.innerHTML = "PWA's are not supported on this browser.";
        return;
    }
    if (window.matchMedia('(display-mode: standalone)').matches || overide) {
        installButton.textContent = "Installed";
        installButton.disabled = true;
        installButton.style.display = "inline";
        installBoxText.innerHTML = "Install PWA: ";
    } else {
        installButton.style.display = "none";
        if (navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome")) {
            installBoxText.innerHTML = "PWA's are supported on this browser, but prompt is not supported.<br> Please install manually";
            return;
        }
        if ('getInstalledRelatedApps' in navigator) {
            navigator.getInstalledRelatedApps().then((relatedApps) => {
                if (relatedApps.length > 0) {
                    checkinstall(true);
                    return;
                }
            });
        }
        installBoxText.innerHTML = "PWA is either already installed, or prompt is not supported on this browser.<br> Please install manually.<br>Note: PWA's are not supported in Incognito/Private mode.";
    }
}

function loadLanguages(sysLang, lang_select) {
    langs = {
        "auto": "Auto (" + sysLang + ")",
        "en": "English",
        "pt": "Portuguese",
        "es": "Spanish",
        "el": "Greek",
        "ja": "Japanese",
        "zh": "Chinese",
        "hi": "Hindi",
        "ar": "Arabic",
        "jv": "Javanese",
        "bn": "Bengali",
        "ru": "Russian",
        "de": "German",
        "ko": "Korean",
        "af": "French",
        "it": "Italian",
        "tr": "Turkish",
        "fa": "Persian",
        "ro": "Romanian",
        "vi": "Vietnamese"
    };
    for (const lang in langs) {
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = langs[lang];
        lang_select.appendChild(option);
    }
    let selectedLang = localStorage.getItem("language");
    if (selectedLang) {
        lang_select.value = selectedLang;
    } else {
        localStorage.setItem("language", "auto");
    }
}