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

  // Task Name Label
  const taskNameLabel = document.createElement("label");
  taskNameLabel.setAttribute("for", `taskName${index}`);
  taskNameLabel.textContent = "Task Name:";
  taskElement.appendChild(taskNameLabel);

  // Task Name Input
  const taskNameInput = document.createElement("input");
  taskNameInput.type = "text";
  taskNameInput.id = `taskName${index}`;
  taskNameInput.value = task.name || "";
  taskNameInput.placeholder = "Enter task name";
  taskNameInput.required = true;
  taskElement.appendChild(taskNameInput);

  taskElement.appendChild(document.createElement("br"));

  // Redirect URL Label
  const redirectUrlLabel = document.createElement("label");
  redirectUrlLabel.setAttribute("for", `redirectUrl${index}`);
  redirectUrlLabel.textContent = "Redirect URL:";
  taskElement.appendChild(redirectUrlLabel);

  // Redirect URL Error Span
  const redirectUrlError = document.createElement("span");
  redirectUrlError.classList.add("error");
  redirectUrlError.id = `redirectUrlError${index}`;
  taskElement.appendChild(redirectUrlError);

  // Redirect URL Input
  const redirectUrlInput = document.createElement("input");
  redirectUrlInput.type = "url";
  redirectUrlInput.id = `redirectUrl${index}`;
  redirectUrlInput.value = task.redirectUrl || "";
  redirectUrlInput.placeholder = "Enter redirect URL";
  redirectUrlInput.required = true;
  taskElement.appendChild(redirectUrlInput);

  taskElement.appendChild(document.createElement("br"));

  // Ignored URLs Label
  const ignoredUrlsLabel = document.createElement("label");
  ignoredUrlsLabel.setAttribute("for", `ignoredUrls${index}`);
  ignoredUrlsLabel.textContent = "Ignored URLs (comma separated):";
  taskElement.appendChild(ignoredUrlsLabel);

  // Ignored URLs Error Span
  const ignoredUrlsError = document.createElement("span");
  ignoredUrlsError.classList.add("error");
  ignoredUrlsError.id = `ignoredUrlsError${index}`;
  taskElement.appendChild(ignoredUrlsError);

  // Ignored URLs Textarea
  const ignoredUrlsTextarea = document.createElement("textarea");
  ignoredUrlsTextarea.id = `ignoredUrls${index}`;
  ignoredUrlsTextarea.placeholder = "Enter ignored URLs separated by commas";
  ignoredUrlsTextarea.textContent = task.ignoredUrls ? task.ignoredUrls.join(", ") : "";
  taskElement.appendChild(ignoredUrlsTextarea);

  taskElement.appendChild(document.createElement("br"));

  // Task Completed Label and Checkbox
  const taskCompletedLabel = document.createElement("label");
  taskCompletedLabel.setAttribute("for", `taskCompleted${index}`);
  taskCompletedLabel.innerHTML = `Task Completed: <input type="checkbox" id="taskCompleted${index}" ${task.completed ? "checked" : ""}>`;
  taskElement.appendChild(taskCompletedLabel);

  taskElement.appendChild(document.createElement("br"));

  // Move Buttons and Priority Span
  const moveButtonsDiv = document.createElement("div");

  const moveUpBtn = document.createElement("button");
  moveUpBtn.classList.add("moveUpBtn");
  moveUpBtn.innerHTML = "&#9650;";
  moveUpBtn.disabled = index === 0;
  moveButtonsDiv.appendChild(moveUpBtn);

  let gap = document.createElement("span");
  gap.innerHTML = "&nbsp;&nbsp;";
  moveButtonsDiv.appendChild(gap);

  const moveDownBtn = document.createElement("button");
  moveDownBtn.classList.add("moveDownBtn");
  moveDownBtn.innerHTML = "&#9660;";
  moveDownBtn.disabled = index === totalTasks - 1;
  moveButtonsDiv.appendChild(moveDownBtn);

  const prioritySpan = document.createElement("span");
  prioritySpan.innerHTML = `&nbsp;Priority: ${index + 1}`;
  moveButtonsDiv.appendChild(prioritySpan);

  taskElement.appendChild(moveButtonsDiv);

  taskElement.appendChild(document.createElement("br"));

  // Remove Task Button
  const removeTaskBtn = document.createElement("button");
  removeTaskBtn.classList.add("removeTaskBtn");
  removeTaskBtn.textContent = "Remove Task";
  taskElement.appendChild(removeTaskBtn);

  taskElement.appendChild(document.createElement("br"));
  taskElement.appendChild(document.createElement("br"));

  tasksContainer.appendChild(taskElement);

  // Event Listeners
  removeTaskBtn.addEventListener("click", () => {
    removeTask(index);
  });

  taskNameInput.addEventListener("input", () => {
    task.name = taskNameInput.value;
    saveTasks();
  });

  redirectUrlInput.addEventListener("input", () => {
    task.redirectUrl = redirectUrlInput.value;
    saveTasks();
  });

  redirectUrlInput.addEventListener("blur", () => {
    validateUrl(redirectUrlInput, `#redirectUrlError${index}`);
  });

  ignoredUrlsTextarea.addEventListener("input", () => {
    task.ignoredUrls = ignoredUrlsTextarea.value.split(",").map((url) => url.trim());
    saveTasks();
  });

  ignoredUrlsTextarea.addEventListener("blur", () => {
    validateIgnoredUrls(ignoredUrlsTextarea, `#ignoredUrlsError${index}`);
  });

  const taskCompletedCheckbox = taskCompletedLabel.querySelector(`#taskCompleted${index}`);
  taskCompletedCheckbox.addEventListener("change", () => {
    task.completed = taskCompletedCheckbox.checked;
    saveTasks();
  });

  moveUpBtn.addEventListener("click", () => {
    if (index > 0) {
      swapTasks(index, index - 1);
    }
  });

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
  const urlsInput = textareaElement.value.trim() + ",";  // Declare urlsInput at the start

  if (urlsInput.length === 0) {
    // No URLs provided
    const errorElement = document.querySelector(errorElementId);
    errorElement.textContent = "";
    return true;
  }

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
