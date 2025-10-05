const API_URL = "http://18.209.46.24:5000/api";
let token = localStorage.getItem("token");

const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get("courseId");

const outlineContainer = document.getElementById("lecturesList");
const courseTitle = document.getElementById("courseTitle");
const lectureVideo = document.getElementById("lectureVideo");
const lectureContent = document.getElementById("lectureContent");
const markDoneBtn = document.getElementById("markDoneBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let lectures = [];
let currentIndex = 0;
let completedLectures = [];

// ================= Load lectures =================
async function loadLectures() {
  try {
    const res = await fetch(`${API_URL}/lectures/${courseId}`, {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data) || data.length === 0) {
      outlineContainer.innerHTML = "<p>No lectures found for this course.</p>";
      return;
    }

    lectures = data.sort((a, b) => {
      if (parseInt(a.week) !== parseInt(b.week)) {
        return parseInt(a.week) - parseInt(b.week);
      }
      const typeOrder = { "video": 1, "reading": 2, "quiz": 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
    
    courseTitle.textContent = `Course: ${lectures[0].courseId}`;
    renderOutline();
    displayLecture(0);
  } catch (err) {
    console.error("Error loading lectures:", err);
    outlineContainer.innerHTML = `<p style="color:red;">Failed to load course lectures.</p>`;
  }
}

// ================= Render course outline =================
function renderOutline() {
  outlineContainer.innerHTML = "";
  const weeks = {};
  lectures.forEach((lec, index) => {
    if (!weeks[lec.week]) weeks[lec.week] = [];
    weeks[lec.week].push({ ...lec, index });
  });

  Object.keys(weeks).sort((a, b) => parseInt(a) - parseInt(b)).forEach(weekNum => {
    const weekLectures = weeks[weekNum];

    const weekDiv = document.createElement("div");
    weekDiv.className = "week-section";
    weekDiv.innerHTML = `
      <div class="week-header">
        <span class="week-circle" id="weekCircle_${weekNum}">○</span>
        <span class="week-title">Week ${weekNum}</span>
      </div>
    `;

    const list = document.createElement("ul");
    list.className = "lecture-list";

    weekLectures.forEach(lecObj => {
      const li = document.createElement("li");
      li.className = "lecture-item lecture";
      li.id = `lecture_${lecObj.index}`;
      if (completedLectures.includes(lecObj.index)) li.classList.add("done");
      li.innerHTML = `
        <span class="lecture-circle" id="circle_${lecObj.index}">○</span>
        <a href="#" onclick="event.preventDefault(); goToLecture(${lecObj.index})">
          ${lecObj.title} (${lecObj.type})
        </a>
      `;
      list.appendChild(li);
    });

    weekDiv.appendChild(list);
    outlineContainer.appendChild(weekDiv);
  });
  
  updateWeekCompletionStatus();
}

// ================= Mark as done =================
function markDone(showWeekCompletion = false) {
  if (!completedLectures.includes(currentIndex)) {
    completedLectures.push(currentIndex);
    const circle = document.getElementById(`circle_${currentIndex}`);
    const lectureItem = document.getElementById(`lecture_${currentIndex}`);
    if (circle) {
      circle.textContent = "●";
      circle.style.color = "#007bff";
    }
    if (lectureItem) lectureItem.classList.add("done");
    
    // Check if week is completed only when requested (after quiz submission)
    if (showWeekCompletion) {
      checkWeekCompletion();
    }
    updateWeekCompletionStatus();
  }
}

// ================= Check week completion =================
function checkWeekCompletion() {
  const currentLecture = lectures[currentIndex];
  const currentWeek = currentLecture.week;
  
  // Get all lectures in the current week
  const weekLectures = lectures
    .map((l, i) => ({ ...l, index: i }))
    .filter(l => l.week === currentWeek);
  
  // Check if all lectures in this week are completed
  const allCompleted = weekLectures.every(l => completedLectures.includes(l.index));
  
  if (allCompleted) {
    setTimeout(() => {
      alert(`🎉 Congratulations! Week ${currentWeek} Completed! 🎉`);
    }, 500);
  }
}

// ================= Update week completion status =================
function updateWeekCompletionStatus() {
  const weeks = {};
  lectures.forEach((lec, index) => {
    if (!weeks[lec.week]) weeks[lec.week] = [];
    weeks[lec.week].push(index);
  });

  Object.keys(weeks).forEach(weekNum => {
    const weekLectures = weeks[weekNum];
    const doneCount = weekLectures.filter(idx => completedLectures.includes(idx)).length;
    const weekCircle = document.getElementById(`weekCircle_${weekNum}`);
    
    if (weekCircle) {
      if (doneCount === weekLectures.length) {
        weekCircle.textContent = "●";
        weekCircle.style.color = "#007bff";
      } else {
        weekCircle.textContent = "○";
        weekCircle.style.color = "";
      }
    }
  });
}

// ================= Display lecture =================
function displayLecture(index) {
  if (index < 0 || index >= lectures.length) return;
  currentIndex = index;
  const lec = lectures[index];

  courseTitle.textContent = `Week ${lec.week}: ${lec.title}`;

  // Reset video and content
  lectureVideo.style.display = "none";
  lectureVideo.src = "";
  lectureContent.innerHTML = "";
  markDoneBtn.style.display = "none";

  // Video
  if (lec.type === "video" && lec.youtubeUrl) {
    const videoId = lec.youtubeUrl.includes("youtu.be")
      ? lec.youtubeUrl.split("youtu.be/")[1]?.split("?")[0]
      : lec.youtubeUrl.split("watch?v=")[1]?.split("&")[0];

    lectureVideo.src = `https://www.youtube.com/embed/${videoId}`;
    lectureVideo.style.display = "block";
    
    // Auto-mark video as done after iframe loads
    lectureVideo.onload = function() {
      setTimeout(() => {
        markDone();
      }, 1000);
    };
  }

  // Reading
  if (lec.type === "reading") {
    if (lec.content.startsWith("http")) {
      lectureContent.innerHTML = `
        <h3>Reading</h3>
        <a href="${lec.content}" target="_blank" onclick="markReadingDone()">Open Article</a>
      `;
    } else {
      lectureContent.innerHTML = `<h3>Reading</h3><p>${lec.content}</p>`;
      // Auto-mark reading as done after a short delay
      setTimeout(() => {
        markDone();
      }, 1500);
    }
  }

  // Quiz
  if (lec.type === "quiz") {
    try {
      const quizData = JSON.parse(lec.content);
      lectureContent.innerHTML = `
        <h3>Quiz Time!</h3>
        <form id="quizForm">
          ${quizData.map((q, i) => `
            <div style="margin-bottom:15px;">
              <p><b>Q${i + 1}) ${q.question}</b></p>
              ${q.options.map(opt => `
                <label style="display:block;">
                  <input type="radio" name="q${i}" value="${opt}"> ${opt}
                </label>
              `).join('')}
            </div>
          `).join('')}
          <button type="submit" style="padding: 8px 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 4px;">Submit Quiz</button>
        </form>
        <p id="quizResult" style="margin-top:10px; font-weight:bold;"></p>
      `;

      document.getElementById("quizForm").addEventListener("submit", e => {
        e.preventDefault();
        let score = 0;
        quizData.forEach((q, i) => {
          const selected = document.querySelector(`input[name="q${i}"]:checked`);
          if (selected && selected.value === q.answer) score++;
        });
        const result = document.getElementById("quizResult");
        result.textContent = `You scored ${score}/${quizData.length}`;
        result.style.color = score >= Math.ceil(0.7 * quizData.length) ? "green" : "red";
        
        // Mark quiz as done after submission and check week completion
        markDone(true);
      });
    } catch {
      lectureContent.innerHTML = "<p>Invalid quiz format.</p>";
    }
  }

  // Update navigation buttons
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === lectures.length - 1;
  
  // Ensure buttons are visible/enabled properly
  prevBtn.style.opacity = currentIndex === 0 ? "0.5" : "1";
  prevBtn.style.cursor = currentIndex === 0 ? "not-allowed" : "pointer";
  nextBtn.style.opacity = currentIndex === lectures.length - 1 ? "0.5" : "1";
  nextBtn.style.cursor = currentIndex === lectures.length - 1 ? "not-allowed" : "pointer";
}

// ================= Mark reading as done when link is clicked =================
function markReadingDone() {
  setTimeout(() => {
    markDone();
  }, 500);
}

// ================= Navigation =================
function prevLecture() {
  if (currentIndex > 0) {
    displayLecture(currentIndex - 1);
  }
}

function nextLecture() {
  if (currentIndex < lectures.length - 1) {
    displayLecture(currentIndex + 1);
  }
}

function goToLecture(index) {
  displayLecture(index);
}

// ================= Event Listeners =================
prevBtn.addEventListener("click", prevLecture);
nextBtn.addEventListener("click", nextLecture);
markDoneBtn.addEventListener("click", markDone);

// ================= Load =================
if (courseId) loadLectures();
else outlineContainer.innerHTML = "<p>Invalid course selected.</p>";