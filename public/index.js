
var markerList = [];
var map;
var directionsDisplay = null;
var directionsService;
var polylinePath;
var nodes = [];
var prevNodes = [];
var markers = [];
var durations = [];
var order = [];
var atractionlist = [];
var addresslist = [];
var startPoint; //=[];
var start_to_atractionnodelist = [];
var choosestart = true;
var travel_mode = 'DRIVING';
var dict = {};
var geocode_status = 'NOT OK';
var place_atraction;
var travel_size=true;



function initMap() {
  //Map options
  var options = {
    zoom: 15,
    center: { lat: 47.8409, lng: 25.9138 }
  }
  //New map
  var map = new google.maps.Map(document.getElementById('map'), options);
  //  Initialize the GeoCoder API
  var geocoder = new google.maps.Geocoder();
  var directionsService = new google.maps.DirectionsService();
  // Create a DirectionsRenderer object which we will use to display the route
  var directionsDisplay = new google.maps.DirectionsRenderer();
  // Bind the DirectionsRenderer to the map
  directionsDisplay.setMap(map);
  //travel_size=true;

  function MakeMatrixOfDurations(callback) {
     if(travel_size==true)
     {
       nodes.push(startPoint);
       console.log(nodes.length);
       travel_size=false;
       console.log("intra");
     }
     console.log("travel-size "+ travel_size)
    // nodes.push(startPoint);
    console.log(nodes.length);
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: nodes,
      destinations: nodes,
      travelMode: travel_mode
    }, function (response) {
      // Create duration data array
      var distance_data;
      console.log(response);
      for (source in response.rows) {
        console.log(response.rows);
        distance_data = response.rows[source].elements;
        durations[source] = [];
        for (destination in distance_data) {
          if (durations[source][destination] = distance_data[destination].duration == undefined) {
            //alert('Nu se poate realiza ruta');
            popup("Nu se poate realiza ruta");
            return;
          }
          durations[source][destination] = distance_data[destination].duration.value;
        }
      }
      if (callback != undefined) {
        callback();
      }
    });
  }
  

   document.getElementById('atraction-list').innerHTML += `<div class="mySlides"> <img class="img_dest" src="images/no_image1.png" style="width:100%"></div>`;
   document.getElementById("thumb-images").innerHTML = "";
   document.getElementById("caption").innerHTML = "";
   showSlides(1);
  // Removes markers and temporary paths
  function clearMapMarkers() {
    for (index in atractionlist) {
      atractionlist[index].setMap(null);
    }
    // nodes = [];
    if (polylinePath != undefined) {
      polylinePath.setMap(null);
    }
    atractionlist = [];

  }

  // Removes map directions
  function clearDirections() {
    // If there are directions being shown, clear them
    if (directionsDisplay != null) {
      directionsDisplay.setMap(null);
      directionsDisplay = null;
    }
  }
  // Completely clears map
  function clearMap() {
    clearMapMarkers();
    clearDirections();
    $('#status').html('&nbsp;');
    $('#best-time').html('&nbsp;');
  }

  document.getElementById("walking-btn").addEventListener("click", () => {
    travel_mode = 'WALKING';
    document.getElementById('walking-btn').style.backgroundColor = '#7D82B8';
    document.getElementById('driving-btn').style.backgroundColor = 'white';
  });
  document.getElementById("driving-btn").addEventListener("click", () => {
    travel_mode = 'DRIVING';
    document.getElementById('driving-btn').style.backgroundColor = '#7D82B8';
    document.getElementById('walking-btn').style.backgroundColor = 'white';
  });

  function onlyLetters(str) {
    return /^[A-Za-z\s]*$/.test(str);
  }

  document.getElementById("submit-btn").addEventListener("click", () => {
    startPoint = null;
    choosestart = true;
    atractionlist = [];
    nodes = [];
    clearMapMarkers();
    let x = document.getElementById("address").value;
    clearMap();
    if (onlyLetters(x)) {
      geocodeAddress(geocoder, map);
      var _status = "";
      let f = () => {
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            _status = JSON.parse(this.responseText);
           // console.log("status" + _status);
            document.getElementById('atraction-list').innerHTML = "";
            document.getElementById("thumb-images").innerHTML = "";
            if (_status.status == "ok") {
              let i = 0;
              dict = _status.data;
              var x = 1 / Object.keys(dict).length;
              for (key in dict) {
                document.getElementById('atraction-list').innerHTML += `<div class="mySlides"> <div class="numbertext">${i + 1} / ${Object.keys(dict).length}</div>  <img class="img_dest" src="${dict[key][1]}"" style="width:100%">  <input type="checkbox" class="checkbox" id="check1" value="${key}" />
             </div>`;
                document.getElementById("thumb-images").innerHTML += `<div class="column" style="width:${1 / Object.keys(dict).length * 100}%">  <img class="demo cursor" src="${dict[key][1]}" style="width:100%" onclick="currentSlide(${i + 1})" alt="${key}"> </div> `;
                i++;
              }
              showSlides(1);
            }
            else {

              document.getElementById('atraction-list').innerHTML += `<div class="mySlides"> <img class="img_dest" src="images/no_image1.png" style="width:100%"></div>`;
              document.getElementById("thumb-images").innerHTML = "";
              document.getElementById("caption").innerHTML = "";
              showSlides(1);
              setTimeout(f, 1000);
            }
          }
        }
        xhttp.open("GET", "/check_city?x=" + x);
        xhttp.send();
      };
      f();
    }
    else {
      popup("The city needs to be only of letters");
    }
  });

  google.maps.event.addListener(map, 'click', function (event) {
    if (choosestart == true) {
      marker = new google.maps.Marker({
        position: event.latLng,
        map: map,
        icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }
      });
      atractionlist.push(marker);
      startPoint = event.latLng;
      choosestart = false;
    }
    else {
    
      marker = new google.maps.Marker({ position: event.latLng, map: map });
      atractionlist.push(marker);
      nodes.push(event.latLng);
     
  } 
  });

  document.getElementById("points").addEventListener("click", () => {
    var list = getValue();
    geocodeAtractions(geocoder, map, list);

  });

  document.getElementById("delete").addEventListener("click", () => {
    startPoint = null;
    choosestart = true;
    nodes= [];
    clearMap();
  });


  document.getElementById("find-route").addEventListener("click", () => {
   
    console.log("nodes: "+ nodes.length);
  
    if (!startPoint) {
    
      popup('You did not choose the start point');
      return;
    }
    if (nodes.length > 9) {
      popup('Too many atractions, the maximum is 9');
      return;
    }
    if (nodes.length < 3) {
        popup("Few atractions, the minimum is 3");
        return;
      }

    if (directionsDisplay != null) {
      directionsDisplay.setMap(null);
      directionsDisplay = null;
    }

    MakeMatrixOfDurations(function () {
      ga.getConfig();
      var pop = new ga.population();
      pop.initialize(nodes.length-1 );//-1
      var route = pop.getFittest().chromosome;
      console.log("route: " + route);

      ga.evolvePopulation(pop, function (update) {
        $('#status').html("Waiting");
        $('#best-time').html('&nbsp;');

        // Get route coordinates
        var route = update.population.getFittest().chromosome;
        var routeCoordinates = [];
        for (index in route) {
          routeCoordinates[index] = nodes[route[index]];
        }
        routeCoordinates[route.length] = nodes[route[0]];
        // Display temp. route
        if (polylinePath != undefined) {
          polylinePath.setMap(null);
        }
        polylinePath = new google.maps.Polyline({
          path: routeCoordinates,
          strokeColor: "#0066ff",
          strokeOpacity: 0.75,
          strokeWeight: 2,
        });
        polylinePath.setMap(map);
      }, function (result) {
        // Get route
        route = result.population.getFittest().chromosome;
        // Add route to map
        directionsService = new google.maps.DirectionsService();
        directionsDisplay = new google.maps.DirectionsRenderer();
        directionsDisplay.setMap(map);
        var waypts = [];
        for (var i = 0; i < route.length; i++) {
          waypts.push({
            location: nodes[route[i]],
            stopover: true
          });
        }

        // Add final route to map
        var request = {
          origin: startPoint,
          destination: startPoint,
          waypoints: waypts,
          travelMode: travel_mode
        };
        directionsService.route(request, function (response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            $('#status').html("Done");
            $('#best-time').html((result.population.getFittest().getDistance() / 60).toFixed(2) + ' minutes.');
          }
          clearMapMarkers();
        });
      });
    });
  });

  // GA code
  var ga = {

    "getConfig": function () {
      ga.crossoverRate = 0.7;
      ga.mutationRate = 0.2;
      ga.populationSize = 100;
      ga.elitism = true;
      ga.maxGenerations = 50 * (nodes.length - 1);
      ga.tournamentSize = 5;
      ga.tickerSpeed = 10;
    },

    // Evolves given population
    "evolvePopulation": function (population, generationCallBack, completeCallBack) {
      // Start evolution
      var generation = 1;

      var evolveInterval = setInterval(function () {
        if (generationCallBack != undefined) {
          generationCallBack({
            population: population,
            generation: generation,
          });
        }

        // Evolve population
        population = population.crossover();
        population.mutate();
        generation++;

        // If max generations passed
        if (generation > ga.maxGenerations) {
          // Stop looping
          clearInterval(evolveInterval);

          if (completeCallBack != undefined) {
            completeCallBack({
              population: population,
              generation: generation,
            });
          }
        }
      }, ga.tickerSpeed);
    },

    // Population class
    "population": function () {
      // Holds individuals of population
      this.individuals = [];
      // Initial population of random individuals with given chromosome length
      this.initialize = function (chromosomeLength) {
        this.individuals = [];
        for (var i = 0; i < ga.populationSize; i++) {
          var newIndividual = new ga.individual(chromosomeLength);
          newIndividual.initialize();
          this.individuals.push(newIndividual);
        }
      };

      // Mutates current population
      this.mutate = function () {
        var fittestIndex = this.getFittestIndex();

        for (index in this.individuals) {
          // Don't mutate if this is the elite individual and elitism is enabled 
          if (ga.elitism != true || index != fittestIndex) {
            this.individuals[index].mutate();
          }
        }
      };

      // Applies crossover to current population and returns population of offspring
      this.crossover = function () {
        // Create offspring population
        var newPopulation = new ga.population();

        // Find fittest individual
        var fittestIndex = this.getFittestIndex();
        console.log(this.individuals[fittestIndex].calcFitness() + ",");

        for (index in this.individuals) {
          // Add unchanged into next generation if this is the elite individual and elitism is enabled
          if (ga.elitism == true && index == fittestIndex) {
            // Replicate individual
            var eliteIndividual = new ga.individual(this.individuals[index].chromosomeLength);
            eliteIndividual.setChromosome(this.individuals[index].chromosome.slice());
            newPopulation.addIndividual(eliteIndividual);
          } else {
            // Select mate
            var parent = this.tournamentSelection();
            // Apply crossover
            this.individuals[index].crossover(parent, newPopulation);
          }
        }

        return newPopulation;
      };

      // Adds an individual to current population
      this.addIndividual = function (individual) {
        this.individuals.push(individual);
      };

      // Selects an individual with tournament selection
      this.tournamentSelection = function () {
        // Randomly order population
        for (var i = 0; i < this.individuals.length; i++) {
          var random_index = Math.floor(Math.random() * this.individuals.length);
          [this.individuals[random_index], this.individuals[i]] = [this.individuals[i], this.individuals[random_index]];
        }
        // Create tournament population and add individuals
        var tournamentPopulation = new ga.population();
        for (var i = 0; i < ga.tournamentSize; i++) {
          tournamentPopulation.addIndividual(this.individuals[i]);
        }
        return tournamentPopulation.getFittest();
      };

      // Return the fittest individual's population index
      this.getFittestIndex = function () {
        var fittestIndex = 0;

        // Loop over population looking for fittest
        for (var i = 1; i < this.individuals.length; i++) {
          if (this.individuals[i].calcFitness() > this.individuals[fittestIndex].calcFitness()) {
            fittestIndex = i;
          }
        }

        return fittestIndex;
      };

      // Return fittest individual
      this.getFittest = function () {
        return this.individuals[this.getFittestIndex()];
      };
    },

    // Individual class
    "individual": function (chromosomeLength) {
      this.chromosomeLength = chromosomeLength;
      this.fitness = null;
      this.chromosome = [];

      // Initialize random individual
      this.initialize = function () {
        this.chromosome = [];

        // Generate chromosome  [0,1....... n-1]
        for (var i = 0; i < this.chromosomeLength; i++) {
          this.chromosome.push(i);
        }
        // Shuffle the chromosome 
        for (var i = 0; i < this.chromosomeLength; i++) {
          var random_index = Math.floor(Math.random() * this.chromosomeLength);
          [this.chromosome[random_index], this.chromosome[i]] = [this.chromosome[i], this.chromosome[random_index]]
        }
      };

      // Set individual's chromosome
      this.setChromosome = function (chromosome) {
        this.chromosome = chromosome;
      };

      // Mutate individual
      this.mutate = function () {
        this.fitness = null;

        // Loop over chromosome making random changes
        for (index in this.chromosome) {
          if (ga.mutationRate > Math.random()) {
            var random_index = Math.floor(Math.random() * this.chromosomeLength);
            [this.chromosome[random_index], this.chromosome[index]] = [this.chromosome[index], this.chromosome[random_index]]
          }
        }
      };

      // Returns individuals route distance
      this.getDistance = function () {
        var totalDistance = 0;
        for (let i = 0; i < this.chromosome.length - 1; i++) {
          totalDistance += durations[this.chromosome[i]][this.chromosome[i + 1]];
        }
        totalDistance += durations[this.chromosome[0]][this.chromosome.length];
        totalDistance += durations[this.chromosome[(parseInt(nodes.length) - 2)]][this.chromosome.length];
        return totalDistance;
      };

      // Calculates individuals fitness value
      this.calcFitness = function () {
        if (this.fitness != null) {
          return this.fitness;
        }
        var totalDistance = this.getDistance();
        this.fitness = 1 / totalDistance;
        return this.fitness;
      };

      
      this.crossover = function (individual, offspringPopulation) {
        var offspringChromosome = [];

        // Add a random amount of this individual's genetic information to offspring
        var startPos = Math.floor(this.chromosome.length * Math.random());
        var endPos = Math.floor(this.chromosome.length * Math.random());
        if (startPos < endPos) [startPos, endPos] = [endPos, startPos];

        for (let i = startPos; i <= endPos; i++) {
          if (i == this.chromosomeLength) {
            offspringChromosome[i] = 0
          }
          else {
            offspringChromosome[i] = individual.chromosome[i]
          }
        }


        // Add any remaining genetic information from individual's mate
        for (parentIndex in individual.chromosome) {
          var node = individual.chromosome[parentIndex];

          var nodeFound = false;
          for (offspringIndex in offspringChromosome) {
            if (offspringChromosome[offspringIndex] == node) {
              nodeFound = true;
              break;
            }
          }

          if (nodeFound == false) {
            for (var offspringIndex = 0; offspringIndex < individual.chromosome.length; offspringIndex++) {
              if (offspringChromosome[offspringIndex] == undefined) {
                offspringChromosome[offspringIndex] = node;
                break;
              }
            }
          }
        }

        // Add chromosome to offspring and add offspring to population
        var offspring = new ga.individual(this.chromosomeLength);
        offspring.setChromosome(offspringChromosome);
        offspringPopulation.addIndividual(offspring);

      };
    },
  };
}

function popup(text) {
  document.getElementById('text-modal').innerText = text;
  var modal = document.getElementById("myModal");
  var span = document.getElementsByClassName("close")[0];
  modal.style.display = "block";
  // When the user clicks on <span> (x), close the modal
  span.onclick = function () {
    modal.style.display = "none";
  }
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
}
function geocodeAddress(geocoder, resultsMap) {
  const address = document.getElementById("address").value;
  // Search for the address with the API
  geocoder.geocode({ address: address }, (results, status) => {
    //send status
    // geocode_status=status;
    if (status == "OK") {
      // Set the location of the map obtained by the API
      resultsMap.setCenter(results[0].geometry.location);
    } else {
      popup("Geocode error, the place is not correct!");

    }
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/geocode_status?y=" + status, true);
    xhttp.send();
  });
}

function getValue() {
  var checkboxes = document.getElementsByClassName('checkbox');
  var result = [];
  for (var i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked) {
      result.push(dict[checkboxes[i].value]);
    }
  }
  return result;
}


function geocodeAtractions(geocoder, resultsMap, list) {
  const x = document.getElementById("address").value;
  var address_list = [];
  console.log("lista:" + list)
  for (let j = 0; j < list.length; j++) {
    address_list.push(list[j][0]);
  }
  for (i = 0; i < list.length; i++) {
    // Search for the address with the API
    var address = address_list[i];
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === "OK") {
        // Add the marker with the obtained location
        try{
        var a = JSON.parse(JSON.stringify(results[0].geometry.location.toJSON()));
        const latitude = a.lat;
        const longitude = a.lng;
        const myLatlng = { lat: latitude, lng: longitude };
        marker = new google.maps.Marker({
          map: resultsMap,
          position: results[0].geometry.location
        });
        atractionlist.push(marker);
        nodes.push(myLatlng);
      }
      catch{};
      } else {
        //alert("Geocode error: " + status);
        popup("Geocode error, the place is not correct!");
      }
    });
  }
}




