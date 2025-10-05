// instructor.js
const API_URL = "http://18.209.46.24:5000/api";
const token = localStorage.getItem("token");

// decode JWT payload (no verification) to get userId
function decodeJWT(tok){
  if(!tok) return null;
  try{
    const payload = tok.split('.')[1];
    const json = JSON.parse(atob(payload));
    return json;
  } catch(e){ return null; }
}

const me = decodeJWT(token);
const userName = me?.username || me?.userId;
if(userName){
  document.getElementById('loggedUser').textContent = ` ${userName}`;
}


// UI refs
const tabs = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b=>b.classList.remove('active'));
    panels.forEach(p=>p.classList.remove('show'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('show');
  });
});

/* ---------- Create Course ---------- */
const createCourseForm = document.getElementById('createCourseForm');
createCourseForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('courseTitle').value.trim();
  const description = document.getElementById('courseDesc').value.trim();
  const image = document.getElementById('courseImage').value.trim();
  const youtubeLink = document.getElementById('courseYoutube').value.trim();

  try {
    const res = await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: {
        "Content-Type":"application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ title, description, image, youtubeLink })
    });
    const data = await res.json();
    if(res.ok) {
      alert('Course created');
      createCourseForm.reset();
      loadMyCourses();
      // switch to my courses tab
      document.querySelector('[data-target="myCourses"]').click();
    } else {
      alert(data.message || 'Failed to create course');
    }
  } catch(err){
    console.error(err);
    alert('Server error');
  }
});

/* ---------- Load My Courses ---------- */
const coursesList = document.getElementById('coursesList');
const selectCourse = document.getElementById('selectCourse');

async function loadMyCourses(){
  try {
    const res = await fetch(`${API_URL}/courses`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();
    // filter by instructorId (needs token -> userId)
    const mine = (Array.isArray(data) ? data : []).filter(c => {
      return c.instructorId === userId;
    });

    // populate cards grid
    coursesList.innerHTML = '';
    selectCourse.innerHTML = '<option value="">-- select a course to manage --</option>';
    if(mine.length === 0){
      coursesList.innerHTML = '<p class="muted">No courses found. Create one first.</p>';
      return;
    }

    mine.forEach(course => {
      const div = document.createElement('div');
      div.className = 'course-card card';
      div.innerHTML = `
        <h4>${course.title}</h4>
        <p>${course.description || ''}</p>
        <div class="course-actions">
          <button class="btn small manage-btn" data-id="${course.courseId}">Manage</button>
        </div>
      `;
      coursesList.appendChild(div);

      // add to select
      const opt = document.createElement('option');
      opt.value = course.courseId;
      opt.textContent = course.title;
      selectCourse.appendChild(opt);
    });

    // wire manage buttons
    document.querySelectorAll('.manage-btn').forEach(b=>{
      b.addEventListener('click', (ev)=>{
        const cid = ev.currentTarget.dataset.id;
        selectCourse.value = cid;
        selectCourse.dispatchEvent(new Event('change'));
        // switch to manage tab
        document.querySelector('[data-target="manageLectures"]').click();
      });
    });

  } catch(err){
    console.error(err);
    coursesList.innerHTML = '<p class="muted">Failed to load courses.</p>';
  }
}

/* ---------- Manage Lectures UI ---------- */
const lecturesList = document.getElementById('lecturesList');
let currentCourseId = null;

selectCourse?.addEventListener('change', (e)=>{
  currentCourseId = e.target.value;
  if(currentCourseId) {
    loadLecturesForCourse(currentCourseId);
  } else {
    lecturesList.innerHTML = '<p class="muted">Choose a course to load lectures.</p>';
  }
});

async function loadLecturesForCourse(courseId){
  lecturesList.innerHTML = '<p class="muted">Loading lectures...</p>';
  try {
    const res = await fetch(`${API_URL}/lectures/${encodeURIComponent(courseId)}`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();
    if(!Array.isArray(data) || data.length === 0){
      lecturesList.innerHTML = '<p class="muted">No lectures yet.</p>';
      return;
    }

    // group by week
    const weeks = {};
    data.forEach(lec => {
      const wk = lec.week || '1';
      if(!weeks[wk]) weeks[wk] = [];
      weeks[wk].push(lec);
    });

    // render
    lecturesList.innerHTML = '';
    Object.keys(weeks).sort((a,b)=>a-b).forEach(wk=>{
      const header = document.createElement('div');
      header.className = 'muted';
      header.style.margin = '8px 0';
      header.textContent = `Week ${wk}`;
      lecturesList.appendChild(header);

      weeks[wk].forEach(lec => {
        const item = document.createElement('div');
        item.className = 'lecture-item' + (lec.status === 'done' ? ' done' : '');
        item.innerHTML = `
          <div class="meta">
            <strong>${lec.title}</strong>
            <small>${lec.type} · ${lec.lectureId}</small>
          </div>
          <div class="controls">
            <button class="btn small view-lecture" data-id="${lec.lectureId}" data-type="${lec.type}" data-content="${encodeURIComponent(lec.content||lec.youtubeUrl||'')}">View</button>
            <button class="btn small" data-id="${lec.lectureId}" data-cid="${lec.courseId}" data-action="delete">Delete</button>
          </div>
        `;
        lecturesList.appendChild(item);
      });
    });

    // delete listeners
    lecturesList.querySelectorAll('button[data-action="delete"]').forEach(b=>{
      b.addEventListener('click', (ev)=>{
        const lectureId = ev.currentTarget.dataset.id;
        deleteLecture(lectureId, currentCourseId);
      });
    });

    // view listeners (simple: open in new tab or alert)
    lecturesList.querySelectorAll('.view-lecture').forEach(b=>{
      b.addEventListener('click', (ev)=>{
        const type = ev.currentTarget.dataset.type;
        const raw = decodeURIComponent(ev.currentTarget.dataset.content || '');
        if(type === 'video'){
          // open youtube in new tab
          // support youtu.be and watch?v
          let videoId = '';
          if(raw.includes('youtu.be')) videoId = raw.split('youtu.be/')[1]?.split('?')[0];
          else if(raw.includes('watch?v=')) videoId = raw.split('watch?v=')[1]?.split('&')[0];
          if(videoId) window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
          else alert('No valid video URL stored.');
        } else if(type === 'reading'){
          // open content as link if starts with http, else show text
          if(raw.startsWith('http')) window.open(raw, '_blank');
          else alert(raw || 'No reading content.');
        } else if(type === 'quiz'){
          alert('Quiz preview (content): ' + (raw ? raw : 'No content'));
        } else {
          alert('Unknown type: ' + type);
        }
      });
    });

  } catch(err){
    console.error(err);
    lecturesList.innerHTML = '<p class="muted">Failed to load lectures.</p>';
  }
}

/* ---------- Add Lecture Form ---------- */
const ltButtons = document.querySelectorAll('.lt-btn');
const readingFields = document.getElementById('readingFields');
const videoFields = document.getElementById('videoFields');
const quizFields = document.getElementById('quizFields');
const addLectureForm = document.getElementById('addLectureForm');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const quizQuestions = document.getElementById('quizQuestions');

let selectedType = 'reading';
ltButtons.forEach(b=>{
  b.addEventListener('click', () => {
    ltButtons.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    selectedType = b.dataset.type;
    // toggle fields
    readingFields.classList.toggle('hidden', selectedType !== 'reading');
    videoFields.classList.toggle('hidden', selectedType !== 'video');
    quizFields.classList.toggle('hidden', selectedType !== 'quiz');
  });
});

// quiz dynamic
function addQuestionUI(prefill){
  const idx = quizQuestions.children.length;
  const root = document.createElement('div');
  root.className = 'quiz-q';
  root.innerHTML = `
    <label>Question ${idx+1}</label>
    <input type="text" class="q-text" placeholder="Question text" value="${prefill?.q||''}" />
    <div class="opts">
      <input type="text" class="opt" placeholder="Option A" value="${prefill?.options?.[0]||''}" />
      <input type="text" class="opt" placeholder="Option B" value="${prefill?.options?.[1]||''}" />
      <input type="text" class="opt" placeholder="Option C" value="${prefill?.options?.[2]||''}" />
      <input type="text" class="opt" placeholder="Option D" value="${prefill?.options?.[3]||''}" />
    </div>
    <label>Correct option index (0-3)</label>
    <input type="number" class="correct" min="0" max="3" value="${prefill?.correct ?? 0}" />
    <div style="margin-top:8px;">
      <button type="button" class="btn small remove-q">Remove</button>
    </div>
  `;
  quizQuestions.appendChild(root);
  root.querySelector('.remove-q').addEventListener('click', ()=>{
    root.remove();
  });
}
addQuestionBtn?.addEventListener('click', ()=> addQuestionUI());

// submit add lecture
addLectureForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!currentCourseId){
    alert('Select a course to add lecture into.');
    return;
  }
  const week = document.getElementById('lecWeek').value;
  const title = document.getElementById('lecTitle').value.trim();

  let payload = {
    courseId: currentCourseId,
    title,
    week: Number(week),
    type: selectedType
  };

  if(selectedType === 'reading'){
    payload.content = document.getElementById('lecContent').value.trim();
    payload.youtubeUrl = '';
  } else if(selectedType === 'video'){
    payload.youtubeUrl = document.getElementById('lecYoutube').value.trim();
    payload.content = '';
  } else if(selectedType === 'quiz'){
    // collect questions
    const qs = [];
    const qnodes = quizQuestions.querySelectorAll('.quiz-q');
    if(qnodes.length === 0){
      alert('Add at least one question');
      return;
    }
    qnodes.forEach(qn => {
      const qtext = qn.querySelector('.q-text').value.trim();
      const opts = Array.from(qn.querySelectorAll('.opt')).map(i=>i.value.trim());
      const correct = Number(qn.querySelector('.correct').value||0);
      qs.push({ q: qtext, options: opts, correct });
    });
    payload.content = JSON.stringify({ questions: qs });
    payload.youtubeUrl = '';
  }

  try {
    const res = await fetch(`${API_URL}/lectures`, {
      method: 'POST',
      headers: { "Content-Type":"application/json", "Authorization":"Bearer "+token },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(res.ok){
      alert('Lecture added');
      addLectureForm.reset();
      quizQuestions.innerHTML = '';
      // reload lectures
      loadLecturesForCourse(currentCourseId);
    } else {
      alert(data.message || 'Failed to add lecture');
    }
  } catch(err){
    console.error(err);
    alert('Server error');
  }
});

/* ---------- Delete lecture ---------- */
async function deleteLecture(lectureId, courseId){
  if(!confirm('Delete this lecture?')) return;
  try {
    const res = await fetch(`${API_URL}/lectures/${encodeURIComponent(lectureId)}`, {
      method: 'DELETE',
      headers: { "Authorization":"Bearer "+token }
    });
    const data = await res.json();
    if(res.ok){
      alert('Deleted');
      loadLecturesForCourse(courseId);
    } else {
      alert(data.message || 'Failed to delete');
    }
  } catch(err){
    console.error(err);
    alert('Server error');
  }
}

/* ---------- init ---------- */
loadMyCourses();
