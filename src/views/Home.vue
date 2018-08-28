<template>
  <div id="home">

    <nav class='navbar' role='navigation' aria-label='main navigation'>
        <div class='navbar-brand'>
            <div class='navbar-item'>
                <img src="@/assets/logo.svg">
            </div>

            <div class='navbar-item'>
                <div class='field is-grouped'>
                    <autocomplete :items="stops" v-on:result="getTimes" :placeholder="placeholder"/>
                    <button @click="refresh">refresh</button>
                </div>
            </div>

            <div class='navbar-item'>
                <button v-if="currentIsFavourite" class='button' @click="removeFavourite">remove favourite</button>
                <button v-else class='button' @click='setFavourite'>set favourite</button>
            </div>

        </div>
    </nav>

    <div class='dropdown'>
        <button
            v-for='favourite in favourites'
            @click="getTimes(favourite)"
            class='button'
            >{{ favourite.label }}</button>
    </div>



    <div v-for="platform in departureTimes">
        <timetable :data="platform"/>

    </div>

    <div>
        <p>
            Last Updated: {{ timeSinceUpdate }}
        </p>
    </div>



  </div>
</template>



<script>
import Timetable from '@/components/Timetable.vue'
import Autocomplete from '@/components/Autocomplete.vue'
import axios from 'axios'

export default {
    data() {
        return {
            stops: [],
            favourites: [],
            lastUpdated: null,
            transportTypes: new Set([2, 8]),
            newStop: '',
            departureTimes: [],
            currentStop: null,
            currentIsFavourite: false,
            currentDate: Date.now(),
            placeholder: ''
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
            // TODO: refresh stops every n days.
            // TODO: store transport types wanted alongside so the user can select what they want, refresh when different to chosen options.
        }
        else {
            console.log('get stops fresh');
            this.getStopsFresh();
        }

        var fav = JSON.parse(localStorage.getItem('fav'))
        if (fav != null) {
            this.favourites = fav;
        }

        this.interval = setInterval(this.setCurrentTime, 1000);


        console.log('mounted');
        // console.log('transport types: ', this.transportTypes);
    },
    destroyed () {
        clearInterval(this.interval);
    },
    methods: {
        setCurrentTime() {
            this.currentDate = Date.now();
        },
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
                // TODO: proper error handling here
                console.log('error: ', error);
            });
        },
        getStopTimes (stop) {
            this.getTimes(stop);
        },
        refresh () {
            if (this.currentStop != null) {
                console.log('refresh: currentid:', this.currentStop)
                this.getTimes(this.currentStop);
            }
        },
        getTimes: function (stop) {
            // TODO: only do if stop is proper format
            this.currentStop = stop;
            console.log('get time for selected stop', stop.value);
            this.placeholder = stop.label

            const path = 'https://reisapi.ruter.no/StopVisit/GetDepartures/' + stop.value;
            axios.get(path)
            .then((response) => {
                this.setCurrentTime();
                this.lastUpdated = Date.now();
                this.formatData(response.data);

                if (this.currentFavouriteIndex >= 0) {
                    this.currentIsFavourite = true;
                } else {
                    this.currentIsFavourite = false;
                }

            })
            .catch((error) => {
                console.log('error', error)
                // TODO: proper error handling here
            });
        },
        formatData (data) {
            var platforms = [];
            // const currentDate = new Date();
            for (var i = 0; i < data.length; i++) {
                var result = data[i];

                var departureTime = new Date(result.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime);
                var minsAway = Math.floor((departureTime - this.currentDate)/1000/60);

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


            for (var j = 0; j < platforms.length; j++) {
                platforms[j].results.sort((a, b) => parseFloat(a.minsAway) - parseFloat(b.minsAway));
            }

            platforms.sort((a,b) => a.platform.localeCompare(b.platform))

            this.departureTimes = platforms;

        },
        setFavourite: function () {
            if (this.currentFavouriteIndex == -1) {
                this.favourites.push(this.currentStop);
                console.log(this.currentStop);
                this.currentIsFavourite = true;
                localStorage.setItem('fav', JSON.stringify(this.favourites));
            }
        },
        removeFavourite: function () {
            console.log('removeFavourite', this.currentFavouriteIndex);
            if ( this.currentFavouriteIndex >= 0 ) {
                this.favourites.splice(this.currentFavouriteIndex, this.currentFavouriteIndex + 1);
                this.currentIsFavourite = false;
                localStorage.setItem('fav', JSON.stringify(this.favourites));
            }
        },

    },
    computed: {
        currentFavouriteIndex () {
            return this.favourites.findIndex((a) => {
                return a.value == this.currentStop.value;
            });
        },
        timeSinceUpdate: function () {

            if (this.lastUpdated == null) {
                return 'never updated'
            }

            var seconds = Math.floor((this.currentDate - this.lastUpdated) / 1000);
            var diff = 0;
            // console.log('timeSinceUpdate:', seconds)

            diff = Math.floor(seconds / 86400);
            if (diff > 1) {
                return diff + ' days  ago'
            }

            diff = Math.floor(seconds / 3600);
            if (diff > 1) {
                return diff + ' hours  ago';
            }

            diff = Math.floor(seconds / 60);
            if (diff > 1) {
                return diff + ' minutes  ago';
            }

            return seconds + ' seconds ago';

            // return 'within the last minute';
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
