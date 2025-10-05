const API_URL = "http://18.209.46.24:5000/api";
let token = localStorage.getItem("token");

// ================= SIGNUP =================
if (document.getElementById("signupForm")) {
  document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const role = document.querySelector('input[name="role"]:checked').value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Signup successful! Please login.");
        window.location.href = "login.html";
      } else {
        alert(data.message || "Signup failed!");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Server error. Please try again later.");
    }
  });
}

// ================= LOGIN =================
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.querySelector('input[name="role"]:checked').value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
      });

      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", role);
        alert("Login successful!");

        if (role === "instructor") {
          window.location.href = "instructor-dashboard.html";
        } else {
          window.location.href = "student.html";
        }
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Server error. Please try again later.");
    }
  });
}

// ================= STUDENT: LOAD + SEARCH COURSES =================
if (document.getElementById("allCourses")) {
  const list = document.getElementById("allCourses");
  const searchInput = document.getElementById("searchInput");

  // Default fallback courses
  const defaultCourses = [
    { title: "Android", description: "Learn mobile app development with Android.", icon: "fa-solid fa-mobile-screen-button" },
    { title: "Popular Courses", description: "Most enrolled courses across various domains.", icon: "fa-solid fa-star" },
    { title: "Architecture & Planning", description: "Design and plan structures with expert guidance.", icon: "fa-solid fa-building-columns" },
    { title: "Design", description: "Explore creativity with graphic and product design.", icon: "fa-solid fa-paintbrush" },
    { title: "Engineering & Technology", description: "Build tech solutions in various engineering fields.", icon: "fa-solid fa-gears" },
    { title: "Health Sciences", description: "Learn about medical sciences and health care.", icon: "fa-solid fa-heart-pulse" },
    { title: "Humanities & Arts", description: "Explore culture, history, and artistic expression.", icon: "fa-solid fa-theater-masks" },
    { title: "Law", description: "Understand laws and legal frameworks.", icon: "fa-solid fa-gavel" },
    { title: "Management & Commerce", description: "Master business, finance, and management skills.", icon: "fa-solid fa-briefcase" },
    { title: "Maths & Sciences", description: "Explore the world of numbers and scientific thinking.", icon: "fa-solid fa-square-root-variable" },
  ];

  async function loadCourses(query = "") {
    try {
      let url = `${API_URL}/courses`;

      const res = await fetch(url, {
        headers: { "Authorization": "Bearer " + token }
      });

      let courses = await res.json();

      // Map DynamoDB items to usable format
      courses = courses.map(c => ({
        courseId: c.courseId,
        title: c.title,
        description: c.description,
        image: c.image || "default-course.jpg",
        youtubeLink: c.youtubeLink,
      }));

      // Frontend filtering by title if query exists
      if (query) {
        const lowerQuery = query.toLowerCase();
        courses = courses.filter(c => c.title.toLowerCase().includes(lowerQuery));
      }

      if (!courses || courses.length === 0) {
        renderCourses(defaultCourses, true);
      } else {
        renderCourses(courses, false);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      renderCourses(defaultCourses, true);
    }
  }

  function renderCourses(courses, isDefault = false) {
    list.innerHTML = "";

    if (!courses.length) {
      list.innerHTML = "<p style='text-align:center'>No courses found</p>";
      return;
    }

    courses.forEach(c => {
      const card = document.createElement("div");
      card.className = "course-card";

      if (isDefault) {
        card.innerHTML = `<i class="${c.icon}"></i>
                          <h3>${c.title}</h3>
                          <p>${c.description}</p>`;
      } else {
        card.innerHTML = `<img src="${c.image}" alt="${c.title}">
                          <div class="content">
                            <h3>${c.title}</h3>
                            <p>${c.description}</p>
                          </div>`;

        // 🔹 CHANGE: Redirect to progress.html instead of course.html
        card.onclick = () => window.location.href = `progress.html?courseId=${c.courseId}`;
      }

      list.appendChild(card);
    });
  }

  // Initial load
  loadCourses();

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim();
      if (query.length >= 2) loadCourses(query);
      else loadCourses();
    });
  }
}
