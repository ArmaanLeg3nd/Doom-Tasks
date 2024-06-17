const storage =
  typeof browser !== "undefined" ? browser.storage.sync : chrome.storage.sync;
const runtime =
  typeof browser !== "undefined" ? browser.runtime : chrome.runtime;

const tasksContainer = document.getElementById("tasksContainer");
const toggleExtensionCheckbox = document.getElementById("toggleExtension");
const navigateOptionsButton = document.getElementById("navigateOptions");

function createTaskElement(task, index, totalTasks) {
  const taskElement = document.createElement("div");
  taskElement.classList.add("task");

  taskElement.innerHTML = `
    <label>Task Name: ${task.name}</label>
    <br>
    <label for="taskCompleted${index}"> Task Completed: <input type="checkbox" id="taskCompleted${index}" ${
    task.completed ? "checked" : ""
  }></label>
    <label>Priority: ${index + 1}</label>
    <br>
    <div class="details">
      <strong>Redirect URL:</strong> ${task.redirectUrl || "Not specified"}
      <br>
      <strong>Ignored URLs:</strong> ${
        task.ignoredUrls && task.ignoredUrls.length > 0
          ? task.ignoredUrls.join(", ")
          : "None"
      }
    </div>
    <br>
    <button class="moveUpBtn" ${index === 0 ? "disabled" : ""}>&#9650;</button>
    <button class="moveDownBtn" ${
      index === totalTasks - 1 ? "disabled" : ""
    }>&#9660;</button>
  `;

  tasksContainer.appendChild(taskElement);

  document
    .getElementById(`taskCompleted${index}`)
    .addEventListener("change", (event) => {
      task.completed = event.target.checked;
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

function renderTasks(tasks) {
  tasksContainer.innerHTML = "";
  tasks.forEach((task, index) => createTaskElement(task, index, tasks.length));
}

function saveTasks() {
  const taskElements = tasksContainer.querySelectorAll(".task");
  const tasks = Array.from(taskElements).map((taskElement, index) => {
    const name = taskElement
      .querySelector(`label[for="taskCompleted${index}"]`)
      .innerText.replace(":", "");
    const completed = taskElement.querySelector(
      `#taskCompleted${index}`
    ).checked;
    const priority = index + 1;
    const redirectUrl =
      taskElement
        .querySelector(".details strong")
        .nextSibling.textContent.trim() || "";
    const ignoredUrls =
      taskElement
        .querySelector(".details strong")
        .nextElementSibling.textContent.trim() || "";

    return { name, completed, priority, redirectUrl, ignoredUrls }; // Store the updated tasks
  });

  storage.set({ tasks }, () => {
    console.log("Tasks updated");
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

function toggleExtension(enabled) {
  storage.set({ extensionEnabled: enabled }, () => {
    console.log("Extension enabled status:", enabled);
  });
}

navigateOptionsButton.addEventListener("click", () => {
  if (runtime.openOptionsPage) {
    runtime.openOptionsPage();
  } else {
    window.open(runtime.getURL("options.html"));
  }
});

document.addEventListener("DOMContentLoaded", () => {
  storage.get(["tasks", "extensionEnabled"], (data) => {
    // Filter out tasks with empty name or redirectUrl
    const filteredTasks = data.tasks.filter(
      (task) => task.name.trim() !== "" && task.redirectUrl.trim() !== ""
    );

    storage.set({ tasks: filteredTasks }, () => {
      console.log("Empty tasks removed!");
    });

    renderTasks(filteredTasks || []);
    toggleExtensionCheckbox.checked = data.extensionEnabled || false;

    // Disable or enable the tasks container based on the extension status
    tasksContainer.style.display = toggleExtensionCheckbox.checked
      ? "block"
      : "none";
  });

  toggleExtensionCheckbox.addEventListener("change", (event) => {
    const enabled = event.target.checked;
    toggleExtension(enabled);

    // Disable or enable the tasks container based on the extension status
    tasksContainer.style.display = enabled ? "block" : "none";
  });
});
