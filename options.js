const storage = typeof browser !== 'undefined' ? browser.storage.sync : chrome.storage.sync;
const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;

const tasksContainer = document.getElementById("tasksContainer");
const addTaskBtn = document.getElementById("addTaskBtn");
const removeAllBtn = document.getElementById("removeAllBtn");

function createTaskElement(task, index, totalTasks) {
  const taskElement = document.createElement("div");
  taskElement.classList.add("task");

  taskElement.innerHTML = `
    <label for="taskName${index}">Task Name:</label>
    <input type="text" id="taskName${index}" value="${task.name || ""}">
    <br>
    <label for="redirectUrl${index}">Redirect URL:</label>
    <input type="url" id="redirectUrl${index}" value="${task.redirectUrl || ""}">
    <br>
    <label for="ignoredUrls${index}">Ignored URLs (comma separated):</label>
    <textarea id="ignoredUrls${index}">${task.ignoredUrls ? task.ignoredUrls.join(", ") : ""}</textarea>
    <br>
    <label for="taskCompleted${index}">Task Completed: <input type="checkbox" id="taskCompleted${index}" ${task.completed ? "checked" : ""}></label>
    <br>
    <div>
      <button class="moveUpBtn" ${index === 0 ? 'disabled' : ''}>&#9650;</button>
      <button class="moveDownBtn" ${index === totalTasks - 1 ? 'disabled' : ''}>&#9660;</button>
      <span>Priority: ${index + 1}</span>
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

  const ignoredUrlsTextarea = taskElement.querySelector(`#ignoredUrls${index}`);
  ignoredUrlsTextarea.addEventListener("input", () => {
    task.ignoredUrls = ignoredUrlsTextarea.value
      .split(",")
      .map((url) => url.trim());
    saveTasks();
  });

  const taskCompletedCheckbox = taskElement.querySelector(`#taskCompleted${index}`);
  taskCompletedCheckbox.addEventListener("change", () => {
    task.completed = taskCompletedCheckbox.checked;
    saveTasks();
  });

  const moveUpBtn = taskElement.querySelector('.moveUpBtn');
  moveUpBtn.addEventListener('click', () => {
    if (index > 0) {
      swapTasks(index, index - 1);
    }
  });

  const moveDownBtn = taskElement.querySelector('.moveDownBtn');
  moveDownBtn.addEventListener('click', () => {
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
  const tasks = [];
  const taskElements = tasksContainer.querySelectorAll(".task");
  taskElements.forEach((taskElement, index) => {
    const name = taskElement.querySelector(`#taskName${index}`).value;
    const redirectUrl = taskElement.querySelector(`#redirectUrl${index}`).value;
    const ignoredUrls = taskElement.querySelector(`#ignoredUrls${index}`).value.split(",").map((url) => url.trim());
    const completed = taskElement.querySelector(`#taskCompleted${index}`).checked;

    tasks.push({ name, redirectUrl, ignoredUrls, completed });
  });

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
  renderTasks(tasks);
});
