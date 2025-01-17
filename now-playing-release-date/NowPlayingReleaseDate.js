console.log('Now Playing Release Date loaded');
if (!localStorage.getItem('position')) localStorage.setItem('position', '.main-trackInfo-artists');
setTimeout(() => initialize(), 2000);

async function initialize() {
    try {
        await waitForSpicetify();
        Spicetify.Player.addEventListener("songchange", async () => {
            removeExistingReleaseDateElement();
            await displayReleaseDate();
        });
        await displayReleaseDate();
    } catch (error) {
        console.error('Error initializing:', error);
    }
}

async function waitForSpicetify() {
    while (!Spicetify || !Spicetify.showNotification) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

async function displayReleaseDate() {
    try {
        const trackId = Spicetify.Player.data.item.uri.split(":")[2];
        const trackDetails = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${trackId}`);
        const releaseDate = new Date(trackDetails.album.release_date);

        let formattedReleaseDate;

        switch (localStorage.getItem('dateformat')) {
            case "DD-MM-YYYY":
                formattedReleaseDate = `${String(releaseDate.getDate()).padStart(2, '0')}-${String(releaseDate.getMonth() + 1).padStart(2, '0')}-${releaseDate.getFullYear()}`;
                break;
            case "MM-DD-YYYY":
                formattedReleaseDate = `${String(releaseDate.getMonth() + 1).padStart(2, '0')}-${String(releaseDate.getDate()).padStart(2, '0')}-${releaseDate.getFullYear()}`;
                break;
            case "YYYY-MM-DD":
                formattedReleaseDate = `${releaseDate.getFullYear()}-${String(releaseDate.getMonth() + 1).padStart(2, '0')}-${String(releaseDate.getDate()).padStart(2, '0')}`;
                break;
            default:
                formattedReleaseDate = releaseDate;
        }

        removeExistingReleaseDateElement();

        setTimeout(() => {
            const releaseDateElement = createReleaseDateElement(formattedReleaseDate);
            const container = document.querySelector(localStorage.getItem('position'));
            container.appendChild(releaseDateElement);
        }, 1000);
    } catch (error) {
        console.error('Error displaying release date:', error);
    }
}

function removeExistingReleaseDateElement() {
    const existingReleaseDateElement = document.getElementById('releaseDate');
    if (existingReleaseDateElement) {
        existingReleaseDateElement.remove();
    }
}

function createReleaseDateElement(formattedReleaseDate) {
    const releaseDateElement = createDivElement('releaseDate');
    const bulletElement = document.createTextNode(" • ");
    releaseDateElement.appendChild(bulletElement);

    const dateElement = createAnchorElement(formattedReleaseDate);
    releaseDateElement.appendChild(dateElement);

    const targetedElement = document.querySelector(localStorage.getItem('position') + ' a');
    const targetedStyles = window.getComputedStyle(targetedElement);
    setElementStyles(releaseDateElement, targetedStyles);

    const existingSettingsMenu = document.getElementById('settingsMenu');
    if (existingSettingsMenu) {
        document.body.removeChild(existingSettingsMenu);
    }

    const settingsMenu = createSettingsMenu();

    const style = document.createElement('style');
    style.innerHTML = `
    #settingsMenu {
        display: none;
        position: absolute;
        background-color: var(--background-body);
        padding: 16px;
        margin: 24px 0;
        border-radius: 12px;
        flex-direction: column;
    }
    #optionsDiv {
        display: flex;
        padding: 10px;
        flex-direction: column;
    }
    .Dropdown-container {
        overflow: visible; 
        display: flex;
        align-items: center;
        margin-top: 10px;
        gap: 10px;
    }
    .releaseDateDropdown-control {
        flex-grow: 1;
        display: inline;
        justify-content: space-between;
        border: 1px solid #ccc;
        padding: 5px;
        cursor: pointer;
    }
    .Dropdown-optionsList {
        position: fixed;
        background-color:  var(--background-body);
        z-index: 1;
    }
    .Dropdown-option {
        padding: 5px;
        cursor: pointer;
    }
    .Dropdown-option:hover {
        background-color: #f0f0f0;
    }
    .main-trackInfo-name {
        display: flex;
        gap: 3px;
    }
    `;

    // Append the style element to the head of the document
    document.head.appendChild(style);

    document.body.appendChild(settingsMenu);

    dateElement.addEventListener('click', function (event) {
        event.preventDefault();
        toggleSettingsMenu(event, dateElement, settingsMenu);
    });

    return releaseDateElement;
}

function createDivElement(id) {
    const divElement = document.createElement("div");
    divElement.id = id;
    return divElement;
}

function createAnchorElement(textContent) {
    const anchorElement = document.createElement("a");
    anchorElement.textContent = textContent;
    anchorElement.style.cursor = 'pointer';
    return anchorElement;
}

function setElementStyles(element, styles) {
    element.style.fontSize = styles.fontSize;
    element.style.fontWeight = styles.fontWeight;
    element.style.minWidth = "75px";
}

function createSettingsMenu() {
    const settingsMenu = createDivElement('settingsMenu');

    const title = document.createElement("h2");
    title.textContent = 'NPRD Settings';
    settingsMenu.appendChild(title);

    const optionsDiv = document.createElement("div");
    optionsDiv.id = 'optionsDiv';

    const positions = [
        { value: ".main-trackInfo-artists", text: "Artist" },
        { value: ".main-trackInfo-name", text: "Song name" }
    ];

    const positionDropdown = createDropdown("position", "Position", positions);
    optionsDiv.appendChild(positionDropdown);

    const dateformat = [
        { value: "DD-MM-YYYY", text: "DD-MM-YYYY" },
        { value: "MM-DD-YYYY", text: "MM-DD-YYYY" },
        { value: "YYYY-MM-DD", text: "YYYY-MM-DD" }
    ];

    const dateFormatDropdown = createDropdown("dateformat", "Date Format", dateformat);
    optionsDiv.appendChild(dateFormatDropdown);

    settingsMenu.appendChild(optionsDiv);

    return settingsMenu;
}


function createDropdown(id, label, options) {
    const dropdownContainer = document.createElement("div");
    dropdownContainer.classList.add('Dropdown-container');

    const labelElement = document.createElement("label");
    labelElement.textContent = label;
    dropdownContainer.appendChild(labelElement);

    const dropdown = document.createElement("div");
    dropdown.id = id;
    dropdown.classList.add('Dropdown-control');
    dropdown.classList.add('releaseDateDropdown-control');

    const selectedOption = document.createElement("div");

    const currentSelectedOptionValue = localStorage.getItem(id);
    const currentSelectedOption = options.find(option => option.value === currentSelectedOptionValue);

    selectedOption.textContent = currentSelectedOption ? currentSelectedOption.text : options[0].text;

    dropdown.appendChild(selectedOption);

    const optionsList = document.createElement("div");
    optionsList.classList.add('Dropdown-optionsList');
    optionsList.style.display = 'none';

    options.forEach(option => {
        const optionElement = createOption(option.value, option.text, dropdown, selectedOption);
        optionsList.appendChild(optionElement);
    });

    dropdown.appendChild(optionsList);

    dropdown.addEventListener('click', function (event) {
        event.stopPropagation();
        if (event.target.classList.contains('Dropdown-option')) {
            return;
        }

        optionsList.style.display = optionsList.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', function () {
        optionsList.style.display = 'none';
    });
    dropdownContainer.appendChild(dropdown);

    return dropdownContainer;
}

function createOption(value, text, dropdown, selectedOption) {
    const option = document.createElement("div");
    option.value = value;
    option.textContent = text;
    option.classList.add('Dropdown-option');

    option.addEventListener('click', async function () {
        selectedOption.textContent = text;

        localStorage.setItem(dropdown.id, value);

        // Hide the settings menu
        const settingsMenu = document.getElementById('settingsMenu');
        if (settingsMenu) {
            settingsMenu.style.display = 'none';
        }

        await displayReleaseDate();
    });

    return option;
}

function toggleSettingsMenu(event, dateElement, settingsMenu) {
    const rect = dateElement.getBoundingClientRect();

    settingsMenu.style.position = 'fixed';
    settingsMenu.style.left = `${rect.left}px`;
    settingsMenu.style.bottom = `${window.innerHeight - rect.top}px`;

    if (settingsMenu.style.display === '') {
        settingsMenu.style.display = 'flex';
    } else {
        settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'flex' : 'none';
    }
}