$( document ).ready(function() {
    	var restaurantLocations = [];
    	var thingToDoLocations = [];
    	initialize_gmaps();
    	var Day = function(){
    		this.hotelExists = false;
    		this.currMarkerId = 0;
    		this.markersArray = [];
    		this.lastHotelId= null;
    		this.bounds = new google.maps.LatLngBounds();
    	};

        /*
        var Marker = {

        }
        this.position = new google.maps.LatLng(location[0], location[1]);
          this.map = map;
          this.id = markerId
          this.name = locationName;
          this.type = typeStr;
         */

    	var daysArray = [];
    	var currDay = 0;
    	var prevDay;
    	var map;
    	var count = [0];

      $.ajax({
        type: "GET",
        url:'/days',
        success: function(days){
          console.log("hello",days.length);
          if (days.length === 0){
            daysArray = [new Day()];
            $('.day-buttons').append('<button class="btn btn-circle day-btn current-day">1</button>');
            $('.day-buttons').append('<button class="btn btn-circle day-btn btn-plus">+</button>');
            //if there are no days, create new day
            $.ajax({
                type: "POST",
                url: '/days/0',
                success: function(days){
                  console.log(days);
                },
                error: function(error){
                  console.log(error);
                }
            });
          }else{
            var thisDay = 0;
            days.forEach(function(day){
              daysArray.push(new Day());
              console.log(day);
              var hotel = day[0];
              var restaraunts= day[1];
              var things = day[2];
              if (hotel){
                drawLocation(hotel.place[0].location, {icon: '/images/lodging_0star.png'}, hotel.name, '#hotel-list', thisDay, hotel._id);
              }
              restaraunts.forEach(function(rest){
                  drawLocation(rest.place[0].location, {icon: '/images/restaurant.png'}, rest.name, '#restaurant-list', thisDay, rest._id);
              });
              things.forEach(function(thing){
                  drawLocation(thing.place[0].location, {icon: '/images/star-3.png'}, thing.name, '#things-list', thisDay, thing._id);
              });
              removeDay(thisDay);
              console.log("runin");
              $('.day-buttons').append('<button class="btn btn-circle day-btn">'+(thisDay+1)+'</button>');
              thisDay++;
            });
            $('.day-buttons').append('<button class="btn btn-circle day-btn btn-plus">+</button>');
            $('.day-buttons').children().first().addClass('current-day');

            //render buttons for each day

            }

            renderDay(0);

        },
        error: function(err){
          console.log(err);
        }
      });

    	//when document loads we need to set up map to Day 1

    $('.selection-panel').on('click','button',function(){


    	var $button = $(this);
    	//on click events adding information to the day array.

    	//finding option next to add button
    	var $selected = $button.siblings('select').find('option:selected');
      var selectedVal =  $selected.val();
      console.log("SV", selectedVal);
    	//getting name of  category
    	typeName = $button.siblings('h4').text();

    	//getting list of items in category
    	var typeArray = getType(typeName);

		// getting name of establishment
    	var eName = $selected.text();

    	//get html id tag/ used checking type
    	var typeStr = typeArray[1];

    	//getting database object for establishment
    	var result =  $.grep(typeArray[0], function(e){
    		return e.name==eName;
    	});

    	//getting existing list of items
    	var $locationListElement = $(typeStr).children('.list-group');

    	//special rules for hotel
    	if(typeStr[1]=='h' && daysArray[currDay].hotelExists){
    		//deletes marker
    		deleteMarker(daysArray[currDay].lastHotelId);
    		// updates list - replace existing
    		$locationListElement.find('span').text(eName);
    	}
    	else{
    		// adds new itinerary item at end of relevant list
	    	$locationListElement
	    	.append('<div class="itinerary-item"><span class="title">'
	    		+eName+'</span><button class="btn btn-xs btn-danger remove btn-circle">x</button></div>');
		}

		//************ GOOGLE MAPS MARKER DRAWING SECTION ************************
    	var locationArr = result[0].place[0].location;
    	if(typeStr[1]=='h'){
			daysArray[currDay].hotelExists = true;
      console.log("HERE, ", selectedVal);
			daysArray[currDay].lastHotelId = drawLocation(locationArr, {
	          icon: '/images/lodging_0star.png'
	        }, eName, typeStr, currDay, selectedVal);
	    }
		else if(typeStr[1]=='r'){
			drawLocation(locationArr, {
	        	icon: '/images/restaurant.png'
	      	},eName, typeStr, currDay, selectedVal);
	    }
		else if(typeStr[1]=='t'){
			drawLocation(locationArr, {
            	icon: '/images/star-3.png'
          	},eName, typeStr, currDay, selectedVal);

		}



    });

	$('.itinerary-panel').on('click','button',function(){
		// RED X MARKER DELETE BUTTON FOR ITINERARY PANEL
		var $button = $(this);
		var placeName = $button.siblings('span').text();

		var markerToRemove = getMarker(daysArray[currDay].markersArray, placeName);

    console.log("!")
    $.ajax({
      type: 'DELETE',
      url: '/days/marker',
      data: {day: currDay, name: placeName, type: markerToRemove.type, foreignKey: markerToRemove.foreignId},
      success: function(data){
        console.log(data);
      },
      error: function(data){
        console.log(data);
      }

    });

		if(markerToRemove.type[1] =='h'){
			daysArray[currDay].hotelExists =false;
		}
		deleteMarker(markerToRemove.id);
		$button.parent().remove();
	});

	$('.day-buttons').on('click','button',function(){
		var $button= $(this);
		// find out which day/and what was the last day




		//how many days to we have?
		var numOfDays = $('.day-buttons').children().length-1;

		//if we clicked a plus button- add a new day button/day array/id count
		if($button.text() =='+'){
			$button.prev().after('<button class="btn btn-circle day-btn">'+(numOfDays+1)+'</button>');
			daysArray[numOfDays] = new Day();
      console.log("days" + numOfDays);
      $.ajax({
        type: "POST",
        url: '/days/'+numOfDays,
        success: function(days){
          console.log(days);
        },
        error: function(error){
          console.log(error);
        }
      });

		}
		else{
			//switching a day
			prevDay = currDay;
			currDay =  parseInt($button.text())-1;

			//change the title of the day to reflect current day
			$('#day-title').find('span').text("Day "+(currDay+1));
			// changes the active 'current day' button
			$button.siblings().removeClass('current-day');
			$button.addClass('current-day');
			removeDay(prevDay);
			renderDay(currDay);

		}


	});

	//remove  current day and adjust information
		$('#day-title').on('click','button',function(){
			//num of days counts buttons including 'plus', remove another
			// for index
			var numOfDays = $('.day-buttons').children().length-2;

			removeDay(currDay);
			daysArray.splice(currDay,1);
			if(currDay==numOfDays) currDay--;
			renderDay(currDay);

			$('.day-buttons').find('.btn-plus').prev().remove();


		});

	var removeDay = function(day){
		//removes all itinerary items from current day from dom
		$('.itinerary-item').remove();

    $.ajax({
      type:"DELETE",
      url:"/days/"+currDay,
      success: function(data){
        console.log("hooray");
      }
    });

		//hide previous days markers
		var markersToRemove = daysArray[day].markersArray;
		markersToRemove.forEach(function(marker){
			marker.setVisible(false);

		});




	};

	var renderDay = function(day){

		//show curr days markers
		//debugger;
    if(daysArray.length>0){
      
   
  		var currMarkers = daysArray[day].markersArray;

  		currMarkers.forEach(function(marker){
  			marker.setVisible(true);
  			var typeStr = marker.type;
  			var locationName = marker.name;
  			var $locationListElement = $(typeStr).children('.list-group').last();
  			$locationListElement
  		    	.append('<div class="itinerary-item"><span class="title">'+locationName+'</span><button class="btn btn-xs btn-danger remove btn-circle">x</button></div>');
  			});

     }

	};
	/*********** GOOGLE MAPS API FUNCTIONS ******************/

	 //draws and creates marker
     function drawLocation (location, opts, locationName, typeStr, currDay, foreignId) {

          if (typeof opts !== 'object') opts = {};
          opts.position = new google.maps.LatLng(location[0], location[1]);
          opts.map = map;

          opts.id = daysArray[currDay].currMarkerId++;
          opts.name = locationName;
          opts.type = typeStr;
          opts.foreignId = foreignId;
          var marker = new google.maps.Marker(opts);

          daysArray[currDay].markersArray[opts.id] = marker;
          daysArray[currDay].bounds.extend(marker.position);
          map.fitBounds(daysArray[currDay].bounds);
          //markers[opts.id]= marker;
          //
            console.log("FI", foreignId);
            console.log('currDay',currDay);
          $.ajax({
            type: 'PUT',
            url: 'days/' + currDay,
            data: {'typeStr': typeStr.substring(1), key: foreignId},
            success: function(success){
                console.log("Success ", success);
              },
            error: function(error){
              console.log("Error ", error);
            }
          });
          return marker.id;

      }


      var deleteMarker = function(id){
          var marker = daysArray[currDay].markersArray[id];
          marker.setVisible(false);
          marker.setMap(null);
          daysArray[currDay].markersArray.splice(id,1);
      	  narrowBounds();

      };

      var narrowBounds = function(){
      	//debugger;
      	var day = daysArray[currDay];
      	temp = new google.maps.LatLngBounds();

      	day.markersArray.forEach(function(marker){
      		if(marker.visible){
      			var position = marker.position;
      			temp.extend(position);

      		}

      	});
      	if(!temp.isEmpty()){
      		day.bounds = temp;
      		map.fitBounds(day.bounds);
		}

      };

     function initialize_gmaps() {

        // initialize new google maps LatLng object
        var myLatlng = new google.maps.LatLng(40.705189,-74.009209);
        // set the map options hash
        var mapOptions = {
          center: myLatlng,
          zoom: 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: styleArr
        };
        // get the maps div's HTML obj
        var map_canvas_obj = document.getElementById("map-canvas");
        // initialize a new Google Map with the options
        map = new google.maps.Map(map_canvas_obj, mapOptions);

      }


      var styleArr = [
        {
          'featureType': 'landscape',
          'stylers': [
            { 'saturation': -100 },
            { 'lightness': 60 }
          ]
        },
        {
          'featureType': 'road.local',
          'stylers': [
            { 'saturation': -100 },
            { 'lightness': 40 },
            { 'visibility': 'on' }
          ]
        },
        {
          'featureType': 'transit',
          'stylers': [
            { 'saturation': -100 },
            { 'visibility': 'simplified' }
          ]
        },
        {
          'featureType': 'administrative.province',
          'stylers': [
            { 'visibility': 'off' }
          ]
        },
        {
          'featureType': 'water',
          'stylers': [
            { 'visibility': 'on' },
            { 'lightness': 30 }
          ]
        },
        {
          'featureType': 'road.highway',
          'elementType': 'geometry.fill',
          'stylers': [
            { 'color': '#ef8c25' },
            { 'lightness': 40 }
          ]
        },
        {
          'featureType': 'road.highway',
          'elementType': 'geometry.stroke',
          'stylers': [
            { 'visibility': 'off' }
          ]
        },
        {
          'featureType': 'poi.park',
          'elementType': 'geometry.fill',
          'stylers': [
              { 'color': '#b6c54c' },
              { 'lightness': 40 },
              { 'saturation': -40 }
          ]
        }
      ];
});




//function that searches thingstodo
//
var getType = function(typeName){

	if(typeName == 'Hotels'){
		return [all_hotels,'#hotel-list'];
	}
	else if(typeName =='Restaurants'){
		return [all_restaurants,'#restaurant-list'];
	}
	else if(typeName== 'Things To Do'){
		return [all_things_to_do,'#things-list'];
	}
};

var getMarker = function(markers, eName){
	return $.grep(markers, function(marker){
    		return marker.name==eName;
    	})[0];
};
