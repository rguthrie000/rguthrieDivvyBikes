// get most recent 7 days of workout data from back-end

  stats(); async function stats() {
    let data = await API.getWorkoutsInRange();
    populateChart(data);
  }

  function generatePalette() {
    const arr = [
    "#003f5c",
    "#2f4b7c",
    "#665191",
    "#a05195",
    "#d45087",
    "#f95d6a",
    "#ff7c43",
    "ffa600",
    "#003f5c",
    "#2f4b7c",
    "#665191",
    "#a05195",
    "#d45087",
    "#f95d6a",
    "#ff7c43",
    "ffa600"
  ]
  return arr;
  }

let durationsWorkouts  = [];
let poundsWorkouts     = [];
let exerciseNames      = [];
let durationsExercises = [];
let resistanceNames    = [];
let poundsExercises    = [];

function populateChart(data) {
  // Accumulate By Day
  durationsWorkouts  = durationByDay(data);
  poundsWorkouts     = calculateTotalWeightByDay(data);

  // Accumulate By Exercise

  // all exercises have durations
  exerciseNames      = exerciseNamesByEx(data);
  durationsExercises = durationsByEx(data);
  consolidateDurations();

  // only resistance exercises have weights
  resistanceNames    = resistanceNamesByEx(data);
  poundsExercises    = calculateTotalWeightByEx(data);
  consolidateWeights();

  // let's graph!
  const colors = generatePalette();
  let line = document.querySelector("#canvas").getContext("2d");
  let bar = document.querySelector("#canvas2").getContext("2d");
  let pie = document.querySelector("#canvas3").getContext("2d");
  let pie2 = document.querySelector("#canvas4").getContext("2d");

  let lineChartObj = {
    type: "line",
    data: {
      labels: [
        (data[0].day.split("T"))[0],
        (data[1].day.split("T"))[0],
        (data[2].day.split("T"))[0],
        (data[3].day.split("T"))[0],
        (data[4].day.split("T"))[0],
        (data[5].day.split("T"))[0],
        (data[6].day.split("T"))[0]
      ],
      datasets: [
        {
          label: "Workout Duration In Minutes",
          backgroundColor: "red",
          borderColor: "red",
          data: durationsWorkouts,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      title: {
        display: true
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true
            }
          }
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true
            }
          }
        ]
      }
    }
  };
  
  let lineChart = new Chart(line, lineChartObj);

  let barChartObj = {

    type: "bar",
    data: {
      labels: [
        (data[0].day.split("T"))[0],
        (data[1].day.split("T"))[0],
        (data[2].day.split("T"))[0],
        (data[3].day.split("T"))[0],
        (data[4].day.split("T"))[0],
        (data[5].day.split("T"))[0],
        (data[6].day.split("T"))[0]
      ],
      datasets: [
        {
          label: "Pounds",
          data: poundsWorkouts,
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)"
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)"
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Weight Lifted"
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    }
  };

  let barChart = new Chart(bar, barChartObj);

  let pieChart = new Chart(pie, {
    type: "pie",
    data: {
      labels: exerciseNames,
      datasets: [
        {
          label: "Exercises Performed",
          backgroundColor: colors,
          data: durationsExercises
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Exercises Performed - durations"
      }
    }
  });

  let donutChart = new Chart(pie2, {
    type: "doughnut",
    data: {
      labels: resistanceNames,
      datasets: [
        {
          label: "Exercises Performed",
          backgroundColor: colors,
          data: poundsExercises
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: "Exercises Performed - weight (lbs)"
      }
    }
  });
}

function durationByDay(data) {
  let durations = [];

  data.forEach(workout => {
    durations.push(workout.exercises.reduce( (acc, curr) => acc += curr.duration, 0));
  });

  return durations;
}

function calculateTotalWeightByDay(data) {
  let total = [];

  data.forEach(workout => {
    total.push(workout.exercises.reduce( (acc, exercise) => 
        acc += parseInt(exercise.weight)*parseInt(exercise.reps)*parseInt(exercise.sets), 0));
  });

  return total;
}

// durations functions - names and values
function exerciseNamesByEx(data) {
  let actions = [];

  data.forEach( (workout) => {
    workout.exercises.forEach( (exercise) => actions.push(exercise.name));
  });
  
  return actions;
}

function durationsByEx(data) {
  let durations = [];

  data.forEach(workout => {
    workout.exercises.forEach( (exercise) => 
      durations.push(exercise.duration));
  });

  return durations;
}

function consolidateDurations() {  
  for (let i = 0; i < exerciseNames.length-1; i++) {
    for (let j = i+1; j < exerciseNames.length; j++) {
      if (exerciseNames[i] == exerciseNames[j]) {
        durationsExercises[i] += durationsExercises[j];
        exerciseNames.splice(j,1);
        durationsExercises.splice(j,1);
      }
    }
  }
}

// weights functions - names and values
function calculateTotalWeightByEx(data) {
  let total = [];

  data.forEach(workout => {
    workout.exercises.forEach( (exercise) => {
      if (exercise.type.toLowerCase() == "resistance") {
        total.push(parseInt(exercise.weight)*parseInt(exercise.reps)*parseInt(exercise.sets));
      };
    });  
  });

  return total;
}

function resistanceNamesByEx(data) {
  let actions = [];

  data.forEach( (workout) => {
    workout.exercises.forEach( (exercise) => {
      if (exercise.type.toLowerCase() == "resistance") {
        actions.push(exercise.name);
      }
    });
  });
  
  return actions;
}

function consolidateWeights() {  
  for (let i = 0; i < resistanceNames.length-1; i++) {
    for (let j = i+1; j < resistanceNames.length; j++) {
      if (resistanceNames[i] == resistanceNames[j]) {
        poundsExercises[i] += poundsExercises[j];
        resistanceNames.splice(j,1);
        poundsExercises.splice(j,1);
      }
    }
  }
}

