const cls = document.querySelector(".box");

let members = [];
let numls = [];
let MemberLock = [];
let MemberClick = [];
let historyData = []; // To store all historical arrangements

// Fisher-Yates Shuffle
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    if (MemberLock[array[i]] === true || MemberLock[array[j]] === true) {
      // Skip swapping if either element is locked
    } else {
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  return array;
};

const htmlrender = () => {
  const Si = [
    members.slice(0, 5).map((name) => members.indexOf(name)),
    members.slice(5, 11).map((name) => members.indexOf(name)),
    members.slice(11, 17).map((name) => members.indexOf(name)),
    members.slice(17, 22).map((name) => members.indexOf(name)),
    members.slice(22, 27).map((name) => members.indexOf(name)),
  ].map((row) => row.map((originalIndex) => numls.indexOf(originalIndex)));

  cls.innerHTML =
    '<div class="table"><h2>2-6반(교탁)</h2></div><div class = "students"></div>';
  const studentList = document.querySelector(".students");
  studentList.innerHTML = ""; // Clear existing students

  const studentPositions = numls.map((studentIndex, positionIndex) => ({
    studentIndex,
    positionIndex,
  }));

  let currentPosition = 0;
  const grid = [5, 6, 6, 5, 5];
  for (let i = 0; i < grid.length; i++) {
    let str = "";
    for (let j = 0; j < grid[i]; j++) {
      const student = studentPositions.find(
        (s) => s.positionIndex === currentPosition
      );
      if (student) {
        const studentName = members[student.studentIndex];
        str += `
          <div class="b${studentName}" lock="${
          MemberLock[student.studentIndex]
        }">
            <button type="button" onclick="clickname('${studentName}')">${studentName}</button>
          </div>`;
      }
      currentPosition++;
    }
    studentList.innerHTML += `<div class="line${i + 1}">${str}</div>`;
  }
};

const renderHistory = () => {
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";
  historyData.forEach((history, index) => {
    const radioId = `history-${index}`;
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "history";
    radio.id = radioId;
    radio.value = index;
    if (index === historyData.length - 1) {
      radio.checked = true;
    }

    const label = document.createElement("label");
    label.htmlFor = radioId;
    label.textContent = `기록 ${index + 1}`;

    historyList.appendChild(radio);
    historyList.appendChild(label);
    historyList.appendChild(document.createElement("br"));
  });
};

window.onload = function () {
  fetch("/load")
    .then((res) => res.json())
    .then((data) => {
      if (data.members) {
        members = data.members;
      }

      if (data.last && data.last.length > 0) {
        historyData = data.last;
        numls = historyData[historyData.length - 1].slice(); // Use a copy
      } else {
        // Initialize numls if no history
        numls = Array.from({ length: members.length }, (_, i) => i);
      }

      MemberClick = new Array(members.length).fill(false);
      MemberLock = new Array(members.length).fill(false);

      renderHistory();
      htmlrender();
    });
};

const clickname = (name) => {
  let MemberNumber = members.indexOf(name);
  const target = MemberClick.indexOf(true);

  if (MemberClick[MemberNumber] === false) {
    MemberClick[MemberNumber] = true;
    const myDiv = document.querySelector(`.b${name}`);
    myDiv.style.backgroundColor = "blue";
  } else {
    MemberClick[MemberNumber] = false;
    // Optional: Reset background color on deselect
    htmlrender();
  }

  if (target !== -1) {
    if (MemberNumber === target) {
      // Clicked the same name twice
      MemberLock[MemberNumber] = !MemberLock[MemberNumber];
    } else {
      // Swapping two different students
      if (MemberLock[MemberNumber] === true || MemberLock[target] === true) {
        alert("고정된 이름입니다.");
      } else {
        const idx1 = numls.indexOf(MemberNumber);
        const idx2 = numls.indexOf(target);
        if (idx1 !== -1 && idx2 !== -1) {
          [numls[idx1], numls[idx2]] = [numls[idx2], numls[idx1]];
        }
      }
    }
    MemberClick.fill(false);
    htmlrender();
  }
};

// --- New Shuffle Logic ---

const gridStructure = [5, 6, 6, 5, 5];
const getPosition = (indexInNumls) => {
  let row = 0;
  let cumulative = 0;
  for (let i = 0; i < gridStructure.length; i++) {
    if (indexInNumls < cumulative + gridStructure[i]) {
      const col = indexInNumls - cumulative;
      return { row, col };
    }
    cumulative += gridStructure[i];
  }
  return null;
};

const areNeighbors = (studentIdx1, studentIdx2, arrangement) => {
  const index1 = arrangement.indexOf(studentIdx1);
  const index2 = arrangement.indexOf(studentIdx2);
  if (index1 === -1 || index2 === -1) return false;

  const pos1 = getPosition(index1);
  const pos2 = getPosition(index2);
  if (!pos1 || !pos2) return false;

  // Horizontal neighbors
  if (pos1.row === pos2.row && Math.abs(pos1.col - pos2.col) === 1) return true;
  // Vertical & Diagonal neighbors
  if (Math.abs(pos1.row - pos2.row) === 1 && Math.abs(pos1.col - pos2.col) <= 1)
    return true;

  return false;
};

const hasDuplicateNeighbors = (newArrangement, oldArrangement) => {
  for (let i = 0; i < newArrangement.length; i++) {
    for (let j = i + 1; j < newArrangement.length; j++) {
      const student1 = newArrangement[i];
      const student2 = newArrangement[j];
      if (
        areNeighbors(student1, student2, newArrangement) &&
        areNeighbors(student1, student2, oldArrangement)
      ) {
        return true;
      }
    }
  }
  return false;
};

function mixVer2() {
  const preventDuplicates =
    document.getElementById("prevent-duplicates").checked;
  const previousArrangement =
    historyData.length > 0 ? historyData[historyData.length - 1] : null;

  let attempts = 0;
  const maxAttempts = 50;

  let newArrangement;
  do {
    newArrangement = shuffleArray([...numls]);
    attempts++;
    if (attempts > maxAttempts) {
      console.warn(
        "Could not find a better arrangement after " +
          maxAttempts +
          " attempts."
      );
      break;
    }
  } while (
    preventDuplicates &&
    previousArrangement &&
    hasDuplicateNeighbors(newArrangement, previousArrangement)
  );

  numls = newArrangement;
  htmlrender();
}

function saveToServer() {
  fetch("/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ last: numls }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert("자리 저장 완료!");
      // Reload data to update history
      window.location.reload();
    });
}

function loadSelectedHistory() {
  const selectedIndex = document.querySelector(
    'input[name="history"]:checked'
  ).value;
  if (selectedIndex !== null) {
    numls = historyData[selectedIndex].slice(); // use a copy
    MemberClick.fill(false);
    MemberLock.fill(false); // Reset locks when loading history
    htmlrender();
  }
}
