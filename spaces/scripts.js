/* ======================================================
   ⚙️ ReachFlow.spaces() — Script
   Author: TRAIS
   Description:
   Dynamically fetches folder names from your GitHub repo’s
   /spaces directory and lists them as clickable “functions”.
   ====================================================== */

// --- ✅ CONFIG SECTION --- //

// Grab the container where items will be displayed
const listContainer = document.getElementById("spaces-list-container");

// GitHub API endpoint for repo contents
const apiUrl = `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces`;

// Fetch the list of folders in /spaces
fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        // Loop through each item in the API response
        data.forEach(item => {
            // Only show directories (not files)
            if (item.type === "dir") {
                // Build one “function-style” list entry
                const itemHTML = `
                    <div class="list-item">
                        <div class="node"></div>
                        <a href="${item.name}/" class="function-call">.${item.name}()</a>
                    </div>
                `;
                // Add it to the container
                listContainer.innerHTML += itemHTML;
            }
        });
    })
    .catch(error => {
        // Display an error message if GitHub API fails
        console.error("Error fetching repository data:", error);
        listContainer.innerHTML += `
            <div class="list-item">
                <a class="function-call" style="color: #ff5555;">.error()</a>
            </div>
        `;
    });
