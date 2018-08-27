<template>
  <div id="home">
    <div id="nav">


      <nav class='navbar' role='navigation' aria-lael='main navigation'>
        <div class='navbar-brand'>
            <div class='navbar-item'>
                <img src="@/assets/logo.svg">
            </div>
        </div>

        <div class='navbar-start'>
            <autocomplete :items="stops" v-on:result="getTimes"/>

            <button>refresh</button>
            <button>set favourite</button>
            <button>remove favourite</button>


        </div>
      </nav>


      <div>
        <div class='dropdown'>
          <button>Favourites</button>
        </div>
      </div>




    </div>

    <div v-for="platform in departureTimes">
        <timetable :data="platform"/>

    </div>

  </div>
</template>



<script>
import Timetable from '@/components/Timetable.vue'
import axios from 'axios'
import Autocomplete from '@/components/Autocomplete.vue'

export default {
    data() {
        return {
            stops: [],
            favourites: [],
            lastUpdateTime: null,
            transportTypes: new Set([2, 8]),
            newStop: '',
            departureTimes: [],


        };
    },
    components: {
        Timetable,
        Autocomplete,
    },
    mounted() {
        console.log('mounting');
        var s = localStorage.getItem('stops')
        if (s) {
            this.stops = JSON.parse(s);
            console.log('from localStorage');
        }
        else {
            console.log('get stops fresh');
            this.getStopsFresh();
        }
        console.log('mounted');
        // console.log('transport types: ', this.transportTypes);
    },
    methods: {
        getStops: function () {
            console.log('get stops from local or server');

        },
        getStopsFresh: function () {
            axios.get('https://reisapi.ruter.no/Line/GetLinesRuterExtended?ruterOperatedOnly=true')
            .then((res) => {
                console.log(res);

                var allStops = res.data.filter(i => this.transportTypes.has(i['Transportation']));
                var foundStops = new Set();
                var newStops = [];
                for (var i = 0; i < allStops.length; i++) {
                    var x = allStops[i].Stops;
                    for (var j = 0; j < x.length; j++) {
                        var y = x[j];
                        if (!foundStops.has(y.Id)) {
                            newStops.push({'value': y.Id, 'label': y.Name});
                            foundStops.add(y.Id);
                }}}
                console.log(JSON.stringify(newStops));
                this.stops = newStops;
                localStorage.setItem('stops', JSON.stringify(newStops));

            }).catch((error) => {
                console.log('error: ', error);
            });
        },
        getTimes: function (result) {
            console.log('get time for selected stop', result.value, result.label);

            const path = 'https://reisapi.ruter.no/StopVisit/GetDepartures/' + result.value;
            console.log(path);
            axios.get(path)
            .then((response) => {
                console.log(response.data);
                console.log(JSON.stringify(response.data));
                this.formatData(response.data);
            })
        },
        formatData (data) {
            var platforms = [];
            const currentDate = new Date();
            for (var i = 0; i < data.length; i++) {
                var result = data[i];

                var departureTime = new Date(result.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime);
                var minsAway = Math.floor((departureTime - currentDate)/1000/60);

                if (minsAway <= 30) {

                    result.minsAway = minsAway;
                    var platform = result.MonitoredVehicleJourney.MonitoredCall.DeparturePlatformName;

                    var ind = platforms.findIndex(x => x.platform === platform);

                    if (ind >= 0) {
                        platforms[ind].results.push(result);
                    }
                    else {
                        platforms[platform] = [result]
                        platforms.push({
                            'platform': platform,
                            'results': [result],
                        });
                    }
                }
            }


            for (var i = 0; i < platforms.length; i++) {
                platforms[i].results.sort((a, b) => parseFloat(a.minsAway) - parseFloat(b.minsAway));
            }

            platforms.sort((a,b) => a.platform.localeCompare(b.platform))

            this.departureTimes = platforms;
            console.log('platforms: ');
            console.log(JSON.stringify(platforms[0]));

        },
        setFavourite: function () {

        },
        removeFavourite: function () {

        },

    },
    computed: {
        timeSinceUpdate: function () {
            return '1 minute'
        },
    }
};



</script>
















<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
