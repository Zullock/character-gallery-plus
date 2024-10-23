let currentTab = "View";
let tagsChecked = true;

export default class CGPlusApplication {
    #searchFilter = new SearchFilter({
        inputSelector: "input[type=search]",
        contentSelector: "[data-application-part=grid] > .grid",
        callback: this._searchOverride
    });

    createTab() {
        //Find Gallery parts
        const cgContent = CharacterGallery.application.element.getElementsByClassName("window-content")[0];
        const oldGridView = cgContent.getElementsByClassName("body main")[0];

        const tabSection = document.createElement('section');
        const tabLinkGrid = document.createElement('button');
        const tabLinkTable = document.createElement('button');

        // Create Tabs and move old grid to new section
        if (oldGridView && !(document.getElementsByClassName("tablinks").length > 0)) {
            const tab = document.createElement('div');
            this._tabMenuStyles(tab, tabLinkGrid, tabLinkTable);
            tab.appendChild(tabLinkGrid);
            tab.appendChild(tabLinkTable);
            tabSection.appendChild(tab);
            cgContent.insertBefore(tabSection, oldGridView);

            tabSection.appendChild(oldGridView);
        }

        //Set old grid part as new View Tab
        oldGridView.className = oldGridView.className.concat(" tabcontent")
        oldGridView.style.height = "calc(100% - 46px)";
        oldGridView.id = "View";

        //Create Edit Tab
        const editTabContent = document.createElement("div");
        const table = document.createElement("table");

        //Create table Head
        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        const thImage = document.createElement("th");
        const thLabel = document.createElement("th");
        const thSource = document.createElement("th");
        const thTags = document.createElement("th");
        const inputTagCheckbox = document.createElement("input");

        thImage.innerText = "Image";
        thLabel.innerText = "Label";
        thSource.innerText = "Source";
        thTags.innerText = "Tags?";

        this._editTabStyles(editTabContent, inputTagCheckbox);

        thTags.appendChild(inputTagCheckbox);

        trHead.appendChild(thImage);
        trHead.appendChild(thLabel);
        trHead.appendChild(thSource);
        trHead.appendChild(thTags);

        thead.appendChild(trHead);

        //Create table Body
        const tbody = document.createElement("tbody");

        for (const entry of (Array.from(CharacterGallery.application.database.values()))) {
            const trBody = document.createElement("tr");

            const tdImage = document.createElement("td");
            const tdLabel = document.createElement("td");
            const tdSource = document.createElement("td");
            const tdTags = document.createElement("td");
            const imgThumb = document.createElement("img");

            tdLabel.innerText = entry.label;
            tdSource.innerText = entry.source;
            tdTags.innerText = (entry.tags ? "Yes" : "No");
            imgThumb.src = entry.art.thumb;
            imgThumb.style.width = "50px";
            imgThumb.loading = "lazy";

            tdImage.appendChild(imgThumb);

            trBody.appendChild(tdImage);
            trBody.appendChild(tdLabel);
            trBody.appendChild(tdSource);
            trBody.appendChild(tdTags);

            tbody.appendChild(trBody);
        }

        table.appendChild(thead);
        table.appendChild(tbody);

        editTabContent.appendChild(table);

        tabSection.appendChild(editTabContent);

        //Set button color and display based on current mode
        if (currentTab === "View") {
            editTabContent.style.display = "none";
            tabLinkGrid.style.backgroundColor = "#c9593f";
        } else if (currentTab === "Edit") {
            oldGridView.style.display = "none";
            tabLinkTable.style.backgroundColor = "#c9593f";
        }
    }

    createSourceSearch() {
        //Find Search Input
        const cgContent = CharacterGallery.application.element.getElementsByClassName("window-content")[0];
        const searchAside = cgContent.getElementsByClassName("sidebar filters");
        const searchPanel = searchAside[0].getElementsByClassName("panel")[0];


        if (searchPanel && !(document.getElementsByClassName("sourceSearch").length > 0)) {
            const searchElement = document.createElement('search');
            const sourceInput = document.createElement('input');
            sourceInput.className = "sourceSearch"
            sourceInput.type = "search";
            sourceInput.placeholder = "Search Source";
            sourceInput.autofocus = true;
            sourceInput.onchange = function (_event) {

                let resultsCount = 0;
                for (const cell of CharacterGallery.application.element.getElementsByClassName("window-content")[0]
                        .getElementsByClassName("body main")[0]
                        .firstElementChild.querySelectorAll(":scope > *")) {
                    cell.hidden = !CharacterGallery.application.database.get(cell.dataset.key).source.match(_event.target.value);
                    const isVisible = !cell.hidden && !cell.classList.contains("excluded");
                    resultsCount += Number(isVisible);
                }
                const countEl = document.body.querySelector("#character-gallery .results > .count");
                countEl.innerText = resultsCount;
            }
            searchElement.appendChild(sourceInput);
            searchPanel.appendChild(searchElement);
        }
    }

    overrideSearchFilter() {
        this.#searchFilter.query = CharacterGallery.application.element.getElementsByClassName("panel")[0].lastElementChild.firstElementChild.value;
        this.#searchFilter.rgx = new RegExp(this.#searchFilter.query, "i");
        this.#searchFilter.bind(CharacterGallery.application.element);
    }

    _tabMenuStyles(tab, tabLinkGrid, tabLinkTable) {
        tab.className="tab";
        tab.style.display = "flex"
        tabLinkGrid.className = "tablinks";
        tabLinkGrid.style.width = "unset";
        tabLinkGrid.style.marginRight = "5px";
        tabLinkGrid.innerText = "View";
        tabLinkGrid.onclick = function(event) { openViewTab(event); };
        tabLinkTable.className = "tablinks";
        tabLinkTable.style.width = "unset";
        tabLinkTable.innerText = "Edit";
        tabLinkTable.onclick = function(event) { openEditTab(event); };
    }

    _editTabStyles(editTabContent, inputTagCheckbox) {
        editTabContent.className = "tabContent grid cg-scrollable";
        editTabContent.id = "Edit";
        editTabContent.style.height = "calc(100% - 46px)";
        inputTagCheckbox.type = "checkbox";
        inputTagCheckbox.checked = tagsChecked;
        inputTagCheckbox.onchange = function() {tagsChecked = !tagsChecked;}
    }

    _searchOverride(_event, _str, regex, grid) {
        let resultsCount = 0;
        if (regex.source.toString().startsWith("source:") || regex.source.toString().startsWith("tag:") || regex.source.toString().startsWith("\\-tag:")) {
            const complexSearch = regex.source.toString().split(/\\+|\\-/);
            const includedTags = [];
            const excludedTags = [];
            const includedSource = [];
            for (let tag of complexSearch) {
                if (tag.startsWith("tag:")) {
                    tag = tag.substring(4,tag.length);
                }
                if (tag.startsWith("\"")) {
                    tag = tag.substring(1,tag.length);
                }
                if (tag.startsWith("-")) {
                    excludedTags.push(tag.substring(5,tag.length));
                } else if (tag.startsWith("+")) {
                    if (tag.startsWith("+source:")) {
                        includedSource.push(tag.substring(8,tag.length));
                    } else {
                        includedTags.push(tag.substring(5,tag.length));
                    }
                } else if (tag.startsWith("source:")) {
                    includedSource.push(tag.substring(7,tag.length));
                } else {
                    includedTags.push(tag);
                }
            }
            for (const cell of grid.querySelectorAll(":scope > *")) {
                cell.hidden = (!includedTags.every(r=> cell.dataset.tags.split(",").includes(r))
                        || excludedTags.some(r=> cell.dataset.tags.split(",").includes(r)))
                    || !includedSource.every(r=> CharacterGallery.application.database.get(cell.dataset.key).source.match(r));
                const isVisible = !cell.hidden && !cell.classList.contains("excluded");
                resultsCount += Number(isVisible);
            }
        } else {
            for (const cell of grid.querySelectorAll(":scope > *")) {
                cell.hidden = !regex.test(cell.dataset.label);
                const isVisible = !cell.hidden && !cell.classList.contains("excluded");
                resultsCount += Number(isVisible);
            }
        }
        const countEl = document.body.querySelector("#character-gallery .results > .count");
        countEl.innerText = resultsCount;
    }
}

export function openViewTab(event) {
    document.getElementById("Edit").style.display = "none";
    openTab(event, 'View');
}

export function openEditTab(event) {
    document.getElementById("View").style.display = "none";
    openTab(event, 'Edit');
}


export function openTab(event, tab) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
        tablinks[i].style.backgroundColor = "inherit";
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tab).style.display = "";
    event.currentTarget.className += " active";
    event.currentTarget.style.backgroundColor = "#c9593f";
    currentTab=tab;
}

export function _reorderGroup(group) {
    return group.sort((a, b) => a.localeCompare(b));
}

export function _toLowerCase(group) {
    return group.map(v => v.toLowerCase());
}
