//Sadece update buttonunu işlevsel yapma, kodunu yazmadım ve extra courselar içinde bilgileir gerkeiyor. Kursu alan kişi sayısı not ortalaması geçen kalan sayısı gibi

const courses = {};
let currentCourse = null;

// Add Course
document.querySelector('#add-course-btn').addEventListener('click', () => {
  const courseName = document.querySelector('#course-name').value.trim();
  const scaleType = document.querySelector('#point-scale').value;

  if (!courseName) {
    return alert('Please fill in the course name.');
  }

  // Check for existing course (case-insensitive)
  const courseExists = Object.keys(courses).some(
    existingCourse => existingCourse.toLowerCase() === courseName.toLowerCase()
  );

  if (courseExists) {
    return alert(`The course "${courseName}" already exists.`);
  }

  courses[courseName] = { scaleType, students: [] };

  // Add course to dropdown
  const courseDropdown = document.querySelector('#course-dropdown');
  const option = document.createElement('option');
  option.value = courseName;
  option.textContent = courseName;
  courseDropdown.appendChild(option);

  // Clear the input
  document.querySelector('#course-name').value = '';
  alert(`Course "${courseName}" added successfully!`);
});

// Select Course
document.querySelector('#course-dropdown').addEventListener('change', (e) => {
  currentCourse = e.target.value;
  renderStudentsTable();
});

// Add Student
document.querySelector('#add-student-btn').addEventListener('click', () => {
  if (!currentCourse) {
    return alert('Please select a course first.');
  }

  const id = document.querySelector('#student-id').value.trim();
  const firstName = document.querySelector('#student-name').value.trim();
  const lastName = document.querySelector('#student-surname').value.trim();
  const midterm = Number(document.querySelector('#midterm-score').value);
  const final = Number(document.querySelector('#final-score').value);

  if (!id || !firstName || !lastName || isNaN(midterm) || isNaN(final)) {
    return alert('Please fill in all fields.');
  }

  const fullName = `${firstName} ${lastName}`;

  // Check if the student already exists in this course
  const students = courses[currentCourse].students;
  const studentExistsInCurrentCourse = students.some(student =>
    student.name.toLowerCase() === firstName.toLowerCase() &&
    student.surname.toLowerCase() === lastName.toLowerCase()
  );

  if (studentExistsInCurrentCourse) {
    return alert(`A student with the name "${fullName}" already exists in this course.`);
  }

  // Check if the student exists in other courses with a different ID
  const studentExistsInOtherCourses = Object.values(courses).some(course =>
    course.students.some(student =>
      student.name.toLowerCase() === firstName.toLowerCase() &&
      student.surname.toLowerCase() === lastName.toLowerCase() &&
      student.id !== id
    )
  );

  if (studentExistsInOtherCourses) {
    return alert(`A student with the name "${fullName}" already exists in another course with a different ID.`);
  }

  // Check if the ID is used by any other student across all courses
  const idExists = Object.values(courses).some(course =>
    course.students.some(student => student.id === id)
  );

  if (idExists) {
    return alert(`The ID "${id}" is already used by another student. Please use a unique ID.`);
  }

  // Calculate grade
  const grade = calculateGrade(midterm, final, courses[currentCourse].scaleType);
  students.push({ id, name: firstName, surname: lastName, midterm, final, grade });

  renderStudentsTable();

  // Clear the form
  document.querySelectorAll('#student-id, #student-name, #student-surname, #midterm-score, #final-score')
    .forEach(input => input.value = '');

  alert('Student added successfully!');
});

// Calculate Grade
function calculateGrade(midterm, final, scaleType) {
  const total = (0.4 * midterm) + (0.6 * final);
  if (scaleType === '10') {
    if (total >= 90) return 'A';
    if (total >= 80) return 'B';
    if (total >= 70) return 'C';
    if (total >= 60) return 'D';
    return 'F';
  } else {
    if (total >= 93) return 'A';
    if (total >= 85) return 'B';
    if (total >= 77) return 'C';
    if (total >= 70) return 'D';
    return 'F';
  }
}

// Render Students Table
function renderStudentsTable() {
  const tbody = document.querySelector('#students-table');
  tbody.innerHTML = '';

  if (!currentCourse) return;

  courses[currentCourse].students.forEach(student => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.surname}</td>
      <td>${student.midterm}</td>
      <td>${student.final}</td>
      <td>${student.grade}</td>
      <td>
        <button onclick="deleteStudent('${student.id}')">Delete</button>
        <button onclick="updateStudent('${student.id}')">Update</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Delete Student
function deleteStudent(id) {
  courses[currentCourse].students = courses[currentCourse].students.filter(student => student.id !== id);
  renderStudentsTable();
}

// Formu Sıfırlayan Fonksiyon
function resetForm() {
  document.querySelector('#student-id').value = '';
  document.querySelector('#student-name').value = '';
  document.querySelector('#student-surname').value = '';
  document.querySelector('#midterm-score').value = '';
  document.querySelector('#final-score').value = '';
  document.querySelector('#student-id').disabled = false;
}

// Track whether the search results are currently visible
let isSearchResultsVisible = false;

// Search Function
document.querySelector('#search-btn').addEventListener('click', () => {
  const searchBtn = document.querySelector('#search-btn');
  const resultsContainer = document.querySelector('#search-results');

  if (isSearchResultsVisible) {
    // If search results are visible, hide them and reset the button
    resultsContainer.innerHTML = '';
    searchBtn.textContent = 'Search';
    isSearchResultsVisible = false;
    return;
  }

  const query = document.querySelector('#search-query').value.trim().toLowerCase();

  if (!query) {
    resultsContainer.textContent = 'Please enter a student name or ID.';
    return;
  }

  const groupedResults = {};

  // Search through all courses
  Object.entries(courses).forEach(([courseName, course]) => {
    course.students.forEach(student => {
      const fullName = `${student.name.toLowerCase()} ${student.surname.toLowerCase()}`;
      const studentId = student.id.toLowerCase();

      if (fullName.includes(query) || studentId.includes(query)) {
        const studentKey = `${student.id}-${student.name} ${student.surname}`;
        if (!groupedResults[studentKey]) {
          groupedResults[studentKey] = {
            name: `${student.name} ${student.surname}`,
            id: student.id,
            courses: [],
          };
        }
        groupedResults[studentKey].courses.push({
          courseName,
          midterm: student.midterm,
          final: student.final,
          grade: student.grade,
        });
      }
    });
  });

  resultsContainer.innerHTML = '';

  Object.values(groupedResults).forEach(student => {
    const studentHTML = `
      <div style="margin-bottom: 1rem;">
        <strong>Name:</strong> ${student.name}<br>
        <strong>ID:</strong> ${student.id}<br>
        ${student.courses
          .map(
            course => `
          <div style="margin-left: 1rem;">
            <strong>Course:</strong> ${course.courseName}<br>
            <strong>Midterm:</strong> ${course.midterm}, <strong>Final:</strong> ${course.final}, <strong>Grade:</strong> ${course.grade}
          </div>
        `
          )
          .join('')}
      </div>
    `;
    resultsContainer.innerHTML += studentHTML;
  });

  if (!Object.keys(groupedResults).length) {
    resultsContainer.textContent = 'No results found.';
  } else {
    // If results are found, update the button to allow closing the results
    searchBtn.textContent = 'Close Search Results';
    isSearchResultsVisible = true;
  }
});


// Track whether the student list is currently visible
let isStudentListVisible = false;

// Show All Students Button
document.querySelector('#show-all-students-btn').addEventListener('click', () => {
  const resultsContainer = document.querySelector('#all-students-results');
  const showAllStudentsBtn = document.querySelector('#show-all-students-btn');

  if (isStudentListVisible) {
    // If the list is currently visible, hide it and update the button text
    resultsContainer.innerHTML = '';
    showAllStudentsBtn.textContent = 'Show All Students';
    isStudentListVisible = false;
  } else {
    // If the list is currently hidden, show it and update the button text
    const groupedStudents = {};

    // Group students across all courses
    Object.entries(courses).forEach(([courseName, course]) => {
      course.students.forEach(student => {
        const studentKey = `${student.id}-${student.name} ${student.surname}`;
        if (!groupedStudents[studentKey]) {
          groupedStudents[studentKey] = {
            name: `${student.name} ${student.surname}`,
            id: student.id,
            courses: [],
          };
        }
        groupedStudents[studentKey].courses.push({
          courseName,
          midterm: student.midterm,
          final: student.final,
          grade: student.grade,
        });
      });
    });

    // Display the results
    resultsContainer.innerHTML = '';
    Object.values(groupedStudents).forEach(student => {
      const studentHTML = `
        <div style="margin-bottom: 1rem;">
          <strong>Name:</strong> ${student.name}<br>
          <strong>ID:</strong> ${student.id}<br>
          ${student.courses
            .map(
              course => `
            <div style="margin-left: 1rem;">
              <strong>Course:</strong> ${course.courseName}<br>
              <strong>Midterm:</strong> ${course.midterm}, <strong>Final:</strong> ${course.final}, <strong>Grade:</strong> ${course.grade}
            </div>
          `
            )
            .join('')}
        </div>
      `;
      resultsContainer.innerHTML += studentHTML;
    });

    if (!Object.keys(groupedStudents).length) {
      resultsContainer.innerHTML = 'No students found.';
    }

    // Update button text and state
    showAllStudentsBtn.textContent = 'Close Students List';
    isStudentListVisible = true;
  }
});
