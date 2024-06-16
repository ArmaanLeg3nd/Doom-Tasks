const storage =
  typeof browser !== "undefined" ? browser.storage.sync : chrome.storage.sync;
const runtime =
  typeof browser !== "undefined" ? browser.runtime : chrome.runtime;

const tasksContainer = document.getElementById("tasksContainer");
const addTaskBtn = document.getElementById("addTaskBtn");
const removeAllBtn = document.getElementById("removeAllBtn");

function createTaskElement(task, index, totalTasks) {
  const taskElement = document.createElement("div");
  taskElement.classList.add("task");

  taskElement.innerHTML = `
    <label for="taskName${index}">Task Name:</label>
    <input type="text" id="taskName${index}" value="${
    task.name || ""
  }" placeholder="Enter task name" required>
    <br>
    <label for="redirectUrl${index}">Redirect URL:</label>
    <span class="error" id="redirectUrlError${index}"></span>
    <input type="url" id="redirectUrl${index}" value="${
    task.redirectUrl || ""
  }" placeholder="Enter redirect URL" required>
    <br>
    <label for="ignoredUrls${index}">Ignored URLs (comma separated):</label>
    <span class="error" id="ignoredUrlsError${index}"></span>
    <textarea id="ignoredUrls${index}" placeholder="Enter ignored URLs separated by commas">${
    task.ignoredUrls ? task.ignoredUrls.join(", ") : ""
  }</textarea>
    <br>
    <label for="taskCompleted${index}">Task Completed: <input type="checkbox" id="taskCompleted${index}" ${
    task.completed ? "checked" : ""
  }></label>
    <br>
    <div>
      <button class="moveUpBtn" ${
        index === 0 ? "disabled" : ""
      }>&#9650;</button>
      <button class="moveDownBtn" ${
        index === totalTasks - 1 ? "disabled" : ""
      }>&#9660;</button>
      &nbsp;<span>Priority: ${index + 1}</span>
    </div>
    <br>
    <button class="removeTaskBtn">Remove Task</button>
    <br><br>
  `;

  tasksContainer.appendChild(taskElement);

  const removeTaskBtn = taskElement.querySelector(".removeTaskBtn");
  removeTaskBtn.addEventListener("click", () => {
    removeTask(index);
  });

  const taskNameInput = taskElement.querySelector(`#taskName${index}`);
  taskNameInput.addEventListener("input", () => {
    task.name = taskNameInput.value;
    saveTasks();
  });

  const redirectUrlInput = taskElement.querySelector(`#redirectUrl${index}`);
  redirectUrlInput.addEventListener("input", () => {
    task.redirectUrl = redirectUrlInput.value;
    saveTasks();
  });

  redirectUrlInput.addEventListener("blur", () => {
    validateUrl(redirectUrlInput, `#redirectUrlError${index}`);
  });

  const ignoredUrlsTextarea = taskElement.querySelector(`#ignoredUrls${index}`);
  ignoredUrlsTextarea.addEventListener("input", () => {
    task.ignoredUrls = ignoredUrlsTextarea.value
      .split(",")
      .map((url) => url.trim());
    saveTasks();
  });

  ignoredUrlsTextarea.addEventListener("blur", () => {
    validateIgnoredUrls(ignoredUrlsTextarea, `#ignoredUrlsError${index}`);
  });

  const taskCompletedCheckbox = taskElement.querySelector(
    `#taskCompleted${index}`
  );
  taskCompletedCheckbox.addEventListener("change", () => {
    task.completed = taskCompletedCheckbox.checked;
    saveTasks();
  });

  const moveUpBtn = taskElement.querySelector(".moveUpBtn");
  moveUpBtn.addEventListener("click", () => {
    if (index > 0) {
      swapTasks(index, index - 1);
    }
  });

  const moveDownBtn = taskElement.querySelector(".moveDownBtn");
  moveDownBtn.addEventListener("click", () => {
    if (index < totalTasks - 1) {
      swapTasks(index, index + 1);
    }
  });
}

function validateUrl(inputElement, errorElementId) {
  const url = inputElement.value.trim();
  const errorElement = document.querySelector(errorElementId);

  try {
    const urlObj = new URL(url);
    // Check if the hostname includes a dot (.) to ensure there's a domain/subdomain structure
    if (!urlObj.hostname.includes(".")) {
      throw new Error("Invalid URL structure: missing domain or subdomain");
    }
    errorElement.textContent = "";
    return true;
  } catch {
    errorElement.textContent =
      "Incorrect URL structure found. Correct it for the extension to work. Example: https://www.google.com";
    return false;
  }
}

function validateIgnoredUrls(textareaElement, errorElementId) {
  if (urlsInput.length === 0) {
    // No URLs provided
    const errorElement = document.querySelector(errorElementId);
    errorElement.textContent = "";
    return true;
  }

  const urlsInput = textareaElement.value.trim() + ",";

  const urls = urlsInput.split(",").map((url) => url.trim());
  const errorElement = document.querySelector(errorElementId);
  let allValid = true;

  urls.forEach((url) => {
    try {
      if (url !== "") {
        const urlObj = new URL(url);
        // Check if the hostname includes a dot (.) to ensure there's a domain/subdomain structure
        if (!urlObj.hostname.includes(".")) {
          throw new Error("Invalid URL structure: missing domain or subdomain");
        }
      }
    } catch {
      allValid = false;
    }
  });

  const improperlySeparated = urlsInput
    .split(" ")
    .some((part) => !part.includes(",") && part.length > 0);

  if (!allValid || improperlySeparated) {
    errorElement.textContent =
      "Incorrect URL structure or separation found. Ensure URLs are comma-separated and correctly formatted. Example: https://www.google.com, https://www.reddit.com";
  } else {
    errorElement.textContent = "";
  }

  return allValid && !improperlySeparated;
}

function renderTasks(tasks) {
  tasksContainer.innerHTML = "";
  tasks.forEach((task, index) => createTaskElement(task, index, tasks.length));
}

function saveTasks() {
  const tasks = [];
  const taskElements = tasksContainer.querySelectorAll(".task");

  taskElements.forEach((taskElement, index) => {
    const taskNameInput = taskElement.querySelector(`#taskName${index}`);
    const redirectUrlInput = taskElement.querySelector(`#redirectUrl${index}`);
    const ignoredUrlsTextarea = taskElement.querySelector(
      `#ignoredUrls${index}`
    );
    const taskCompletedCheckbox = taskElement.querySelector(
      `#taskCompleted${index}`
    );

    const name = taskNameInput.value.trim();
    const redirectUrl = redirectUrlInput.value.trim();
    const ignoredUrls = ignoredUrlsTextarea.value
      .split(",")
      .map((url) => url.trim());
    const completed = taskCompletedCheckbox.checked;

    if (
      name &&
      redirectUrl &&
      validateUrl(redirectUrlInput, `#redirectUrlError${index}`) &&
      validateIgnoredUrls(ignoredUrlsTextarea, `#ignoredUrlsError${index}`)
    ) {
      tasks.push({ name, redirectUrl, ignoredUrls, completed });
    } else {
      console.log(`Task ${index + 1} has empty or invalid details. Skipping.`);
    }
  });

  console.log("Tasks saved:", tasks);

  storage.set({ tasks }, () => {
    console.log("Tasks autosaved!");
    runtime.sendMessage({ tasksUpdated: true });
  });
}

function removeTask(index) {
  storage.get("tasks", (data) => {
    const tasks = data.tasks || [];
    tasks.splice(index, 1);
    storage.set({ tasks }, () => {
      renderTasks(tasks);
    });
  });
}

function removeAllTasks() {
  storage.set({ tasks: [] }, () => {
    tasksContainer.innerHTML = "";
    alert("All tasks removed!");
  });
}

function swapTasks(index1, index2) {
  storage.get("tasks", (data) => {
    const tasks = data.tasks || [];
    const temp = tasks[index1];
    tasks[index1] = tasks[index2];
    tasks[index2] = temp;
    storage.set({ tasks }, () => {
      renderTasks(tasks);
    });
  });
}

addTaskBtn.addEventListener("click", () => {
  storage.get("tasks", (data) => {
    const tasks = data.tasks || [];
    tasks.push({
      name: "",
      redirectUrl: "",
      ignoredUrls: [],
      completed: false,
    });
    storage.set({ tasks }, () => {
      renderTasks(tasks);
    });
  });
});

removeAllBtn.addEventListener("click", removeAllTasks);

storage.get("tasks", (data) => {
  const tasks = data.tasks || [];

  // Filter out tasks with empty name or redirectUrl
  const filteredTasks = tasks.filter(
    (task) => task.name.trim() !== "" && task.redirectUrl.trim() !== ""
  );

  storage.set({ tasks: filteredTasks }, () => {
    console.log("Empty tasks removed!");
  });

  renderTasks(filteredTasks);
});
